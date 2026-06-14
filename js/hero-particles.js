/* ============================================================
   hero-particles.js — canvas particle field that assembles into
   the name and idle-drifts behind the crisp <h1>. Cursor repels.
   DPR-capped, IntersectionObserver + visibility paused.
   Reduced-motion: canvas left blank, real h1 carries the hero.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var canvas = document.getElementById("hero-canvas");
    var h1 = document.getElementById("hero-h");
    if (!canvas || !h1) return;
    if (HG.reduced) { canvas.style.display = "none"; return; }

    var ctx = canvas.getContext("2d", { alpha: true });
    var DPR = Math.min(window.devicePixelRatio || 1, 2);
    var particles = [];
    var pointer = { x: -9999, y: -9999, active: false };
    var running = false, assembled = 0, raf = 0;
    var W = 0, H = 0;

    var inkVal = "", sigVal = "";
    function updateColors() {
        var style = getComputedStyle(document.body);
        inkVal = style.getPropertyValue("--ink").trim() || "#E4E4E7";
        sigVal = style.getPropertyValue("--signal").trim() || "#4ADE80";
    }

    function buildTargets() {
        var hero = canvas.getBoundingClientRect();
        W = hero.width; H = hero.height;
        canvas.width = Math.round(W * DPR);
        canvas.height = Math.round(H * DPR);
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

        /* offscreen render of the two-line name, aligned to the real h1 box */
        var r = h1.getBoundingClientRect();
        var cs = getComputedStyle(h1);
        var fs = parseFloat(cs.fontSize);
        var off = document.createElement("canvas");
        off.width = canvas.width; off.height = canvas.height;
        var octx = off.getContext("2d");
        octx.setTransform(DPR, 0, 0, DPR, 0, 0);
        octx.fillStyle = "#fff";
        octx.textBaseline = "top";
        octx.font = '700 ' + fs + 'px "Clash Display", Inter, sans-serif';
        var x0 = r.left - hero.left;
        var y0 = r.top - hero.top;
        var lineH = fs * (parseFloat(cs.lineHeight) / fs || 0.98);
        if (isNaN(lineH)) lineH = fs * 0.98;
        octx.fillText("HASHWANTH", x0, y0);
        octx.fillText("GHANTA", x0, y0 + lineH);

        var img = octx.getImageData(0, 0, off.width, off.height).data;
        var isMobile = W < 760;
        var gap = isMobile ? 7 : 5;             /* sampling step in CSS px */
        var cap = isMobile ? 1000 : 1500;
        var pts = [];
        for (var y = 0; y < H; y += gap) {
            for (var x = 0; x < W; x += gap) {
                var idx = ((Math.round(y * DPR) * off.width) + Math.round(x * DPR)) * 4 + 3;
                if (img[idx] > 128) pts.push({ x: x, y: y });
            }
        }
        /* downsample to cap */
        if (pts.length > cap) {
            var stride = pts.length / cap, kept = [];
            for (var i = 0; i < cap; i++) kept.push(pts[Math.floor(i * stride)]);
            pts = kept;
        }
        return pts;
    }

    function spawn() {
        var pts = buildTargets();
        particles = pts.map(function (p) {
            return {
                tx: p.x, ty: p.y,
                x: Math.random() * W, y: Math.random() * H,
                vx: 0, vy: 0,
                ph: Math.random() * Math.PI * 2,
                sig: Math.random() < 0.12,
                s: Math.random() < 0.18 ? 1.6 : 1.0
            };
        });
        assembled = 0;
    }

    function frame(t) {
        if (!running) return;
        ctx.clearRect(0, 0, W, H);
        assembled = Math.min(1, assembled + 0.012);
        var ink = inkVal, sig = sigVal;
        /* light paper needs denser, more opaque particles to read against white */
        var light = document.body.getAttribute("data-theme") === "light";
        var baseA = light ? 0.78 : 0.5, sigA = light ? 0.95 : 0.85, szBoost = light ? 0.8 : 0;
        var time = t * 0.001;
        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];
            /* idle drift target */
            var dxn = Math.sin(time * 0.6 + p.ph) * 1.4;
            var dyn = Math.cos(time * 0.5 + p.ph) * 1.4;
            var tx = p.tx + dxn, ty = p.ty + dyn;
            /* spring toward target */
            var ax = (tx - p.x) * 0.06;
            var ay = (ty - p.y) * 0.06;
            /* cursor repulsion */
            if (pointer.active) {
                var rx = p.x - pointer.x, ry = p.y - pointer.y;
                var d2 = rx * rx + ry * ry;
                if (d2 < 9000 && d2 > 0.01) {
                    var f = (9000 - d2) / 9000 * 5;
                    var d = Math.sqrt(d2);
                    ax += (rx / d) * f;
                    ay += (ry / d) * f;
                }
            }
            p.vx = (p.vx + ax) * 0.82;
            p.vy = (p.vy + ay) * 0.82;
            p.x += p.vx; p.y += p.vy;
            ctx.fillStyle = p.sig ? sig : ink;
            ctx.globalAlpha = (p.sig ? sigA : baseA) * (0.25 + 0.75 * assembled);
            ctx.fillRect(p.x, p.y, p.s + szBoost, p.s + szBoost);
        }
        ctx.globalAlpha = 1;
        raf = requestAnimationFrame(frame);
    }

    function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

    var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (FINE) {
        var hero = document.getElementById("identity");
        hero.addEventListener("pointermove", function (e) {
            var b = canvas.getBoundingClientRect();
            pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; pointer.active = true;
        });
        hero.addEventListener("pointerleave", function () { pointer.active = false; });
    }

    var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) { en.isIntersecting ? start() : stop(); });
    }, { threshold: 0.02 });

    function boot() {
        updateColors();
        spawn();
        io.observe(canvas);
        start();
    }

    document.addEventListener("visibilitychange", function () {
        if (document.hidden) stop(); else if (isVisible()) start();
    });
    function isVisible() {
        var r = canvas.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
    }

    var resizeT;
    window.addEventListener("resize", function () {
        clearTimeout(resizeT);
        resizeT = setTimeout(function () { spawn(); }, 200);
    }, { passive: true });

    HG.on("themechange", updateColors);

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(boot);
    } else {
        window.addEventListener("load", boot, { once: true });
    }
})();
