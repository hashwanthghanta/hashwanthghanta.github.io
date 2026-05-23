# CLAUDE.md — Portfolio Brain

This file is the single source of truth for this project.
**Read it fully before making ANY change.** It will save you hours of debugging.

---

## WHO IS HASHWANTH GHANTA

- M.Sc. Digital Engineering student at OVGU Magdeburg, Germany
- Unity 3D developer — main project is a 7-phase CO₂ Carbon Capture Simulation
- Available from May 2026 for internships/Werkstudent roles in Germany
- Email: hashwanthghanta@gmail.com
- LinkedIn: linkedin.com/in/hashwanthghanta | GitHub: github.com/hashwanthghanta
- Portfolio: hashwanthghanta.github.io

---

## PROJECT OVERVIEW

Single-file static portfolio: **`index.html`** (≈3956 lines).
No build system. No npm. No dependencies to install.
Open directly in browser or push to GitHub Pages (`main` branch).

**Repository folder:** `hashwanthghanta.github.io` inside `~/Documents/GitHub/`
**Assets:** `Images/hash.jpeg` (hero photo), `resume.pdf` (English CV), `lebenslauf.pdf` (German CV)

> The `hashwanthghanta.github.io.worktrees` folder next to it is a Claude Code scratch space — **not** the live site. Ignore it.

---

## ✅ SAFE TO CHANGE — GREEN ZONE

These areas are low-risk and straightforward to edit:

| What | How |
|---|---|
| Text content (bio, project descriptions, skills) | Edit `PORTFOLIO_DATA` (EN ~line 2590) and `PORTFOLIO_DATA_DE` (DE ~line 2760) |
| Section headings / nav labels | Edit `UI_STRINGS` for both `en` and `de` (~line 2620) |
| Entire color scheme | Override `:root` variables at lines 24–120 — one block, propagates everywhere |
| Adding a new CSS animation | Add before `</style>` (~line 2212), document in Animations list below |
| Adding new JS behavior | Add before `</script>` (~line 3956) |
| Resume / CV files | Replace `resume.pdf` (English) and `lebenslauf.pdf` (German) in the repo root |

---

## 🚫 DO NOT TOUCH — RED ZONE

These areas are fragile. Changing them without deep understanding will break things on mobile, iOS, or both.

### 1. Hero portrait mobile fix block (≤860px) — lines ~396–460
This block was the result of **multiple failed attempts** to fix an invisible photo on iPhone.
Every line exists for a specific iOS Safari reason. See the "Hero Section Deep Dive" section below.
**Do not remove, simplify, or reorganise this block.**

### 2. CTA button mobile fix (≤480px) — lines ~2303–2340
The `::before`/`::after` pseudo-elements on buttons use animated conic-gradients.
On iOS Safari, these trigger GPU compositing layer promotion and can make the button invisible or cause layout overflow.
The fix disables them entirely on narrow screens.
**Do not re-enable button animations at ≤480px.**

### 3. Loading curtain timing — `setupLoadingCurtain()` at ~line 3709
- Minimum display: **3100ms** — this is the required buffer for all animations + hero photo to finish loading on mobile before the user sees anything.
- Hard failsafe: **6000ms** — never blocks longer than 6s on slow connections.
- `triggerHeroEntrance()` fires **450ms after** the curtain hides.
**Do not shorten the 3100ms minimum. Do not change the call order.**

### 4. `.hero-skills-track-wrap` mask-image removal (inside the ≤860px block)
The scrolling chip strip uses `-webkit-mask-image` on desktop for a fade edge effect.
On iOS Safari, this forces the element's intrinsic width to `max-content` (as wide as all chips end-to-end), which breaks the entire hero grid layout on mobile.
The fix removes the mask entirely at ≤860px.
**Do not re-add `-webkit-mask-image` inside the mobile media query.**

### 5. EmailJS credentials — never touch
```
Public Key:  MM3bI7Ecwcbc9DcZi
Service ID:  service_joq8tyr
Template ID: template_vihv3zr
Sends to:    hashwanthghanta@gmail.com
```

