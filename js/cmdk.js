/* ============================================================
   cmdk.js — ⌘K command palette. Native <dialog> + showModal
   (top layer, Esc, background inertness for free).
   Combobox pattern: focus STAYS on the input; the active
   option is conveyed via aria-activedescendant (no roving
   tabindex). Result count → its own polite region, debounced.
============================================================ */
(function () {
    "use strict";
    var HG = window.HG;
    var dlg = document.getElementById("cmdk");
    var input = document.getElementById("cmdk-input");
    var list = document.getElementById("cmdk-list");
    var empty = document.getElementById("cmdk-empty");
    var countEl = document.getElementById("cmdk-count");
    var trigger = document.getElementById("cmdk-trigger");
    if (!dlg || !input || !list || !trigger || typeof dlg.showModal !== "function") return;

    var SECTIONS = [
        ["identity", "01"], ["about", "02"], ["simulation", "03"],
        ["systems", "04"], ["capabilities", "05"], ["stack", "06"],
        ["trajectory", "07"], ["now", "08"], ["handshake", "09"]
    ];

    var UNITY_URL = "https://play.unity.com/en/games/30f22392-532c-41e1-b925-6191a9ea99c2/post-combustion-co-carbon-capture";
    function openUrl(u) { window.open(u, "_blank", "noopener"); }
    function navTo(u) { window.location.href = u; }

    function commands() {
        var d = HG.data();
        var de = HG.lang === "de";
        var dd = function (en, deTxt) { return de ? deTxt : en; };
        var grp = function (g) { return function (c) { c.group = g; return c; }; };

        /* [desc-en, desc-de, search keywords/synonyms] — keywords make every item
           findable by intent (resume → CV, mail → email, work → experience…). */
        var NAV = {
            identity:     ["Hero — who I am at a glance", "Hero — wer ich bin, auf einen Blick", "home hero top intro name landing start"],
            about:        ["About me, stats, GitHub activity", "Über mich, Statistiken, GitHub-Aktivität", "about bio summary profile stats github activity me"],
            simulation:   ["CO₂ capture simulation walkthrough", "CO₂-Abscheidungs-Simulation", "co2 carbon capture simulation unity project absorber stripper plant chemical"],
            systems:      ["Selected project case studies", "Ausgewählte Projekt-Fallstudien", "projects systems work portfolio case study case studies"],
            capabilities: ["What I do — services", "Was ich mache — Leistungen", "services capabilities what i do offer skills"],
            stack:        ["Tools & tech, with proof", "Tools & Technik, mit Belegen", "stack skills tools tech technologies swift python unity sql javascript blender git"],
            trajectory:   ["Education & experience timeline", "Bildung & Erfahrung", "experience education timeline career background university ovgu vit work studies degree"],
            now:          ["What I'm building right now", "Woran ich gerade arbeite", "now building current hcai learning latest"],
            handshake:    ["Contact form & details", "Kontaktformular & Details", "contact email message hire connect reach get in touch location magdeburg germany linkedin github phone"]
        };
        var nav = SECTIONS.map(function (s) {
            var key = "nav_" + (s[0] === "handshake" ? "contact" : s[0]);
            var n = NAV[s[0]] || ["", "", ""];
            return {
                id: "cmd-nav-" + s[0], group: d.cmdk_group_nav || "Navigate",
                route: "/" + s[0], label: d[key] || s[0], descTxt: dd(n[0], n[1]), kw: n[2],
                run: function () { jump(s[0]); }
            };
        });
        /* Documents — CVs + internal pages (same tab). */
        var docs = [
            { id: "cmd-cv-en", route: "~/cv.en.pdf", label: d.cmdk_cv_en, descTxt: dd("Open my English CV (PDF)", "Englischen Lebenslauf öffnen (PDF)"), kw: "resume résumé resumé cv curriculum vitae english download pdf document lebenslauf", run: function () { openUrl("resume.pdf"); } },
            { id: "cmd-cv-de", route: "~/cv.de.pdf", label: d.cmdk_cv_de, descTxt: dd("Open my German CV (PDF)", "Deutschen Lebenslauf öffnen (PDF)"), kw: "lebenslauf resume résumé resumé cv curriculum vitae german deutsch download pdf document", run: function () { openUrl("lebenslauf.pdf"); } },
            { id: "cmd-case",  route: "/co2-case",   label: d.cmdk_case, descTxt: dd("Read the full CO₂ project case study", "Vollständige CO₂-Fallstudie lesen"), kw: "co2 case study simulation unity project read details writeup", run: function () { navTo("projects/co2-simulation.html"); } },
            { id: "cmd-now",   route: "/now",        label: d.cmdk_now, descTxt: dd("What I'm building — the /now page", "Woran ich arbeite — die /now-Seite"), kw: "now building current page status latest", run: function () { navTo("now.html"); } },
            { id: "cmd-uses",  route: "/uses",       label: d.cmdk_uses, descTxt: dd("My toolkit & setup — the /uses page", "Mein Toolkit & Setup — die /uses-Seite"), kw: "uses tools setup gear toolkit kit hardware software", run: function () { navTo("uses.html"); } }
        ].map(grp(d.cmdk_group_docs || "Documents"));
        /* Links — external (new tab). */
        var links = [
            { id: "cmd-unity", route: "↗ unity-build", label: d.cmdk_unity, descTxt: dd("Play the live Unity WebGL build", "Live-Unity-WebGL-Build starten"), kw: "unity play webgl demo co2 simulation live build game project run", run: function () { openUrl(UNITY_URL); } },
            { id: "cmd-sw",    route: "↗ stockwatch",  label: d.cmdk_stockwatch, descTxt: dd("StockWatch iOS source on GitHub", "StockWatch-iOS-Quellcode auf GitHub"), kw: "stockwatch ios swift app stocks finance repo github source code", run: function () { openUrl("https://github.com/hashwanthghanta/stockwatch-ios"); } },
            { id: "cmd-gh",    route: "↗ github",      label: d.cmdk_github, descTxt: dd("My GitHub profile", "Mein GitHub-Profil"), kw: "github git repo repository code source profile open", run: function () { openUrl("https://github.com/hashwanthghanta"); } },
            { id: "cmd-li",    route: "↗ linkedin",    label: d.cmdk_linkedin, descTxt: dd("My LinkedIn profile", "Mein LinkedIn-Profil"), kw: "linkedin profile network professional contact connect", run: function () { openUrl("https://www.linkedin.com/in/hashwanthghanta"); } }
        ].map(grp(d.cmdk_group_links || "Links"));
        /* Actions — toggles + copy email. */
        var act = [
            { id: "cmd-copy",  route: ":copy",  label: d.cmdk_copy,  descTxt: dd("Copy my email to the clipboard", "E-Mail in die Zwischenablage kopieren"), kw: "email mail address gmail contact copy reach hashwanthghanta", run: copyEmail },
            { id: "cmd-theme", route: ":theme", label: d.cmdk_theme, descTxt: dd("Toggle dark / light theme", "Dunkel/Hell umschalten"), kw: "theme dark light mode toggle appearance colour color", run: function () { HG.toggleTheme(); } },
            { id: "cmd-lang",  route: ":lang",  label: d.cmdk_lang,  descTxt: dd("Switch site language EN / DE", "Sprache umschalten EN / DE"), kw: "language english german deutsch switch translate locale sprache", run: function () { HG.setLanguage(HG.lang === "de" ? "en" : "de"); } }
        ].map(grp(d.cmdk_group_act || "Actions"));

        return nav.concat(docs, links, act);
    }

    function copyEmail() {
        var mail = "hashwanthghanta@gmail.com";
        var done = function () { HG.announce((HG.data().copy_done || "Copied") + " — " + mail); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(mail).then(done, done);
        } else done();
    }

    function jump(id) {
        var target = document.getElementById(id);
        if (!target) return;
        var heading = target.querySelector("h1, h2");
        HG.scroll.to(target, { offset: -10 });
        if (heading) {
            heading.setAttribute("tabindex", "-1");
            setTimeout(function () { heading.focus({ preventScroll: true }); }, HG.reduced ? 0 : 450);
        }
    }

    /* ---------- state ---------- */
    var all = [], filtered = [], active = -1, countT;

    function filter(q) {
        q = (q || "").trim().toLowerCase();
        filtered = !q ? all.slice() : all.filter(function (c) {
            return ((c.label || "") + " " + (c.route || "") + " " + (c.descTxt || "") + " " + (c.kw || "")).toLowerCase().indexOf(q) !== -1;
        });
        active = filtered.length ? 0 : -1;
        paint();
        announceCount();
    }

    function paint() {
        var html = "", lastGroup = null;
        filtered.forEach(function (c, i) {
            if (c.group !== lastGroup) {
                lastGroup = c.group;
                html += '<li class="cmdk__group" role="presentation" aria-hidden="true"># ' + c.group + "</li>";
            }
            html += '<li class="cmdk__opt" role="option" id="' + c.id + '" aria-selected="' + (i === active) + '" data-i="' + i + '">' +
                '<span class="mark" aria-hidden="true">❯</span>' +
                '<span class="cmdk__cmd">' + (c.route || "$") + "</span>" +
                '<span class="cmdk__desc">' + (c.descTxt || c.label) + "</span>" +
            "</li>";
        });
        list.innerHTML = html;
        if (empty) empty.hidden = filtered.length > 0;
        syncActive();
    }

    function syncActive() {
        list.querySelectorAll(".cmdk__opt").forEach(function (el) {
            var on = +el.getAttribute("data-i") === active;
            el.setAttribute("aria-selected", on ? "true" : "false");
            if (on) el.scrollIntoView({ block: "nearest" });
        });
        if (active >= 0 && filtered[active]) input.setAttribute("aria-activedescendant", filtered[active].id);
        else input.removeAttribute("aria-activedescendant");
    }

    function announceCount() {
        if (!countEl) return;
        clearTimeout(countT);
        countT = setTimeout(function () {
            var d = HG.data();
            countEl.textContent = filtered.length
                ? filtered.length + " " + (filtered.length === 1 ? (d.cmdk_result || "result") : (d.cmdk_results || "results"))
                : (d.cmdk_empty || "No matches");
        }, 300);
    }

    /* ---------- open / close ---------- */
    function open() {
        all = commands();
        input.value = "";
        filter("");
        dlg.showModal();
        input.setAttribute("aria-expanded", "true");
        input.focus();
    }
    function close() { dlg.close(); }

    dlg.addEventListener("close", function () {
        /* covers both close() and native ESC dismissal */
        input.setAttribute("aria-expanded", "false");
        /* plain close → focus returns to the trigger (jump() already moved
           focus to a heading; refocusing a hidden-behind-scroll trigger is
           skipped if focus already moved) */
        if (document.activeElement === document.body || document.activeElement === dlg) trigger.focus();
    });
    dlg.addEventListener("click", function (e) {
        /* click on the backdrop (the dialog element itself) closes */
        if (e.target === dlg) close();
    });

    trigger.addEventListener("click", open);
    window.addEventListener("keydown", function (e) {
        if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
            e.preventDefault();
            dlg.open ? close() : open();
        }
    });

    input.addEventListener("input", function () { filter(input.value); });
    input.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown") { e.preventDefault(); if (filtered.length) { active = (active + 1) % filtered.length; syncActive(); } }
        else if (e.key === "ArrowUp") { e.preventDefault(); if (filtered.length) { active = (active - 1 + filtered.length) % filtered.length; syncActive(); } }
        else if (e.key === "Home" && filtered.length) { e.preventDefault(); active = 0; syncActive(); }
        else if (e.key === "End" && filtered.length) { e.preventDefault(); active = filtered.length - 1; syncActive(); }
        else if (e.key === "Enter") {
            e.preventDefault();
            if (active >= 0 && filtered[active]) { var cmd = filtered[active]; close(); cmd.run(); }
        }
    });
    list.addEventListener("click", function (e) {
        var opt = e.target.closest(".cmdk__opt");
        if (!opt) return;
        var cmd = filtered[+opt.getAttribute("data-i")];
        if (cmd) { close(); cmd.run(); }
    });
    /* hover moves the active option (visual parity with keyboard) */
    list.addEventListener("pointermove", function (e) {
        var opt = e.target.closest(".cmdk__opt");
        if (!opt) return;
        var i = +opt.getAttribute("data-i");
        if (i !== active) { active = i; syncActive(); }
    });
})();
