/* ============================================================
   STATE
============================================================ */
let currentLang  = (function(){ try { return localStorage.getItem("lang") || "en"; } catch(e) { return "en"; } })();
let currentTheme = (function(){
    try {
        const saved = localStorage.getItem("theme");
        if (saved) return saved;
    } catch(e){}
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
})();
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let currentProjects = [];

/* ============================================================
   SCROLL BUS — single window.scroll listener, rAF-throttled.
   Replaces 7 separate scroll handlers (review feedback).
   Subscribers receive { y, dy, w, h } and may bail early.
============================================================ */
const __scrollBus = (function(){
    const subs = new Set();
    let rafId = 0, lastY = 0;
    function tick() {
        rafId = 0;
        const y = window.scrollY;
        const payload = { y, dy: y - lastY, w: window.innerWidth, h: window.innerHeight };
        lastY = y;
        subs.forEach(fn => { try { fn(payload); } catch(e){ console.warn("scrollBus subscriber failed", e); } });
    }
    function schedule() {
        if (rafId) return;
        rafId = requestAnimationFrame(tick);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return {
        add(fn) { subs.add(fn); fn({ y: window.scrollY, dy: 0, w: window.innerWidth, h: window.innerHeight }); return () => subs.delete(fn); },
    };
})();

/* ============================================================
   RENDER
============================================================ */
function $(sel, root){ return (root||document).querySelector(sel); }
function $$(sel, root){ return Array.from((root||document).querySelectorAll(sel)); }

function applyI18n(lang) {
    const d = DATA[lang];
    $$("[data-i18n]").forEach(el => {
        const k = el.getAttribute("data-i18n");
        if (d[k] !== undefined) el.textContent = d[k];
    });
}

function renderServices(lang) {
    const d = DATA[lang];
    const list = $("#services-list");
    list.innerHTML = "";
    d.services.forEach((s, i) => {
        const item = document.createElement("li");
        item.className = "service-item reveal";
        item.style.transitionDelay = (i * 0.1) + "s";
        item.innerHTML = `
            <div class="service-num">${String(i + 1).padStart(2, "0")}</div>
            <div>
                <h3 class="service-name">${s.name}</h3>
                <p class="service-desc">${s.desc}</p>
            </div>`;
        list.appendChild(item);
        observeReveal(item);
    });
}

function renderProjects(lang) {
    const d = DATA[lang];
    currentProjects = d.projects;
    const stack = $("#projects-stack");
    stack.innerHTML = "";
    const total = d.projects.length;
    d.projects.forEach((p, i) => {
        const frame = document.createElement("div");
        frame.className = "project-card-frame";
        /* Deep-link anchor — skill chips and external links jump straight to this card. */
        frame.id = "project-" + p.num;
        const targetScale = 1 - (total - 1 - i) * 0.03;
        const stickyTop = 80 + i * 28;
        /* Build left column — real images if available, otherwise the inline SVG mockup. */
        let leftHtml;
        if (p.img1 && p.img2) {
            leftHtml = `
                <div class="pc-col-left">
                    <div class="pc-img top"><img src="${p.img1}" width="800" height="450" alt="" loading="lazy" decoding="async"></div>
                    <div class="pc-img bottom"><img src="${p.img2}" width="800" height="450" alt="" loading="lazy" decoding="async"></div>
                </div>`;
        } else if (p.img1) {
            leftHtml = `<div class="pc-img solo tall"><img src="${p.img1}" width="800" height="900" alt="" loading="lazy" decoding="async"></div>`;
        } else if (p.svg && PROJ_SVG[p.svg]) {
            leftHtml = `<div class="pc-img svg-mock solo tall" aria-hidden="true">${PROJ_SVG[p.svg]}</div>`;
        } else {
            leftHtml = `<div class="pc-img solo" aria-hidden="true"></div>`;
        }
        const highlightsHtml = (p.highlights && p.highlights.length)
            ? `<ul class="pc-highlights">${p.highlights.map(h => `<li>${h}</li>`).join("")}</ul>`
            : "";
        const tagsHtml = (p.tags && p.tags.length)
            ? `<div class="pc-tags">${p.tags.map(t => `<span class="pc-tag">${t}</span>`).join("")}</div>`
            : "";
        const liveCls = (p.url && (!p.urlLabel || /demo|live|play/i.test(p.urlLabel))) ? " live-demo" : "";
        const liveBtn = p.url
            ? `<a class="ghost-btn${liveCls}" href="${p.url}" target="_blank" rel="noopener noreferrer">${p.urlLabel || d.live}</a>`
            : "";
        const caseStudyBtn = p.caseStudy
            ? `<a class="ghost-btn pc-casestudy-link" href="${p.caseStudy}">${p.caseStudyLabel || (currentLang === "de" ? "Case Study lesen" : "Read case study")}</a>`
            : "";
        const learnedLabel = currentLang === "de" ? "Was ich gelernt habe" : "What I learned";
        const learnedHtml = p.learned
            ? `<div class="pc-learned"><div class="pc-learned-label">${learnedLabel}</div><p class="pc-learned-text">${p.learned}</p></div>`
            : "";
        const featuredAttr  = i === 0 ? ' data-featured="true"' : "";
        const featuredLabel = currentLang === "de" ? "VORGESTELLT" : "FEATURED";
        const featuredRibbon = i === 0
            ? `<span class="pc-featured-ribbon" aria-label="${featuredLabel} project"><span aria-hidden="true">★</span> ${featuredLabel}</span>`
            : "";
        frame.innerHTML = `
            <article class="project-card"${featuredAttr} data-index="${i}" style="top:${stickyTop}px;">
                ${featuredRibbon}
                <div class="pc-top">
                    <div class="pc-num">${p.num}</div>
                    <div class="pc-meta">
                        <div class="pc-cat">${p.cat}</div>
                        <h3 class="pc-name">${p.name}</h3>
                    </div>
                    <div class="pc-actions">
                        ${caseStudyBtn}
                        ${liveBtn}
                        <button class="ghost-btn pc-details-btn" data-index="${i}" type="button">${d.details}</button>
                    </div>
                </div>
                <div class="pc-grid">
                    ${leftHtml}
                    <div class="pc-details">
                        <div class="pc-period">${p.period || ""}</div>
                        <p class="pc-desc">${p.desc || ""}</p>
                        ${highlightsHtml}
                        ${learnedHtml}
                        ${tagsHtml}
                    </div>
                </div>
            </article>
        `;
        stack.appendChild(frame);
        observeReveal(frame);
    });
    /* Wire detail buttons */
    $$(".pc-details-btn", stack).forEach(btn => {
        btn.addEventListener("click", () => openProjectModal(Number(btn.dataset.index)));
    });
}

/* Brand icons — real, current logos served from simpleicons CDN.
   Each rendered as an <img> with empty alt + aria-hidden in the chip;
   the chip text label is the accessible name. */
const SI = (slug, color) => color
    ? `<img src="https://cdn.simpleicons.org/${slug}/${color}" alt="" aria-hidden="true" loading="lazy" decoding="async">`
    : `<img src="https://cdn.simpleicons.org/${slug}" alt="" aria-hidden="true" loading="lazy" decoding="async">`;

/* Inline brand glyphs — stylized, decorative, brand-coloured tiles that identify
   the software in the chip. Each is aria-hidden; chip text is the accessible name. */
const SWIFT_BIRD = `<path fill="#ffffff" d="M14.4 8.2c1.2 1 2.2 2.3 2.7 3.8.3 1.2.3 2.4 0 3.6.1.1.2.3.3.4 1-1.4 1.4-3 1.1-4.6-.4-2.4-2.3-4.5-4.7-5.2-.2-.1-.4-.1-.5-.2.2.1.3.2.4.3.2.2.4.3.5.5-.7-.2-1.4-.4-2.1-.5L11 6c-1.5-1-3.2-1.4-5-1-.2 0-.3.1-.5.2.5-.1 1 0 1.5.1 1 .2 2 .6 2.9 1.2.8.5 1.5 1.2 2.1 2-.1.2-.3.4-.5.5-1.5-1.1-3.1-1.9-4.9-2.1-1-.1-2 0-2.9.4 1.8.2 3.6 1.1 5.1 2.4.6.5 1.1 1 1.5 1.6-.5.7-1.1 1.4-1.8 1.9-1.9 1.6-4.3 2.6-6.8 2.8 2.1 1.1 4.6 1.5 7 1 2.2-.5 4.1-1.8 5.4-3.6.1-.2.2-.4.3-.6.5.7.9 1.4 1.2 2.2.6 1.6.6 3.3.1 4.9 1.5-1.7 2.2-4 1.7-6.2-.3-1.4-1-2.7-2-3.7z"/>`;
const SKILL_ICONS = {
    "Unity 3D":    SI("unity", "FFFFFF"),
    "C#":          `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#239120"/><text x="12" y="16" font-family="Inter, Helvetica, sans-serif" font-weight="800" font-size="11" fill="#ffffff" text-anchor="middle">C#</text></svg>`,
    /* Swift — orange tile with white bird glyph */
    "Swift":       `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="swo" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFB97A"/><stop offset="55%" stop-color="#F05138"/><stop offset="100%" stop-color="#D54223"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#swo)"/>${SWIFT_BIRD}</svg>`,
    /* SwiftUI — blue tile with same bird glyph */
    "SwiftUI":     `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sub" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5EC3FF"/><stop offset="100%" stop-color="#1A82E2"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#sub)"/>${SWIFT_BIRD}</svg>`,
    "SwiftUX":     `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="sux" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5EC3FF"/><stop offset="100%" stop-color="#1A82E2"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#sux)"/><text x="12" y="16" font-family="Inter, sans-serif" font-weight="900" font-size="9" fill="#ffffff" text-anchor="middle">UX</text></svg>`,
    /* Xcode — blue tile with grid + hammer */
    "Xcode":       `<svg viewBox="0 0 24 24" aria-hidden="true"><defs><linearGradient id="xc" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5EC3FF"/><stop offset="100%" stop-color="#1A82E2"/></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="5" fill="url(#xc)"/><g opacity="0.28" stroke="#ffffff" stroke-width="0.4"><line x1="2" y1="8"  x2="22" y2="8"/><line x1="2" y1="13" x2="22" y2="13"/><line x1="2" y1="18" x2="22" y2="18"/><line x1="8"  y1="2" x2="8"  y2="22"/><line x1="13" y1="2" x2="13" y2="22"/><line x1="18" y1="2" x2="18" y2="22"/></g><path fill="#1A1A2E" d="M9.4 17.3 5.2 13l1.5-1.5 4.2 4.3-1.5 1.5zM14.5 6.8c1 .1 2 .8 2.3 1.8.3 1-.1 2-.9 2.6l-2.7 1.9c-.4.3-1 .3-1.4 0L9.3 11.2 11 9.4l2.3 1.8 1.7-1.2c.3-.2.4-.6.1-.9-.2-.3-.6-.4-.9-.2l-.6.4-1.4-1.4 1.1-.8c.3-.2.7-.3 1.2-.3z"/></svg>`,
    "Python":      SI("python"),
    "SQL":         SI("mysql"),
    "JavaScript":  SI("javascript"),
    "GitHub":      SI("github", "F5F5F5"),
    /* Premiere Pro — deep navy tile with light-purple Pr */
    "Premiere Pro":`<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" fill="#00005B"/><path fill="#A6A0FF" d="M7.4 17.4V6.6h4.7c2.4 0 3.9 1.5 3.9 3.7s-1.5 3.7-3.9 3.7H10v3.4H7.4zm2.6-5.6h1.9c1 0 1.6-.6 1.6-1.6s-.6-1.6-1.6-1.6H10v3.2z"/><circle cx="17" cy="9" r="0.9" fill="#A6A0FF"/></svg>`,
    "Blender":     SI("blender"),
    "TextMeshPro": SI("unity", "C0C0C0"),
    /* Excel — green tile with white X */
    "Excel":       `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" fill="#107C41"/><path fill="#ffffff" d="M8.8 6.8 11.2 12l-2.4 5.2h2l1.2-3 1.2 3h2L12.8 12l2.4-5.2h-2l-1.2 3-1.2-3z"/></svg>`,
};

/* Education-card icons */
const EDU_ICONS = {
    grad:  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    zap:   `<svg viewBox="0 0 24 24" aria-hidden="true"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
    award: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>`,
};

function renderHeroSkills(lang) {
    const wrap = $("#hero-skills-track-wrap");
    if (!wrap) return;
    const chips = DATA[lang].heroChips;
    const pass = chips.map(c => {
        const icon = SKILL_ICONS[c] || `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="4"/></svg>`;
        return `<span class="hero-skill-chip"><span class="chip-ico" aria-hidden="true">${icon}</span>${c}</span>`;
    }).join("");
    wrap.innerHTML = `<div class="hero-skills-track">${pass + pass + pass}</div>`;
}

function renderSkills(lang) {
    const groups = DATA[lang].skillsGroups || [];
    const grid = $("#skills-grid");
    if (!grid) return;
    grid.innerHTML = "";
    groups.forEach((g, i) => {
        const card = document.createElement("div");
        card.className = "skill-card reveal";
        card.style.transitionDelay = (i * 0.06) + "s";
        const proofs = g.proofs || [];
        const proofsHtml = proofs.length
            ? `<ul class="skill-proofs">${proofs.map(p => {
                const external = /^https?:/.test(p.href);
                const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
                const icon = external
                    ? '<svg class="skill-proof-ico" viewBox="0 0 24 24" aria-hidden="true" width="13" height="13"><path d="M14 4h6v6M20 4 10 14M11 5H4v15h15v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                    : '<svg class="skill-proof-ico" viewBox="0 0 24 24" aria-hidden="true" width="13" height="13"><path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
                return `<li class="skill-proof-row"><a class="skill-proof-link" href="${p.href}"${attrs}><span class="skill-proof-name">${p.name}</span>${icon}</a><span class="skill-proof-note">${p.note}</span></li>`;
            }).join("")}</ul>`
            : "";
        const chipsHtml = g.chips.length
            ? `<div class="skill-chips">${g.chips.map(c => `<span class="skill-chip">${c}</span>`).join("")}</div>`
            : "";
        card.innerHTML = `<div class="skill-card-title">${g.category}</div>${proofsHtml}${chipsHtml}`;
        grid.appendChild(card);
        observeReveal(card);
    });
}

function renderTrack(lang) {
    const items = DATA[lang].track || [];
    const list = $("#track-list");
    if (!list) return;
    list.innerHTML = "";
    items.forEach((it, i) => {
        const li = document.createElement("li");
        li.className = "track-item reveal";
        li.style.transitionDelay = (i * 0.08) + "s";
        li.innerHTML = `
            <div class="track-date">${it.date}</div>
            <div class="track-role">${it.role}</div>
            <div class="track-org">${it.org}</div>
            <div class="track-body">${it.body}</div>`;
        list.appendChild(li);
        observeReveal(li);
    });
}

function renderEducation(lang) {
    const items = DATA[lang].education || [];
    const grid = $("#edu-grid");
    if (!grid) return;
    grid.innerHTML = "";
    items.forEach((it, i) => {
        const card = document.createElement("div");
        card.className = "edu-card reveal";
        card.style.transitionDelay = (i * 0.08) + "s";
        let inner = `<div class="edu-icon-wrap">${EDU_ICONS[it.iconKey] || EDU_ICONS.grad}</div>`;
        inner += `<div class="edu-degree">${it.degree}</div>`;
        if (it.period) inner += `<div class="edu-period">${it.period}</div>`;
        if (it.detail) inner += `<div class="edu-detail">${it.detail}</div>`;
        if (it.focusAreas && it.focusAreas.length) {
            const label = it.focusAreasLabel || (lang === "de" ? "Schwerpunkte" : "Focus areas");
            inner += `<div class="edu-block">` +
                `<div class="edu-block-label">${label}</div>` +
                `<div class="edu-focus-chips">` +
                    it.focusAreas.map(a => `<span class="edu-focus-chip">${a}</span>`).join("") +
                `</div>` +
                `</div>`;
        }
        if (it.subjects && it.subjects.length) {
            const label = it.subjectsLabel || (lang === "de" ? "Lehrveranstaltungen" : "Coursework");
            inner += `<div class="edu-block">` +
                `<div class="edu-block-label">${label}</div>` +
                `<div class="edu-subjects">` +
                    it.subjects.map(s => {
                        if (s.focus) {
                            return `<a class="edu-subject-link" href="#projects" aria-label="Jump to the DE visualization project in the Projects section"><span>${s.name}</span></a>`;
                        }
                        return `<span class="edu-subject">${s.name}</span>`;
                    }).join("") +
                `</div>` +
                `</div>`;
        }
        if (it.badges && it.badges.length) {
            inner += `<div class="edu-badges">` +
                it.badges.map(b => `<span class="edu-badge">${b}</span>`).join("") +
                `</div>`;
        }
        card.innerHTML = inner;
        grid.appendChild(card);
        observeReveal(card);
    });
}

/* ============================================================
   LANGUAGE / THEME
============================================================ */
/* View Transitions wrapper — feature-detect, no-op fallback for Safari/Firefox. */
function __withViewTransition(mutator) {
    if (REDUCED || !document.startViewTransition) { mutator(); return; }
    try { document.startViewTransition(mutator); } catch(e) { mutator(); }
}

function setLanguage(lang) {
    __withViewTransition(() => {
        currentLang = lang;
        try { localStorage.setItem("lang", lang); } catch(e){}
        document.documentElement.lang = lang;
        $$(".lang-btn").forEach(b => b.classList.toggle("active", b.getAttribute("data-lang") === lang));
        applyI18n(lang);
        renderHeroSkills(lang);
        renderServices(lang);
        renderProjects(lang);
        renderSkills(lang);
        renderTrack(lang);
        renderEducation(lang);
        /* Swap footer secondary-page links to the correct language version */
        const footerNow  = document.getElementById("footer-now");
        const footerUses = document.getElementById("footer-uses");
        const footerCo2  = document.getElementById("footer-co2");
        if (footerNow)  footerNow.href  = lang === "de" ? "now-de.html"  : "now.html";
        if (footerUses) footerUses.href = lang === "de" ? "uses-de.html" : "uses.html";
        if (footerCo2)  footerCo2.href  = lang === "de" ? "projects/co2-simulation-de.html" : "projects/co2-simulation.html";
        /* Swap resume download to the correct language PDF */
        const resumeBtn = $("#resume-btn");
        if (resumeBtn) {
            if (lang === "de") {
                resumeBtn.href = "lebenslauf.pdf";
                resumeBtn.download = "Hashwanth_Ghanta_Lebenslauf.pdf";
                resumeBtn.setAttribute("aria-label", "Lebenslauf herunterladen (PDF)");
            } else {
                resumeBtn.href = "resume.pdf";
                resumeBtn.download = "Hashwanth_Ghanta_CV_English.pdf";
                resumeBtn.setAttribute("aria-label", "Download resume (PDF)");
            }
        }
        /* Re-attach sticky-stack scroll listener (cards rebuilt) */
        setupStickyStack();
        /* Command palette — relocalize placeholder, empty state, trigger label, and visible list. */
        if (typeof window.__cmdkApplyLang === "function") window.__cmdkApplyLang();
    });
}
window.setLanguage = setLanguage;

function applyTheme(theme) {
    __withViewTransition(() => {
        currentTheme = theme === "light" ? "light" : "dark";
        document.body.setAttribute("data-theme", currentTheme);
        document.documentElement.style.colorScheme = currentTheme;
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", currentTheme === "light" ? "#F5F2EC" : "#0C0C0C");
        const tt = $("#theme-toggle");
        tt.textContent = currentTheme === "light" ? "☀️" : "🌙";
        tt.setAttribute("aria-pressed", currentTheme === "light" ? "true" : "false");
        tt.setAttribute("aria-label", currentTheme === "light" ? "Switch to dark theme" : "Switch to light theme");
        try { localStorage.setItem("theme", currentTheme); } catch(e){}
    });
}
$("#theme-toggle").addEventListener("click", () => applyTheme(currentTheme === "light" ? "dark" : "light"));

/* ============================================================
   REVEAL OBSERVER
============================================================ */
let revealObs = null;
function observeReveal(el) {
    if (!el) return;
    if (REDUCED) { el.classList.add("in"); return; }
    if (!revealObs) {
        revealObs = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.classList.add("in");
                    revealObs.unobserve(e.target);
                }
            });
        }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    }
    revealObs.observe(el);
}

