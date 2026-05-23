# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
It acts as the project brain — read this fully before making ANY change.

---

## WHO IS HASHWANTH GHANTA

- M.Sc. Digital Engineering student at OVGU Magdeburg, Germany
- Unity 3D developer — main project is a 7-phase CO₂ Carbon Capture Simulation
- Available from May 2026 for internships/Werkstudent roles in Germany
- Email: hashwanthghanta@gmail.com
- LinkedIn: linkedin.com/in/hashwanthghanta | GitHub: github.com/hashwanthghanta

---

## PROJECT OVERVIEW

Single-file static portfolio: **`index.html`** (≈3956 lines).
No build system. No npm. No dependencies to install.
Open directly in browser or push to GitHub Pages (`main` branch — `hashwanthghanta.github.io` folder).
Assets: `Images/` folder (hero photo at `Images/hash.jpeg`), `resume.pdf`, `lebenslauf.pdf`.

> **Deploy**: Only the `hashwanthghanta.github.io` folder is pushed to GitHub. The `hashwanthghanta.github.io.worktrees` folder is a git worktree scratch space created by Claude Code agents — it is **not** the live site and should be ignored.

---

## FILE ARCHITECTURE — JUMP MAP

Never read the whole file. Use these line ranges to go directly to what you need.

### CSS (lines 20–2210)

| What | Lines |
|---|---|
| **Design tokens / CSS variables** | 24–120 |
| Light mode overrides | 122–203 |
| Aurora blobs | 300–375 |
| **Loading curtain (HG intro screen)** | 1849–1935 |
| Hero portrait mobile fix (≤860px) | 396–460 |
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
| **New animation layer** | 1805–2210 |
| **Mobile button fix (≤480px)** | 2303–2340 |

### HTML Body (lines ~2369–2530)

Sections in exact order (must stay in sync with JS sectionIds):
```
#hero → #about → #projects → #skills → #experience → #education → #contact
```

Key elements:
- Loading curtain: `<div class="loading-curtain" id="loading-curtain">` — line ~2369
- Hero portrait: `<div class="hero-portrait-wrap" id="hero-portrait-wrap">` — line ~2434

Key dynamic targets (populated by JS, empty in HTML):
- `#hero-name`, `#hero-role`, `#hero-bio`, `#hero-availability`, `#hero-stack-row`
- `#stats-card`, `#about-text`, `#about-cards`
- `#skills-layout`, `#projects-grid`, `#edu-grid`, `#experience-timeline`
- `#contact-cards`, `#contact-intro-text`, `#contact-avatar`
- `#section-nav` — right-side dot nav

### JavaScript (lines ~2590–3956)

| Block | Lines |
|---|---|
| **`PORTFOLIO_DATA` (EN)** — all content | ~2590–2760 |
| **`PORTFOLIO_DATA_DE`** — German translation | ~2760–2850 |
| **`UI_STRINGS`** — nav/button labels both languages | ~2620–2840 |
| Section nav dots IIFE | ~2409 |
| Custom cursor IIFE | ~2832 |
| Nav scroll + active pill | ~2878 |
| `startTypewriter()` | ~2938 |
| `applyTheme()` / `applyUIStrings()` / `setLanguage()` | ~3022 |
| Modal open/close | ~3060 |
| **`renderDynamic(data, lang)`** — core renderer | ~3104 |
| One-time setup + initial render | ~3324 |
| EmailJS contact form | ~3362 |
| **`setupLoadingCurtain()`** — HG intro screen logic | ~3709 |
| Word-by-word title reveal | ~3439 |
| Logo scramble on hover | ~3496 |

---

## DESIGN SYSTEM

### Current Color Palette (Dark Mode) — Cool Indigo
```
--ember:       #818cf8   (primary accent — signature indigo, THE ONE accent)
--ember-soft:  #a5b4fc
--ember-deep:  #6366f1
--gold:        #c7d2fe   (periwinkle lavender)
--sage:        #64748b
--bg-dark:     #020817   (deep navy)
--bg-card:     rgba(13,18,37,0.72)
--text-primary: #f1f5f9  (cool near-white)
--text-secondary: #94a3b8
```
**To change the entire color scheme:** override `:root` variables at lines 24–120. ALL rules use these variables, so one block change propagates everywhere.

