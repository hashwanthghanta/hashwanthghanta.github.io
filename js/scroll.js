/* ============================================================
   scroll.js — Lenis smooth inertia + ScrollTrigger sync +
   one rAF scroll bus feeding HUD telemetry and chapter rail.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var subs = new Set();
    var lenis = null;

    function payload() {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var y = window.scrollY;
        return { y: y, max: max, pct: max > 0 ? y / max : 0, w: window.innerWidth, h: window.innerHeight };
    }
    function fire() { var p = payload(); subs.forEach(function (fn) {
        try { fn(p); } catch (e) { console.warn("scroll sub failed", e); }
    }); }

    HG.scroll = {
        on: function (fn) { subs.add(fn); fn(payload()); return function () { subs.delete(fn); }; },
        lenis: function () { return lenis; },
        to: function (target, opts) {
            if (lenis) lenis.scrollTo(target, opts);
            else if (target && target.scrollIntoView) target.scrollIntoView({ behavior: "smooth" });
        },
        stop: function () { if (lenis) lenis.stop(); },
        start: function () { if (lenis) lenis.start(); }
    };

    function init() {
        var hasGSAP = typeof window.gsap !== "undefined";
        var hasST = hasGSAP && typeof window.ScrollTrigger !== "undefined";
        if (hasST) window.gsap.registerPlugin(window.ScrollTrigger);

        if (!HG.reduced && typeof window.Lenis !== "undefined") {
            lenis = new window.Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.4 });
            if (hasST) {
                lenis.on("scroll", window.ScrollTrigger.update);
                window.gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
                window.gsap.ticker.lagSmoothing(0);
            } else {
                function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
                requestAnimationFrame(raf);
            }
            lenis.on("scroll", fire);
        } else {
            var ticking = false;
            window.addEventListener("scroll", function () {
                if (ticking) return; ticking = true;
                requestAnimationFrame(function () { ticking = false; fire(); });
            }, { passive: true });
        }
        window.addEventListener("resize", fire, { passive: true });
        fire();
    }
    HG.scroll.init = init;
})();