/* ============================================================
   ANIMATED TEXT — per-character scroll-driven opacity
============================================================ */
function setupAnimatedText() {
    const el = $("#about-text");
    if (!el) return;
    const text = el.textContent.trim();
    el.textContent = "";
    /* A11y: original full text in a visually-hidden node so screen readers read it
       as one continuous sentence instead of 200 separate chars. The animated layer
       is aria-hidden so it's purely decorative. */
    const sr = document.createElement("span");
    sr.className = "sr-only";
    sr.textContent = text;
    el.appendChild(sr);
    const wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    wrap.className = "about-text-anim";
    const frag = document.createDocumentFragment();
    for (const ch of text) {
        const sp = document.createElement("span");
        sp.className = "char";
        sp.textContent = ch;
        sp.style.opacity = REDUCED ? "1" : "0.55";
        frag.appendChild(sp);
    }
    wrap.appendChild(frag);
    el.appendChild(wrap);
    if (REDUCED) return;
    const chars = wrap.querySelectorAll(".char");
    function update() {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight || document.documentElement.clientHeight;
        const start = vh * 0.85;
        const end   = vh * 0.20;
        const prog  = Math.min(1, Math.max(0, (start - r.top) / (start - end)));
        const n = chars.length;
        const cursor = prog * n;
        chars.forEach((c, i) => {
            /* Floor at 0.55 → composites above AA threshold even mid-scroll */
            const localProg = Math.min(1, Math.max(0, cursor - i));
            const opacity = 0.55 + 0.45 * localProg;
            c.style.opacity = opacity.toFixed(3);
        });
    }
    update();
    __scrollBus.add(update);
    window.addEventListener("resize", update);
}

