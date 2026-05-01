# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
It acts as the project brain — read this fully before making ANY change.

---

## WHO IS HASHWANTH GHANTA

- M.Sc. Digital Engineering student at OVGU Magdeburg, Germany
- Unity 3D developer — main project is a 7-phase CO₂ Carbon Capture Simulation
- Available from May 2026 for internships/Werkstudent roles in Germany
- Email: hashwanthghanta@gmail.com | Phone: +49 15510070657
- LinkedIn: linkedin.com/in/hashwanthghanta | GitHub: github.com/hashwanthghanta

---

## PROJECT OVERVIEW

Single-file static portfolio: **`index.html`** (≈3525 lines).
No build system. No npm. No dependencies to install.
Open directly in browser or push to GitHub Pages (`main` branch).
Assets: `Images/` folder, `resume.pdf`, `lebenslauf.pdf`.

---

## FILE ARCHITECTURE — JUMP MAP

Never read the whole file. Use these line ranges to go directly to what you need.

### CSS (lines 20–2210)

| What | Lines |
|---|---|
| **Design tokens / CSS variables** | 24–120 |
| Light mode overrides | 122–203 |
| Aurora blobs | 300–375 |
| Loading screen | 377–420 |
| Custom cursor (dot + ring) | 422–446 |
| Card spotlight (cursor glow) | 448–458 |
| Section nav dots (right side) | 486–519 |
| **Hero section CSS** | 787–1034 |
| About section CSS | 1035–1082 |
| **Skills section CSS** | 1083–1132 |
| Experience timeline CSS | 1133–1168 |
| **Projects grid CSS** | 1169–1340 |
| Education cards CSS | 1344–1382 |
| Contact section CSS | 1384–1570 |
| Footer CSS | 1571–1600 |
| Contact layout grid (explicit placement) | 1668–1685 |
| Polish & refinements block | 1745–1804 |
| **New animation layer (2024-style)** | 1805–2210 |

### HTML Body (lines 1790–1940)

Sections in exact order (must stay in sync with JS sectionIds):
```
#hero → #about → #projects → #skills → #experience → #education → #contact
```

Key dynamic targets (populated by JS, empty in HTML):
- `#hero-name`, `#hero-role`, `#hero-bio`, `#hero-availability`, `#hero-stack-row`
- `#stats-card`, `#about-text`, `#about-cards`
- `#skills-layout`, `#projects-grid`, `#edu-grid`, `#experience-timeline`
- `#contact-cards`, `#contact-intro-text`, `#contact-avatar`
- `#section-nav` — right-side dot nav

### JavaScript (lines 2214–3525)

| Block | Lines |
|---|---|
| **`PORTFOLIO_DATA` (EN)** — all content | ~2215–2130 |
| **`PORTFOLIO_DATA_DE`** — German translation | ~2130–2310 |
| **`UI_STRINGS`** — nav/button labels both languages | ~2582–2363 |
| Section nav dots IIFE | 2409–2428 |
| Cursor trail sparkles IIFE | 2700–2728 |
| Hero 3D parallax IIFE | 2773–2791 |
| Scroll velocity tilt IIFE | 2793–2820 |
| Custom cursor IIFE | 2832–2849 |
| Nav scroll + active pill | 2878–2910 |
| `startTypewriter()` | 2938–2974 |
| `animateCount()` | 2992–3004 |
| `initTilt()` / `initMagnetic()` / `addSpotlight()` | 3006–3022 |
| `applyTheme()` / `applyUIStrings()` / `setLanguage()` | 3022–3060 |
| Modal open/close | 3060–3100 |
| **`renderDynamic(data, lang)`** — core renderer | 3104–3320 |
| One-time setup + initial render | 3324–3360 |
| EmailJS contact form | 3362–3413 |
| Button ripple (delegated) | 3424–3427 |
| Word-by-word title reveal | 3439–3476 |
| Parallax depth on scroll | 3479–3494 |
| Logo scramble on hover | 3496–3522 |

---

## DESIGN SYSTEM

### Current Color Palette (Dark Mode) — UPDATED to Cool Indigo
```
--ember:       #818cf8   (primary accent — signature indigo, THE ONE accent)
--ember-soft:  #a5b4fc
--ember-deep:  #6366f1
--gold:        #c7d2fe   (periwinkle lavender — replaces warm gold)
--sage:        #64748b
--bg-dark:     #020817   (deep navy)
--bg-card:     rgba(13,18,37,0.72)
--text-primary: #f1f5f9  (cool near-white)
--text-secondary: #94a3b8
```
**To change the entire color scheme:** override `:root` variables at lines 24–120. ALL rules use these variables, so one block change propagates everywhere.

