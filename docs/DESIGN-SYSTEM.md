# fabio.sh — Design System (v4, monochrome pixel, dark + light)

v4 adds: a `data-theme` dark/light system (toggle in the nav, persisted to
localStorage, pre-paint init script, `prefers-color-scheme` fallback), the
Handjet variable pixel face replacing Silkscreen, and a fixed viewport frame
(`.page-frame` + `.edge-strip`) so the pixel system touches every corner of
the page, not just individual components.

## 1. Site audit — every route and its fate

### Public pages
| Route | What it is | Decision |
|---|---|---|
| `/` (index) | Hero + project teaser + contact form | **Restructure** — becomes the concept page (section indices, dither dividers) |
| `/projects` | Filterable project grid/list | **Keep**, restyle onto system (chips, cards, pixel rows) |
| `/about` | Bio + Tidal now-playing + status | **Keep**, restyle; frame now-playing cover with `.img-pixel` |
| `/contact` | Contact form page | **Keep**, `.field`/`.banner` |
| `/courses` | Course progress cards | **Keep**, cards + square progress bars |
| `/cv` | Gated CV viewer (iframe) | **Keep** as-is (PDF viewer) |
| `/social` | ATProto feed embeds | **Keep**, restyle cards |
| `/mediakit` | Brand assets | **Keep**, update palette/font entries to monochrome |
| `/404` | Error page | **Restyle** — outlined 404 + checker block |
| `/test` | Dev scratch page with Hero2–7 | **Cut** (dev-only; variants deleted) |
| `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/.well-known/atproto-did` | Machine-readable | **Keep** untouched |

### Admin (internal, same system)
`/admin`, `/admin/login`, `/admin/register`, `/admin/projects[/new|/id]`, `/admin/courses[...]`, `/admin/submissions`, `/admin/cv` — **keep all**, restyle onto `.btn`/`.card`/`.field`/`.table-pixel`.

### API routes — keep all (no visual impact)

### Conflicts with the monochrome/pixel direction (flagged, not yet removed)
1. **party-js confetti** on `/projects` (colorful burst at footer) — conflicts with "no color accents". Proposal: cut it, or make it grayscale squares. **Recommend cut.**
2. **Green Web Foundation badge** (colorful PNG) in footer — conflicts. Proposal: replace with a mono text chip `green hosting ✓` linking to the check. **Recommend replace.**
3. **`test.astro` + `HeroVariants/`** — dev scratch, conflicts with "premium" polish. **Recommend delete.**
4. **Novelty locales `en-x-*`** (cowboy/starwars/…) — joke content; keep (harmless, excluded from sitemap) or cut. **Your call.**
5. **Custom cursor `f.cur`** — keep (brand mark, monochrome-safe) but make it opt-in only on fine pointers.
6. **Umami analytics script** — invisible, keep.
7. **Console easter egg** — already grayscale; keep.

## 2. Tokens

```
light (:root)                dark (html[data-theme="dark"])
--paper:  #FFFFFF            --paper:  #0A0A0A
--ink:    #0A0A0A            --ink:    #F2F2F2
--surface:#F5F5F5            --surface:#161616
--raised: #ECECEC            --raised: #1F1F1F
--divider:#E2E2E2            --divider:#2A2A2A
--muted:  #444/#666/#8A      --muted:  #C4/#9C/#7D
ink tints: 05/10/15/20/30/40/80 for borders, washes, shadows
```
All tints derive from `--ink-rgb` (`10 10 10` light / `242 242 242` dark) and
surfaces from `--paper-rgb`, so one `data-theme` flip re-themes the pixel grid,
scrollbar, selection, caret and shadows. `<meta name="color-scheme" content="light dark">`
plus `color-scheme` on `:root`/`[data-theme="dark"]` keeps form controls and
scrollbars native-correct. The black `f.cur` cursor falls back to `pointer` in
dark mode and is disabled on coarse pointers.

## 3. Type scale (Handjet variable pixel for display, Andes Neue Light for body, mono for labels)

Handjet (OFL, weight axis 100–900, latin + latin-ext subsets) replaces
Silkscreen — same pixel voice, less childish. The woff2 files are committed as
base64 text in `scripts/fonts/*.b64` and materialized into `public/fonts/` by
`scripts/decode-fonts.mjs` (predev/prebuild hooks), so the font survives
text-only transports. `--font-pixel: "Handjet", "AndesNeueMedium", monospace`.

| Role | Size | Treatment |
|---|---|---|
| Display (h1) | clamp(3rem → 8rem) | Handjet 700, tight leading |
| H2 | 2–3rem | Handjet 700 + square bullet (`.h-pixel`) |
| H3 | 1.25rem | Handjet 400 |
| Body | 1rem | Andes Neue Light |
| Micro-label | 0.65–0.75rem | mono / Handjet, uppercase, tracking 0.1–0.2em |

## 4. Spacing grid
4px base: 4 / 8 / 16 / 24 / 32 / 48 / 64 / 96 / 128. Sections separated by **dither dividers** or `.pixel-strip`.

## 5. Pixel component specs (all plain CSS in globals.css)
- **`.btn` / `.btn-solid`** — 1px ink border, stepped 4px pixel-cut corners, hover: invert + 2px lift with hard offset block
- **`.card`** — `--soft` surface, hairline border, 8px stepped corners, solid 8px corner notch, `.card-hover` lift
- **`.chip`** — square mono badge; `.chip-active` solid ink
- **`.field`** — square, 1px ink border, 2px offset focus outline
- **`.table-pixel`** — ink header row, hairline rows
- **nav** — pixel F logo, Handjet uppercase links, active = solid underline; sticky on desktop (`.sticky` + `.bg-paper/95` now defined), theme toggle button (`[data-theme-toggle]`, pixel sun/moon)
- **footer** — hairline top rule + pixel strip, big `.wordmark`, link columns
- **viewport frame** — `.page-frame` fixed 1px HUD border inset 8px (4px on mobile) with solid 8px corner squares in all four viewport corners, plus fixed `.pixel-strip` `.edge-strip-top`/`.edge-strip-bottom` pinned to the viewport edges
- **motifs** — `.pixel-bg` pixel-grid page background, `.pixel-checker` checkerboard blocks, `.pixel-strip` dividers, `.px-cut` 4px stepped corners, `.px-details` +/− markers, `.dot` status squares, `.tooltip` ink blocks, blinking `▌` cursor, dithered fade (`.dither-fade`) between sections
- **motion** — fade/slide reveals on load (`animate-fadeIn_*`), `steps()` blink, hover lifts; `prefers-reduced-motion` respected

## 6. Accessibility
- Contrast: ink on paper = 19.6:1, gray #666 on white = 5.7:1 (both AA+)
- Focus: 2px ink outline, offset 2px, on every interactive element
- Skip link, aria-current on nav, semantic landmarks — already in place, kept