/* ============================================================
   STICKY-STACKING CARD SCALE
============================================================ */
/* Cards now stack normally with a flex gap — sticky scroll-scale removed.
   Only the mouse tilt animation remains active. */
function setupStickyStack() {
    const stack = $("#projects-stack");
    if (!stack) return;
    const cards = $$(".project-card", stack);
    if (!cards.length) return;
    setupCardTilt(cards);
}

/* Per-card mouse-position tilt — gated by (hover: hover) and reduced-motion. */
function setupCardTilt(cards) {
    if (REDUCED) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const STR = 6;
    cards.forEach(card => {
        let rafId = 0;
        card.addEventListener("mousemove", e => {
            if (window.innerWidth < 768) return;
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
            const y = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                card.style.setProperty("--tilt-ry", (x * STR).toFixed(2) + "deg");
                card.style.setProperty("--tilt-rx", (-y * STR).toFixed(2) + "deg");
            });
        }, { passive: true });
        card.addEventListener("mouseleave", () => {
            card.style.setProperty("--tilt-ry", "0deg");
            card.style.setProperty("--tilt-rx", "0deg");
        });
    });
}

/* ============================================================
   MOBILE DRAWER
============================================================ */
const hamburger    = $("#hamburger");
const drawerEl     = $("#mobile-drawer");
const drawerOvEl   = $("#drawer-overlay");
const mainBg       = () => [$("nav.topnav"), ...$$("main > section"), $("footer.site-footer")].filter(Boolean);
let drawerLastFocused = null;
function getDrawerFocusables() {
    return $$('a[href], button:not([disabled])', drawerEl)
        .filter(el => el.offsetParent !== null || el.getClientRects().length);
}
function openDrawer() {
    if (drawerEl.classList.contains("open")) return;
    drawerLastFocused = document.activeElement;
    drawerEl.classList.add("open"); drawerOvEl.classList.add("open"); hamburger.classList.add("open");
    drawerEl.setAttribute("aria-hidden","false"); drawerOvEl.setAttribute("aria-hidden","false");
    hamburger.setAttribute("aria-expanded","true");
    hamburger.setAttribute("aria-label","Close menu");
    document.body.style.overflow = "hidden";
    mainBg().forEach(el => { el.setAttribute("aria-hidden","true"); el.inert = true; });
    setTimeout(() => { const f = getDrawerFocusables(); if (f[0]) f[0].focus(); }, 30);
}
function closeDrawer() {
    if (!drawerEl.classList.contains("open")) return;
    drawerEl.classList.remove("open"); drawerOvEl.classList.remove("open"); hamburger.classList.remove("open");
    drawerEl.setAttribute("aria-hidden","true"); drawerOvEl.setAttribute("aria-hidden","true");
    hamburger.setAttribute("aria-expanded","false");
    hamburger.setAttribute("aria-label","Open menu");
    document.body.style.overflow = "";
    mainBg().forEach(el => { el.removeAttribute("aria-hidden"); el.inert = false; });
    (drawerLastFocused && drawerLastFocused.focus) ? drawerLastFocused.focus() : hamburger.focus();
}
hamburger.addEventListener("click", () => drawerEl.classList.contains("open") ? closeDrawer() : openDrawer());
drawerOvEl.addEventListener("click", closeDrawer);
$$(".drawer-nav a, .drawer-cta a", drawerEl).forEach(a => a.addEventListener("click", closeDrawer));
document.addEventListener("keydown", e => {
    if (!drawerEl.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); closeDrawer(); return; }
    if (e.key === "Tab") {
        const f = getDrawerFocusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
});

