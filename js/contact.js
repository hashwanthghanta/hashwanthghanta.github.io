/* ============================================================
   contact.js — 06 HANDSHAKE terminal form (EmailJS, survivor
   credentials), copy-to-clipboard readouts, and the monument
   footer (scroll fill + per-letter hover rise).
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;

    var EMAIL = { pub: "MM3bI7Ecwcbc9DcZi", service: "service_joq8tyr", template: "template_vihv3zr" };
    var OK = {
        en: "> message transmitted. response < 24h_",
        de: "> nachricht übertragen. antwort < 24h_"
    };
    var ERR = {
        en: "> transmission failed — email me directly.",
        de: "> übertragung fehlgeschlagen — schreib mir direkt."
    };

    /* ---- contact form ---- */
    function setupForm() {
        var form = document.getElementById("contact-form");
        var status = document.getElementById("cf-status");
        if (!form) return;
        if (typeof emailjs !== "undefined") {
            try { emailjs.init({ publicKey: EMAIL.pub }); } catch (e) {}
        }

        var btn = form.querySelector('button[type="submit"]');
        var COOLDOWN_MS = 60000;

        function checkCooldown() {
            var lastSent = sessionStorage.getItem("contact_last_sent");
            if (lastSent) {
                var remaining = COOLDOWN_MS - (Date.now() - Number(lastSent));
                if (remaining > 0) {
                    if (btn) btn.disabled = true;
                    setTimeout(function () {
                        if (btn) btn.disabled = false;
                    }, remaining);
                    return remaining;
                }
            }
            if (btn) btn.disabled = false;
            return 0;
        }
        checkCooldown();

        /* #cf-status is a role="status" live region — set the FULL string at
           once so screen readers announce the complete confirmation, not a
           stutter of partial strings. The terminal look stays via the text. */
        function setStatus(el, text) { el.textContent = text; }

        var fields = ["cf-name", "cf-email", "cf-msg"].map(function (id) { return document.getElementById(id); });
        fields.forEach(function (f) {
            if (f) f.addEventListener("input", function () { f.removeAttribute("aria-invalid"); });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            var hp = form.querySelector('[name="website"]');
            if (hp && hp.value) return;                 /* bot */

            var remaining = checkCooldown();
            if (remaining > 0) {
                status.className = "cf-status err";
                status.textContent = HG.lang === "de"
                    ? "> bitte warte " + Math.ceil(remaining / 1000) + "s vor der nächsten übertragung."
                    : "> please wait " + Math.ceil(remaining / 1000) + "s before sending again.";
                return;
            }

            /* explicit, programmatically-associated error identification (WCAG 3.3.1) */
            var firstBad = null;
            fields.forEach(function (f) {
                if (!f) return;
                if (f.validity.valid) { f.removeAttribute("aria-invalid"); }
                else { f.setAttribute("aria-invalid", "true"); if (!firstBad) firstBad = f; }
            });
            if (firstBad) {
                status.className = "cf-status err";
                status.textContent = HG.lang === "de"
                    ? "> bitte alle felder korrekt ausfüllen."
                    : "> please complete every field correctly.";
                firstBad.focus();
                return;
            }

            if (typeof emailjs === "undefined") {
                status.className = "cf-status err";
                setStatus(status, ERR[HG.lang] || ERR.en);
                return;
            }

            status.className = "cf-status";
            status.textContent = HG.lang === "de" ? "> wird gesendet…" : "> sending…";
            emailjs.send(EMAIL.service, EMAIL.template, {
                from_name:  document.getElementById("cf-name").value.trim(),
                from_email: document.getElementById("cf-email").value.trim(),
                message:    document.getElementById("cf-msg").value.trim()
            }).then(function () {
                status.className = "cf-status ok";
                setStatus(status, OK[HG.lang] || OK.en);
                sessionStorage.setItem("contact_last_sent", Date.now().toString());
                checkCooldown();
                form.reset();
            }, function (error) {
                status.className = "cf-status err";
                setStatus(status, ERR[HG.lang] || ERR.en);
                console.error("EmailJS transmission failed:", error);
            });
        });
    }

    /* ---- copy-to-clipboard ---- */
    function setupCopy() {
        document.querySelectorAll(".ro-copy").forEach(function (btn) {
            btn.addEventListener("click", function () {
                var val = btn.getAttribute("data-copy");
                var done = function () {
                    var prev = btn.textContent;
                    btn.classList.add("done");
                    btn.textContent = (HG.lang === "de" ? "KOPIERT ✓" : "COPIED ✓");
                    HG.announce((HG.data().copy_done || "Copied") + " — " + val);
                    setTimeout(function () { btn.classList.remove("done"); btn.textContent = prev; }, 1600);
                };
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(val).then(done, done);
                } else {
                    var t = document.createElement("textarea");
                    t.value = val; document.body.appendChild(t); t.select();
                    try { document.execCommand("copy"); } catch (e) {}
                    document.body.removeChild(t); btn.focus(); done();
                }
            });
        });
    }

    /* ---- monument footer ---- */
    function setupMonument() {
        var mtext = document.querySelector(".monument .mtext");
        var fill = document.getElementById("monument-fill");
        if (!mtext) return;
        /* split into letters for hover-rise */
        var txt = mtext.textContent;
        mtext.textContent = "";
        var monument = document.querySelector(".monument");
        var nonSpace = 0;
        for (var i = 0; i < txt.length; i++) {
            var s = document.createElement("span");
            s.className = "ml";
            s.textContent = txt[i] === " " ? " " : txt[i];
            if (s.textContent.trim()) { s.style.transitionDelay = (nonSpace * 32) + "ms"; nonSpace++; }
            mtext.appendChild(s);
        }
        if (monument && "IntersectionObserver" in window && !HG.reduced) {
            var mio = new IntersectionObserver(function (es) {
                es.forEach(function (en) { if (en.isIntersecting) { monument.classList.add("is-in"); mio.disconnect(); } });
            }, { threshold: 0.25 });
            mio.observe(monument);
        } else if (monument) { monument.classList.add("is-in"); }
        if (!fill) return;
        var footer = document.querySelector(".shutdown");
        /* Fill the name as the page scrolls through the footer. Anchored to the
           document's true scroll range so it ALWAYS completes (100%) at the
           page bottom — the footer is the last thing on the page and can never
           scroll to 30%-up, which previously capped the fill mid-word ("N"). */
        HG.scroll.on(function () {
            if (HG.reduced) { fill.style.clipPath = "inset(0 0 0 0)"; return; }
            var maxY = (document.documentElement.scrollHeight - window.innerHeight) || 1;
            var startY = Math.max(0, footer.offsetTop - window.innerHeight * 0.85);
            var span = Math.max(1, maxY - startY);
            var p = Math.max(0, Math.min(1, (window.scrollY - startY) / span));
            fill.style.clipPath = "inset(0 " + (100 - p * 100).toFixed(1) + "% 0 0)";
        });
    }

    function init() { setupForm(); setupCopy(); setupMonument(); }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
})();