### 6. Section order — must stay in sync in 3 places
Current order: About(01) → Projects(02) → Skills(03) → Experience(04) → Education(05) → Contact(06)
If you reorder sections, you must update all three simultaneously:
1. HTML section elements in body
2. `sectionIds` array in section-nav IIFE (~line 2404)
3. Section number labels in `UI_STRINGS`

### 7. Featured project full-width card layout
This was attempted once and the user reverted it. **Do not re-implement a wide/horizontal featured card.**

---

## HERO SECTION DEEP DIVE — READ BEFORE TOUCHING ANYTHING HERE

The hero section is the most complex part of the site and caused the most problems during development, especially on iPhone / iOS Safari. This section documents every trap we hit and why the current code works.

### Hero layout structure

```
#hero
  └── .hero-inner (CSS grid: 2 columns on desktop, single column on mobile)
        ├── .hero-left   → name, role, bio, CTA buttons
        └── .hero-right  → photo portrait + scrolling skills strip
              ├── .hero-portrait-wrap  → the photo container
              │     └── img (Images/hash.jpeg)
              └── .hero-skills-track-wrap → scrolling chip strip
```

### Desktop behaviour
On desktop (> 860px), the hero renders as a two-column grid. The portrait uses `aspect-ratio`, `overflow: hidden`, `isolation: isolate`, and an animated `::before` ring around it. This all works fine on desktop Chrome/Firefox/Safari.

### Mobile (≤860px) — what went wrong and what was fixed

**Problem 1: Photo completely invisible on iPhone**

Root cause: iOS Safari has a specific rendering trap. When a container uses `isolation: isolate` AND `overflow: hidden`, iOS Safari refuses to resolve `height: 100%` on any child element — it computes the child's height as 0px. Combined with an animated `::before` pseudo-element that has `z-index: -1`, iOS promotes that pseudo-element to a separate GPU compositing layer. The parent element then becomes invisible because iOS cannot composite it correctly with the layer stack.

Failed attempts before the fix:
- Adding `opacity: 1 !important` on `.hero-left` — did nothing
- Setting `isolation: isolate` + `animation: none !important` on `::before` — stopped animation but `height: 100%` on img still failed
- Adding `height: 325px` to the parent while keeping `height: 100%` on img + `isolation: isolate` + `overflow: hidden` — iOS still refused to resolve `height: 100%`

**The nuclear fix that works:**
```css
@media (max-width: 860px) {
    .hero-portrait-wrap {
        height: 325px;        /* explicit pixel height on parent */
        isolation: auto;      /* removes stacking context = removes compositing trap */
        animation: none !important;
        overflow: hidden;
    }
    .hero-portrait-wrap::before {
        display: none !important;  /* remove the ring entirely — it is the compositing problem */
    }
    .hero-portrait-wrap img {
        height: 325px;        /* explicit px on img, NEVER height: 100% — iOS won't resolve it */
        width: 100%;
        position: static;     /* static = no new stacking context */
    }
}
```

Key rule: **Never use `height: 100%` on the img inside `.hero-portrait-wrap` on mobile.** Always use an explicit pixel value. The moment you switch back to `height: 100%`, the photo disappears on iPhone.

**Problem 2: Hero-right content cut off at the right edge of the screen**

Root cause: The scrolling chip track (`.hero-skills-track-wrap`) uses `-webkit-mask-image` for a fade effect on desktop. On iOS Safari, applying a mask to an element whose inner track has `width: max-content` causes iOS to compute the *parent's* intrinsic width as `max-content` — meaning as wide as all the chips laid out in one line (far wider than the viewport). This pushed the entire right column past the screen edge.

Fix:
```css
@media (max-width: 860px) {
    .hero-right {
        max-width: 100%;
        overflow-x: clip;   /* clip, not hidden — hidden creates a scroll container */
    }
    .hero-skills-track-wrap {
        width: 100%;
        max-width: 100%;
        -webkit-mask-image: none;
                mask-image: none;
    }
}
```

**Problem 3: CTA buttons stretched full-width on narrow phones**

