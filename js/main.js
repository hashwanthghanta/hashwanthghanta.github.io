/* ============================================================
   main.js — orchestrator: cursor, clock, telemetry, chapter
   rail, reveal observer, toggle wiring, magnetic buttons.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG || { reduced: false };
    var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    /* ---------- custom cursor ---------- */
    function setupCursor() {
        if (!FINE || HG.reduced) return;
        var dot = document.querySelector(".cursor-dot");
        var ring = document.querySelector(".cursor-ring");
        if (!dot || !ring) return;
        document.body.classList.add("has-cursor");
        var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
        var active = false;
        function startLoop() {
            if (active) return;
            active = true;
            requestAnimationFrame(raf);
        }
        window.addEventListener("pointermove", function (e) {
            mx = e.clientX; my = e.clientY;
            dot.style.transform = "translate(" + mx + "px," + my + "px)";
            startLoop();
        }, { passive: true });
        function raf() {
            if (!active) return;
            var dx = mx - rx;
            var dy = my - ry;
            if (Math.abs(dx) < 0.05 && Math.abs(dy) < 0.05) {
                rx = mx; ry = my;
                ring.style.transform = "translate(" + rx + "px," + ry + "px)";
                active = false;
                return;
            }
            rx += dx * 0.18; ry += dy * 0.18;
            ring.style.transform = "translate(" + rx + "px," + ry + "px)";
            requestAnimationFrame(raf);
        }
        startLoop();
        var hot = "a, button, input, textarea, select, [data-hot]";
        document.addEventListener("pointerover", function (e) {
            if (e.target.closest && e.target.closest(hot)) ring.classList.add("is-hot");
        });
        document.addEventListener("pointerout", function (e) {
            if (e.target.closest && e.target.closest(hot)) ring.classList.remove("is-hot");
        });

        /* contextual cursor label — visual duplicate only (aria-hidden);
           the underlying element keeps its own accessible affordance */
        var label = document.createElement("span");
        label.className = "cursor-label";
        label.setAttribute("aria-hidden", "true");
        document.body.appendChild(label);
        var labelled = "[data-cursor]";
        document.addEventListener("pointerover", function (e) {
            var t = e.target.closest && e.target.closest(labelled);
            if (t) { label.textContent = t.getAttribute("data-cursor"); label.classList.add("is-on"); }
        });
        document.addEventListener("pointerout", function (e) {
            if (e.target.closest && e.target.closest(labelled)) label.classList.remove("is-on");
        });
        window.addEventListener("pointermove", function (e) {
            if (!label.classList.contains("is-on")) return;
            label.style.transform = "translate(" + (e.clientX + 18) + "px," + (e.clientY + 16) + "px)";
        }, { passive: true });
    }

    /* ---------- Magdeburg clock (Europe/Berlin) ---------- */
    function setupClock() {
        var el = document.getElementById("hud-clock");
        if (!el) return;
        var fmt;
        try { fmt = new Intl.DateTimeFormat("en-GB", {
            timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
        } catch (e) { fmt = null; }
        function tick() {
            var t = fmt ? fmt.format(new Date()) : new Date().toTimeString().slice(0, 8);
            el.textContent = t;
        }
        tick();
        if (!HG.reduced) setInterval(tick, 1000);
    }

    /* ---------- scroll telemetry + chapter rail ---------- */
    function setupTelemetry() {
        var pctEl = document.getElementById("hud-scroll");
        var thread = document.getElementById("scroll-thread-fill");
        var railLinks = Array.prototype.slice.call(document.querySelectorAll(".chapter-rail a"));
        var sections = railLinks.map(function (a) {
            return document.getElementById((a.getAttribute("href") || "").slice(1));
        });
        HG.scroll.on(function (p) {
            if (pctEl) {
                var v = Math.round(p.pct * 100);
                pctEl.textContent = (v < 10 ? "00" : v < 100 ? "0" : "") + v;
            }
            if (thread) thread.style.transform = "scaleY(" + p.pct.toFixed(4) + ")";
            /* active chapter = last section whose top passed 45% viewport */
            var mark = p.y + innerHeight * 0.45, active = -1;
            for (var i = 0; i < sections.length; i++) {
                if (sections[i] && sections[i].offsetTop <= mark) active = i;
            }
            railLinks.forEach(function (a, idx) {
                a.classList.toggle("is-active", idx === active);
                if (idx === active) a.setAttribute("aria-current", "true");
                else a.removeAttribute("aria-current");
            });
        });
        railLinks.forEach(function (a) {
            a.addEventListener("click", function (e) {
                var id = (a.getAttribute("href") || "").slice(1);
                var t = document.getElementById(id);
                if (t) { e.preventDefault(); HG.scroll.to(t, { offset: -20 }); }
            });
        });
    }

    /* ---------- reveal observer ---------- */
    function setupReveals() {
        var els = document.querySelectorAll("[data-reveal]");
        if (HG.reduced || !("IntersectionObserver" in window)) {
            els.forEach(function (el) { el.classList.add("is-in"); }); return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    var el = en.target;
                    el.style.willChange = "opacity, transform";
                    el.addEventListener("transitionend", function clear() {
                        el.style.willChange = "";
                        el.removeEventListener("transitionend", clear);
                    });
                    el.classList.add("is-in");
                    io.unobserve(el);
                }
            });
        }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
        els.forEach(function (el) { io.observe(el); });
        HG.on("sections:reveal-scan", function () {
            document.querySelectorAll("[data-reveal]:not(.is-in)").forEach(function (el) { io.observe(el); });
        });
    }

    /* ---------- hero caret payoff (rotating taglines) ---------- */
    function setupHeroCaret() {
        var el = document.querySelector(".hero-caret-text");
        if (!el) return;
        var TYPE_MS = 38, ERASE_MS = 22, HOLD_MS = 2200, GAP_MS = 400;
        var i = 0, timer;

        function cycle() {
            var lines = HG.data().hero_taglines || [];
            if (!lines.length) return;
            var text = lines[i % lines.length];
            if (HG.reduced) { el.textContent = text; return; }
            var pos = 0;
            (function type() {
                el.textContent = text.slice(0, pos);
                if (pos++ < text.length) { timer = setTimeout(type, TYPE_MS); return; }
                timer = setTimeout(erase, HOLD_MS);
            })();
            function erase() {
                el.textContent = text.slice(0, pos);
                if (pos-- > 0) { timer = setTimeout(erase, ERASE_MS); return; }
                i++;
                timer = setTimeout(cycle, GAP_MS);
            }
        }

        cycle();
        HG.on("langchange", function () {
            clearTimeout(timer);
            i = 0;
            el.textContent = "";
            cycle();
        });
    }

    /* ---------- magnetic buttons ---------- */
    function setupMagnetic() {
        if (!FINE || HG.reduced) return;
        document.querySelectorAll("[data-magnetic]").forEach(function (el) {
            el.addEventListener("pointermove", function (e) {
                var r = el.getBoundingClientRect();
                var dx = (e.clientX - (r.left + r.width / 2)) * 0.25;
                var dy = (e.clientY - (r.top + r.height / 2)) * 0.25;
                el.style.transform = "translate(" + Math.max(-8, Math.min(8, dx)) + "px," +
                                                     Math.max(-8, Math.min(8, dy)) + "px)";
            });
            el.addEventListener("pointerleave", function () { el.style.transform = ""; });
        });
    }

    /* ---------- back-to-top ---------- */
    function setupToTop() {
        var btn = document.getElementById("to-top");
        if (!btn) return;
        btn.addEventListener("click", function () { HG.scroll.to(0, { duration: 1.1 }); });
        HG.scroll.on(function (p) { btn.classList.toggle("is-visible", p.y > p.h * 0.9); });
    }

    /* ---------- toggles ---------- */
    function wireToggles() {
        var td = HG.data();
        document.querySelectorAll(".theme-btn").forEach(function (b) {
            b.addEventListener("click", function (e) {
                HG.toggleTheme({ x: e.clientX, y: e.clientY });
            });
            b.setAttribute("aria-pressed", HG.theme === "light" ? "true" : "false");
            b.setAttribute("aria-label", HG.theme === "light"
                ? (td.a11y_theme_to_dark || "Switch to dark theme")
                : (td.a11y_theme_to_light || "Switch to light theme"));
        });
        document.querySelectorAll(".lang-btn").forEach(function (b) {
            b.addEventListener("click", function () { HG.setLanguage(b.getAttribute("data-lang")); });
        });
    }

    function init() {
        HG.scroll.init();
        document.documentElement.lang = HG.lang;
        HG.applyI18n(HG.lang);
        /* reflect lang button state */
        document.querySelectorAll(".lang-btn").forEach(function (b) {
            var active = b.getAttribute("data-lang") === HG.lang;
            b.classList.toggle("active", active);
            b.setAttribute("aria-pressed", active ? "true" : "false");
        });
        setupCursor();
        setupClock();
        setupTelemetry();
        setupReveals();
        setupHeroCaret();
        setupMagnetic();
        setupToTop();
        wireToggles();
        HG.emit("ready");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else { init(); }
})();
