# Prompt for Opus: Liquid Glass × Turquoise Mosaic, 3 design options

Copy everything below the line into Opus, with the repo `simonheisstpeter/Fabio_sh` attached.

---

## Role

You are a senior product designer and front-end engineer with a strong sense of premium, restrained visual craft (think Apple's Liquid Glass at WWDC25/iOS 26, Linear, Arc). You are working on my personal site fabio.sh.

## Context: what exists

Astro 7 SSR, hand-written CSS in `src/styles/globals.css` (about 2100 lines, no framework), layout in `src/layouts/default.astro`, components in `src/components/`. Read these first, in this order, before designing anything:

1. `docs/DESIGN-SYSTEM.md` (the current v8 "emerald mosaic" system)
2. `src/styles/globals.css` (tokens at the top; the last section "Mosaic wordmark + glass sections" holds a failed first glass attempt)
3. `src/layouts/default.astro`, `src/components/MosaicWord.astro`, `MiniMosaic.astro`, `MosaicHead.astro`, `Hero.astro`, `Footer.astro`
4. `src/pages/index.astro`, `projects.astro`, `about.astro`, `contact.astro`
5. `src/pages/mediakit/designs/` (existing pattern for side-by-side design experiments)

Run `npm install` and `npm run dev`, then look at the real pages with Playwright (Chromium is preinstalled) in light and dark before you start.

## Why this task exists

A previous model (Mistral) tried "Apple Liquid Glass × turquoise mosaic" and failed. The current result is the old brutalist v8 system (2px ink borders, hard offset shadows, pixel-clipped corners, ivory paper) with `.glass` panels bolted on. It does not look like Liquid Glass and does not look premium. Do not iterate on that. Treat the glass section of `globals.css` as a negative example.

Diagnose the failure in 5 bullet points at the start (what specifically reads as cheap or off), so that the new options avoid it.

## The brief

Redesign the visual language so it feels like **Apple Liquid Glass fused with a turquoise mosaic**, and premium.

**Liquid Glass, interpreted correctly.** It is not a flat blur panel. The material needs:
- A translucent, tinted body: `backdrop-filter: blur() saturate()` plus a low-alpha fill (roughly 8–18 percent), never a heavy frosted slab.
- A specular edge: a 1px inner highlight that is brighter at the top-left and fades around the edge (gradient border via mask or layered `box-shadow: inset`), plus a faint opposite-side rim light.
- Depth by refraction cues: an inner soft glow, and large, very soft, low-opacity colored shadows (no hard offset shadows).
- Generous continuous corner radii (20–32px for panels, full pill for buttons and nav), no stepped pixel corners.
- Glass only floats over something worth refracting. The background must be rich enough to make the glass read (see mosaic below).
- Motion that feels physical: slight scale and brightness change on hover, spring-like easing (`cubic-bezier(.2,.8,.2,1)`), specular highlight that follows the pointer on key surfaces.

**Turquoise mosaic, as the identity.** Keep the brand idea of a tile mosaic and the turquoise/emerald family, but evolve it:
- Mosaic becomes the *world behind the glass*: large soft tile fields, low-contrast tessellated shapes, gently animated color tiles in a turquoise palette (deep teal, turquoise, aqua, mint, with one restrained warm or cool counter accent per option) that the glass refracts.
- The FABIO mosaic wordmark and mini-mosaic markers stay, but are re-rendered to fit (rounded or beveled tiles, subtle gloss, no 2px ink outlines).
- The palette must work as a turquoise-led system in both dark (primary, deep teal-black canvas) and light mode.

**Premium means restraint.** One focal moment per screen, strong typographic hierarchy, large whitespace, few effects done perfectly instead of many done loudly. No neon, no rainbow gradients, no emoji, no drop-shadow soup, no blur on every element.

## Hard constraints

- Plain CSS and vanilla JS only. No new dependencies, no Tailwind, no framework.
- Keep Andes Neue (Book and Black, already self-hosted). You may change how it is used (case, tracking, weights), but not add font files.
- Keep the `html[data-theme]` dark/light mechanism, the pre-paint theme script, and all 23 locales. No visible copy changes except where a design requires it.
- **Visible UI copy rule from the design system: no em-dashes and no hyphen-minus as punctuation; use an en dash.**
- Accessibility: body text AA contrast on top of glass in both themes (test against the *busiest* backdrop region, not the calm one), visible `:focus-visible`, `prefers-reduced-motion` disables animation and parallax, `prefers-reduced-transparency` and no-`backdrop-filter` browsers get an opaque, still-attractive fallback via `@supports`.
- Performance: no more than 2 to 3 stacked `backdrop-filter` layers visible at once, no animated blur radii, canvas or animation paused when off-screen, mobile must stay smooth (test with 4x CPU throttle).
- Do not touch API routes, DB, auth, or admin logic. Admin styling is out of scope in this phase.

## Deliverable for THIS phase: three options, nothing applied to the live site yet

Create three clearly different directions as isolated preview pages, following the existing pattern in `src/pages/mediakit/designs/`:

- `/mediakit/designs/glass-a`
- `/mediakit/designs/glass-b`
- `/mediakit/designs/glass-c`
- `/mediakit/designs/glass` as an overview with the three options side by side and a short comparison.

Scope each option's CSS so it **cannot leak** into the live site: put all of it in a `[data-design="glass-a"]` scope (or a separate stylesheet imported only by that page) with its own token set. Do not edit `globals.css` or the live pages in this phase.

Each option page must show the same content set, so they can be compared fairly:
1. Nav bar (floating glass pill with theme toggle and locale link)
2. Hero with the FABIO mosaic wordmark, role label, two CTAs
3. A project card grid (3 cards, one featured), using real data shapes from `ProjectCard.astro`
4. A text section with the section head
5. Contact form (fields, focus state, submit button, success banner)
6. Footer
7. A small component sheet: buttons (primary, secondary, ghost), chips, tabs, input, toggle, badge, tooltip

Make the three directions truly different, for example:

- **A "Aqua Depth"**: dark-first, deep teal ocean; large soft mosaic tiles drifting slowly behind the glass like light through water; most Apple-like; glass is clear and bright-edged.
- **B "Tessellate"**: light-first, pearly off-white and aqua; crisp, geometric mosaic with visible grout lines; glass is milky and tinted, more editorial typography; warmer, calmer.
- **C "Prism Tile"**: dark, near-black canvas with a few saturated turquoise tiles that glow and refract; glass is darker and more dramatic with strong specular rims; the boldest and most "product launch".

You may swap these concepts if you find stronger ones, but they must be distinguishable at a glance, and each must have its own palette tokens, mosaic treatment, glass recipe (blur, saturation, fill alpha, rim, radius), type treatment and motion personality.

## Process

1. Read the code and screenshot the live site (light and dark, desktop 1440 and mobile 390).
2. Write the 5-bullet failure diagnosis.
3. Build the shared glass primitives once (a small internal token and recipe sheet), then the three themes on top.
4. Screenshot every option in light and dark at 1440 and 390 (Playwright, `deviceScaleFactor: 2`), view the screenshots yourself, and fix what looks cheap (muddy blur, banding, clipped highlights, weak contrast, jitter). Iterate at least twice.
5. Check contrast numerically for body text, chips and buttons on glass.
6. Run `npm run build` and `npm test`; both must pass. Run `npm run fmt` if the repo expects it.
7. Commit on the current branch and push. Do not open a PR.

## What to report back

- The 5-bullet diagnosis
- A table of the three options: concept, palette (hex), glass recipe values, mosaic treatment, type treatment, mood, best for
- Screenshot paths for each option (light and dark, desktop and mobile)
- Your recommendation and why, with honest weaknesses of each
- A short plan for phase 2: how the chosen option maps onto the existing classes (`.card`, `.btn`, `.field`, `.section-head`, `.mosaic-head`, `.f-mosaic`, `.divider-tiles`, `.sunset-stripe`, footer), which pieces get removed, and the estimated number of files touched

Stop after the report and wait for my choice. Do not apply anything to the live site until I pick one.