### Fonts (3 fonts total)
- **Instrument Serif italic** — hero name, section titles, project/timeline titles
- **JetBrains Mono** — section labels, dates, chips, badges, mono data
- **Plus Jakarta Sans** — body text, buttons

### Ghost Section Numbers
- CSS: `.section-header[data-num]::before { content: attr(data-num); }` — translucent italic numbers behind each section title
- HTML: `data-num="01"` through `data-num="06"` on each `.section-header` div

### Key CSS Patterns
- Reveal: elements start `opacity:0 + transform`, get `.visible` class via IntersectionObserver → animate to `opacity:1; transform:none`
- Spotlight: `addSpotlight(el)` on any `position:relative; overflow:hidden` card
- Tilt: `initTilt(card)` — **NO-OP** (disabled permanently)
- Magnetic: `initMagnetic(el)` — contact items only
- Stagger: `observeStaggered(elements, baseDelay, step)`

---

## SECTION ORDER (CRITICAL — must stay in sync in 3 places)

1. HTML section elements order in body
2. `sectionIds` array in section-nav IIFE (~line 2404)
3. Section number labels in `UI_STRINGS`

**Current order:** About(01) → Projects(02) → Skills(03) → Experience(04) → Education(05) → Contact(06)

---

## LOADING CURTAIN — HG INTRO SCREEN

When the portfolio opens, a full-screen curtain shows the user's initials **"HG"** with an indigo progress bar that fills over ~2.4 seconds. This ensures all animations, photos, and scroll effects finish loading before the hero is revealed.

### How it works
- CSS: `.loading-curtain` covers the full viewport; `.curtain-logo` fades up with indigo gradient text; `.curtain-bar` fills from 0→100% over 2.4s with deceleration easing (lines ~1849–1935)
- HTML: `<div class="loading-curtain" id="loading-curtain">` at line ~2369
- JS: `setupLoadingCurtain()` at line ~3709 — uses dual-flag pattern: curtain stays visible until BOTH `window.load` fires AND minimum 3100ms has elapsed. Hard failsafe removes it at 6000ms.
- After curtain hides: `triggerHeroEntrance()` fires 450ms later to start hero section animations

### Do not change
- Minimum display time (3100ms) — this is the buffer for animations + photo to load on mobile
- The hard failsafe at 6000ms — prevents permanent block on slow connections
- The `triggerHeroEntrance()` call order

---

## MOBILE FIXES (iOS Safari — confirmed working)

### Hero Portrait (≤860px) — lines ~396–460
iOS Safari has multiple rendering traps that make the portrait photo invisible. The nuclear fix applied:
- `.hero-portrait-wrap`: `height: 325px`, `isolation: auto`, `animation: none !important`, `overflow: hidden`
- `.hero-portrait-wrap::before`: `display: none !important` — removes the animated ring entirely on mobile (ring animation + `z-index: -1` promotes to GPU compositing layer and makes parent invisible on iOS)
- `.hero-portrait-wrap img`: `height: 325px` (explicit pixel value, NOT `height: 100%` — iOS Safari cannot resolve `height: 100%` when parent uses `isolation` + `overflow: hidden`)
- `.hero-right`: `max-width: 100%`, `overflow-x: clip`
- `.hero-skills-track-wrap`: `-webkit-mask-image: none` — removes mask that caused iOS Safari to compute intrinsic width as `max-content`, pushing the grid wider than the viewport

### CTA Buttons (≤480px) — lines ~2303–2340
- `.hero-cta-row`: `flex-direction: column`, `align-items: flex-start` — prevents buttons stretching full width
- Button `::before` / `::after` pseudo-elements: `display: none !important` — removes animated conic-gradient pseudo-elements that caused iOS compositing issues

---

## ALL CHANGES HISTORY

