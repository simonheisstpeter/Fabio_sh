# fabio.sh — Design System (v6, constructivist poster, dark + light)

v6 replaces the quiet v5 editorial look with a constructivist poster system:
2px ink borders, hard offset block shadows, Andes Neue Black display type,
mono micro-labels, rotated sticker chips, one marquee strip, and a single
electric-blue accent. The `data-theme` dark/light system stays: dark mode
inverts paper and ink, the accent brightens for contrast. Every tint still
derives from `--ink-rgb` / `--paper-rgb`, so one attribute flip re-themes
borders, washes, shadows, scrollbar, selection and caret.

## 1. Site audit — every route and its fate

### Public pages
| Route | What it is | v6 decision |
|---|---|---|
| `/` (index) | Hero + marquee + project teaser + contact form | Hero: stacked `FABIO` / outlined `GSCHEWIDL` in Black at 17vw/12rem, accent caret, rotated accent sticker (`\ digital media & IT`), solid ink F block, chunky CTAs. One marquee strip under the hero (`.marquee`, the only one on the site) |
| `/projects` | Filterable project grid/list | `.card` blocks with 2px ink borders; hover lifts 4px with a 10px hard shadow; project cards additionally invert (`.card-invert`: ink bg, paper type, accent shadow). Rows get 2px `ink-20` dividers; active filter = accent chip |
| `/about` | Bio + Tidal now-playing + status | `.img-pixel` mounted frame is now 2px ink + 8px offset shadow |
| `/contact` | Contact form page | `.field` 2px border, focus = ink border + 4px accent hard shadow; `.banner` status with 2px border + hard shadow |
| `/courses` | Course progress cards | Cards inherit; `.progress` is a 10px ink-framed bar with accent fill |
| `/cv` | Gated CV viewer (iframe) | `.tab-pixel` active tab gets a 3px accent underline |
| `/social` | ATProto feed embeds | Restyled cards inherit the 2px system |
| `/mediakit` | Brand assets | Palette adds Accent `#2B3FF0` (dark `#8A94FF`); type list leads with Andes Neue Black |
| `/404` | Error page | Giant `404` in Black with 2px stroke outline, chunky `.btn` back link |
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

## 2. Tokens

```
light (:root)                dark (html[data-theme="dark"])
--paper:  #FFFFFF            --paper:  #0A0A0A
--ink:    #0A0A0A            --ink:    #F2F2F2
--accent: #2B3FF0            --accent: #8A94FF   (brighter for black canvas)
--on-accent: #FFFFFF         --on-accent: #0A0A0A
--surface:#F5F5F5            --surface:#161616
--raised: #ECECEC            --raised: #1F1F1F
--divider:#E2E2E2            --divider:#2A2A2A
ink tints: 05/10/15/20/30/40/80 derived from --ink-rgb (10 10 10 / 242 242 242)
```

Accent is spent only on: selection, focus-visible outline, link hover, list
bullets, caret, active chips/tabs, the sticker, marquee separators, the
online status marker, primary `.btn-solid`, focus shadow on `.field`, and
the invert hover shadow on project cards. One accent, locked everywhere.

`<meta name="color-scheme" content="light dark">` plus `color-scheme` on
`:root`/`[data-theme="dark"]` keeps form controls and scrollbars
native-correct. A pre-paint inline script in every layout sets `data-theme`
from localStorage or `prefers-color-scheme`; the nav toggle flips and
persists it.

## 3. Type scale

Self-hosted Andes Neue (all weights in `public/fonts/`):

| Role | Face | Weight | Notes |
|---|---|---|---|
| Display (h1/h2, `.h-display`, `.wordmark`, hero, 404) | `AndesNeueBlack` | 900 | `letter-spacing: -0.03em`, `text-transform: uppercase`, `line-height: 0.85–1.1` |
| Body | `AndesNeueLight` | 300 | `line-height: 1.5` |
| Emphasis | `AndesNeueMedium` | 500 | nav labels fallback |
| Labels / meta / chips / buttons / tabs | `ui-monospace` stack | 400 | `0.66–0.72rem`, uppercase, `letter-spacing: 0.14–0.25em` |
| Outlined display | `.text-outline` | 900 | transparent fill, `2px` `-webkit-text-stroke` ink |

Classes: `.font-black`, `.font-display`, `.font-andesNeueLight`,
`.font-andesNeueMedium`, `.font-mono`, `.text-outline`. Black is preloaded in
`default.astro`.

## 4. Motifs

- **Viewport frame** — `.page-frame`: one fixed `2px solid var(--ink)` rule,
  inset 10px / 6px mobile, around the whole page. No corner blocks.
- **Hard offset shadows** — the only elevation: `4px 4px 0` on buttons,
  `10px 10px 0 var(--ink)` on card hover, accent shadow on invert/focus.
  Buttons press flat on `:active` (`translate(3px,3px)`, shadow 0).
- **Sticker** — `.sticker`: rotated (-2deg) accent label, 2px ink border,
  4px hard shadow. Used for the hero role label.
- **Marquee** — `.marquee`: ink strip with 2px ink rules, mono uppercase
  items separated by accent squares, `translateX(-50%)` loop. Exactly one
  per page (index only); static under `prefers-reduced-motion`.
- **Square markers** — `.dot` status markers are squares with an ink border;
  list bullets are accent squares.
- **Outlined display text** — `.text-outline`: 2px stroke (hero surname,
  preview-card index numbers, 404).
- **Caret** — `.caret` + `.animate-blink`: 0.06em accent bar, `steps(1)`.
- **Selection** — accent bg, `--on-accent` text; **scrollbar** — 8px,
  `ink-30` thumb.
- **Motion** — 150–500ms eases, fade/slide-in hero (`animate-fadeIn_*`),
  IntersectionObserver `.reveal`; all disabled under
  `prefers-reduced-motion`.

## 5. Components

| Component | Class | Look |
|---|---|---|
| Button | `.btn` | Mono uppercase label, 2px ink border, 4px hard shadow; hover lifts 2px with 6px accent shadow, `:active` presses flat |
| Primary button | `.btn-solid` | Accent bg, `--on-accent` text, ink border + shadow |
| Card | `.card` (+`.card-hover`, `.card-invert`) | Paper bg, 2px ink border; hover lifts 4px with 10px ink shadow; `.card-invert` inverts to ink bg + accent shadow |
| Chip / filter | `.chip`, `.filter-btn`, `.sort-btn` | Mono label, hairline border; active = accent bg |
| Field | `.field` | 2px `ink-30` border; focus = ink border + 4px accent hard shadow |
| Label | `.label` | Mono uppercase muted |
| Table | `.table-pixel` | 2px ink frame, mono header on surface over 2px ink rule |
| Select | `.select-pixel` | 2px border, chevron caret (SVG data-URI, dark-mode override) |
| Banner | `.banner` | 2px ink border + 6px hard shadow, accent dot |
| Tabs | `.tab-pixel` | Mono, 3px accent underline when active |
| Tooltip | `.tooltip` | Solid ink block, paper mono text |
| Progress | `.progress` | 10px bar, 2px ink frame, accent fill |
| Logo mark | `Loader.astro` | "F" in a solid ink block, 2px border, hard shadow (small in nav, `big` in mediakit) |
| Theme toggle | `[data-theme-toggle]` | `.btn-ink` square, stroke sun/moon swapped by `data-theme` |
| Marquee | `Marquee.astro` | Ink strip, mono items, accent square separators |
