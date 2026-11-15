# fabio.sh — Design System (v8, emerald mosaic, dark + light)

v8 turns the v7 warm poster into an "emerald mosaic" system inspired by
mistral.ai's stacked color blocks: an ivory canvas, a mint secondary
surface, near-black ink, one turquoise accent family (emerald-500 `#10B981`
in fills and the block ramp, emerald-700 `#047857` for text-level accent so
body copy stays AA on ivory), emerald-tinted hard offset shadows,
weight-400 display type (Black reserved for the hero), and the signature
mistral-style color blocks: mini-mosaic markers in the nav brand and every
section head, tiled divider stripes between sections, and one big brand
moment per page. The `data-theme`
dark/light system stays: dark mode flips to a deep green-black canvas with
mint ink and emerald-400 `#34D399`. Every tint still derives from
`--ink-rgb` / `--paper-rgb`, so one attribute flip re-themes borders,
washes, shadows, scrollbar, selection and caret.

## 1. Site audit — every route and its fate

### Public pages
| Route | What it is | v8 decision |
|---|---|---|
| `/` (index) | Hero + marquee + bento project teaser + contact form | Hero: stacked `FABIO` / outlined `GSCHEWIDL`, Black only here (hero moment), accent caret, rotated accent sticker with stepped pixel corners, mosaic F mark (`.f-mosaic`, 6x6 emerald-ramp tiles cascading in), cursor-reactive pixel field behind the hero (`.hero-field` canvas), chunky CTAs. One marquee strip under the hero (`.marquee`, the only one on the site). Bento teaser (`.bento-grid`: first card 2x2 with mini-mosaic tick, "all projects" tile). Tiled divider (`.divider-tiles`) between the projects and contact sections. Fixed tiled sunset stripe (`.sunset-stripe`, hard-stop color tiles) at the very bottom of the index page only |
| `/projects` | Filterable project grid/list, scrollspy rail | Mosaic header strip above the title; fixed left `.rail` (2xl+) with the active section marked. `.card` blocks with 2px ink borders; hover lifts 4px with a 10px emerald hard shadow and reveals the image through a ramp tile overlay (`.tile-overlay`); project cards additionally invert (`.card-invert`: ink bg, paper type, accent shadow). Upcoming/finished rows sit in one 2px ink frame (`.list-frame`) with a mono index tile per row (`.row-idx`, accent fill + accent edge bar on hover), separated by `.divider-tiles`. Active filter = accent chip |
| `/about` | Bio + Tidal now-playing + status | Article measure (`.measure`, max 68ch), bio as `.pull-quote` bordered block on mint, mounted portrait in `.img-pixel` (2px ink + emerald 8px offset shadow) |
| `/contact` | Contact form page | `.field` 2px border, focus = ink border + 4px accent hard shadow; `.banner` status with 2px border + emerald hard shadow |
| `/courses` | Course progress cards | Cards inherit; `.progress` is a 10px ink-framed bar with accent fill |
| `/cv` | Gated CV viewer (iframe) | `.tab-pixel` active tab gets a 3px accent underline |
| `/social` | ATProto feed embeds | Restyled cards inherit the 2px system |
| `/mediakit` | Brand assets | Palette lists the v8 tokens incl. emerald-500 and the block ramp swatch; type list leads with Andes Neue Book (400), Black marked "hero only" |
| `/404` | Error page | Giant `404` in Book with 2px stroke outline over a cascading 6x6 `.f-mosaic`, chunky `.btn` back link |

All subpages (/projects, /about, /contact, /courses, /social, /cv, /mediakit) open with the `.mosaic-head` strip above the page title.
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
--paper:  #FFFAEB            --paper:  #0A1512   (deep green-black canvas)
--ink:    #1F1F1F            --ink:    #E6FBF2  (mint ink)
--accent: #047857            --accent: #34D399   (emerald-700 text accent on ivory /
                                            emerald-400 on the dark canvas)
