/* ============================================================
   scramble.js — section <h2> decode effect. Letters shuffle
   then settle, once per heading, on first scroll into view.
   A11y pattern (per review): the heading's real text lives in
   an sr-only span; only an aria-hidden twin mutates. Heading
   nav (H key) always reads clean text. Rebuilt on langchange.
   Reduced motion / no IO: plain headings, untouched.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    if (HG.reduced || !("IntersectionObserver" in window)) return;

    var GLYPHS = "█▓▒░<>/\\_=+*#01";
    /* NOTE: #sim-h is deliberately excluded — it contains the live #sim-stagenum
       block that co2-sim.js mutates per stage; wrapping it would detach that node. */
    var SEL = "main section > .shell > h2, main section h2#about-h";

    function wrap(h) {
        if (h.querySelector(":scope > .sr-only")) return null;   /* already wrapped — never double */
        var text = h.textContent;
        if (!text.trim()) return null;
        h.innerHTML = "";
        var sr = document.createElement("span");
        sr.className = "sr-only";
        sr.textContent = text;
        var vis = document.createElement("span");
        vis.setAttribute("aria-hidden", "true");
        vis.textContent = text;
        h.appendChild(sr);
        h.appendChild(vis);
        return vis;
    }

    function scramble(vis, final) {
        var t0 = performance.now(), DUR = 900;
        function tick(t) {
            var p = Math.min(1, (t - t0) / DUR);
            var settled = Math.floor(final.length * p);
            var out = final.slice(0, settled);
            for (var i = settled; i < final.length; i++) {
                out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
            }
            vis.textContent = out;
            if (p < 1) requestAnimationFrame(tick);
            else vis.textContent = final;          /* settle exactly */
        }
        requestAnimationFrame(tick);
    }

    var io;
    function arm() {
        if (io) io.disconnect();
        io = new IntersectionObserver(function (es, obs) {
            es.forEach(function (en) {
                if (!en.isIntersecting) return;
                obs.unobserve(en.target);
                var vis = en.target.__hgVis;
                if (vis) scramble(vis, vis.textContent);
            });
        }, { threshold: 0.6 });
        document.querySelectorAll(SEL).forEach(function (h) {
            var vis = wrap(h);
            if (!vis) return;
            h.__hgVis = vis;
            io.observe(h);
        });
    }

    function init() {
        arm();
        /* applyI18n rewrote h2 textContent (spans gone) — re-wrap clean */
        HG.on("langchange", function () { requestAnimationFrame(arm); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
