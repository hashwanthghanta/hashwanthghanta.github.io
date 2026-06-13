/* ============================================================
   boot.js — terminal boot sequence + upward wipe reveal.
   Click/key skips. Reduced-motion or deep-link hash bypasses.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var boot = document.getElementById("boot");
    if (!boot) { document.body.classList.remove("is-booting"); return; }

    var linesEl = boot.querySelector(".boot__lines");
    var barEl = boot.querySelector(".boot__bar");
    var pctEl = boot.querySelector(".boot__pct-val");
    var skipEl = boot.querySelector(".boot__skip");

    var LINES = [
        { t: "> HG.SYSTEMS", cls: "" },
        { t: "loading modules…", ok: "OK" },
        { t: "unity.simulation…", ok: "OK" },
        { t: "backend.core…", ok: "OK" },
        { t: "ios.native…", ok: "OK" },
        { t: "AVAILABLE Q2 2026 — MAGDEBURG, DE", cls: "avail" },
        { t: "launch_", caret: true }
    ];

    /* make the page behind the boot dialog inert + hidden from AT */
    var INERT_SEL = ["#main", ".app-header", ".chapter-rail", ".hud", ".shutdown", ".to-top"];
    function setInert(on) {
        INERT_SEL.forEach(function (sel) {
            document.querySelectorAll(sel).forEach(function (el) {
                if (on) { el.setAttribute("inert", ""); el.setAttribute("aria-hidden", "true"); }
                else { el.removeAttribute("inert"); el.removeAttribute("aria-hidden"); }
            });
        });
    }

    var done = false;
    function finish(instant) {
        if (done) return; done = true;
        function reveal() {
            setInert(false);
            boot.remove();
            document.body.classList.remove("is-booting");
            document.body.classList.add("boot-reveal");
            var lenis = HG && HG.scroll && HG.scroll.lenis && HG.scroll.lenis();
            if (lenis) lenis.start();
            /* Always reveal at the very top unless the user deep-linked to an anchor.
               Lenis + ScrollTrigger can leave a non-zero scroll after their refresh —
               re-pin to 0 for a short window so a plain refresh always starts at the hero. */
            var deepLink = location.hash && location.hash !== "#" && location.hash !== "#top";
            if (!deepLink) {
                var pin = function () {
                    if (window.ScrollTrigger) window.ScrollTrigger.refresh();
                    if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
                    window.scrollTo(0, 0);
                };
                pin();
                var start = performance.now();
                (function rePin() {
                    window.scrollTo(0, 0);
                    if (lenis) lenis.scrollTo(0, { immediate: true });
                    if (performance.now() - start < 300) requestAnimationFrame(rePin);
                })();
            }
        }
        if (instant) { reveal(); return; }
        boot.classList.add("is-wiping");
        boot.addEventListener("animationend", reveal, { once: true });
        setTimeout(reveal, 900); /* failsafe if animationend missed */
    }

    /* bypass conditions */
    if (HG.reduced || (location.hash && location.hash !== "#" && location.hash !== "#top")) {
        finish(true);
        return;
    }

    /* trap focus on the boot dialog: inert the page, focus Skip */
    setInert(true);
    if (skipEl) { try { skipEl.focus({ preventScroll: true }); } catch (e) { skipEl.focus(); } }

    /* pause Lenis during boot */
    setTimeout(function () {
        if (HG.scroll && HG.scroll.lenis && HG.scroll.lenis()) HG.scroll.lenis().stop();
    }, 0);

    if (skipEl) skipEl.addEventListener("click", function () { finish(false); });
    /* only a skip key removes the handler — a stray Tab must NOT disarm keyboard skip */
    function onKey(e) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            document.removeEventListener("keydown", onKey);
            finish(false);
        }
    }
    document.addEventListener("keydown", onKey);
    boot.addEventListener("click", function (e) { if (e.target !== skipEl) finish(false); });

    /* type lines */
    var i = 0;
    var total = LINES.length;
    function setPct(p) {
        var v = Math.round(p * 100);
        if (barEl) barEl.style.transform = "scaleX(" + p + ")";
        if (pctEl) pctEl.textContent = (v < 100 ? "0" : "") + (v < 10 ? "0" : "") + v;
    }
    function next() {
        if (done) return;
        if (i >= total) { setPct(1); setTimeout(function () { finish(false); }, 240); return; }
        var L = LINES[i];
        var div = document.createElement("div");
        div.className = "boot__line " + (L.cls === "avail" ? "" : "");
        var html = '<span class="' + (L.cls === "avail" ? "avail" : "") + '">' + escapeHtml(L.t) + "</span>";
        if (L.ok) html += ' <span class="ok">[' + L.ok + "]</span>";
        if (L.caret) html += '<span class="boot__caret"></span>';
        div.innerHTML = html;
        linesEl.appendChild(div);
        i++;
        setPct(i / total);
        setTimeout(next, i === 1 ? 180 : 190);
    }
    function escapeHtml(s) { return s.replace(/[&<>]/g, function (c) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

    setPct(0);
    setTimeout(next, 120);
})();
