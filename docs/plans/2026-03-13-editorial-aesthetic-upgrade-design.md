# Editorial Aesthetic Upgrade Design

## Direction

Transform the blog from a tech-forward parallax portfolio into a refined editorial/magazine aesthetic. Prioritize typography rhythm, whitespace, and restraint over decorative visual effects.

## Color System

```css
--bg:            #f6f3ed     /* warm white paper */
--bg-secondary:  #edeae4     /* light warm gray */
--ink:           #1a1816     /* near-black brown */
--muted:         #6b665e     /* medium warm gray */
--accent:        #a63d20     /* muted brick red */
--accent-hover:  #8b3118     /* deep brick red */
--sand:          #c4b9a6     /* divider lines */
--border:        rgba(26,24,22, 0.08)
```

Remove `--teal`, `--accent-strong`, `--shadow`. Single accent color throughout.

## Typography

- **Fraunces** (serif): all headings, hero name, logo
- **Space Grotesk** (sans): body text, nav links, meta (weights 400/500 only)
- **Monospace**: dates and tags only
- Body: `1.08rem`, `line-height: 1.85`
- Content max-width: `720px` (lists), `680px` (articles)

## Navigation

- Sticky, solid `var(--bg)` background, no blur/glassmorphism
- Bottom border: `1px solid var(--sand)`
- Logo: Fraunces serif, normal case (not monospace uppercase)
- Link hover: color change to `var(--accent)`, no underline animation

## Homepage Hero

- Remove all parallax background layers (ambient-field, hero-bg, orbs, rings, beams)
- Remove `body::before` (grid overlay) and `body::after` (fixed gradient)
- Body background: solid `var(--bg)`
- Centered single-column layout, `max-width: 720px`, `text-align: center`
- hero-card becomes inline list below hero content, separated by thin line
- Buttons: `border-radius: 4px` (square), not pills
- `min-height: 80vh`

## Homepage Sections

- Remove all `section-decor` elements and parallax attributes
- Sections separated by `border-top: 1px solid var(--sand)`
- Section headers: vertical stack (title above subtitle)
- All content `max-width: 720px; margin: 0 auto`

### About/Now
- Panels: remove card styling (no border, shadow, background, radius), plain 2x2 grid

### Selected Work
- From 3-column card grid to single-column list with thin line dividers
- Project title in Fraunces, tags with `background: var(--bg-secondary)` only
- Hover: background tint + title turns accent color

### Experience
- Keep timeline left-border structure, line color `var(--sand)`

### Contact
- Remove card styling, plain two-column text layout
- Email/GitHub emphasized with `var(--accent)`

### Footer
- `© 2026 吴佳翮`, remove tagline

## Blog Listing Page

- Single column, no sidebar
- Posts grouped by year (year as Fraunces heading)
- Each post: fixed-width date (monospace) + title on one line
- Tags below title, small muted
- Remove excerpt
- Remove card styling entirely
- Hover: title turns accent color
- `max-width: 720px`

## Article Page

- `max-width: 680px`
- Body text color: `var(--ink)` (not muted gray)
- `font-size: 1.08rem; line-height: 1.85`
- h2: `margin-top: 2.5em; margin-bottom: 0.6em`
- Blockquote: left 3px accent line + left padding only, no background/radius
- Code block: `var(--bg-secondary)`, `border-radius: 6px`, no border
- Links: `var(--accent)` + underline
- No reveal animations on article content

## Animation

### Keep
- `data-reveal` fade-in on homepage sections (`translateY(12px)`)
- Nav link hover color transition
- Button hover `translateY(-1px)`
- Project row hover background transition

### Remove
- Entire parallax system (parallax.mjs import, all parallax code in main.mjs)
- All ambient/orb/ring/beam/section-decor CSS
- `.is-lite` performance mode
- `body::before`, `body::after` overlays
- Custom colored scrollbar

### main.mjs
- Strip to ~30 lines: only reveal IntersectionObserver + reduced-motion check

## Responsive

- 900px breakpoint preserved
- Mobile nav: vertical stack (unchanged)
- Blog list date+title: stack vertically on narrow screens
- Article page: `padding: 0 6vw` on mobile

## Build Script Changes

- `renderBlogIndex`: output year-grouped list, remove sidebar HTML, remove excerpt
- `renderPost`: narrower max-width, remove data-reveal
- Layout template: sync new nav style