/* ============================================================
   PROJECT MODAL
============================================================ */
const modalEl       = $("#project-modal");
const modalCloseBtn = $("#project-modal-close");
let projModalLastFocused = null;
function projModalFocusables() {
    return $$('a[href], button:not([disabled])', modalEl)
        .filter(el => el.offsetParent !== null || el.getClientRects().length);
}
function closeProjectModal() {
    modalEl.classList.remove("open");
    modalEl.setAttribute("aria-hidden","true");
    document.body.style.overflow = "";
    document.body.classList.remove("modal-open");
    if (projModalLastFocused && projModalLastFocused.focus) projModalLastFocused.focus();
}
function openProjectModal(index) {
    const proj = currentProjects[index];
    if (!proj) return;
    projModalLastFocused = document.activeElement;
    const d = DATA[currentLang];
    $("#project-modal-period").textContent = proj.period || "";
    $("#project-modal-title").textContent  = proj.name || "";
    $("#project-modal-desc").textContent   = proj.desc || "";
    const hi = $("#project-modal-highlights");
    let hiHtml = (proj.highlights && proj.highlights.length)
        ? `<ul class="proj-highlights">${proj.highlights.map(h => `<li>${h}</li>`).join("")}</ul>`
        : "";
    if (proj.learned) {
        const learnedLabel = currentLang === "de" ? "Was ich gelernt habe" : "What I learned";
        hiHtml += `<div class="proj-learned"><div class="proj-learned-label">${learnedLabel}</div><p class="proj-learned-text">${proj.learned}</p></div>`;
    }
    hi.innerHTML = hiHtml;
    $("#project-modal-stack-title").textContent = (currentLang === "de" ? "Technologie-Stack" : "Tech Stack");
    $("#project-modal-tags").innerHTML = (proj.tags || []).map(t => `<span class="proj-tag">${t}</span>`).join("");
    const act = $("#project-modal-actions");
    act.innerHTML = "";
    if (proj.caseStudy) {
        const cs = document.createElement("a");
        cs.href = proj.caseStudy;
        cs.className = "ghost-btn live-demo";
        cs.textContent = proj.caseStudyLabel || (currentLang === "de" ? "Case Study lesen" : "Read case study");
        act.appendChild(cs);
    }
    if (proj.url) {
        const a = document.createElement("a");
        a.href = proj.url; a.target = "_blank"; a.rel = "noopener noreferrer";
        a.className = "contact-btn"; a.textContent = proj.urlLabel || d.live;
        act.appendChild(a);
    }
    modalEl.classList.add("open");
    modalEl.setAttribute("aria-hidden","false");
    document.body.style.overflow = "hidden";
    document.body.classList.add("modal-open");
    setTimeout(() => modalCloseBtn.focus(), 30);
}
modalCloseBtn.addEventListener("click", closeProjectModal);
modalEl.addEventListener("click", e => { if (e.target === modalEl) closeProjectModal(); });
document.addEventListener("keydown", e => {
    if (!modalEl.classList.contains("open")) return;
    if (e.key === "Escape") { e.preventDefault(); closeProjectModal(); return; }
    if (e.key === "Tab") {
        const f = projModalFocusables();
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
});

/* ============================================================
   EMAILJS CONTACT FORM
============================================================ */
function setupContactForm() {
    if (typeof emailjs === "undefined") {
        /* Library may not be loaded yet — wait. */
        window.addEventListener("load", setupContactForm, { once: true });
        return;
    }
    try { emailjs.init({ publicKey: "MM3bI7Ecwcbc9DcZi" }); } catch(e){}
    const form = $("#contact-form");
    const status = $("#cf-status");
    if (!form) return;
    form.addEventListener("submit", async e => {
        e.preventDefault();
        const d = DATA[currentLang];
        status.className = "contact-form-status";
        status.textContent = currentLang === "de" ? "Wird gesendet…" : "Sending…";
        try {
            await emailjs.send("service_joq8tyr", "template_vihv3zr", {
                from_name:  $("#cf-name").value.trim(),
                from_email: $("#cf-email").value.trim(),
                message:    $("#cf-msg").value.trim(),
            });
            status.className = "contact-form-status ok";
            status.textContent = d.cf_ok;
            form.reset();
        } catch (err) {
            status.className = "contact-form-status err";
            status.textContent = d.cf_err;
        }
    });
}

/* ============================================================
   GHOST SECTION NUMBERS — large translucent numeral behind each H2
============================================================ */
function setupGhostNumbers() {
    /* Renumbered after marquee removal — kept sequential 01–06 */
    const map = [
        { id: "about",     num: "01" },
        { id: "projects",  num: "02" },
        { id: "skills",    num: "03" },
        { id: "track",     num: "04" },
        { id: "education", num: "05" },
        { id: "contact",   num: "06" },
    ];
    map.forEach(m => {
        const sec = document.getElementById(m.id);
        if (!sec) return;
        const h2 = sec.querySelector("h2");
        if (!h2 || h2.previousElementSibling?.classList.contains("ghost-num")) return;
        const ghost = document.createElement("span");
        ghost.className = "ghost-num";
        ghost.setAttribute("aria-hidden", "true");
        ghost.textContent = m.num;
        const wrap = h2.parentElement;
        if (wrap) wrap.classList.add("has-ghost-num");
        h2.parentElement.insertBefore(ghost, h2);
    });
}

/* ============================================================
   HERO NAME PARALLAX — slight upward drift on scroll for depth
============================================================ */
function setupHeroParallax() {
    if (REDUCED) return;
    const h1 = $(".hero-headline");
    if (!h1) return;
    const update = () => {
        const y = window.scrollY;
        const shift = Math.min(80, y * 0.18);
        h1.style.transform = `translate3d(0, ${-shift}px, 0)`;
        h1.style.opacity = Math.max(0.2, 1 - y / 800).toFixed(3);
    };
    update();
    __scrollBus.add(update);
}

/* ============================================================
   SECTION DOT NAV — right-side rail (carried over from old portfolio)
============================================================ */
function setupSectionNav() {
    const navEl = $("#section-nav");
    if (!navEl) return;
    const sectionMap = [
        { id: "hero",      label: "Home" },
        { id: "about",     label: "About" },
        { id: "projects",  label: "Projects" },
        { id: "skills",    label: "Skills" },
        { id: "track",     label: "Experience" },
        { id: "education", label: "Education" },
        { id: "contact",   label: "Contact" },
    ];
    navEl.innerHTML = "";
    const dots = [];
    sectionMap.forEach(s => {
        const sec = document.getElementById(s.id);
        if (!sec) return;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "sn-dot";
        btn.setAttribute("aria-label", `Jump to ${s.label}`);
        btn.dataset.target = s.id;
        btn.innerHTML = `<span class="sn-tip" aria-hidden="true">${s.label}</span>`;
        btn.addEventListener("click", () => {
            const t = document.getElementById(s.id);
            if (t) t.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
        });
        navEl.appendChild(btn);
        dots.push({ btn, sec });
    });
    const updateActive = () => {
        let cur = dots[0];
        const y = window.scrollY + window.innerHeight * 0.35;
        dots.forEach(d => { if (d.sec.offsetTop <= y) cur = d; });
        dots.forEach(d => {
            const active = d === cur;
            d.btn.classList.toggle("active", active);
            if (active) d.btn.setAttribute("aria-current", "true");
            else d.btn.removeAttribute("aria-current");
        });
    };
    updateActive();
    __scrollBus.add(updateActive);
}

/* ============================================================
   BACK-TO-TOP
============================================================ */
function setupBackToTop() {
    const btn = $("#back-to-top");
    if (!btn) return;
    const onScroll = () => btn.classList.toggle("show", window.scrollY > 500);
    onScroll();
    __scrollBus.add(onScroll);
    btn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" });
    });
}