Root cause: The hero CTA row uses flexbox. Without an explicit alignment, buttons stretch to fill the flex container width at narrow viewports.

Fix:
```css
@media (max-width: 480px) {
    .hero-cta-row {
        flex-direction: column;
        align-items: flex-start;  /* buttons size to content, not container */
        gap: 0.65rem;
    }
    /* Disable all button pseudo-element animations on mobile */
    .resume-btn::before, .resume-btn::after,
    .projects-btn::before, .projects-btn::after,
    .contact-btn::before, .contact-btn::after {
        display: none !important;
        animation: none !important;
    }
}
```

### Why the loading curtain exists
Before the loading curtain was added, users opening the portfolio on iPhone saw the hero section before the photo and animations had finished loading. The second scroll position in the hero wasn't visible because the page layout was still computing. The 3.1-second minimum curtain gives mobile browsers time to fully render everything so the user's first impression is the complete, polished page.

### The hero photo clip-path reveal
On desktop, the photo has a clip-path wipe-in animation (`.revealed` class added after `img.onload`). On mobile this still fires, but since the `::before` ring is hidden and `isolation: auto`, there are no conflicts. Do not add any new animated pseudo-elements to `.hero-portrait-wrap` without testing on an actual iPhone first.

---

## LOADING CURTAIN — HG INTRO SCREEN

Full-screen navy curtain with indigo "HG" initials + progress bar. Shows for a minimum of 3.1 seconds every time the portfolio opens.

**CSS:** lines ~1849–1935 — curtain, logo, track, bar, fade-up keyframes
**HTML:** `<div class="loading-curtain" id="loading-curtain">` at line ~2369
**JS:** `setupLoadingCurtain()` at line ~3709

Dual-flag logic:
```
loadFired = false    → set true when window.load fires
minTimeFired = false → set true after 3100ms setTimeout
tryHide() only removes curtain when BOTH flags are true
Hard failsafe at 6000ms removes curtain regardless
triggerHeroEntrance() fires 450ms after curtain hides
```

---

## CV / RESUME FILES

**Source markdown files** (for future edits):
- English: `/Documents/JobHunt/Resumes/cv_english.md`
- German: `/Documents/JobHunt/Resumes/cv_german.md`
- Shared CSS: `/Documents/JobHunt/Resumes/cv_style.css`
- Generate PDFs: `cd /Documents/JobHunt/Resumes && npx md-to-pdf cv_english.md && npx md-to-pdf cv_german.md`
- Then copy: `cp cv_english.pdf <repo>/resume.pdf && cp cv_german.pdf <repo>/lebenslauf.pdf`

**Download filenames** (set via HTML `download` attribute + JS in `setLanguage()`):
- EN button → downloads `resume.pdf` → saved as `Hashwanth_Ghanta_CV_English.pdf`
- DE button → downloads `lebenslauf.pdf` → saved as `Hashwanth_Ghanta_Lebenslauf.pdf`

Language swap is handled in `setLanguage()` (~line 3246) — when `lang === "de"`, it updates the `href`, `download`, and `aria-label` on `#resume-btn`.

---

## PRE-PUSH CHECKLIST — DO THIS BEFORE EVERY COMMIT

Before pushing any change to GitHub, verify these on both desktop and iPhone:

```
[ ] Hero photo is visible on iPhone (open in Safari, not Chrome)
[ ] Hero layout does not overflow horizontally on iPhone
[ ] CTA buttons are not stretched full-width on iPhone
[ ] Loading curtain shows "HG" with progress bar for ~3 seconds
[ ] After curtain, all hero animations play correctly
[ ] Resume download button works — English CV downloads with correct filename
[ ] Switch to DE → "Lebenslauf" button downloads German CV with correct filename
[ ] Section nav dots appear on the right side
[ ] Contact form sends (or at least shows the input correctly)
[ ] No horizontal scroll on any section on mobile
[ ] Light mode toggle works and looks acceptable
```

If you are only changing content (PORTFOLIO_DATA text, not CSS/JS), you can skip the CSS/layout checks but still verify the text renders on mobile.

