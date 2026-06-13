/* ============================================================
   profilecard.js — hero ProfileCard: 3D pointer-tilt + a
   holographic sheen that follows the cursor. Pure decoration:
   no roles, no tabindex; the Contact link inside stays a link.
   Gates: fine pointer + desktop + motion allowed.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var card = document.getElementById("pcard");
    var inner = document.getElementById("pcard-inner");
    if (!card || !inner) return;

    /* Contact link → move focus to the contact heading (a11y: all jump
       mechanisms converge on focusing the target heading). */
    var cta = card.querySelector(".pcard__cta");
    if (cta) cta.addEventListener("click", function () {
        var h = document.getElementById("hand-h");
        if (!h) return;
        h.setAttribute("tabindex", "-1");
        setTimeout(function () { h.focus({ preventScroll: true }); }, 350);
    });

    if (HG && HG.reduced) return;
    var FINE = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!FINE) return;
    function DESKTOP() { return !window.matchMedia("(max-width: 980px)").matches; }

    var MAX_TILT = 9;          /* deg — present, not seasick */
    var raf = 0, px = 0.5, py = 0.5, inside = false;

    function apply() {
        raf = 0;
        if (!inside) return;
        inner.style.setProperty("--ry", ((px - 0.5) * 2 * MAX_TILT).toFixed(2) + "deg");
        inner.style.setProperty("--rx", ((0.5 - py) * 2 * MAX_TILT).toFixed(2) + "deg");
        inner.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        inner.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
    }
    card.addEventListener("pointermove", function (e) {
        if (!DESKTOP()) return;
        var r = inner.getBoundingClientRect();
        px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
        py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
        inside = true;
        if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    card.addEventListener("pointerleave", function () {
        inside = false;
        inner.style.setProperty("--rx", "0deg");
        inner.style.setProperty("--ry", "0deg");
        inner.style.setProperty("--gx", "50%");
        inner.style.setProperty("--gy", "20%");
    });
})();