/* ============================================================
   LIVE WIDGETS — Magdeburg clock + GitHub heatmap placeholder + Spotify stub
============================================================ */
function setupLiveWidgets() {
    /* Magdeburg local time — uses Intl, no network call. */
    const clockVal = $("#live-clock-val");
    if (clockVal) {
        const fmt = new Intl.DateTimeFormat("de-DE", {
            timeZone: "Europe/Berlin",
            hour: "2-digit", minute: "2-digit",
            hour12: false,
        });
        const tick = () => { clockVal.textContent = fmt.format(new Date()) + " · " + (new Date().getDay() % 6 === 0 ? "weekend" : "weekday"); };
        tick();
        setInterval(tick, 30 * 1000);
    }

    /* GitHub heatmap — illustrative placeholder (52 weeks × 7 days).
       Deterministic seed tuned to look healthy without looking fake:
       weekdays denser than weekends, occasional sprint bursts. The whole
       panel is a link to the real profile where recruiters see live data. */
    const grid = $("#github-heatmap-grid");
    if (grid) renderHeatmapPlaceholder(grid);
}
function renderHeatmapPlaceholder(grid) {
    const weeks = 52, days = 7;
    let html = "";
    for (let w = 0; w < weeks; w++) {
        /* Sprint bursts every ~7 weeks — denser blocks of activity. */
        const burst = (w % 7 === 0 || w % 7 === 1) ? 6 : 0;
        for (let d = 0; d < days; d++) {
            /* Weekends (d=0 Sun, d=6 Sat) are lighter than weekdays. */
            const weekendDamp = (d === 0 || d === 6) ? 4 : 0;
            const seed = ((w * 11 + d * 17 + 3) % 17) + burst - weekendDamp;
            const lvl = seed >= 14 ? "l4"
                      : seed >= 10 ? "l3"
                      : seed >= 6  ? "l2"
                      : seed >= 2  ? "l1"
                      : "";
            html += `<span class="github-heatmap-cell ${lvl}" style="grid-column:${w+1};grid-row:${d+1};"></span>`;
        }
    }
    grid.innerHTML = html;
}

/* ============================================================
   CONTACT QUICK ACTIONS — Cal.com / vCard / Share
============================================================ */
function setupContactQuickActions() {
    /* vCard and Cal.com buttons/helpers removed at user request — only Share remains in the contact section. */
    const shareBtn = $("#contact-share");
    if (shareBtn) shareBtn.addEventListener("click", sharePortfolio);
}

/* Add some basic styling for the quick action row */
(function injectQuickActionStyles() {
    const css = `
        .contact-quick-actions {
            display: flex; flex-wrap: wrap; gap: 0.5rem;
            margin-top: 1rem;
        }
        .contact-quick-btn {
            display: inline-flex; align-items: center; gap: 0.45rem;
            padding: 0.6rem 1rem;
            font-size: 0.78rem; letter-spacing: 0.08em;
            border-radius: 9999px;
            background: rgba(20,20,20,0.55);
        }
        body[data-theme="light"] .contact-quick-btn { background: rgba(255,255,255,0.85); }
    `;
    const s = document.createElement("style");
    s.textContent = css;
    document.head.appendChild(s);
})();