---

## FILE ARCHITECTURE — JUMP MAP

Never read the whole file. Use these line ranges to go directly to what you need.

### CSS (lines 20–2210)

| What | Lines |
|---|---|
| **Design tokens / CSS variables** | 24–120 |
| Light mode overrides | 122–203 |
| Aurora blobs | 300–375 |
| **Hero portrait + mobile fix (≤860px)** | 326–460 |
| Custom cursor (dot + ring) | 422–446 |
| Card spotlight (cursor glow) | 448–458 |
| Section nav dots (right side) | 486–519 |
| **Hero section CSS** | 787–1034 |
| About section CSS | 1035–1082 |
| Skills section CSS | 1083–1132 |
| Experience timeline CSS | 1133–1168 |
| Projects grid CSS | 1169–1340 |
| Education cards CSS | 1344–1382 |
| Contact section CSS | 1384–1570 |
| Footer CSS | 1571–1600 |
| Contact layout grid (explicit placement) | 1668–1685 |
| **Loading curtain (HG intro screen)** | 1849–1935 |
| New animation layer | 1805–2210 |
| **Mobile button fix (≤480px)** | 2303–2340 |

### HTML Body (lines ~2369–2530)

Sections in exact DOM order:
```
#hero → #about → #projects → #skills → #experience → #education → #contact
```

Key element IDs:
- `loading-curtain` — HG intro screen (line ~2369)
- `hero-portrait-wrap` — photo container (line ~2434)
- `resume-btn` — download button, href/download swapped by `setLanguage()`

Dynamic targets (populated by JS — empty shells in HTML):
- Hero: `#hero-name`, `#hero-role`, `#hero-bio`, `#hero-availability`, `#hero-stack-row`
- About: `#stats-card`, `#about-text`, `#about-cards`
- Sections: `#skills-layout`, `#projects-grid`, `#edu-grid`, `#experience-timeline`
- Contact: `#contact-cards`, `#contact-intro-text`, `#contact-avatar`
- Nav: `#section-nav`

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
| `applyTheme()` / `applyI18n()` / `setLanguage()` | ~3022 |
| Modal open/close | ~3060 |
| **`renderDynamic(data, lang)`** — core renderer | ~3104 |
| One-time setup + initial render | ~3324 |
| EmailJS contact form | ~3362 |
| Word-by-word title reveal | ~3439 |
| **`setupLoadingCurtain()`** | ~3709 |

---

## DESIGN SYSTEM

### Color Palette (Dark Mode — Cool Indigo)
```
--ember:          #818cf8   ← primary accent, THE signature color
--ember-soft:     #a5b4fc
--ember-deep:     #6366f1
--gold:           #c7d2fe   ← periwinkle lavender
--sage:           #64748b
--bg-dark:        #020817   ← deep navy background
--bg-card:        rgba(13,18,37,0.72)
--text-primary:   #f1f5f9
--text-secondary: #94a3b8
```
To change the whole scheme: edit lines 24–120 only. Everything uses these variables.

### Fonts (3 only)
- **Instrument Serif italic** — hero name, section titles, project/timeline titles
- **JetBrains Mono** — section labels, dates, chips, badges
- **Plus Jakarta Sans** — all body text, buttons

### Key CSS Patterns
- **Reveal**: elements start `opacity:0 + transform`, IntersectionObserver adds `.visible` → animate to final state
- **Spotlight**: `addSpotlight(el)` — cursor glow on any `position:relative; overflow:hidden` card
- **Magnetic**: `initMagnetic(el)` — contact section items only
- **Stagger**: `observeStaggered(elements, baseDelay, step)`
- **Tilt**: `initTilt(card)` — permanently NO-OP, do not re-enable

---

## ANIMATIONS — FULL LIST (do not add duplicates)