### Content & Section Changes
- Signature section: "Built by hand in / Magdeburg." → "Made by / Hashwanth." (since removed entirely — M36)
- Hero name: Removed dot (`::after`) after "Hashwanth Ghanta"
- Section labels: Renumbered to match section order
- Timeline titles: Font size increased to 1.85rem
- **"Services" section renamed** → "What I Do" (EN) / "Was ich mache" (DE) — `nav_services` and `services_h2` keys in `UI_STRINGS` for both languages, + HTML fallback on `<h2 id="services-h2">`. Reason: "Services" implies a business; user is a student.
- Phone number removed (M18), flag icons removed (M19), git strings removed (M22)

### Layout Changes
- **Section reorder**: Was About→Skills→Projects→Education→Experience. Changed to About→Projects→Skills→Experience→Education
- **Contact layout**: Fixed with explicit `grid-column/grid-row` placement
- **Featured project card**: Full-width horizontal layout was tried and **USER REVERTED** — do not re-implement

### Animations Added (full list — do not repeat)
1. Dark-mode hero name: animated shimmer gradient
2. About highlight text: ember↔gold shimmer
3. Open badge: entrance animation only (loop removed)
4. Hero stack chips: (float loop removed)
5. Button ripple: click spread circle (delegated)
6. Nav link underline: slides from centre on hover/active
7. Section label line: draws itself on `.visible`
8. Hero photo: clip-path wipe reveal on image load
9. Project + skill cards: micro-rotate on entrance
10. Cursor sparkle trail: **DISABLED**
11. Chip hover glow
12. Education card icon: bounce on hover
13. Timeline card: gradient overlay on hover
14. Skill bar: brightness pulse after fill
15. Scroll progress bar: ember glow
16. Stat icon: rotate+scale on hover
17. Back-to-top: spring bounce on hover
18. Word-by-word section title reveal (JS + IO)
19. Parallax depth: **DISABLED**
20. Logo scramble: **DISABLED**
21. Scroll-velocity-skew: **DISABLED**
22. 3D card tilt (`initTilt`): **NO-OP**
23. Hero 3D mouse parallax: **DISABLED**
24. **Loading curtain**: HG initials + indigo progress bar (3.1s minimum, dual-flag JS)

### Bugs Fixed
- Critical crash: missing `#section-nav` HTML element — JS crashed on startup
- Missing `grid-overlay` HTML element
- `resumeBtn` used before declaration
- Hoisting bug in `applyUIStrings` redeclaration — fixed via `setLanguage` calling `splitSectionTitles` in `setTimeout`
- iOS Safari portrait invisible — nuclear fix (see Mobile Fixes section)
- iOS CTA buttons stretched full-width — flex-direction fix
- iOS hero-right content overflow — mask-image removal fix

---

## USER PREFERENCES & RULES (follow these always)

1. **Never change text content** unless explicitly asked.
2. **Never change layout/format** unless explicitly asked.
3. **Reverted changes must stay reverted** — featured project full-width card was tried and reverted. Do not re-implement.
4. When asked to "focus on animations/UX", change ONLY CSS and JS effects, not structure or text.
5. User evaluates like a technical hiring manager — judge all changes by that standard.
6. **Don't make the same changes twice** — check this file before implementing anything.
7. When user says "continue from where you left off" — check Pending Work section.
8. **Bilingual (EN/DE) support must be maintained** across all changes — always update both `PORTFOLIO_DATA` + `PORTFOLIO_DATA_DE` and both language blocks of `UI_STRINGS`.
9. **Never push to GitHub without user's explicit confirmation** — user pushes themselves.
10. EmailJS is live — do not touch credentials (see below).

---

## HOW TO MAKE CHANGES EFFICIENTLY

### Changing colors / theme
→ Edit `:root` block (lines 24–120). One change propagates everywhere.

### Changing content (text, bio, projects, skills, etc.)
→ Edit `PORTFOLIO_DATA` (EN: ~2590) and `PORTFOLIO_DATA_DE` (DE: ~2760). Never touch HTML directly.

### Changing section titles / nav labels
→ Edit `UI_STRINGS` (~line 2620) for both `en` and `de`.

### Adding a new animation
→ Add CSS before closing `</style>` (~line 2212). Add JS before closing `</script>` (~line 3956). Document it in "Animations Added" above.

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