/* ============================================================
   COMMAND PALETTE (⌘K / Ctrl+K)
============================================================ */
function setupCommandPalette() {
    const overlay = $("#cmdk-palette");
    const trigger = $("#cmdk-trigger");
    const input   = $("#cmdk-input");
    const list    = $("#cmdk-list");
    const empty   = $("#cmdk-empty");
    if (!overlay || !input || !list) return;

    const ico = {
        jump:  '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        theme: '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
        lang:  '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
        dl:    '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v12m0 0 4-4m-4 4-4-4M5 20h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        copy:  '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
        share: '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6l-4-4-4 4M12 2v13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        ext:   '<svg class="cmdk-item-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4h6v6M20 4 10 14M11 5H4v15h15v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    };
    /* Localized strings — palette content follows the site language (currentLang). */
    const CMDK_I18N = {
        en: {
            placeholder: "Jump to section, switch theme, copy email…",
            empty:       "No matches",
            trigger:     "Search",
            hint: {
                section: "section",  toggle: "T",       lang: { en: "EN", de: "DE" },
                pdf: "PDF",          email: "email",    native: "native",
                external: "external", page: "page",     now: "/now", uses: "/uses",
            },
            items: {
                about:    "Jump to About",
                projects: "Jump to Projects",
                skills:   "Jump to Skills",
                exp:      "Jump to Experience",
                edu:      "Jump to Education",
                contact:  "Jump to Contact",
                theme:    "Toggle theme (dark/light)",
                langEN:   "Switch to English",
                langDE:   "Auf Deutsch umschalten",
                cvEN:     "Download CV (English)",
                cvDE:     "Lebenslauf herunterladen (Deutsch)",
                copyMail: "Copy email address",
                share:    "Share this portfolio",
                github:   "Open GitHub",
                linkedin: "Open LinkedIn",
                caseCo2:  "Read CO₂ Simulation case study",
                now:      "What I'm doing now",
                uses:     "What I use (uses)",
            },
            toast: { mail: "Email copied", link: "Link copied — share didn't open natively" },
        },
        de: {
            placeholder: "Zu Abschnitt springen, Theme wechseln, E-Mail kopieren…",
            empty:       "Keine Treffer",
            trigger:     "Suchen",
            hint: {
                section: "Abschnitt", toggle: "T",       lang: { en: "EN", de: "DE" },
                pdf: "PDF",           email: "E-Mail",   native: "nativ",
                external: "extern",   page: "Seite",     now: "/now", uses: "/uses",
            },
            items: {
                about:    "Zu Über mich springen",
                projects: "Zu Projekten springen",
                skills:   "Zu Skills springen",
                exp:      "Zu Erfahrung springen",
                edu:      "Zu Bildung springen",
                contact:  "Zu Kontakt springen",
                theme:    "Theme umschalten (dunkel/hell)",
                langEN:   "Switch to English",
                langDE:   "Auf Deutsch umschalten",
                cvEN:     "Download CV (English)",
                cvDE:     "Lebenslauf herunterladen (Deutsch)",
                copyMail: "E-Mail-Adresse kopieren",
                share:    "Portfolio teilen",
                github:   "GitHub öffnen",
                linkedin: "LinkedIn öffnen",
                caseCo2:  "CO₂-Simulation Case Study lesen",
                now:      "Was ich gerade mache",
                uses:     "Was ich benutze (uses)",
            },
            toast: { mail: "E-Mail kopiert", link: "Link kopiert — natives Teilen nicht verfügbar" },
        },
    };
    const tr = () => CMDK_I18N[currentLang] || CMDK_I18N.en;
    const commands = () => {
        const t = tr();
        return [
            { id: "go-about",      label: t.items.about,    hint: t.hint.section,  icon: ico.jump,  run: () => location.hash = "#about" },
            { id: "go-projects",   label: t.items.projects, hint: t.hint.section,  icon: ico.jump,  run: () => location.hash = "#projects" },
            { id: "go-skills",     label: t.items.skills,   hint: t.hint.section,  icon: ico.jump,  run: () => location.hash = "#skills" },
            { id: "go-experience", label: t.items.exp,      hint: t.hint.section,  icon: ico.jump,  run: () => location.hash = "#track" },
            { id: "go-education",  label: t.items.edu,      hint: t.hint.section,  icon: ico.jump,  run: () => location.hash = "#education" },
            { id: "go-contact",    label: t.items.contact,  hint: t.hint.section,  icon: ico.jump,  run: () => location.hash = "#contact" },
            { id: "theme-toggle",  label: t.items.theme,    hint: t.hint.toggle,   icon: ico.theme, run: () => $("#theme-toggle") && $("#theme-toggle").click() },
            { id: "lang-en",       label: t.items.langEN,   hint: t.hint.lang.en,  icon: ico.lang,  run: () => setLanguage("en") },
            { id: "lang-de",       label: t.items.langDE,   hint: t.hint.lang.de,  icon: ico.lang,  run: () => setLanguage("de") },
            { id: "cv-en",         label: t.items.cvEN,     hint: t.hint.pdf,      icon: ico.dl,    run: () => downloadFile("resume.pdf",     "Hashwanth_Ghanta_CV_English.pdf") },
            { id: "cv-de",         label: t.items.cvDE,     hint: t.hint.pdf,      icon: ico.dl,    run: () => downloadFile("lebenslauf.pdf", "Hashwanth_Ghanta_Lebenslauf.pdf") },
            { id: "copy-email",    label: t.items.copyMail, hint: t.hint.email,    icon: ico.copy,  run: () => copyToClipboard("hashwanthghanta@gmail.com", t.toast.mail) },
            { id: "share",         label: t.items.share,    hint: t.hint.native,   icon: ico.share, run: () => sharePortfolio() },
            { id: "github",        label: t.items.github,   hint: t.hint.external, icon: ico.ext,   run: () => window.open("https://github.com/hashwanthghanta", "_blank", "noopener") },
            { id: "linkedin",      label: t.items.linkedin, hint: t.hint.external, icon: ico.ext,   run: () => window.open("https://www.linkedin.com/in/hashwanthghanta", "_blank", "noopener") },
            { id: "case-co2",      label: t.items.caseCo2,  hint: t.hint.page,     icon: ico.ext,   run: () => location.href = currentLang === "de" ? "projects/co2-simulation-de.html" : "projects/co2-simulation.html" },
            { id: "now",           label: t.items.now,      hint: t.hint.now,      icon: ico.ext,   run: () => location.href = currentLang === "de" ? "now-de.html"  : "now.html"  },
            { id: "uses",          label: t.items.uses,     hint: t.hint.uses,     icon: ico.ext,   run: () => location.href = currentLang === "de" ? "uses-de.html" : "uses.html" },
        ];
    };
    /* Re-render input chrome + list whenever the language changes. */
    function applyPaletteLang() {
        const t = tr();
        input.setAttribute("placeholder", t.placeholder);
        empty.textContent = t.empty;
        const triggerText = trigger && trigger.querySelector(".cmdk-trigger-text");
        if (triggerText) triggerText.textContent = t.trigger;
        if (overlay.classList.contains("open")) filter(input.value);
    }
    window.__cmdkApplyLang = applyPaletteLang;

    let activeIdx = 0;
    let filtered = [];
    let lastFocus = null;

    function render() {
        list.innerHTML = filtered.map((c, i) =>
            `<li class="cmdk-item${i === activeIdx ? " is-active" : ""}" role="option" data-id="${c.id}" tabindex="-1" aria-selected="${i === activeIdx}">
                ${c.icon}
                <span class="cmdk-item-label">${c.label}</span>
                <span class="cmdk-item-hint">${c.hint || ""}</span>
            </li>`).join("");
        empty.hidden = filtered.length > 0;
    }
    function filter(q) {
        const all = commands();
        if (!q) { filtered = all; }
        else {
            const norm = q.toLowerCase();
            filtered = all.filter(c => c.label.toLowerCase().includes(norm) || (c.hint && c.hint.toLowerCase().includes(norm)));
        }
        activeIdx = 0;
        render();
    }
    function open() {
        lastFocus = document.activeElement;
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
        input.value = "";
        filter("");
        setTimeout(() => input.focus(), 30);
        document.body.style.overflow = "hidden";
    }
    function close() {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    function run(cmd) {
        close();
        setTimeout(() => { try { cmd.run(); } catch(e) { console.warn("cmd failed", e); } }, 30);
    }

    /* Initial language pass — runs once when palette is set up. */
    applyPaletteLang();

    trigger && trigger.addEventListener("click", open);
    document.addEventListener("keydown", e => {
        const isOpen = overlay.classList.contains("open");
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
            e.preventDefault();
            isOpen ? close() : open();
            return;
        }
        if (!isOpen) return;
        if (e.key === "Escape") { e.preventDefault(); close(); return; }
        if (e.key === "ArrowDown") { e.preventDefault(); activeIdx = Math.min(filtered.length - 1, activeIdx + 1); render(); scrollActiveIntoView(); return; }
        if (e.key === "ArrowUp")   { e.preventDefault(); activeIdx = Math.max(0, activeIdx - 1); render(); scrollActiveIntoView(); return; }
        if (e.key === "Enter")     { e.preventDefault(); if (filtered[activeIdx]) run(filtered[activeIdx]); return; }
    });
    function scrollActiveIntoView() {
        const el = list.querySelector(".cmdk-item.is-active");
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }
    input.addEventListener("input", e => filter(e.target.value));
    list.addEventListener("click", e => {
        const li = e.target.closest(".cmdk-item");
        if (!li) return;
        const cmd = filtered.find(c => c.id === li.dataset.id);
        if (cmd) run(cmd);
    });
    overlay.addEventListener("click", e => { if (e.target === overlay) close(); });
}

/* Helpers used by the command palette and contact section. */
function downloadFile(href, suggestedName) {
    const a = document.createElement("a");
    a.href = href; a.download = suggestedName || "";
    document.body.appendChild(a); a.click(); a.remove();
}
function copyToClipboard(text, toastMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast(toastMsg || "Copied"));
    } else {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta);
        ta.select(); try { document.execCommand("copy"); showToast(toastMsg || "Copied"); } catch(e){}
        ta.remove();
    }
}
async function sharePortfolio() {
    const shareData = {
        title: "Hashwanth Ghanta — Portfolio",
        text: "Backend / iOS / Unity simulation developer. Available Q2 2026 (Werkstudent, Germany).",
        url:  "https://hashwanthghanta.github.io/",
    };
    if (navigator.share) {
        try { await navigator.share(shareData); } catch(e) { /* user cancelled */ }
    } else {
        copyToClipboard(shareData.url, "Link copied — share didn't open natively");
    }
}
function showToast(msg) {
    let t = document.getElementById("toast-stack");
    if (!t) {
        t = document.createElement("div");
        t.id = "toast-stack";
        t.setAttribute("role", "status");
        t.setAttribute("aria-live", "polite");
        t.style.cssText = "position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%);z-index:10000;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;";
        document.body.appendChild(t);
    }
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.cssText = "background:rgba(15,23,42,0.95);color:#fff;padding:0.6rem 1.1rem;border-radius:9999px;font-size:0.85rem;border:1px solid rgba(103,232,249,0.4);box-shadow:0 8px 24px rgba(0,0,0,0.4);";
    t.appendChild(el);
    setTimeout(() => { el.style.transition = "opacity .4s ease, transform .4s ease"; el.style.opacity = "0"; el.style.transform = "translateY(8px)"; }, 1800);
    setTimeout(() => el.remove(), 2400);
}