1. Hero name: animated shimmer gradient (dark mode)
2. About highlight text: ember↔gold shimmer
3. Open badge: entrance only (float loop removed)
4. Stack chips: entrance only (float loop removed)
5. Button ripple: click → spread circle (delegated listener)
6. Nav link underline: slides from centre on hover/active
7. Section label line: width 0→36px on `.visible`
8. Hero photo: clip-path wipe reveal on `img.onload`
9. Project + skill cards: micro-rotate on entrance
10. Cursor sparkle trail: **DISABLED** (early return in IIFE)
11. Chip hover glow: box-shadow pulse
12. Education card icon: bounce on card hover
13. Timeline card: gradient overlay on hover (`::before`)
14. Skill bar: brightness pulse after fill
15. Scroll progress bar: ember glow
16. Stat icon: rotate + scale on hover
17. Back-to-top button: spring bounce on hover
18. Word-by-word section title reveal (JS + IntersectionObserver)
19. Parallax depth: **DISABLED** (early return in IIFE)
20. Logo scramble on hover: **DISABLED** (early return in IIFE)
21. Scroll-velocity skew: **DISABLED** (early return in IIFE)
22. 3D card tilt (`initTilt`): **NO-OP**
23. Hero 3D mouse parallax: **DISABLED** (early return in IIFE)
24. **Loading curtain**: HG initials + indigo progress bar (3.1s minimum)

---

## ALL CHANGES HISTORY

### Content
- "Services" section renamed → "What I Do" (EN) / "Was ich mache" (DE) — student, not a business
- Hero name: removed dot (`::after`) after "Hashwanth Ghanta"
- Phone number removed from contact display (M18)
- Flag icons removed from language toggle (M19)
- Git activity strings removed (M22)
- Signature section removed entirely (M36)
- Section labels renumbered after reorder
- Timeline titles: font size → 1.85rem

### Layout
- Section reorder: About→Projects→Skills→Experience→Education (recruiters want projects first)
- Contact layout: 3 children in 2-col grid fixed with explicit `grid-column/grid-row`
- Featured project card: full-width layout attempted and **user reverted — do not redo**

### Bugs Fixed
- Critical crash: `#section-nav` missing from HTML → JS crashed on startup → whole site blank
- Missing `grid-overlay` HTML element
- `resumeBtn` used before declaration
- Hoisting bug in `applyUIStrings` redeclaration — fixed via `setLanguage` calling `splitSectionTitles` in `setTimeout`
- **iOS Safari hero photo invisible** — nuclear fix (explicit px height, `isolation: auto`, `::before display:none`)
- **iOS CTA buttons stretched full-width** — `flex-direction: column; align-items: flex-start`
- **iOS hero-right overflow** — `-webkit-mask-image: none` on chip strip at ≤860px
- Loading curtain: redesigned from 1s instant-hide to 3.1s branded HG intro screen

---

## USER PREFERENCES & RULES

1. **Never change text content** unless explicitly asked.
2. **Never change layout/format** unless explicitly asked.
3. **Reverted changes stay reverted** — featured card, loop animations.
4. When asked about animations/UX: change ONLY CSS and JS effects, not structure or text.
5. Evaluate every change as a technical hiring manager would see it.
6. **Don't make the same change twice** — check this file first.
7. "Continue from where you left off" → read the Pending Work section and history above.
8. **Always maintain bilingual support** — any content change needs both EN and DE updated.
9. **Never push to GitHub without explicit user confirmation.** User pushes themselves.
10. EmailJS is live — see credentials above, do not touch them.

---

## HOW TO MAKE CHANGES EFFICIENTLY

| Task | Action |
|---|---|
| Change all colors | Edit `:root` at lines 24–120 |
| Change text/content | Edit `PORTFOLIO_DATA` (EN ~2590) + `PORTFOLIO_DATA_DE` (DE ~2760) |
| Change section titles / nav | Edit `UI_STRINGS` (~2620) for both `en` + `de` |
| Add animation | CSS before `</style>` (~2212) + JS before `</script>` (~3956) + add to list above |
| Change section layout | Jump map → that section's CSS lines |
| Update CV/resume | Edit source `.md`, run `npx md-to-pdf`, copy to repo |
| Debug blank/missing element | Check: ID correct? `renderDynamic` populating it? IntersectionObserver watching it? JS crash earlier? |