### Fonts (updated — reduced from 5 to 3, M9; body upgraded to Plus Jakarta Sans)
- **Instrument Serif italic** — hero name, section titles, project/timeline titles
- **JetBrains Mono** — section labels, dates, chips, badges, mono data
- **Plus Jakarta Sans** — body text, buttons (Inter, DM Sans and Syne all removed)

### Ghost Section Numbers (added May 2025)
- CSS: `.section-header[data-num]::before { content: attr(data-num); }` — translucent italic serif numbers behind each section title
- HTML: `data-num="01"` through `data-num="06"` on each `.section-header` div
- Inspired by editorial magazine aesthetics

### Key CSS Patterns
- Reveal: elements start `opacity:0 + transform`, get `.visible` class via IntersectionObserver → animate to `opacity:1; transform:none`
- Spotlight: `addSpotlight(el)` on any `position:relative; overflow:hidden` card
- Tilt: `initTilt(card)` — **NO-OP** (3D tilt disabled, M11)
- Magnetic: `initMagnetic(el)` — contact items only
- Stagger: `observeStaggered(elements, baseDelay, step)`

---

## SECTION ORDER (CRITICAL — must stay in sync in 3 places)

1. HTML section elements order in body
2. `sectionIds` array in section-nav IIFE (~line 2404)
3. Section number labels in `UI_STRINGS` (sec_about_label, etc.)

**Current order:** About(01) → Projects(02) → Skills(03) → Experience(04) → Education(05) → Contact(06)

---

## HISTORY OF CHANGES MADE (what was done and why)

### Bugs Fixed
- **Critical crash fix**: `section-nav` element was missing from HTML → JS crashed on `navEl.appendChild()` → entire script aborted → site showed nothing. Fixed by adding `<div class="section-nav" id="section-nav">` to HTML.
- **Missing `grid-overlay`**: dot grid CSS existed but no HTML element. Fixed.
- **`resumeBtn` used before declaration**: was a timing issue, resolved by reordering.

### Layout Changes Made
- **Section reorder**: Was About→Skills→Projects→Education→Experience. Changed to About→Projects→Skills→Experience→Education (recruiters want projects first).
- **Contact layout**: 3 children in 2-col grid. Fixed with explicit `grid-column/grid-row` placement: intro(col1,row1), cards(col2,rows1-2), form(col1,row2).
- **Featured project card**: Was attempted as full-width horizontal split layout → **USER REVERTED IT** — they did not like it. Keep all project cards the same standard layout.

### Content Changes Made
- Signature section: Changed from "Built by hand in / Magdeburg." → "Made by / Hashwanth."
- Hero name: Removed the dot (`::after` content) after "Hashwanth Ghanta"
- Section labels: Renumbered to match new section order
- Timeline titles: Font size increased from 1.5rem → 1.85rem to match project/section title scale
- "Let's talk" contact title: User asked where to change it → `UI_STRINGS.en.sec_contact_title` (line ~2600) and `UI_STRINGS.de.sec_contact_title` (line ~2625)

### Animations Added (New Layer — lines 1805–2210)
All of these are new, do not repeat them:
1. Dark-mode hero name: animated shimmer gradient (cream→ember→gold sweep)
2. About highlight text: ember↔gold shimmer (dark mode)
3. Open badge: entrance only — badgeFloat loop REMOVED (M11)
4. Hero stack chips: chipFloat loop REMOVED (M11)
5. Button ripple: on click, spread circle animation (delegated listener)
6. Nav link underline: slides in from centre on hover/active
7. Section label line: draws itself (width 0→36px on .visible)
8. Hero photo: clip-path wipe reveal on image load (.revealed class)
9. Project + skill cards: micro-rotate on entrance (removed on .visible)
10. Cursor sparkle trail: **DISABLED** (early return in IIFE, M11/M30)
11. Chip hover glow: box-shadow pulse
12. Education card icon: bounce animation on card hover
13. Timeline card: warm gradient overlay on hover (::before)
14. Skill bar: brightness pulse after fill
15. Scroll progress bar: ember glow
16. Hero availability: availPulse loop REMOVED (M11)
17. Stat icon wrap: rotate+scale on hover
18. Back-to-top: spring bounce on hover
19. Word-by-word section title reveal: JS splits titles into spans, IO reveals per-word
20. Parallax depth: **DISABLED** (early return in IIFE, M11)
21. Logo scramble: **DISABLED** (early return in IIFE, M11)
22. Scroll-velocity-skew: **DISABLED** (early return in IIFE, M11)
23. 3D card tilt (initTilt): **NO-OP** (M11)
24. Hero 3D mouse parallax: **DISABLED** (early return in IIFE, M11)

