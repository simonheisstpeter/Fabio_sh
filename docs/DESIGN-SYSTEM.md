# fabio.sh — Design System (v7, warm poster, dark + light)

v7 refines the v6 constructivist poster into a "warm poster" system inspired
by mistral.ai: an ivory canvas, a cream secondary surface, near-black ink,
one warm orange accent, warm-tinted hard offset shadows, weight-400 display
type (Black reserved for the hero), and the signature block gradient used
exactly once per page. The `data-theme` dark/light system stays: dark mode
flips to a warm near-black canvas with ivory ink and a brightened accent.
Every tint still derives from `--ink-rgb` / `--paper-rgb`, so one attribute
flip re-themes borders, washes, shadows, scrollbar, selection and caret.

## 1. Site audit — every route and its fate

### Public pages
| Route | What it is | v7 decision |
|---|---|---|
| `/` (index) | Hero + marquee + project teaser + contact form | Hero: stacked `FABIO` / outlined `GSCHEWIDL`, Black only here (hero moment), accent caret, rotated accent sticker, F block in the block gradient, chunky CTAs. One marquee strip under the hero (`.marquee`, the only one on the site). Fixed sunset stripe (`.sunset-stripe`, block gradient) at the very bottom of the index page only |
| `/projects` | Filterable project grid/list | `.card` blocks with 2px ink borders; hover lifts 4px with a 10px warm hard shadow; project cards additionally invert (`.card-invert`: ink bg, paper type, accent shadow). Rows get 2px `ink-20` warm dividers; active filter = accent chip |
| `/about` | Bio + Tidal now-playing + status | Article measure (`.measure`, max 68ch), bio as `.pull-quote` bordered block on cream, mounted portrait in `.img-pixel` (2px ink + warm 8px offset shadow) |
| `/contact` | Contact form page | `.field` 2px border, focus = ink border + 4px accent hard shadow; `.banner` status with 2px border + warm hard shadow |
| `/courses` | Course progress cards | Cards inherit; `.progress` is a 10px ink-framed bar with accent fill |
| `/cv` | Gated CV viewer (iframe) | `.tab-pixel` active tab gets a 3px accent underline |
| `/social` | ATProto feed embeds | Restyled cards inherit the 2px system |
| `/mediakit` | Brand assets | Palette lists the v7 tokens incl. the block gradient swatch; type list leads with Andes Neue Book (400), Black marked "hero only" |
| `/404` | Error page | Giant `404` in Book with 2px stroke outline, chunky `.btn` back link |
| `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/.well-known/atproto-did` | Machine-readable | Untouched |

### Admin (internal, same system)
`/admin`, `/admin/login`, `/admin/register`, `/admin/projects[/new|/id]`,
`/admin/courses[...]`, `/admin/submissions`, `/admin/cv` — same tokens;
header gets a 2px ink rule, current nav link is accent, buttons/tables/fields
inherit the poster components.

### API routes — untouched (no visual impact)

### Standing decisions carried over
1. **Custom cursor `f.cur`** — kept (brand mark), fine pointers only; falls
   back to `pointer` in dark mode and on touch.
2. **Umami analytics + console easter egg** — invisible on the page, kept.
3. **Novelty locales `en-x-*`** — kept (excluded from sitemap).
4. **Green Web badge** — mono chip in the footer.
5. **No em-dashes in visible UI copy** — hyphens only (v7 hard rule).

## 2. Tokens

```
light (:root)                dark (html[data-theme="dark"])
--paper:  #FFFAEB            --paper:  #141210   (warm near-black canvas)
--ink:    #1F1F1F            --ink:    #FFFAEB
--accent: #FA520F            --accent: #FF7A3D   (brightened for the dark canvas)
--on-accent: #FFFFFF         --on-accent: #1F1F1F
--popover: #FFFFFF           --popover: #241E16  (pure white: popovers only, light)
--shadow: #8C3817            --shadow: #C14E1E   (amber/ink mix, hard offsets)
--surface:#FFF0C2            --surface:#1D1812
--raised: #F6E3B4            --raised: #282017
--divider:#EBDCBB            --divider:#382E22
--grad-block: linear-gradient(90deg, #FFD900, #FFE295, #FFA110, #FF8105, #FB6424, #FA520F)
ink tints: 05/10/15/20/30/40/80 derived from --ink-rgb (31 31 31 / 255 250 235)
```

Accent is spent only on: selection, focus-visible outline, link hover, list
bullets, caret, active chips/tabs, the sticker, marquee separators, the
online status marker, primary `.btn-solid`, focus shadow on `.field`, and
the invert hover shadow on project cards. One accent, locked everywhere.
The block gradient is a brand moment, never a text fill or a content wash:
on the index page it appears on the hero F block (`.f-block`) and as the
fixed bottom sunset stripe (`.sunset-stripe`); no other page uses it.

`<meta name="color-scheme" content="light dark">` plus `color-scheme` on
`:root`/`[data-theme="dark"]` keeps form controls and scrollbars
native-correct. A pre-paint inline script in every layout sets `data-theme`
from localStorage or `prefers-color-scheme`; the nav toggle flips and
persists it.

## 3. Type scale

Self-hosted Andes Neue (all weights in `public/fonts/`). Hierarchy is carried
by size and color, not weight; maximum two font families (only Andes Neue is
loaded).

