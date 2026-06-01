# Blog Redesign: Brutalist Swiss Manifesto

## Direction

A full rebuild of the personal site along a Brutalist Swiss / Bauhaus axis. Mono-driven, grid-disciplined, deliberately broken in places. A manifesto on the home page, content pushed into secondary pages. The aesthetic positions the author as a systems-builder who treats his work — and his writing — as a published artifact.

This replaces the 2026-03-13 editorial aesthetic. The change is committed, not iterative: every page, every CSS rule, every build-script template is rewritten.

## Information Architecture

### Top-level navigation (4 entries)

1. `/` — home (manifesto)
2. `/writing/` — chronological writing index
3. `/index/` — site-wide index with three views (time, tags, categories)
4. `/about/` — long-form about

### Pages kept but pushed off the nav

- `/bangumis/` and `/Gallery/` — archived collections, single-list layout, no nav entry
- `/categories/<x>/` and `/tags/<x>/` — per-category and per-tag pages
- Each post at `/YYYY/MM/DD/<slug>/`

### Pages removed

- `/archives/...` — superseded by `/index/`
- `/blog/page/N/...` and `/categories/.../page/N/...` (kept only if category has >30 posts)

### Home page shrinkage

Home page keeps only four elements:

- mono label `// LLM SYSTEMS ENGINEER / WU, JIAGE`
- `<h1>` manifesto (three lines, second line in red)
- small meta line `吴佳翮 · Guangzhou · 2026`
- mono `now` line summarising current focus

Removed: 4-panel About/Now grid, 3-card Selected Work, Experience timeline, standalone Contact section. All of these move to `/about/`.

## Design System

### Typography

- **Primary**: JetBrains Mono (400 / 500 / 700) — used for everything except long article body
- **Secondary**: Inter (400 / 600 / 900) — used for `<article>` body in posts only, and as occasional "reverse accent"
- No other typefaces

### Type scale

```
--fs-display:  clamp(3rem, 9vw, 7.5rem)   /* home h1 */
--fs-h1:       clamp(2.25rem, 5vw, 4rem)
--fs-h2:       clamp(1.5rem, 3vw, 2.25rem)
--fs-h3:       1.25rem
--fs-body:     1rem
--fs-small:    0.8125rem
--fs-meta:     0.75rem                   /* uppercase 0.12em tracking */
```

Line heights: `display 0.95`, `h1-h2 1.05`, `h3 1.2`, `body 1.6`, `article 1.6`.

### Color

```
--ink:     #0a0a0a
--paper:   #f5f3ee      /* off-white, no pure #fff */
--rule:    #1a1a1a      /* for 1px rules */
--red:     #dc2626
--red-soft:#fef2f2
--red-hover:#b91c1c
```

No greys, no shadows, no gradients, no rounded corners. All separation by 1px solid lines.

### Grid

- 12 columns, zero gutter, max-width 1440px
- 32px page padding (6vw on mobile)
- Spacing on 8px baseline
- Body content 68ch (~720px); home h1 may span 9 of 12 columns
- Deliberate breaks: blockquote may extend to 14-column visual width; chapter numerals on about may bleed past left margin

### Motion

- Removed: `data-reveal` fade-in, button `translateY(-1px)`, underline animation
- Kept: 120ms color transition on links, smooth scroll for in-page anchors
- `prefers-reduced-motion` is naturally satisfied

### Components

- **Nav**: sticky, `border-bottom: 1px solid var(--ink)`, 4 items. Current page = red background, white text, no transition
- **Footer**: single line, left-aligned, no tagline
- **Button**: 4px corner radius (single "broken" radius allowed), 1px border, hover inverts
- **Tag / chip**: text only, with top/bottom underline
- **Blockquote**: `border-left: 3px solid var(--red)`, large internal padding, no background
- **Code block**: 1px border, paper-tinted background
- **Inline code**: mono with no background, 1px underline in `--ink`

### What is not built

- No dark mode
- No theme switcher
- No new dependencies
- No new font providers (Google Fonts is sufficient)
- No animation library

## Per-page Design

### Home `/`

```
┌─────────────────────────────────────────────────────────────┐
│ nav                                                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  // LLM SYSTEMS ENGINEER                                     │
│  WU, JIAGE                                                    │
│                                                              │
│  I BUILD                                                      │
│  LANGUAGE TOOLS                                              │  ← red
│  AND AGENT SYSTEMS.                                          │
│                                                              │
│  吴佳翮 · Guangzhou · 2026                                   │
│  ─────────────────────                                       │
│  /now — designing the Wuu language · shipping v0.2 of LLMux  │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ © 2026 吴佳翮 · lpageo@163.com · github                       │
└─────────────────────────────────────────────────────────────┘
```

- `min-height: 92vh`, content biased to upper 30%
- 9/12 column span; right 3 columns intentionally empty

### Writing `/writing/`

```
WRITING                                          47 posts
─────────────────────────
2026
─────
01/18  AI AGENT 与白领工作流的重构       /tags/essay
12/28  GO 进阶语法                       /tags/go
12/28  GO GMP 模型                       /tags/go
...

2025
─────
...
```

- Year heading in red as visual anchor
- Each line: `MM/DD` (mono meta) + title (mono) + tags (mono small, dim)
- No excerpt, no "read more", no card
- Top link `→ /index/` to switch view
- Empty categories are not generated