/* ============================================================
   MAGNETIC BUTTONS — hero CTAs pull slightly toward the cursor
============================================================ */
function setupMagneticButtons() {
    if (REDUCED) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const targets = $$(".resume-btn, .projects-btn, .contact-btn").filter(el => el.closest(".hero-cta-row"));
    targets.forEach(el => {
        el.style.transition = (el.style.transition || "") + ", transform 0.2s var(--ease-out)";
        el.addEventListener("mousemove", e => {
            const r = el.getBoundingClientRect();
            const x = e.clientX - (r.left + r.width / 2);
            const y = e.clientY - (r.top + r.height / 2);
            el.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
        });
        el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
}

/* ============================================================
   LOADING CURTAIN & STAGGERED HERO ENTRANCE
   ============================================================ */
function triggerHeroEntrance() {
    if (REDUCED) {
        document.querySelectorAll('.hero-stagger').forEach(el => el.classList.add('in'));
        return;
    }
    const staggers = document.querySelectorAll('.hero-stagger');
    staggers.forEach((el, index) => {
        setTimeout(() => {
            el.classList.add('in');
        }, index * 150);
    });
}

function setupLoadingCurtain() {
    const curtain = document.getElementById("loading-curtain");
    if (!curtain) return;

    let loadFired = false;
    let minTimeFired = false;

    const tryHide = () => {
        if (!loadFired || !minTimeFired) return;
        curtain.classList.add("hide");
        setTimeout(triggerHeroEntrance, 450);
    };

    window.addEventListener("load", () => { loadFired = true; tryHide(); });

    // Minimum display: 3100ms (0.6s bar-start delay + 2.4s animation + 100ms buffer)
    setTimeout(() => { minTimeFired = true; tryHide(); }, 3100);

    // Hard failsafe: never block past 6s on very slow connections
    setTimeout(() => {
        if (!curtain.classList.contains("hide")) {
            curtain.classList.add("hide");
            setTimeout(triggerHeroEntrance, 450);
        }
    }, 6000);
}

/* ============================================================
   SCROLL PROGRESS BAR
   ============================================================ */
function setupScrollProgress() {
    const bar = document.getElementById("scroll-progress");
    if (!bar) return;
    const update = () => {
        const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
        bar.style.width = scrolled + "%";
    };
    update();
    __scrollBus.add(update);
}

/* ============================================================
   NAVBAR COMPACT ON SCROLL
   ============================================================ */
function setupNavbarScroll() {
    const nav = document.querySelector("nav.topnav");
    if (!nav) return;
    const update = () => {
        nav.classList.toggle("scrolled", window.scrollY > 40);
    };
    update();
    __scrollBus.add(update);
}

/* ============================================================
   GHOST NUMBERS PARALLAX FALLBACK
   ============================================================ */
function setupGhostParallax() {
    if (REDUCED) return;
    if (CSS.supports && CSS.supports("animation-timeline: view()")) return;
    
    const ghosts = document.querySelectorAll(".ghost-num");
    if (ghosts.length === 0) return;
    
    const update = () => {
        ghosts.forEach(ghost => {
            const rect = ghost.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            if (rect.top < viewHeight && rect.bottom > 0) {
                const progress = (viewHeight - rect.top) / (viewHeight + rect.height);
                const isLight = document.body.getAttribute("data-theme") === "light";
                const maxOpacity = isLight ? 0.12 : 0.07;
                const opacity = Math.max(0, Math.min(maxOpacity, progress * maxOpacity)).toFixed(3);
                const scale = (0.6 + progress * 0.4).toFixed(3);
                ghost.style.transform = `translate(-50%, -50%) scale(${scale})`;
                ghost.style.opacity = opacity;
            }
        });
    };
    update();
    __scrollBus.add(update);
}

/* ============================================================
   BUTTON RIPPLES
   ============================================================ */
function setupButtonRipples() {
    const buttons = document.querySelectorAll(".resume-btn, .projects-btn, .contact-btn, .ghost-btn");
    buttons.forEach(btn => {
        btn.addEventListener("click", function(e) {
            if (REDUCED) return;
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            const ripple = document.createElement("span");
            ripple.className = "btn-ripple";
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            
            const oldRipple = btn.querySelector(".btn-ripple");
            if (oldRipple) oldRipple.remove();
            
            btn.appendChild(ripple);
            ripple.addEventListener("animationend", () => {
                ripple.remove();
            });
        });
    });
}

/* ============================================================
   STATS COUNTER
   ============================================================ */
function setupStatsCounter() {
    if (REDUCED) return;
    const statsSection = document.querySelector(".about-meta");
    if (!statsSection) return;
    
    let animated = false;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !animated) {
                animated = true;
                const statVals = document.querySelectorAll(".about-stat-val");
                statVals.forEach(val => {
                    const text = val.textContent.trim();
                    const num = parseInt(text, 10);
                    if (!isNaN(num) && num < 1000) {
                        animateCounter(val, num, 1500);
                    } else {
                        val.style.opacity = "0";
                        val.style.transform = "translateY(15px)";
                        val.style.transition = "opacity 0.8s ease, transform 0.8s ease";
                        setTimeout(() => {
                            val.style.opacity = "1";
                            val.style.transform = "translateY(0)";
                        }, 200);
                    }
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });
    
    observer.observe(statsSection);
}

function animateCounter(el, target, duration = 1200) {
    let start = null;
    const step = (ts) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            el.textContent = target;
        }
    };
    requestAnimationFrame(step);
}