--on-accent: #F2FBF7         --on-accent: #052018
--popover: #FFFFFF           --popover: #12211C  (pure white: popovers only, light)
--shadow: #0B5C40            --shadow: #0E5C41   (emerald/ink mix, hard offsets)
--surface:#E9F7F0            --surface:#12211C
--raised: #DCF1E6            --raised: #17291F
--divider:#CBE7D8            --divider:#234237
--grad-block: linear-gradient(90deg, #A7F3D0, #6EE7B7, #34D399, #10B981, #059669, #047857)
ink tints: 05/10/15/20/30/40/80 derived from --ink-rgb (31 31 31 / 230 251 242)
```

One accent family, locked everywhere: emerald-500 `#10B981` carries fills
and the block ramp; emerald-700 `#047857` carries text-level accent on the
light canvas (AA contrast on ivory); emerald-400 `#34D399` does both jobs
on the dark canvas. Accent is spent only on: selection, focus-visible
outline, link hover, list bullets, caret, active chips/tabs, the sticker,
marquee separators, the online status marker, primary `.btn-solid`, focus
shadow on `.field`, and the invert hover shadow on project cards.
The block ramp is a brand moment, never a text fill or a content wash: on
the index page it appears as the mosaic hero F (`.f-mosaic` tiles sampling
the ramp diagonally) and as the fixed bottom sunset stripe (`.sunset-stripe`,
hard-stop 12px tiles of the same ramp); no other page uses it.

`<meta name="color-scheme" content="light dark">` plus `color-scheme` on
`:root`/`[data-theme="dark"]` keeps form controls and scrollbars
native-correct. A pre-paint inline script in every layout sets `data-theme`
from localStorage or `prefers-color-scheme`; the nav toggle flips and
persists it.

## 3. Type scale

Self-hosted Andes Neue: four faces in `public/fonts/`, all preloaded in
`default.astro` (Light 300, Book 400, Medium 500, Black 900). ExtraLight and
Bold were dropped in the v8 perf pass — no family/class ever referenced them,
and `.font-bold` / `.font-semibold` synthesize from the inherited face, so
rendered output is unchanged while ~88 KB of unused woff2 is no longer
preloaded. Hierarchy is carried by size and color, not weight; maximum two
font families (only Andes Neue is loaded).

| Role | Face | Weight | Notes |
|---|---|---|---|
| Hero display (index `h1` only) | `AndesNeueBlack` | 900 | `.font-black` on the hero; `clamp`-scale, `-0.02em`+, uppercase |
| Display (h1/h2 elsewhere, `.h-display`, `.wordmark`, 404, preview indexes) | `AndesNeueBook` | 400 | `letter-spacing: -0.02em`, `text-transform: uppercase`, `line-height: 0.85–1.1` |
| Body | `AndesNeueBook` | 400 | `1rem / 1.6` |
| Emphasis | `AndesNeueLight` / `AndesNeueMedium` | 300 / 500 | paragraphs and nav labels |
| Labels / meta / chips / buttons / tabs | `ui-monospace` stack | 400 | `0.66–0.72rem`, uppercase, `letter-spacing: 0.14–0.25em` |
| Outlined display | `.text-outline` | 400 (900 in hero) | transparent fill, `2px` `-webkit-text-stroke` ink |

Classes: `.font-black`, `.font-display`, `.font-book`, `.font-andesNeueLight`,
`.font-andesNeueMedium`, `.font-mono`, `.text-outline`. All four faces are
preloaded in `default.astro`.

## 4. Motifs

- **Viewport frame** — `.page-frame`: one fixed `2px solid var(--ink)` rule,
  inset 10px / 6px mobile, around the whole page. No corner blocks. The
  desktop header and mobile nav are opaque `z-50` and sit above the frame
  (`z-40`), so the frame's top rule never crosses the nav items; the
  header's own 2px bottom border reads as the frame's top segment.
- **Mini mosaic** — `.mini-mosaic`: 3x3 diagonal sample of the block ramp,
  one element with nine solid 6px layers. Sits in the nav brand next to
  the Loader F and as the corner tick on preview cards. As a real tile
  grid (`MiniMosaic.astro` → `.mini-mosaic-grid`) it marks every
  `.section-head` and each tile pops with a diagonal stagger when the
  head reveals on scroll (armed by the global `.reveal`/`.in` observer;
  visible statically without JS).
- **Mosaic header strip** — `.mosaic-head` (`MosaicHead.astro`): 12x2 ramp
  strip above the title of every subpage (/projects, /about, /contact,
  /courses, /social, /cv, /mediakit), tiles cascading in on load with
  `animate-pop` delays. The 404 page instead puts a 6x6 `.f-mosaic`
  behind the outline number.
- **Section head** — `.section-head`: MiniMosaic + mono accent index +
  title over a 2px ink rule (1rem above the rule, 3rem below it to the
  content); `.section-head::after` paints an accent segment over the
  left 4.5rem of that rule.
- **Vertical rhythm** — index sections breathe at 5rem mobile / 8rem
  desktop (`mt-20 md:mt-32`, `my-20 md:my-32` on `.divider-tiles`,
  `pb-32` on the last section); `.mosaic-head` sits `mb-12` above
  subpage titles; the contact card is `p-8 md:p-16` with `space-y-10`
  field spacing and a 6-row message field.
- **Bento teaser** — `.bento-grid` + `.bento-big` on the index: the first
  preview card spans 2x2 (bigger outline number + type), the rest fill a
  4-column grid, closed by an "all projects" link tile.
- **Image tile-reveal** — `.tile-img` + `.tile-overlay` on project card
  images: an 18-tile ramp overlay scales out staggered on hover/focus,
  revealing the color image beneath. Hidden entirely on touch devices
  and under `prefers-reduced-motion`.
- **Scrollspy rail** — `.rail` on /projects (2xl+ only): fixed left rail
  with the section index; the section in view gets an accent square
  (IntersectionObserver in `default.astro`).
- **Tiled dividers** — `.divider-tiles`: full-bleed 8px strip of the same
  hard-stop ramp tiles as `.sunset-stripe`, between major sections (index,
  /projects) and as the footer's top rule on every page.
- **Framed lists** — `.list-frame` + `.row-idx`: one 2px ink frame around
  the upcoming/finished project rows; CSS-counter index tile per row
  (fills accent on row hover) and an inset 4px accent edge bar.
- **Wordmark dot** — `.wordmark-dot`: the "." of the footer `fabio.sh`
  wordmark as a block-ramp tile with a 2px ink border.
- **Active nav marker** — `header nav ul a[aria-current="page"]::before`:
  a 6px accent square before the active link's label.
- **Emerald hard offset shadows** — the only elevation: `4px 4px 0` on
  buttons, `10px 10px 0 var(--shadow)` on card hover, accent shadow on
  invert/focus. Shadow color is the emerald/ink mix `--shadow`, never pure
  black; soft shadows (`.shadow-xs`/`.shadow-sm`) use emerald-tinted
  `rgb(16 185 129 / …)`. Buttons press flat on `:active`
  (`translate(3px,3px)`, shadow 0).
- **Block ramp** — `--grad-block` (mint → emerald-300 → emerald-400 →
  emerald-500 `#10B981` → emerald-600 → emerald-700): sampled by the mosaic
  hero F (`.f-mosaic`) and tiled into the fixed index-only `.sunset-stripe`
  (10px bar of hard-stop 12px tiles at the very bottom). Exactly one brand
  moment per page; never as text fill or content wash. `.f-block` keeps the
  slow `grad-pan` for gradient surfaces.
- **Mosaic F** — `.f-mosaic`: 6x6 grid of ramp-colored tiles with 2px ink
  border and hard shadow; tiles pop in diagonally (`animate-pop` with inline
  `animation-delay`, 55ms per diagonal step). Index hero only.
- **Pixel corners** — stepped 4px `clip-path` corners (clips the border at
  the steps, on purpose). System-wide on `.card`, `.btn` and `.field`;
  `.px-corner` opts in anywhere else (hero sticker, hero F mark).
- **Hero pixel field** — `.hero-field`: canvas behind the index hero, 18px
  cells in the emerald ramp light up around the pointer and fade out
  (rAF-throttled, vanilla JS in `Hero.astro`). Static scatter under
  `prefers-reduced-motion`. Index hero only.
- **Sticker** — `.sticker`: rotated (-2deg) accent label, 2px ink border,
  emerald 4px hard shadow, `.px-corner` steps. Used for the hero role label.
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
- **Reading progress** — `.scroll-progress`: 3px accent line fixed at the
  very top, width follows scroll (rAF-throttled, JS in `default.astro`).
- **Motion** (mistral-baseline pass) — entrance rise `fade`
  (`animate-fadeIn_*`, 0.7s ease-out with 0/0.15/0.3s stagger), headline
  line mask reveal (`animate-line-1/2`, clip-path wipe), overshoot pop on
  the hero F mosaic tiles (`scale-in` per `.f-tile` with diagonal stagger),
  slow `grad-pan` on gradient surfaces (`.f-block`), `.dot-live` ripple on
  the online status marker, staggered scroll-hint chevrons in the hero
  (`animate-scroll-hint-1/2/3`), springy overshoot on the
  IntersectionObserver `.reveal`, and a view-transition page rise
  (`transition:name="main-content"` + `vt-page-in`, ClientRouter). All
  animation is disabled under `prefers-reduced-motion` (marquee pauses too).

## 5. Components

| Component | Class | Look |
|---|---|---|
| Button | `.btn` | Mono uppercase label, 2px ink border, px-corner steps, 4px emerald hard shadow; hover sweeps an ink block in from the left (label flips to paper, lift 2px + 6px accent shadow), `:active` presses flat |
| Primary button | `.btn-solid` | Accent bg, `--on-accent` text, ink border + shadow |
| Card | `.card` (+`.card-hover`, `.card-invert`, `.preview-card`) | Paper bg, 2px ink border, px-corner steps; hover lifts 4px with 10px emerald shadow; `.card-invert` inverts to ink bg + accent shadow; `.preview-card` adds a mini-mosaic tick and fills the outline index with accent on hover |
| Chip / filter | `.chip`, `.filter-btn`, `.sort-btn` | Mono label, hairline border; active = accent bg |
| Field | `.field` | 2px `ink-30` border, px-corner steps; focus = ink border + 4px accent hard shadow |
| Section head | `.section-head` | Mini-mosaic + `idx` + title over a 2px ink rule with an accent segment |
| Divider | `.divider-tiles` | Full-bleed 8px strip of hard-stop ramp tiles between sections / above the footer |
| List frame | `.list-frame` + `.row-idx` | 2px ink frame around project rows; mono index tile per row, accent on hover |
| Mini mosaic | `.mini-mosaic` | 3x3 diagonal ramp sample (nine 6px layers), nav brand + preview-card ticks |
| Mini mosaic grid | `MiniMosaic.astro` (`.mini-mosaic-grid`) | Real 3x3 tile grid in every `.section-head`; tiles pop staggered on scroll reveal |
| Mosaic header | `MosaicHead.astro` (`.mosaic-head`) | 12x2 cascading ramp strip above subpage titles |
| Bento grid | `.bento-grid` + `.bento-big` | Index teaser: first card 2x2, 4-column grid, link tile |
| Tile reveal | `.tile-img` + `.tile-overlay` | Ramp overlay on project card images, scales out on hover |
| Rail | `.rail` | Fixed scrollspy section rail on long pages (2xl+) |
| Label | `.label` | Mono uppercase muted |
| Table | `.table-pixel` | 2px ink frame, mono header on surface over 2px ink rule |
| Select | `.select-pixel` | 2px border, chevron caret (SVG data-URI, dark-mode override) |
| Banner | `.banner` | 2px ink border + 6px emerald hard shadow, accent dot |
| Tabs | `.tab-pixel` | Mono, 3px accent underline when active |
| Tooltip | `.tooltip` | Solid ink block, paper mono text |
| Progress | `.progress` | 10px bar, 2px ink frame, accent fill |
| Logo mark | `Loader.astro` | "F" in a solid ink block, 2px border, emerald hard shadow; in the nav it sits next to a `.mini-mosaic` tile (small in nav, `big` in mediakit) |
| Hero F mark | `.f-mosaic` (+`.px-corner`) | 6x6 emerald-ramp tiles, 2px ink border, emerald shadow, diagonal cascade pop (index hero only) |
| Gradient block | `.f-block` | Block ramp bg with slow `grad-pan`, ink border |
| Sunset stripe | `.sunset-stripe` | Fixed 10px bar of hard-stop ramp tiles at the page bottom (index only) |
| Hero pixel field | `.hero-field` | Canvas behind the index hero, pointer-reactive ramp cells (index only) |
| Theme toggle | `[data-theme-toggle]` | `.btn-ink` square, stroke sun/moon swapped by `data-theme` |
| Marquee | `Marquee.astro` | Ink strip, mono items, accent square separators |
