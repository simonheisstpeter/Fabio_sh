# fabio.sh — Design System (v5, elegant monochrome editorial, dark + light)

v5 retires the pixel/brutalist v4 look (Handjet display face, checkerboards,
pixel strips, clip-path corner cuts, hard offset block shadows) in favor of a
quiet, editorial monochrome system: hairline ink rules on paper, Andes Neue
display type with tight tracking, mono micro-labels, soft shadows and generous
whitespace. The `data-theme` dark/light system from v4 stays — every tint
still derives from `--ink-rgb` / `--paper-rgb`, so one attribute flip
re-themes borders, washes, shadows, scrollbar, selection and caret.

## 1. Site audit — every route and its fate

### Public pages
| Route | What it is | v5 decision |
|---|---|---|
| `/` (index) | Hero + project teaser + contact form | Hero in ExtraLight display type with 1px-stroke outlined surname and a thin blinking caret; mono meta row (status // Vienna // time) |
| `/projects` | Filterable project grid/list | `.card` hairline blocks with soft hover lift; mono chips/filters |
| `/about` | Bio + Tidal now-playing + status | `.img-pixel` mounted-cover frame (hairline + paper padding) |
| `/contact` | Contact form page | `.field` hairline inputs (ink ring on focus), outlined `.banner` status |
| `/courses` | Course progress cards | Cards + thin 3px progress bars |
| `/cv` | Gated CV viewer (iframe) | Tab underline in mono |
| `/social` | ATProto feed embeds | Restyled cards, mounted avatars |
| `/mediakit` | Brand assets | Palette + type entries updated to the v5 system (no pixel font) |
| `/404` | Error page | Outlined `404` in ExtraLight, 1px stroke, no backdrop block |
| `/llms.txt`, `/robots.txt`, `/sitemap.xml`, `/.well-known/atproto-did` | Machine-readable | Untouched |

### Admin (internal, same system)
`/admin`, `/admin/login`, `/admin/register`, `/admin/projects[/new|/id]`,
`/admin/courses[...]`, `/admin/submissions`, `/admin/cv` — same tokens;
`.table-pixel` now has a mono header over an ink rule instead of a solid
black header row.

### API routes — untouched (no visual impact)

### Standing decisions carried over
1. **Custom cursor `f.cur`** — kept (brand mark, monochrome-safe), fine
   pointers only; falls back to `pointer` in dark mode and on touch.
2. **Umami analytics + console easter egg** — invisible on the page, kept.
3. **Novelty locales `en-x-*`** — kept (excluded from sitemap).
4. **Green Web badge** — mono text chip, monochrome.

## 2. Tokens

```
light (:root)                dark (html[data-theme="dark"])
--paper:  #FFFFFF            --paper:  #0A0A0A
--ink:    #0A0A0A            --ink:    #F2F2F2
--surface:#F5F5F5            --surface:#161616
--raised: #ECECEC            --raised: #1F1F1F
--divider:#E2E2E2            --divider:#2A2A2A
--muted:  #444/#666/#8A      --muted:  #C4/#9C/#7D
ink tints: 05/10/15/20/30/40/80 derived from --ink-rgb (10 10 10 / 242 242 242)
```

`<meta name="color-scheme" content="light dark">` plus `color-scheme` on
`:root`/`[data-theme="dark"]` keeps form controls and scrollbars
native-correct. A pre-paint inline script in every layout sets `data-theme`
from localStorage or `prefers-color-scheme`; the nav toggle (stroke sun/moon
icons, desktop + mobile) flips and persists it.

## 3. Type scale

Self-hosted Andes Neue (all weights already in `public/fonts/`):

| Role | Face | Weight | Notes |
|---|---|---|---|
| Display (h1/h2, `.h-display`, hero, wordmark, 404) | `AndesNeueExtraLight` / `AndesNeueLight` | 200–300 | `letter-spacing: -0.03em`, `line-height: 0.9–1.1` |
| Body | `AndesNeueLight` | 300 | `line-height: 1.5` |
| Emphasis | `AndesNeueMedium` | 500 | nav wordmark, buttons fallback |
| Labels / meta / chips / buttons / tabs | `ui-monospace` stack | 400 | `0.66–0.72rem`, uppercase, `letter-spacing: 0.14–0.2em`, `--muted2` |

Classes: `.font-display`, `.font-extralight`, `.font-book`, `.font-mono`,
`.font-andesNeueLight`, `.font-andesNeueMedium`. The pixel faces (Silkscreen,
Handjet) are fully removed — no `@font-face`, no preload, no files.

## 4. Motifs

- **Viewport frame** — `.page-frame`: one fixed hairline (`1px solid
  var(--ink-10)`, inset 10px / 6px mobile) around the whole page, like a
  print margin rule. No corner blocks, no edge strips.
- **Hairline rules** — `border-divider` / `border-ink` 1px lines structure
  header, footer, section heads (`.section-head` = mono index + display
  title over an ink rule), tables, tabs.
- **Outlined display text** — `.text-outline`: transparent fill, 1px
  `-webkit-text-stroke` in ink (hero surname, 404).
- **Thin caret** — `.caret` + `.animate-blink`: 0.06em ink bar blinking with
  `steps(1)` in the hero.
- **Soft elevation only** — hover lifts use
  `box-shadow: 0 16px 40px rgb(var(--ink-rgb) / 0.08)`; hard offset block
  shadows are gone.
- **Selection** — inverted ink/paper; **scrollbar** — 8px, `ink-30` thumb.
- **Motion** — 200–500ms eases, fade/slide-in hero (`animate-fadeIn_*`),
  IntersectionObserver `.reveal`; all disabled under
  `prefers-reduced-motion`.

## 5. Components

| Component | Class | Look |
|---|---|---|
| Button | `.btn` / `.btn-solid` | Mono uppercase label, 1px ink border, inverts on hover, no radius, no clip-path |
| Card | `.card` (+`.card-hover`) | Surface bg, hairline border, lifts 3px with soft shadow on hover |
| Chip / filter | `.chip`, `.filter-btn`, `.sort-btn` | Mono pill, hairline border; active = solid ink |
| Field | `.field` | Hairline `ink-30` border; focus = ink border + 1px ring |
| Label | `.label` | Mono uppercase muted |
| Table | `.table-pixel` | Mono header over 1px ink rule, hairline rows |
| Select | `.select-pixel` | Thin chevron caret (SVG data-URI, dark-mode override) |
| Banner | `.banner` | Outlined ink status line with dot |
| Tabs | `.tab-pixel` | Mono, 1px ink underline when active |
| Tooltip | `.tooltip` | Solid ink block, paper mono text |
| Logo mark | `Loader.astro` | "F" in a hairline square (small in nav, `big` in mediakit) |
| Theme toggle | `[data-theme-toggle]` | Stroke sun/moon SVGs, `.icon-sun`/`.icon-moon` swapped by `data-theme` |