| Role | Face | Weight | Notes |
|---|---|---|---|
| Hero display (index `h1` only) | `AndesNeueBlack` | 900 | `.font-black` on the hero; `clamp`-scale, `-0.02em`+, uppercase |
| Display (h1/h2 elsewhere, `.h-display`, `.wordmark`, 404, preview indexes) | `AndesNeueBook` | 400 | `letter-spacing: -0.02em`, `text-transform: uppercase`, `line-height: 0.85–1.1` |
| Body | `AndesNeueBook` | 400 | `1rem / 1.6` |
| Emphasis | `AndesNeueLight` / `AndesNeueMedium` | 300 / 500 | paragraphs and nav labels |
| Labels / meta / chips / buttons / tabs | `ui-monospace` stack | 400 | `0.66–0.72rem`, uppercase, `letter-spacing: 0.14–0.25em` |
| Outlined display | `.text-outline` | 400 (900 in hero) | transparent fill, `2px` `-webkit-text-stroke` ink |

Classes: `.font-black`, `.font-display`, `.font-book`, `.font-andesNeueLight`,
`.font-andesNeueMedium`, `.font-mono`, `.text-outline`. Black is preloaded in
`default.astro`.

## 4. Motifs

- **Viewport frame** — `.page-frame`: one fixed `2px solid var(--ink)` rule,
  inset 10px / 6px mobile, around the whole page. No corner blocks.
- **Warm hard offset shadows** — the only elevation: `4px 4px 0` on buttons,
  `10px 10px 0 var(--shadow)` on card hover, accent shadow on invert/focus.
  Shadow color is the amber/ink mix `--shadow`, never pure black; soft shadows
  (`.shadow-xs`/`.shadow-sm`) use amber-tinted `rgb(250 82 15 / …)`.
  Buttons press flat on `:active` (`translate(3px,3px)`, shadow 0).
- **Block gradient** — `--grad-block` (yellow → gold → amber → orange →
  flame → `#FA520F`): hero F block (`.f-block`) and the fixed index-only
  `.sunset-stripe` (10px bar at the very bottom). Exactly one brand moment
  per page; never as text fill or content wash.
- **Sticker** — `.sticker`: rotated (-2deg) accent label, 2px ink border,
  warm 4px hard shadow. Used for the hero role label.
- **Marquee** — `.marquee`: ink strip with 2px ink rules, mono uppercase
  items separated by accent squares, `translateX(-50%)` loop. Exactly one
  per page (index only); static under `prefers-reduced-motion`.
- **Square markers** — `.dot` status markers are squares with an ink border;
  list bullets are accent squares.
- **Outlined display text** — `.text-outline`: 2px stroke (hero surname,
  preview-card index numbers, 404).
- **Article manners** — `.measure` (max 68ch) for reading pages, `.pull-quote`
  bordered block on `--surface` for the bio.
- **Caret** — `.caret` + `.animate-blink`: 0.06em accent bar, `steps(1)`.
- **Selection** — accent bg, `--on-accent` text; **scrollbar** — 8px,
  `ink-30` thumb.
- **Motion** — 150–500ms eases, fade/slide-in hero (`animate-fadeIn_*`),
  IntersectionObserver `.reveal`; all disabled under
  `prefers-reduced-motion` (marquee pauses too).

## 5. Components

| Component | Class | Look |
|---|---|---|
| Button | `.btn` | Mono uppercase label, 2px ink border, 4px warm hard shadow; hover lifts 2px with 6px accent shadow, `:active` presses flat |
| Primary button | `.btn-solid` | Accent bg, `--on-accent` text, ink border + shadow |
| Card | `.card` (+`.card-hover`, `.card-invert`) | Paper bg, 2px ink border; hover lifts 4px with 10px warm shadow; `.card-invert` inverts to ink bg + accent shadow |
| Chip / filter | `.chip`, `.filter-btn`, `.sort-btn` | Mono label, hairline border; active = accent bg |
| Field | `.field` | 2px `ink-30` border; focus = ink border + 4px accent hard shadow |
| Label | `.label` | Mono uppercase muted |
| Table | `.table-pixel` | 2px ink frame, mono header on surface over 2px ink rule |
| Select | `.select-pixel` | 2px border, chevron caret (SVG data-URI, dark-mode override) |
| Banner | `.banner` | 2px ink border + 6px warm hard shadow, accent dot |
| Tabs | `.tab-pixel` | Mono, 3px accent underline when active |
| Tooltip | `.tooltip` | Solid ink block, paper mono text |
| Progress | `.progress` | 10px bar, 2px ink frame, accent fill |
| Logo mark | `Loader.astro` | "F" in a solid ink block, 2px border, warm hard shadow (small in nav, `big` in mediakit) |
| Hero F block | `.f-block` | Block gradient bg, ink letter, 2px ink border, warm shadow (index hero only) |
| Sunset stripe | `.sunset-stripe` | Fixed 10px block-gradient bar at the page bottom (index only) |
| Theme toggle | `[data-theme-toggle]` | `.btn-ink` square, stroke sun/moon swapped by `data-theme` |
| Marquee | `Marquee.astro` | Ink strip, mono items, accent square separators |
