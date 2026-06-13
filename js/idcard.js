/* ============================================================
   idcard.js — hanging lanyard ID card (About section).
   REAL physics: a 2D verlet rope (point-mass chain + distance
   constraints + gravity). Drag the card in ANY direction —
   including above the anchor — release, and it drops with
   weight and settles like a real ID tag on a strap.

   Stability recipe (learned the hard way — do not relax):
   - card.offsetWidth (layout width, never the transformed bbox)
   - anchor pinned EVERY constraint iteration
   - short segments (~16px), >= 16 iterations
   - per-frame velocity clamp + visual rotation clamp
   A11y: role="img" + localized label on the card; click/tap or
   Enter/Space nudges it (WCAG 2.5.7 non-drag alternative).
   Reduced motion / mobile: static card, no tabindex, no hint.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var mount = document.getElementById("idcard-mount");
    var card = document.getElementById("idcard");
    var face = card && card.querySelector(".idcard-face");
    var rope = document.getElementById("rope-path");
    var ropeEdge = document.getElementById("rope-edge");
    var ropeStripe = document.getElementById("rope-stripe");
    var svg = document.getElementById("lanyard-rope");
    if (!mount || !card || !rope) return;

    var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    function DESKTOP() { return !window.matchMedia("(max-width: 980px)").matches; }

    /* When the card is non-interactive (reduced motion, or mobile where CSS
       forces it static), remove ALL interaction affordance: a focusable
       element with a "drag me" hint that does nothing is worse than none. */
    function stripAffordance() {
        /* keep data-i18n-attr so the role="img" aria-label still translates;
           only kill the drag hint + keyboard affordance that does nothing here */
        var hint = document.getElementById("idcard-hint");
        if (hint) { hint.textContent = ""; hint.removeAttribute("data-i18n"); }
        card.removeAttribute("aria-describedby");
        card.removeAttribute("tabindex");
    }
    if ((HG && HG.reduced) || !DESKTOP()) { stripAffordance(); return; }
    card.setAttribute("tabindex", "0");

    /* ---- rope: verlet point chain ---- */
    var SEGS = 9;              /* segment count — short segments, stable chain */
    var GRAV = 0.9;            /* gravity drop — a tag, not a balloon */
    var AIR = 0.91;            /* heavy damping → simple drop, settles fast, minimal bounce (was 0.986 = rubbery) */
    var ITER = 20;             /* stiffer strap = less elastic stretch/pull */
    var VMAX = 22;             /* gentler px/frame velocity clamp */
    var ROT_MAX = 0.6;         /* rad — calmer swing clamp (~34°, was ~53°) */

    var W = 0, H = 0, cardW = 0, ropeLen = 0, restLen = 0;
    var anchor = { x: 0, y: 6 };
    var pts = [];              /* {x, y, ox, oy} */
    var rot = 0;               /* smoothed card rotation */
    var dragging = false, grabDX = 0, grabDY = 0;
    var running = false, raf = 0, sleepFrames = 0;

    function measure() {
        var mr = mount.getBoundingClientRect();
        W = mr.width; H = mr.height;
        cardW = card.offsetWidth || 200;          /* layout width — NEVER the bbox */
        anchor.x = W / 2;
        ropeLen = Math.max(120, Math.min(190, H * 0.30));
        restLen = ropeLen / SEGS;
        if (svg) svg.setAttribute("viewBox", "0 0 " + W.toFixed(0) + " " + H.toFixed(0));
    }

    function buildChain(compressed) {
        pts = [];
        for (var i = 0; i <= SEGS; i++) {
            /* compressed start = points bunched near the anchor → gravity
               unspools them = the drop-in entrance */
            var y = anchor.y + (compressed ? i * 2 : i * restLen);
            pts.push({ x: anchor.x, y: y, ox: anchor.x, oy: y });
        }
    }

    function integrate() {
        for (var i = 1; i <= SEGS; i++) {
            var p = pts[i];
            var vx = (p.x - p.ox) * AIR;
            var vy = (p.y - p.oy) * AIR;
            if (vx > VMAX) vx = VMAX; else if (vx < -VMAX) vx = -VMAX;
            if (vy > VMAX) vy = VMAX; else if (vy < -VMAX) vy = -VMAX;
            p.ox = p.x; p.oy = p.y;
            p.x += vx;
            p.y += vy + GRAV;
        }
    }

    function constrain() {
        var last = pts[SEGS];
        for (var k = 0; k < ITER; k++) {
            /* pin the anchor EVERY iteration */
            pts[0].x = anchor.x; pts[0].y = anchor.y;
            if (dragging) { last.x = dragX(); last.y = dragY(); }
            for (var i = 0; i < SEGS; i++) {
                var a = pts[i], b = pts[i + 1];
                var dx = b.x - a.x, dy = b.y - a.y;
                var dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
                var diff = (dist - restLen) / dist;
                /* end points (anchor / dragged card) absorb none of the correction */
                var wa = (i === 0) ? 0 : 0.5;
                var wb = (i + 1 === SEGS && dragging) ? 0 : (i === 0 ? 1 : 0.5);
                var s = wa + wb || 1;
                a.x += dx * diff * (wa / s) * 2 * 0.5;
                a.y += dy * diff * (wa / s) * 2 * 0.5;
                b.x -= dx * diff * (wb / s) * 2 * 0.5;
                b.y -= dy * diff * (wb / s) * 2 * 0.5;
            }
        }
    }

    var pointer = { x: 0, y: 0 };
    function dragX() { return pointer.x - grabDX; }
    function dragY() { return pointer.y - grabDY; }

    function render() {
        /* strap: smooth quadratic segments through the chain */
        var d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
        for (var i = 1; i < SEGS; i++) {
            var mx = (pts[i].x + pts[i + 1].x) / 2;
            var my = (pts[i].y + pts[i + 1].y) / 2;
            d += " Q " + pts[i].x.toFixed(1) + " " + pts[i].y.toFixed(1) + " " + mx.toFixed(1) + " " + my.toFixed(1);
        }
        d += " L " + pts[SEGS].x.toFixed(1) + " " + pts[SEGS].y.toFixed(1);
        rope.setAttribute("d", d);
        if (ropeEdge) ropeEdge.setAttribute("d", d);
        if (ropeStripe) ropeStripe.setAttribute("d", d);

        /* card hangs from the last point; rotation follows the last segment */
        var a = pts[SEGS - 1], b = pts[SEGS];
        var target = Math.atan2(b.x - a.x, b.y - a.y);   /* 0 = straight down */
        if (target > ROT_MAX) target = ROT_MAX;
        if (target < -ROT_MAX) target = -ROT_MAX;
        rot += (target - rot) * 0.3;
        card.style.transform = "translate(" + (b.x - cardW / 2).toFixed(1) + "px," +
            b.y.toFixed(1) + "px) rotate(" + rot.toFixed(4) + "rad)";
    }

    function energy() {
        var e = 0;
        for (var i = 1; i <= SEGS; i++) {
            e += Math.abs(pts[i].x - pts[i].ox) + Math.abs(pts[i].y - pts[i].oy);
        }
        return e;
    }

    function step() {
        if (!running) return;
        integrate();
        constrain();
        render();
        if (!dragging && energy() < 0.3) {
            if (++sleepFrames > 30) { running = false; raf = 0; return; }
        } else sleepFrames = 0;
        raf = requestAnimationFrame(step);
    }
    function wake() {
        if (!DESKTOP()) return;
        sleepFrames = 0;
        if (!running) { running = true; raf = requestAnimationFrame(step); }
    }

    /* ---- pointer: grab anywhere on the card, drag in ANY direction ---- */
    function localPt(e) {
        var mr = mount.getBoundingClientRect();
        return { x: e.clientX - mr.left, y: e.clientY - mr.top };
    }
    var moved = 0, downAt = null;
    card.addEventListener("pointerdown", function (e) {
        if (!DESKTOP()) return;
        var lp = localPt(e);
        var end = pts[SEGS];
        dragging = true; moved = 0; downAt = lp;
        grabDX = lp.x - end.x; grabDY = lp.y - end.y;
        pointer = lp;
        try { card.setPointerCapture(e.pointerId); } catch (err) {}
        resetTilt(); wake(); e.preventDefault();
    });
    window.addEventListener("pointermove", function (e) {
        if (dragging) {
            var lp = localPt(e);
            moved += Math.abs(lp.x - pointer.x) + Math.abs(lp.y - pointer.y);
            pointer = lp;
            wake();
            return;
        }
        /* hover tilt + holographic sheen (decorative) */
        if (!FINE || !face || !DESKTOP()) return;
        var cr = card.getBoundingClientRect();
        if (e.clientX < cr.left || e.clientX > cr.right || e.clientY < cr.top || e.clientY > cr.bottom) { resetTilt(); return; }
        var px = (e.clientX - cr.left) / cr.width, py = (e.clientY - cr.top) / cr.height;
        face.style.setProperty("--ty", ((px - 0.5) * 16).toFixed(1) + "deg");
        face.style.setProperty("--tx", ((0.5 - py) * 14).toFixed(1) + "deg");
        face.style.setProperty("--gx", (px * 100).toFixed(0) + "%");
        face.style.setProperty("--gy", (py * 100).toFixed(0) + "%");
    }, { passive: true });
    function release() {
        if (!dragging) return;
        dragging = false;
        /* tap (not drag) = nudge — single-pointer non-drag alternative (2.5.7) */
        if (moved < 6) nudge();
        wake();
    }
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);

    function resetTilt() {
        if (!face) return;
        face.style.setProperty("--tx", "0deg"); face.style.setProperty("--ty", "0deg");
        face.style.setProperty("--gx", "50%"); face.style.setProperty("--gy", "0%");
    }

    /* ---- keyboard / tap nudge: a believable impulse, no drag needed ---- */
    function nudge() {
        var last = pts[SEGS];
        var dir = Math.random() < 0.5 ? -1 : 1;
        last.ox = last.x - dir * 8;           /* gentle sideways kick */
        last.oy = last.y + 5;                  /* small upward fling */
        pts[SEGS - 1].ox = pts[SEGS - 1].x - dir * 4;
        wake();
    }
    card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); nudge(); }
    });

    var rt;
    window.addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
            var keep = pts.length ? pts.map(function (p) { return { x: p.x / (W || 1), y: p.y }; }) : null;
            measure();
            if (keep) pts.forEach(function (p, i) { p.x = keep[i].x * W; p.ox = p.x; });
            wake();
        }, 200);
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
        if (document.hidden) { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }
        else wake();
    });

    /* ---- boot: drop in when the About section scrolls into view ---- */
    function start() {
        measure();
        buildChain(true);
        render();
        if (!("IntersectionObserver" in window)) { wake(); return; }
        var io = new IntersectionObserver(function (es, obs) {
            es.forEach(function (en) {
                if (!en.isIntersecting) return;
                obs.disconnect();
                if (!DESKTOP()) return;
                /* tiny sideways energy so the drop reads organic (not a hard swing) */
                pts[SEGS].ox = pts[SEGS].x - 2;
                wake();
            });
        }, { threshold: 0.25 });
        io.observe(mount);
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(start);
    else window.addEventListener("load", start, { once: true });
})();
