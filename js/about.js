/* ============================================================
   about.js — 02 ABOUT: count-up stats + GitHub heatmap strip.
   Stats a11y pattern: markup always carries the FINAL value
   (sr-only copy); only the aria-hidden visible span animates.
   No live regions. Reduced motion: final values, no animation.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var statsEl = document.getElementById("ab-stats");
    var gridEl = document.getElementById("ab-heatmap-grid");

    function fmt(n) {
        try { return new Intl.NumberFormat(HG.lang === "de" ? "de-DE" : "en-US").format(n); }
        catch (e) { return String(n); }
    }

    /* ---------- stats ---------- */
    var counted = false;
    function renderStats() {
        if (!statsEl) return;
        var stats = (HG.data().ab_stats) || [];
        statsEl.innerHTML = stats.map(function (s) {
            var v = fmt(s.n) + (s.suf || "");
            return '<div class="ab-stat">' +
                '<span class="num" aria-hidden="true"><span class="val">' + fmt(s.n) + '</span><span class="suf">' + (s.suf || "") + "</span></span>" +
                '<span class="sr-only">' + v + "</span>" +
                '<span class="lbl">' + s.lbl + "</span>" +
            "</div>";
        }).join("");
        counted = false;
        observe();
    }

    function countUp() {
        if (counted || HG.reduced) return;
        counted = true;
        var stats = (HG.data().ab_stats) || [];
        var nums = statsEl.querySelectorAll(".ab-stat .num .val");
        var t0 = performance.now(), DUR = 1400;
        function tick(t) {
            var p = Math.min(1, (t - t0) / DUR);
            var e = 1 - Math.pow(1 - p, 4);          /* ease-out-quart */
            nums.forEach(function (el, i) {
                var s = stats[i]; if (!s) return;
                el.textContent = fmt(Math.round(s.n * e));
            });
            if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    var io;
    function observe() {
        if (HG.reduced || !("IntersectionObserver" in window) || !statsEl) return;
        if (io) io.disconnect();
        io = new IntersectionObserver(function (es) {
            es.forEach(function (en) {
                if (en.isIntersecting) { countUp(); io.disconnect(); }
            });
        }, { threshold: 0.4 });
        io.observe(statsEl);
    }

    /* ---------- heatmap (decorative, deterministic) ---------- */
    function renderHeatmap() {
        if (!gridEl) return;
        var COLS = 26, ROWS = 7, html = "";
        var seed = 42;
        function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
        for (var c = 0; c < COLS; c++) {
            for (var r = 0; r < ROWS; r++) {
                var v = rnd();
                /* weekly rhythm: weekdays busier, recent weeks busier */
                var bias = (r > 0 && r < 6 ? 0.18 : 0) + (c / COLS) * 0.22;
                var lv = v * 0.55 + bias;
                var lvl = lv < 0.3 ? 0 : lv < 0.5 ? 1 : lv < 0.7 ? 2 : lv < 0.85 ? 3 : 4;
                html += '<span class="hm hm-' + lvl + '"></span>';
            }
        }
        gridEl.innerHTML = html;
    }

    function init() {
        renderStats();
        renderHeatmap();
        HG.on("langchange", renderStats);
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
