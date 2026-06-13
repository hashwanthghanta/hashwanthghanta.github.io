/* ============================================================
   projects.js — 03 SYSTEMS horizontal rail.
   Renders bilingual cards from DATA[lang].projects, pins the
   rail and scrubs translateX with scroll (GSAP), adds
   drag-to-explore. Mobile / reduced-motion → vertical stack.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var rail = document.getElementById("projects-rail");
    var section = document.getElementById("systems");
    if (!rail) return;

    var st = null;
    var MOBILE = function () { return window.matchMedia("(max-width: 760px)").matches; };

    function media(p) {
        var src = null;
        var isGif = p.img1 && /\.gif$/i.test(p.img1);
        if (isGif) {
            /* show the animated GIF (e.g. the CO₂ simulation), but fall back to the
               static frame when the user prefers reduced motion */
            src = (HG.reduced && p.img2) ? p.img2 : p.img1;
        } else if (p.img1) {
            src = p.img1;
        } else if (p.img2) {
            src = p.img2;
        }
        if (src) return '<img src="' + src + '" width="640" height="480" alt="" loading="lazy" decoding="async">';
        if (p.svg && typeof PROJ_SVG !== "undefined" && PROJ_SVG[p.svg]) return PROJ_SVG[p.svg];
        return "";
    }

    function card(p, lang) {
        var learnedLabel = lang === "de" ? "Was ich gelernt habe" : "What I learned";
        var tags = (p.tags || []).slice(0, 7).map(function (t) {
            return '<span class="pc-tag">' + t + "</span>";
        }).join("");
        var links = "";
        if (p.url) links += '<a class="pc-link pc-link--primary" href="' + p.url + '" target="_blank" rel="noopener noreferrer">' +
            (p.urlLabel || (lang === "de" ? "Live ansehen" : "Open live demo")) +
            '<span class="pc-link-arrow" aria-hidden="true">↗</span>' + HG.newTabSR() + "</a>";
        if (p.caseStudy) links += '<a class="pc-link" href="' + p.caseStudy + '">' +
            (p.caseStudyLabel || (lang === "de" ? "Fallstudie" : "Case study")) +
            '<span class="pc-link-arrow" aria-hidden="true">→</span></a>';
        var learned = p.learned
            ? '<details class="pc-learned"><summary>' + learnedLabel + "</summary><p>" + p.learned + "</p></details>"
            : "";
        return '' +
        '<article class="project-card" id="project-' + p.num + '">' +
            '<span class="pc-numeral" aria-hidden="true">' + p.num + "</span>" +
            '<div class="pc-body">' +
                '<p class="pc-cat">' + p.cat + "</p>" +
                '<h3 class="pc-name">' + p.name + "</h3>" +
                '<p class="pc-period">' + (p.period || "") + "</p>" +
                '<p class="pc-desc">' + p.desc + "</p>" +
                '<div class="pc-tags">' + tags + "</div>" +
                learned +
                (links ? '<div class="pc-links">' + links + "</div>" : "") +
            "</div>" +
            '<div class="pc-media">' + media(p) + "</div>" +
        "</article>";
    }

    function render() {
        var lang = HG.lang;
        var d = (typeof DATA !== "undefined" && DATA[lang]) || {};
        var projects = d.projects || [];
        rail.innerHTML = projects.map(function (p) { return card(p, lang); }).join("");
        var total = document.getElementById("rail-total");
        if (total) total.textContent = String(projects.length).padStart(2, "0");
        attachSpotlight();
    }

    function attachSpotlight() {
        if (MOBILE() || HG.reduced) return;
        rail.querySelectorAll(".project-card").forEach(function (c) {
            c.addEventListener("pointermove", function (e) {
                var r = c.getBoundingClientRect();
                c.style.setProperty("--mx", (e.clientX - r.left) + "px");
                c.style.setProperty("--my", (e.clientY - r.top) + "px");
            });
        });
    }

    /* ---- horizontal scrub via CSS-sticky pin + ScrollTrigger progress ---- */
    var DIST = 0;
    var track = document.getElementById("systems-track");
    function buildScroll() {
        if (st) { st.kill(); st = null; }
        rail.style.transform = "";
        section.classList.remove("no-pin");
        if (track) track.style.height = "";
        if (MOBILE() || HG.reduced || typeof window.ScrollTrigger === "undefined") {
            section.classList.add("no-pin");
            return;
        }
        var gutter = parseFloat(getComputedStyle(document.body).getPropertyValue("--gutter")) || 24;
        DIST = Math.max(0, rail.scrollWidth - window.innerWidth + gutter);
        if (DIST === 0) { section.classList.add("no-pin"); return; }
        if (track) track.style.height = (window.innerHeight + DIST) + "px";
        var total = (DATA[HG.lang].projects || []).length || 1;
        var curEl = document.getElementById("rail-cur");
        st = window.ScrollTrigger.create({
            trigger: track,
            start: "top top",
            end: "bottom bottom",
            onUpdate: function (self) {
                /* round to whole px — sub-pixel transforms cause shimmer/jank */
                rail.style.transform = "translate3d(" + Math.round(-DIST * self.progress) + "px,0,0)";
                var cur = Math.min(total, Math.floor(self.progress * total) + 1);
                if (curEl) curEl.textContent = String(cur).padStart(2, "0");
            }
        });
    }

    /* keyboard: bring a focused (possibly off-screen) rail card into view */
    function setupFocusScroll() {
        rail.addEventListener("focusin", function (e) {
            if (MOBILE() || HG.reduced || !st || !track) return;
            var card = e.target.closest(".project-card");
            if (!card) return;
            var cards = Array.prototype.slice.call(rail.querySelectorAll(".project-card"));
            var idx = cards.indexOf(card);
            var total = cards.length;
            var p = total > 1 ? idx / (total - 1) : 0;
            var top = track.getBoundingClientRect().top + window.scrollY;
            HG.scroll.to(top + (track.offsetHeight - window.innerHeight) * p);
        });
    }

    function init() {
        render();
        buildScroll();
        setupFocusScroll();
        HG.on("langchange", function () {
            render();
            if (window.ScrollTrigger) window.ScrollTrigger.refresh();
        });
        var rt;
        window.addEventListener("resize", function () {
            clearTimeout(rt);
            rt = setTimeout(function () { buildScroll(); if (window.ScrollTrigger) window.ScrollTrigger.refresh(); }, 220);
        }, { passive: true });
    }

    if (document.fonts && document.fonts.ready) document.fonts.ready.then(init);
    else window.addEventListener("load", init, { once: true });
})();