/* ============================================================
   MOBILE GESTURES
   ============================================================ */
function setupMobileGestures() {
    if (!drawerEl) return;
    let touchStartX = 0;
    drawerEl.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    }, { passive: true });
    drawerEl.addEventListener('touchend', e => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (dx > 80 && drawerEl.classList.contains("open")) {
            closeDrawer();
        }
    }, { passive: true });
}

/* ============================================================
   EASTER EGGS
============================================================ */
function setupEasterEggs() {
    // 1. Logo clicks 5 times
    const logo = $(".nav-logo");
    let logoClicks = 0;
    let logoClickTimeout = null;
    if (logo) {
        logo.addEventListener("click", (e) => {
            logoClicks++;
            clearTimeout(logoClickTimeout);
            logoClickTimeout = setTimeout(() => { logoClicks = 0; }, 2000);
            if (logoClicks === 5) {
                e.preventDefault();
                logoClicks = 0;
                showToast("🎨 Monogram mode activated!");
                const svgMark = logo.querySelector(".nav-logo-mark");
                if (svgMark) {
                    svgMark.style.transition = "transform 1s cubic-bezier(0.34, 1.56, 0.64, 1)";
                    svgMark.style.transform = "rotate(360deg)";
                    setTimeout(() => { svgMark.style.transform = ""; svgMark.style.transition = ""; }, 1000);
                }
                console.log("%c✨ MONOGRAM EASTER EGG! You clicked the HG logo 5 times. Monogram style engaged! ✨", "color: #0891b2; font-size: 14px; font-weight: bold;");
            }
        });
    }

    // 2. Konami Code (ArrowUp ArrowUp ArrowDown ArrowDown ArrowLeft ArrowRight ArrowLeft ArrowRight b a)
    const sequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let kIndex = 0;
    document.addEventListener("keydown", (e) => {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
        const key = e.key;
        if (key === sequence[kIndex]) {
            kIndex++;
            if (kIndex === sequence.length) {
                kIndex = 0;
                showToast("🚀 Antigravity Mode Enabled!");
                console.log(
                    "%c🛸 ANTIGRAVITY ENGAGED! 🛸\n%cYou found the Konami Code Easter Egg. The gravity constant has been set to 0. Have fun coding!",
                    "color: #ff6b35; font-size: 20px; font-weight: bold; text-shadow: 0 0 10px rgba(255,107,53,0.5);",
                    "color: #22d3ee; font-size: 14px;"
                );
                document.body.style.transition = "transform 2s ease-in-out";
                document.body.style.transform = "translateY(-10px) rotate(0.5deg)";
                setTimeout(() => { document.body.style.transform = ""; }, 4000);
            }
        } else {
            kIndex = (key === sequence[0]) ? 1 : 0;
        }
    });

    // 3. /hire typing shortcut
    let inputBuffer = "";
    document.addEventListener("keydown", (e) => {
        if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
        if (e.key.length === 1) {
            inputBuffer += e.key.toLowerCase();
            if (inputBuffer.endsWith("/hire")) {
                inputBuffer = "";
                e.preventDefault();
                const contactSec = document.getElementById("contact");
                if (contactSec) {
                    showToast("Routing to contact section...");
                    contactSec.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
                    const nameInput = document.getElementById("cf-name");
                    if (nameInput) {
                        setTimeout(() => nameInput.focus(), 600);
                    }
                }
            }
        } else {
            if (inputBuffer.length > 10) {
                inputBuffer = inputBuffer.substring(inputBuffer.length - 10);
            }
        }
    });
}

function init() {
    /* Apply persisted theme + lang FIRST */
    applyTheme(currentTheme);
    document.documentElement.lang = currentLang;
    $$(".lang-btn").forEach(b => b.classList.toggle("active", b.getAttribute("data-lang") === currentLang));
    applyI18n(currentLang);

    /* Sync footer secondary-page links + resume PDF with persisted lang */
    (function(){
        const footerNow  = document.getElementById("footer-now");
        const footerUses = document.getElementById("footer-uses");
        const footerCo2  = document.getElementById("footer-co2");
        if (footerNow)  footerNow.href  = currentLang === "de" ? "now-de.html"  : "now.html";
        if (footerUses) footerUses.href = currentLang === "de" ? "uses-de.html" : "uses.html";
        if (footerCo2)  footerCo2.href  = currentLang === "de" ? "projects/co2-simulation-de.html" : "projects/co2-simulation.html";
        const resumeBtn = document.getElementById("resume-btn");
        if (resumeBtn && currentLang === "de") {
            resumeBtn.href = "lebenslauf.pdf";
            resumeBtn.download = "Hashwanth_Ghanta_Lebenslauf.pdf";
            resumeBtn.setAttribute("aria-label", "Lebenslauf herunterladen (PDF)");
        }
    })();

    /* Render dynamic sections (marquee removed) */
    renderHeroSkills(currentLang);
    renderServices(currentLang);
    renderProjects(currentLang);
    renderSkills(currentLang);
    renderTrack(currentLang);
    renderEducation(currentLang);

    /* Observe track-list container for timeline line drawing */
    observeReveal($("#track-list"));

    /* Wire reveal observers */
    $$(".reveal").forEach(observeReveal);

    /* Subsystems */
    setupLoadingCurtain();
    setupScrollProgress();
    setupNavbarScroll();
    setupGhostParallax();
    setupButtonRipples();
    setupStatsCounter();
    setupMobileGestures();
    setupAnimatedText();
    setupStickyStack();
    setupContactForm();
    setupContactQuickActions();
    setupBackToTop();
    setupGhostNumbers();
    setupSectionNav();
    setupHeroParallax();
    setupCommandPalette();
    setupMagneticButtons();
    setupLiveWidgets();
    setupEasterEggs();

    /* PWA Service Worker Registration */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .catch(err => console.warn('Service worker registration failed:', err));
        });
    }

    /* Footer year */
    const fy = $("#footer-year");
    if (fy) fy.textContent = "© " + new Date().getFullYear();

    /* Smooth scroll + drawer close on anchor click */
    $$('a[href^="#"]').forEach(a => {
        a.addEventListener("click", e => {
            const href = a.getAttribute("href");
            if (href === "#" || href.length < 2) return;
            const tgt = document.querySelector(href);
            if (!tgt) return;
            e.preventDefault();
            tgt.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth", block: "start" });
        });
    });
}
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
