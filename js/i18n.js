/* ============================================================
   i18n + app bus — window.HG
   Reuses the DATA dictionary (data.js) and the [data-i18n]
   mechanism. Owns language + theme state, a tiny event bus,
   and view-transition wipes for both toggles.
============================================================ */
(function () {
    "use strict";

    var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function read(key, fallback) {
        try { var v = localStorage.getItem(key); return v == null ? fallback : v; }
        catch (e) { return fallback; }
    }
    function write(key, val) { try { localStorage.setItem(key, val); } catch (e) {} }

    var listeners = {};
    var HG = {
        reduced: REDUCED,
        lang: read("lang", "en"),
        theme: document.body.getAttribute("data-theme") || "dark",   /* default dark; OS scheme is ignored (inline head script already set this) */
        data: function () { return (typeof DATA !== "undefined" && DATA[HG.lang]) || {}; },
        on: function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); },
        emit: function (evt, payload) { (listeners[evt] || []).forEach(function (fn) {
            try { fn(payload); } catch (e) { console.warn("HG listener failed", evt, e); }
        }); }
    };
    window.HG = HG;

    /* ---- view transition helper (with optional circular clip origin) ---- */
    function withViewTransition(mutator, origin) {
        if (REDUCED || !document.startViewTransition) { mutator(); return; }
        if (origin) {
            document.documentElement.style.setProperty("--vt-x", origin.x + "px");
            document.documentElement.style.setProperty("--vt-y", origin.y + "px");
            document.documentElement.classList.add("vt-circle");
        }
        try {
            var t = document.startViewTransition(mutator);
            var cleanup = function () { document.documentElement.classList.remove("vt-circle"); };
            /* .ready and .finished both reject when a transition is skipped — swallow. */
            if (t.ready && t.ready.catch) t.ready.catch(function () {});
            t.finished.then(cleanup, cleanup);
        } catch (e) { mutator(); document.documentElement.classList.remove("vt-circle"); }
    }
    HG.withViewTransition = withViewTransition;

    /* ---- i18n ---- */
    function applyI18n(lang) {
        var d = (typeof DATA !== "undefined" && DATA[lang]) || {};
        document.querySelectorAll("[data-i18n]").forEach(function (el) {
            var k = el.getAttribute("data-i18n");
            if (d[k] !== undefined) el.textContent = d[k];
        });
        /* attribute translation: data-i18n-attr="aria-label:key" (";"-separated pairs) */
        document.querySelectorAll("[data-i18n-attr]").forEach(function (el) {
            el.getAttribute("data-i18n-attr").split(";").forEach(function (pair) {
                var i = pair.indexOf(":");
                if (i < 1) return;
                var attr = pair.slice(0, i).trim(), key = pair.slice(i + 1).trim();
                if (d[key] !== undefined) el.setAttribute(attr, d[key]);
            });
        });
    }
    HG.applyI18n = applyI18n;

    /* ---- single persistent polite live region (#sr-live) ---- */
    var annT;
    HG.announce = function (msg) {
        var region = document.getElementById("sr-live");
        if (!region) return;
        clearTimeout(annT);
        region.textContent = "";
        annT = setTimeout(function () { region.textContent = msg; }, 80);
    };

    HG.newTabSR = function () {
        return ' <span class="sr-only">(' +
            (HG.lang === "de" ? "öffnet in neuem Tab" : "opens in new tab") + ")</span>";
    };

    function setLanguage(lang) {
        withViewTransition(function () {
            HG.lang = lang;
            write("lang", lang);
            document.documentElement.lang = lang;
            document.querySelectorAll(".lang-btn").forEach(function (b) {
                var active = b.getAttribute("data-lang") === lang;
                b.classList.toggle("active", active);
                b.setAttribute("aria-pressed", active ? "true" : "false");
                b.setAttribute("aria-label", active
                    ? (lang === "de" ? "Deutsch (aktuelle Sprache)" : "English (current language)")
                    : (lang === "de" ? "Switch to English" : "Auf Deutsch umschalten"));
            });
            applyI18n(lang);
            /* swap localized hrefs/downloads */
            var rb = document.getElementById("resume-btn");
            if (rb) {
                if (lang === "de") {
                    rb.href = "lebenslauf.pdf"; rb.download = "Hashwanth_Ghanta_Lebenslauf.pdf";
                    rb.setAttribute("aria-label", "Lebenslauf.pdf — Lebenslauf als PDF herunterladen");
                } else {
                    rb.href = "resume.pdf"; rb.download = "Hashwanth_Ghanta_CV_English.pdf";
                    rb.setAttribute("aria-label", "Résumé.pdf — download CV (PDF)");
                }
            }
            var map = [["footer-now","now.html","now-de.html"],
                      ["footer-uses","uses.html","uses-de.html"],
                      ["footer-co2","projects/co2-simulation.html","projects/co2-simulation-de.html"],
                      ["sim-co2-case","projects/co2-simulation.html","projects/co2-simulation-de.html"]];
                      /* sim-co2-build points to the single Unity Play URL — not language-swapped */
            map.forEach(function (m) {
                var el = document.getElementById(m[0]);
                if (el) el.href = lang === "de" ? m[2] : m[1];
            });
            HG.emit("langchange", lang);
            if (d() .ann_lang) HG.announce(d().ann_lang);
        });
        function d() { return (typeof DATA !== "undefined" && DATA[lang]) || {}; }
    }
    HG.setLanguage = setLanguage;
    window.setLanguage = setLanguage;

    function applyTheme(theme, origin) {
        theme = theme === "light" ? "light" : "dark";
        withViewTransition(function () {
            HG.theme = theme;
            document.body.setAttribute("data-theme", theme);
            document.documentElement.style.colorScheme = theme;
            var meta = document.getElementById("meta-theme-color");
            if (meta) meta.setAttribute("content", theme === "light" ? "#F4F4F2" : "#0A0A0B");
            var td = (typeof DATA !== "undefined" && DATA[HG.lang]) || {};
            document.querySelectorAll(".theme-btn").forEach(function (b) {
                b.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
                b.setAttribute("aria-label", theme === "light"
                    ? (td.a11y_theme_to_dark || "Switch to dark theme")
                    : (td.a11y_theme_to_light || "Switch to light theme"));
            });
            write("theme", theme);
            HG.emit("themechange", theme);
            var d = (typeof DATA !== "undefined" && DATA[HG.lang]) || {};
            var key = theme === "light" ? "ann_theme_light" : "ann_theme_dark";
            if (d[key]) HG.announce(d[key]);
        }, origin);
    }
    HG.applyTheme = applyTheme;
    HG.toggleTheme = function (origin) { applyTheme(HG.theme === "light" ? "dark" : "light", origin); };
})();
