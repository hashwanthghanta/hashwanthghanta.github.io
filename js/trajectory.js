/* ============================================================
   trajectory.js — 07 TRAJECTORY. Education then Experience on
   a WAVY Bézier curve: dots sit on the wave, cards alternate
   left/right of it, the signal stroke draws with scroll and a
   glowing tip rides the curve at the scroll point.
   DOM <ol> order stays chronological (a11y); sides are CSS.
   Mobile / reduced-motion: vertical left-rail fallback,
   curve fully drawn.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var list = document.getElementById("traj-list");
    var fg = document.getElementById("traj-fg");
    var svg = document.querySelector(".traj-line");
    if (!list || !svg) return;

    var MOBILE = function () { return window.matchMedia("(max-width: 760px)").matches; };
    var AMP = 0.13;            /* wave amplitude as fraction of width */
    var tip = null;
    var trajHeight = 1;
    var trajDocumentTop = 0;
    var nodeData = [];

    function strip(html) {
        var d = document.createElement("div");
        d.innerHTML = (html || "").replace(/<br\s*\/?>/gi, " · ");
        return (d.textContent || "").trim();
    }
    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
        });
    }

    function buildEntries() {
        var d = (typeof DATA !== "undefined" && DATA[HG.lang]) || {};
        var edu = d.education || [], track = d.track || [];
        var e = function (x) {
            if (!x) return null;
            var body = "";
            if (x.focusAreas && x.focusAreas.length) body = x.focusAreas.join(" · ");
            else if (x.badges && x.badges.length) body = x.badges.slice(0, 5).join(" · ");
            /* coursework subjects → chips (restored from the old site) */
            var chips = (x.subjects || []).map(function (s) {
                return { t: s.name, f: !!s.focus };
            });
            return { date: x.period || "", title: x.degree || "", org: strip(x.detail), body: body, chips: chips };
        };
        var t = function (x) {
            return x ? { date: x.date || "", title: x.role || "", org: x.org || "", body: x.body || "", chips: [] } : null;
        };
        var de = HG.lang === "de";
        return [
            { label: de ? "Ausbildung" : "Education",  nodes: [e(edu[0]), e(edu[1]), e(edu[2])].filter(Boolean) },
            { label: de ? "Erfahrung"  : "Experience", nodes: [t(track[0]), t(track[1]), t(track[2])].filter(Boolean) }
        ];
    }

    function render() {
        var groups = buildEntries();
        var html = "", side = 0;
        groups.forEach(function (g) {
            html += '<li class="traj-group" data-reveal>' +
                    '<span class="traj-group-label">' + esc(g.label) + "</span></li>";
            g.nodes.forEach(function (en) {
                var cls = side % 2 === 0 ? "t-right" : "t-left";   /* card opposite the dot side */
                side++;
                var clw = (DATA[HG.lang] && DATA[HG.lang].a11y_coursework) || "Coursework";
                var chips = en.chips.length
                    ? '<ul class="node-chips" aria-label="' + clw + '">' + en.chips.map(function (c) {
                        return '<li class="node-chip' + (c.f ? " focus" : "") + '">' + esc(c.t) + "</li>";
                    }).join("") + "</ul>"
                    : "";
                html += '<li class="traj-node ' + cls + '" data-reveal>' +
                    '<span class="node-dot" aria-hidden="true"></span>' +
                    '<div class="node-card">' +
                        '<p class="node-date">' + esc(en.date) + "</p>" +
                        '<h3 class="node-title">' + esc(en.title) + "</h3>" +
                        (en.org ? '<p class="node-org">' + esc(en.org) + "</p>" : "") +
                        (en.body ? '<p class="node-body">' + esc(en.body) + "</p>" : "") +
                        chips +
                    "</div>" +
                "</li>";
            });
        });
        list.innerHTML = html;
        HG.emit("sections:reveal-scan");
    }

    /* ---- wave path: smooth cubic curve, alternating around the centre ---- */
    var pathLen = 0;
    function layoutLine() {
        var traj = document.getElementById("traj");
        if (!traj) return;
        var r = traj.getBoundingClientRect();
        var W = Math.max(1, r.width), H = Math.max(1, r.height);
        svg.setAttribute("viewBox", "0 0 " + W.toFixed(0) + " " + H.toFixed(0));
        svg.setAttribute("preserveAspectRatio", "none");

        var rows = list.querySelectorAll(".traj-node, .traj-group");
        if (!rows.length) return;

        /* anchor x positions: centre for group labels, alternating wave
           crests for nodes; y = each row's vertical middle of its dot line */
        var cx = W / 2, amp = MOBILE() ? 0 : W * AMP;
        var pts = [{ x: cx, y: 0 }];
        var side = 0;
        rows.forEach(function (row) {
            var rr = row.getBoundingClientRect();
            var y;
            if (row.classList.contains("traj-node")) {
                var dot = row.querySelector(".node-dot");
                if (dot) {
                    var dotRect = dot.getBoundingClientRect();
                    y = dotRect.top - r.top + dotRect.height / 2;
                } else {
                    y = rr.top - r.top + 1.9 * 16 + 7;
                }
            } else {
                y = rr.top - r.top + rr.height / 2;
            }
            if (row.classList.contains("traj-node")) {
                var x = MOBILE() ? 8 : cx + (side % 2 === 0 ? -amp : amp);
                side++;
                pts.push({ x: x, y: y });
                row.style.setProperty("--ind", x.toFixed(1) + "px");
            } else {
                pts.push({ x: MOBILE() ? 8 : cx, y: y });
                row.style.setProperty("--ind", (MOBILE() ? 8 : cx).toFixed(1) + "px");
            }
        });
        pts.push({ x: cx, y: H });

        /* smooth cubic spline through the points (vertical-ish tangents) */
        var d = "M " + pts[0].x.toFixed(1) + " " + pts[0].y.toFixed(1);
        for (var i = 0; i < pts.length - 1; i++) {
            var a = pts[i], b = pts[i + 1];
            var dy = (b.y - a.y) * 0.5;
            d += " C " + a.x.toFixed(1) + " " + (a.y + dy).toFixed(1) +
                 " " + b.x.toFixed(1) + " " + (b.y - dy).toFixed(1) +
                 " " + b.x.toFixed(1) + " " + b.y.toFixed(1);
        }
        var bg = svg.querySelector(".bg");
        if (bg) bg.setAttribute("d", d);
        if (fg) {
            fg.setAttribute("d", d);
            pathLen = fg.getTotalLength ? fg.getTotalLength() : 0;
        }
        if (!tip && fg && !HG.reduced) {
            tip = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            tip.setAttribute("class", "traj-tip");
            tip.setAttribute("r", "5");
            svg.appendChild(tip);
        }

        /* Cache bounds to prevent DOM queries during scroll events */
        trajHeight = H;
        trajDocumentTop = r.top + window.scrollY;
        var nodes = list.querySelectorAll(".traj-node");
        nodeData = [];
        nodes.forEach(function (n) {
            var dot = n.querySelector(".node-dot");
            if (!dot) return;
            var nr = dot.getBoundingClientRect();
            nodeData.push({
                el: n,
                dotDocumentY: nr.top + window.scrollY + nr.height / 2
            });
        });
    }

    function draw() {
        var traj = document.getElementById("traj");
        if (!traj) return;
        HG.scroll.on(function () {
            var scrollY = window.scrollY;
            var rTop = trajDocumentTop - scrollY;
            var center = window.innerHeight * 0.5;
            var p = (center - rTop) / trajHeight;
            p = Math.max(0, Math.min(1, p));
            if (fg) fg.style.strokeDashoffset = HG.reduced ? 0 : (1 - p);
            /* glowing tip rides the curve at the scroll point */
            if (tip && pathLen && fg.getPointAtLength) {
                var pt = fg.getPointAtLength(pathLen * p);
                tip.setAttribute("cx", pt.x.toFixed(1));
                tip.setAttribute("cy", pt.y.toFixed(1));
                tip.style.opacity = p > 0.005 && p < 0.995 ? 1 : 0;
            }
            nodeData.forEach(function (data) {
                var dotViewportY = data.dotDocumentY - scrollY;
                var dist = Math.abs(dotViewportY - center);
                data.el.classList.toggle("is-pulse", dist < window.innerHeight * 0.18);
            });
        });
        if (HG.reduced && fg) fg.style.strokeDashoffset = 0;
    }

    function relayout() {
        requestAnimationFrame(function () { requestAnimationFrame(layoutLine); });
    }

    function init() {
        render();
        relayout();
        draw();
        HG.on("langchange", function () { render(); relayout(); });
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
        var rt;
        window.addEventListener("resize", function () {
            clearTimeout(rt); rt = setTimeout(relayout, 200);
        }, { passive: true });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