### Post `/YYYY/MM/DD/<slug>/`

```
← writing
2025 · 12 · 28
GO 进阶语法
3 min read · go · 语言基础
───────────────
[article body — Inter 400, 68ch, line-height 1.6]
h2 in mono, 24px, 3em top margin
blockquote: 3px red left line
code: 1px border + paper-tint background
───────────────
← prev: 文章标题      next: 文章标题 →
```

- No data-reveal, no animation
- Article body uses Inter (the one Inter exception per design system)
- Prev/next rendered when neighbours exist

### About `/about/`

Single column, 68ch, four anchor sections:

1. `01` self-introduction (one paragraph)
2. `02` `#work` — selected projects, full-width single-card list, more description than home page version
3. `03` `#experience` — vertical timeline
4. `04` `#contact` — email / github / how to reach

Chapter numerals are large mono (`01 ─`), left-bleeding past the column edge as a deliberate grid break.

No sidebar, no images, no social buttons.

### Index `/index/`

Three independent HTML pages with tab-style nav at top:

- `/index/index.html` — chronological, full list
- `/index/tags.html` — by tag, with post counts
- `/index/categories.html` — by category, with post counts

Top tabs: `WRITING · TAGS · CATEGORIES` with current item red.

### Bangumis / Gallery

Each is a single-column list with a `// archived collections` mono label. Reuses the global layout, no per-page CSS.

### Categories / Tags

Reuse writing-index layout but without year grouping. `categories/<x>/page/N/` preserved for categories with >30 posts.

## Build Pipeline

### Path changes

| Old | New |
|-----|-----|
| `blog/index.html` | `writing/index.html` |
| `blog/posts.json` | `writing/posts.json` |
| (none) | `index/index.html`, `index/tags.html`, `index/categories.html` |
| `archives/...` | deleted |
| `blog/page/N/...` | deleted |
| `js/main.mjs` | deleted or reduced to <200 bytes |
| `js/parallax.mjs` | already deleted |
| `css/var.css` | merged into `css/style.css` |
| `css/index.css`, `css/recommend.css`, `css/custom.css` | merged or deleted |

### `scripts/build-blog.mjs` changes

1. `renderLayout` template replaced: 4-item nav, current-page marker, new footer, no `data-reveal`
2. `renderPost` adds prev/next logic (sorted posts, neighbours by date)
3. `renderBlogIndex` renamed `renderWriting`, output path `writing/`, year heading as `<h2>`, red class
4. `renderIndex` (new) — three-view index page generation
5. `extractExcerpt` removed from post render (frontmatter can still hold excerpt; we just don't render it)
6. `writePosts` path unchanged
7. `writePostsIndex` renamed, output `index/posts.json` (optional data feed; static site does not require it)
8. `main` flow: posts + writing + index-three-views + categories + tags, no archives, no blog pagination

### Markdown parsing

Unchanged. `marked` + existing frontmatter helpers stay.

### Tests

- `scripts/parallax-config.test.mjs` — delete (parallax removed)
- `scripts/homepage.test.mjs` — rewrite assertions for new home structure (manifesto h1, /now line, no panels)
- `scripts/homepage-links.test.mjs` — assert 4-item nav, footer has 3 links
- `scripts/homepage-focus.test.mjs` — assert /now line is present and matches about page
- New: `scripts/writing-index.test.mjs` — assert year grouping, no excerpt, /index/ link present
- New: `scripts/post-prev-next.test.mjs` — assert prev/next rendering on sample posts

## Content Changes

### Static pages rewritten

- `index.html` (home) — full rewrite to manifesto template
- `about/index.html` — full rewrite to 4-section long form
- `bangumis/index.html` and `Gallery/index.html` — minimal list layout

### Generated by build script

- `writing/index.html`
- `index/index.html`, `index/tags.html`, `index/categories.html`
- All post pages at `/YYYY/MM/DD/<slug>/index.html`
- All category and tag pages

### Copy

- Home h1: `I BUILD / LANGUAGE TOOLS / AND AGENT SYSTEMS.`
- Home /now line: shared with about page `#now` field (single source of truth)
- About long form: reorganised existing material into 4 anchors; **no fabricated experience**
- Page titles and meta descriptions updated to match new information architecture

### Frontmatter

No structural change. Tags may be tightened for precision (e.g. `go` vs `语言基础`).

## Release Strategy

1. Build script changes land first; regenerated HTML is functional but visually unchanged
2. CSS rewrite lands; site becomes the new design
3. Content rewrites (home, about) land; build script regenerated content follows
4. Each step is its own commit with tests passing
5. Final: verify locally by running build, opening key pages, checking responsive breakpoints
6. Push to main; Pages deploys automatically via the existing CNAME

## Out of scope (explicit)

- RSS / sitemap.xml
- Search functionality
- Dark mode
- Multi-language
- Server-side rendering
- New build tools (esbuild, vite, etc.)
- Comments / interactions
- Analytics integration

## Risk Notes

- **Mono for headings** is divisive: some readers find it harder to scan. Mitigation: large display sizes (3rem+) and tight line-height (0.95) keep it readable.
- **No card UI anywhere** may feel austere on mobile. Mitigation: keep generous line-height (1.6) and 6vw padding.
- **Red used only once on home** is high-risk if the rest of the site feels monochrome. Mitigation: use red as the recurring "current/active/here" signal in nav and year headings throughout.