### Skills Section
Currently renders: category title + progress bars (pct-based) + chip cloud.
The `SKILL_ICONS` map at line ~3183 adds an emoji icon + left ember border to each group title.

---

## KNOWN BUGS / PENDING WORK

### Bug: Function hoisting crash risk
In the word-by-word reveal code (line ~3449):
```js
const _origApplyUIStrings = applyUIStrings;
function applyUIStrings(lang) { _origApplyUIStrings(lang); ... }
```
Due to JS hoisting, `_origApplyUIStrings` captures the NEW function → **infinite recursion** on language switch.
**Fix needed**: Remove this function redeclaration. Replace with MutationObserver or re-run `splitSectionTitles()` from `setLanguage()` directly.

### Top-5 Audit Items — COMPLETED
1. ✅ P1 — Hoisting bug already fixed in `setLanguage` (adds `splitSectionTitles` via setTimeout)
2. ✅ P2 — Projects 2–4 now have SVG mockup visuals (`PROJ_SVG` object + `mediaSVGKey` in data)
3. ✅ P3 — Hero simplified: removed `hero-live-indicator`, removed 3rd CTA button, role is static (first segment only), stats use SVG icons
4. ✅ P4 — Skill % bars replaced with level tags (Expert/Advanced/Proficient/Familiar) in `renderDynamic`
5. ✅ P5 — All emoji icons replaced with SVG via `SVG_ICONS` constant; contact, edu, stats, skills all use SVGs

### M1–M45 Comprehensive Audit — May 2025 (COMPLETED SESSION)
Applied in one session. See memory file `project_audit_2025.md` for full detail.
Key items DONE: M1 (eyebrow removed), M4 (stats replaced), M5 (value prop), M6 (availability reframed), M7 (CO₂ desc shortened), M9 (fonts → 3), M11 (6 animations disabled), M15 (CGPA fixed), M17 (loading instant), M18 (phone removed), M19 (flags removed), M21 (featured card ember border), M22 (git strings removed), M24 (about personality), M25 (theme persistent), M26 (resume emoji), M27 (photo brightness), M29 (hover consistent), M30+M32 (sparkle+download), M36 (signature section removed), M39 (og:image).
Items NOT done: M3, M8, M13, M14, M23, M28, M33, M34, M37, M38, M40-M44 — see memory for reasoning.

### Next Audit Items (if revisiting the design)
A full redesign was considered:
- New palette: cool indigo (#818cf8) instead of ember orange
- Deep navy background (#020817) instead of warm black
- Ghost section numbers (large transparent numerals behind each section header)
- Cards with left accent border instead of full border (border-radius 8px)
- Aurora blobs changed to indigo + cyan

---

## USER PREFERENCES & RULES (critical — follow these always)

1. **Never change text content** unless explicitly asked.
2. **Never change layout/format** unless explicitly asked.
3. **Reverted changes must stay reverted** — the featured project full-width card was tried and reverted. Do not re-implement it.
4. When asked to "focus on animations/UX", change ONLY CSS and JS effects, not structure or text.
5. User has full backup — not afraid of bold changes.
6. User behaves like a recruiter + senior dev when evaluating — judge changes by whether they look impressive to a technical hiring manager.
7. **Don't make the same changes twice** — check this file before implementing anything.
8. When user says "continue from where you left off" — check the Pending Work section above.
9. User prefers bilingual (EN/DE) support maintained across all changes.
10. EmailJS is configured and live — do not touch credentials.

---

## HOW TO MAKE CHANGES EFFICIENTLY

### Changing colors / theme
→ Edit `:root` block (lines 24–120). One change propagates everywhere.

### Changing content (text, bio, projects, skills, etc.)
→ Edit `PORTFOLIO_DATA` (EN: ~2215) and `PORTFOLIO_DATA_DE` (DE: ~2130). Never touch HTML.

### Changing section titles / nav labels
→ Edit `UI_STRINGS` (~line 2582) for both `en` and `de`.

### Adding a new animation
→ Add CSS before closing `</style>` (currently at line ~2212). Add JS before closing `</script>` (currently at line ~3523). Document it in the "Animations Added" section of this file.

### Changing a specific section's layout
→ Use the jump map above to go directly to that section's CSS lines.

### Debugging why something doesn't show
→ Check: (1) Is the element ID correct? (2) Is `renderDynamic` populating it? (3) Is the IntersectionObserver observing it? (4) Is there a JS crash earlier stopping execution?

---

## EMAILJS CONFIG (live — do not change)
```
Public Key:  MM3bI7Ecwcbc9DcZi
Service ID:  service_joq8tyr
Template ID: template_vihv3zr
Sends to:    hashwanthghanta@gmail.com
```
