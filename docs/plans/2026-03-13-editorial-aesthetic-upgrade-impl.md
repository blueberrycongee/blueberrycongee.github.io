# Editorial Aesthetic Upgrade — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the blog from a tech-forward parallax portfolio into a refined editorial/magazine aesthetic with typography-driven design.

**Architecture:** Pure CSS + HTML changes. Rewrite `css/style.css` with new design tokens and editorial layout. Simplify `js/main.mjs` to reveal-only. Update `scripts/build-blog.mjs` templates for new blog listing (year-grouped, no sidebar) and article page (wider line-height, ink-colored body text). Update `index.html` to remove all parallax HTML elements.

**Tech Stack:** HTML, CSS, vanilla JS, Node.js build script (marked library for Markdown)

---

### Task 1: Rewrite CSS — Design Tokens & Base Styles

**Files:**
- Modify: `css/style.css` (lines 1–56, the `:root`, `*`, `html`, `body`, `body::before`, `body::after`, `a`, `img`, `main` rules)

**Step 1: Replace the top of style.css**

Replace everything from line 1 through line 71 (`:root` through `main { ... }`) with:

```css
:root {
  color-scheme: light;
  --bg: #f6f3ed;
  --bg-secondary: #edeae4;
  --ink: #1a1816;
  --muted: #6b665e;
  --accent: #a63d20;
  --accent-hover: #8b3118;
  --sand: #c4b9a6;
  --border: rgba(26, 24, 22, 0.08);
}

* {
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  min-height: 100vh;
  font-family: "Space Grotesk", "Helvetica Neue", sans-serif;
  font-size: 1.08rem;
  line-height: 1.85;
  color: var(--ink);
  background: var(--bg);
  overflow-x: hidden;
}

a {
  color: inherit;
  text-decoration: none;
}

img {
  max-width: 100%;
  display: block;
}
```

This removes: `body::before` (grid overlay), `body::after` (fixed gradient), multi-layer radial gradient background, `--teal`, `--accent-strong`, `--shadow`, `main` z-index.

**Step 2: Verify the file renders**

Run: `open index.html` in browser — page should load with warm white background, no grid overlay or gradient blobs.

**Step 3: Commit**

```bash
git add css/style.css
git commit -m "refactor: replace design tokens and base styles with editorial palette"
```

---

### Task 2: CSS — Navigation Bar

**Files:**
- Modify: `css/style.css` — replace `.nav`, `.logo`, `.nav-links`, `.nav-links a` rules (old lines 162–210)

**Step 1: Replace navigation CSS**

Remove the entire nav block (`.nav` through `.nav-links a:hover::after`) and replace with:

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 8vw;
  background: var(--bg);
  border-bottom: 1px solid var(--sand);
}

.logo {
  font-family: "Fraunces", "Times New Roman", serif;
  font-size: 1.1rem;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.nav-links {
  display: flex;
  gap: 28px;
  font-size: 0.95rem;
}

.nav-links a {
  transition: color 0.2s ease;
}

.nav-links a:hover,
.nav-links a:focus {
  color: var(--accent);
}
```

This removes: `backdrop-filter: blur`, translucent background, monospace logo, underline hover animation pseudo-element.

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "refactor: simplify nav to solid editorial style"
```

---

### Task 3: CSS — Hero Section

**Files:**
- Modify: `css/style.css` — replace `.hero` through `.hero-card li::before` rules
- Modify: `css/style.css` — delete `.hero-bg`, all `.parallax-layer`, `.orb-*`, `.ring`, `.beam` rules

**Step 1: Replace hero CSS**

Remove all hero-related rules (`.hero` through `.beam`) and all parallax layer rules, and replace with:

```css
.hero {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 8vw;
  text-align: center;
}

.hero-content {
  max-width: 720px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  animation: rise 0.9s ease both;
}

.hero-eyebrow {
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  font-size: 0.8rem;
  letter-spacing: 0.28em;
  text-transform: uppercase;
  color: var(--muted);
}

.hero-title {
  font-family: "Fraunces", "Times New Roman", serif;
  font-size: clamp(2.8rem, 5vw, 4.5rem);
  line-height: 1;
  margin: 0;
}

.hero-title span {
  display: block;
  color: var(--accent);
  font-size: clamp(1.4rem, 2.5vw, 2rem);
  margin-top: 8px;
}

.hero-lead {
  max-width: 520px;
  font-size: 1.05rem;
  line-height: 1.75;
  color: var(--muted);
}

.hero-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 4px;
  border: 1px solid var(--ink);
  font-weight: 500;
  font-size: 0.95rem;
  transition: transform 0.2s ease, background 0.2s ease;
  background: var(--ink);
  color: var(--bg);
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-ghost {
  background: transparent;
  color: var(--ink);
}

.btn-ghost:hover {
  background: var(--bg-secondary);
}

.hero-card {
  max-width: 720px;
  width: 100%;
  margin-top: 40px;
  padding-top: 32px;
  border-top: 1px solid var(--sand);
}

.hero-card h3 {
  margin: 0 0 16px;
  font-size: 0.85rem;
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.hero-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  color: var(--muted);
  font-size: 0.95rem;
}

.hero-card li::before {
  content: "//";
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  color: var(--accent);
  margin-right: 10px;
}
```

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "refactor: hero to centered editorial layout, remove parallax CSS"
```

---

### Task 4: CSS — Delete Ambient & Decoration Rules

**Files:**
- Modify: `css/style.css` — delete `.ambient-field`, `.ambient-layer`, all `.ambient-glow-*`, `.ambient-ring-*`, `.ambient-beam-*`, `.ambient-grid`, `.section-decor`, `.deco-glass`, `.deco-ring`, `.deco-line`, `.deco-glow` rules
- Modify: `css/style.css` — delete `.is-lite` block and all its children

**Step 1: Remove all ambient, parallax-layer, section-decor, and is-lite CSS**

Delete these rule blocks entirely (they are no longer referenced after Task 3):
- `.ambient-field` through `.ambient-grid` (~lines 73–160 in old file)
- `.section-decor` through `.deco-glow` (~old lines 400–444)
- `.is-lite` and all children (~old lines 803–829)

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "remove: delete ambient, section-decor, and is-lite CSS"
```

---

### Task 5: CSS — Homepage Sections (About, Projects, Experience, Contact, Footer)

**Files:**
- Modify: `css/style.css` — rewrite `.section`, `.section-header`, `.panel-grid`, `.panel`, `.project-card`, `.timeline`, `.contact`, `.contact-card`, `.footer` rules

**Step 1: Replace section and component styles**

```css
.section {
  padding: 80px 8vw;
  border-top: 1px solid var(--sand);
}

.section-header {
  max-width: 720px;
  margin: 0 auto 48px;
}

.section-title {
  font-family: "Fraunces", "Times New Roman", serif;
  font-size: clamp(1.8rem, 3vw, 2.6rem);
  margin: 0 0 8px;
}

.section-subtitle {
  color: var(--muted);
  line-height: 1.7;
  margin: 0;
}

/* About panels */
.panel-grid {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 32px 48px;
  grid-template-columns: 1fr 1fr;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel h4 {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
}

.panel p {
  margin: 0;
  color: var(--muted);
  line-height: 1.65;
}

/* Projects — single column list */
.section.projects {
  background: none;
  border-top: 1px solid var(--sand);
  border-bottom: none;
}

.project-card {
  max-width: 720px;
  margin: 0 auto;
  display: block;
  padding: 28px 0;
  border-bottom: 1px solid var(--border);
  transition: background 0.2s ease;
}

.project-card:first-child {
  border-top: 1px solid var(--border);
}

.project-card:hover {
  background: var(--bg-secondary);
}

.project-card:hover .project-title {
  color: var(--accent);
}

.project-meta {
  display: flex;
  gap: 16px;
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  font-size: 0.78rem;
  color: var(--muted);
  margin-bottom: 8px;
}

.project-title {
  font-family: "Fraunces", "Times New Roman", serif;
  font-size: 1.35rem;
  margin: 0 0 6px;
  transition: color 0.2s ease;
}

.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag {
  padding: 4px 10px;
  border-radius: 4px;
  border: none;
  background: var(--bg-secondary);
  font-size: 0.8rem;
  color: var(--muted);
}

/* Timeline */
.timeline {
  max-width: 720px;
  margin: 0 auto;
  border-left: 2px solid var(--sand);
  padding-left: 24px;
  display: grid;
  gap: 32px;
}

.timeline-item h4 {
  margin: 0 0 6px;
}

.timeline-item p {
  margin: 0;
  color: var(--muted);
}

/* Contact */
.contact {
  max-width: 720px;
  margin: 0 auto;
  display: grid;
  gap: 32px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  align-items: start;
}

.contact-card {
  padding: 0;
}

.contact-card p {
  margin: 0;
  color: var(--muted);
}

.contact-card h3 {
  margin: 4px 0 2px;
  font-size: 1.1rem;
  color: var(--accent);
}

.contact-card h3 a {
  color: var(--accent);
  transition: color 0.2s ease;
}

.contact-card h3 a:hover {
  color: var(--accent-hover);
}

/* Footer */
.footer {
  padding: 32px 8vw 48px;
  font-size: 0.85rem;
  color: var(--muted);
  border-top: 1px solid var(--sand);
}
```

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "refactor: editorial styles for sections, projects, contact, footer"
```

---

### Task 6: CSS — Blog Listing & Blog Card Styles

**Files:**
- Modify: `css/style.css` — rewrite `.blog-section`, `.blog-header`, `.blog-layout`, `.blog-list`, `.blog-card`, `.blog-meta`, `.blog-title`, `.blog-excerpt`, `.blog-tags`, `.blog-side`, `.sidebar-card`, `.sidebar-tags`, `.blog-count` rules

**Step 1: Replace blog listing CSS**

Remove all old blog rules and replace with:

```css
/* Blog listing */
.blog-section .blog-header {
  max-width: 720px;
  margin: 0 auto 40px;
}

.blog-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
}

.blog-count {
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  font-size: 0.75rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.blog-list {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.blog-year {
  font-family: "Fraunces", "Times New Roman", serif;
  font-size: 1.6rem;
  margin: 48px 0 16px;
}

.blog-year:first-child {
  margin-top: 0;
}

.blog-entry {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 16px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
  transition: background 0.15s ease;
}

.blog-entry:hover {
  background: var(--bg-secondary);
}

.blog-entry:hover .blog-entry-title {
  color: var(--accent);
}

.blog-date {
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  font-size: 0.8rem;
  color: var(--muted);
  white-space: nowrap;
}

.blog-entry-title {
  font-size: 1rem;
  font-weight: 500;
  margin: 0;
  transition: color 0.15s ease;
}

.blog-entry-tags {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: -4px;
}

.blog-entry-tags .tag {
  font-size: 0.72rem;
  padding: 2px 8px;
}
```

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "refactor: editorial blog listing styles with year grouping"
```

---

### Task 7: CSS — Article (Markdown) Styles

**Files:**
- Modify: `css/style.css` — rewrite `.markdown`, `.markdown-meta`, `.markdown h1/h2/h3`, `.markdown p`, `.markdown a`, `.markdown ul/ol`, `.markdown blockquote`, `.markdown code`, `.markdown pre` rules

**Step 1: Replace markdown/article CSS**

```css
.markdown {
  max-width: 680px;
  margin: 0 auto;
  font-size: 1.08rem;
  line-height: 1.85;
  color: var(--ink);
}

.markdown-meta {
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.75rem;
  color: var(--muted);
  margin: 0 0 16px;
}

.markdown h1,
.markdown h2,
.markdown h3 {
  font-family: "Fraunces", "Times New Roman", serif;
  line-height: 1.2;
  color: var(--ink);
}

.markdown h1 {
  font-size: clamp(2rem, 4vw, 2.8rem);
  margin: 0 0 24px;
}

.markdown h2 {
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  margin: 2.5em 0 0.6em;
}

.markdown h3 {
  font-size: 1.2rem;
  margin: 2em 0 0.5em;
}

.markdown p {
  margin: 0 0 1.5em;
  color: var(--ink);
}

.markdown a {
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s ease;
}

.markdown a:hover {
  color: var(--accent-hover);
}

.markdown ul,
.markdown ol {
  padding-left: 1.25rem;
  margin: 0 0 1.5em;
  color: var(--ink);
}

.markdown li {
  margin-bottom: 0.4em;
}

.markdown blockquote {
  margin: 0 0 1.5em;
  padding: 0 0 0 20px;
  border-left: 3px solid var(--accent);
  color: var(--muted);
}

.markdown code {
  font-family: ui-monospace, "SFMono-Regular", "Menlo", monospace;
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.9em;
}

.markdown pre {
  background: var(--bg-secondary);
  padding: 18px 20px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0 0 1.5em;
}

.markdown pre code {
  background: none;
  padding: 0;
}
```

Key changes: body text is `var(--ink)` not muted, h2 has large top margin, blockquote stripped to just left border, links are accent+underline.

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "refactor: editorial article typography with ink-colored body text"
```

---

### Task 8: CSS — Animations & Responsive

**Files:**
- Modify: `css/style.css` — rewrite `[data-reveal]`, `@keyframes rise`, `@media` blocks

**Step 1: Replace animation and responsive CSS**

```css
[data-reveal] {
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.6s ease, transform 0.6s ease;
  transition-delay: var(--delay, 0ms);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translateY(0);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .nav-links {
    flex-wrap: wrap;
    gap: 16px;
  }

  .hero {
    padding-top: 60px;
    min-height: auto;
  }

  .hero-card ul {
    grid-template-columns: 1fr;
  }

  .panel-grid {
    grid-template-columns: 1fr;
  }

  .blog-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .blog-entry {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .blog-entry-tags {
    grid-column: 1;
  }

  .contact {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    scroll-behavior: auto !important;
  }

  [data-reveal] {
    opacity: 1;
    transform: none;
  }
}
```

**Step 2: Commit**

```bash
git add css/style.css
git commit -m "refactor: simplified animations and responsive breakpoints"
```

---

### Task 9: Simplify index.html — Remove Parallax HTML

**Files:**
- Modify: `index.html`

**Step 1: Remove parallax elements from index.html**

Delete the entire `<div class="ambient-field">` block (lines 29–103 in current file).

Delete the entire `<div class="hero-bg">` block (lines 105–163 in current file).

Remove `data-parallax` attribute and all `data-speed`, `data-speed-x`, `data-max-shift`, `data-rotate`, `data-opacity`, `data-scale` attributes from `<div class="hero-card">` (line 180).

Remove all `<div class="section-decor ...">` elements from each section (4 elements total, one per section).

Change the hero from `grid` to simple centered layout — the CSS already handles this from Task 3, just need to remove `grid-column` structure. Remove the grid column spans since hero is now flex.

Update the footer text from `© 2025 吴佳翮 · Built for performance-first storytelling.` to `© 2026 吴佳翮`.

**Step 2: Verify page renders correctly**

Open `index.html` in browser. Should show: centered hero, clean nav, no floating orbs/rings/beams, sections separated by thin lines.

**Step 3: Commit**

```bash
git add index.html
git commit -m "refactor: strip parallax HTML from homepage"
```

---

### Task 10: Simplify main.mjs — Remove Parallax JS

**Files:**
- Modify: `js/main.mjs` — rewrite to ~30 lines (reveal observer only)

**Step 1: Replace main.mjs entirely**

```js
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const setupReveals = () => {
  if (!revealItems.length || prefersReducedMotion.matches) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );

  revealItems.forEach((item) => observer.observe(item));
};

setupReveals();

if (prefersReducedMotion.addEventListener) {
  prefersReducedMotion.addEventListener("change", setupReveals);
}
```

**Step 2: Delete `js/parallax.mjs`** — no longer imported anywhere.

**Step 3: Commit**

```bash
git add js/main.mjs
git rm js/parallax.mjs
git commit -m "simplify: strip parallax system, keep reveal observer only"
```

---

### Task 11: Update Build Script — Blog Listing (Year-Grouped, No Sidebar)

**Files:**
- Modify: `scripts/build-blog.mjs` — rewrite `renderBlogIndex` function

**Step 1: Rewrite renderBlogIndex**

Replace the `renderBlogIndex` function with:

```js
const renderBlogIndex = (posts) => {
  const grouped = new Map();
  posts.forEach((post) => {
    const year = post.date ? post.date.slice(0, 4) : "Other";
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year).push(post);
  });

  let listHtml = "";
  for (const [year, yearPosts] of grouped) {
    listHtml += `<h3 class="blog-year">${year}</h3>\n`;
    for (const post of yearPosts) {
      const monthDay = post.dateDisplay ? post.dateDisplay.slice(5) : "";
      const tags = post.tags.length
        ? `<div class="blog-entry-tags">${post.tags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}</div>`
        : "";

      listHtml += `
        <a class="blog-entry" href="${post.url}">
          <span class="blog-date">${monthDay}</span>
          <h4 class="blog-entry-title">${post.title}</h4>
          ${tags}
        </a>\n`;
    }
  }

  return renderLayout({
    title: "Writing | blueberrycongee",
    description: "Journal, notes, and reflections.",
    bodyHtml: `
      <section class="section blog-section">
        <div class="blog-header">
          <div>
            <h2 class="section-title">Writing / Notes</h2>
            <p class="section-subtitle">Journal / Notes / Reflections</p>
          </div>
          <div class="blog-count">${posts.length} posts</div>
        </div>
        <div class="blog-list">
          ${listHtml}
        </div>
      </section>
    `,
  });
};
```

Changes: year grouping, no sidebar, no excerpt, no cards, no `data-reveal` on entries.

**Step 2: Commit**

```bash
git add scripts/build-blog.mjs
git commit -m "refactor: blog listing to year-grouped editorial index"
```

---

### Task 12: Update Build Script — Article Page Template & Layout

**Files:**
- Modify: `scripts/build-blog.mjs` — update `renderLayout` (nav style) and `renderPost` (no data-reveal)

**Step 1: Update renderLayout nav**

In the `renderLayout` function, update the nav to match the homepage nav:

```js
const renderLayout = ({ title, description, bodyHtml }) => `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Space+Grotesk:wght@400;500&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/css/style.css" />
  </head>
  <body>
    <nav class="nav">
      <a class="logo" href="/">吴佳翮</a>
      <div class="nav-links">
        <a href="/blog/">博客</a>
        <a href="/#work">项目</a>
        <a href="/#contact">联系</a>
      </div>
    </nav>

    <main>
      ${bodyHtml}
    </main>

    <footer class="footer">© 2026 吴佳翮</footer>

    <script type="module" src="/js/main.mjs"></script>
  </body>
</html>
`;
```

Changes: Google Fonts weights reduced to `400;500` for Space Grotesk, footer simplified.

**Step 2: Commit**

```bash
git add scripts/build-blog.mjs
git commit -m "refactor: update layout template nav and footer for editorial style"
```

---

### Task 13: Update Google Fonts in index.html

**Files:**
- Modify: `index.html` — update Google Fonts link

**Step 1: Update font link**

Change the Google Fonts `href` in index.html from:

```
family=Space+Grotesk:wght@400;500;600;700
```

to:

```
family=Space+Grotesk:wght@400;500
```

This drops unused 600/700 weights.

**Step 2: Commit**

```bash
git add index.html
git commit -m "perf: reduce Google Fonts weights to 400 and 500"
```

---

### Task 14: Rebuild Blog & Final Verification

**Step 1: Run the build script**

```bash
cd /Users/zzzz/blueberrycongee.github.io && node scripts/build-blog.mjs
```

Expected: `Generated 41 posts.`

**Step 2: Run existing tests**

```bash
node scripts/tests/blog-utils.test.mjs
```

Expected: `blog-utils tests passed`

**Step 3: Spot-check generated files**

- Open `blog/index.html` — should show year-grouped list, no sidebar, no cards
- Open a generated post (e.g., `2026/01/18/2026-01-18-ai-agent-whitecollar/index.html`) — should show editorial article with ink-colored body text, no reveal attrs
- Open `index.html` — should show full editorial homepage

**Step 4: Commit generated files**

```bash
git add blog/ 2025/ 2026/ 2022/
git commit -m "build: regenerate blog with editorial template"
```

---

### Task 15: Clean Up Unused CSS

**Files:**
- Modify: `css/style.css` — scan for any orphaned rules from old design

**Step 1: Remove orphaned rules**

After all previous tasks, scan `style.css` for any rules that reference deleted classes:
- `.writing-grid`, `.writing-card` — these are unreferenced in any HTML, delete them
- `.blog-card`, `.blog-excerpt`, `.blog-side`, `.sidebar-card`, `.sidebar-tags`, `.blog-layout`, `.blog-main` — old blog classes, delete if still present
- `.section > *` z-index rule — no longer needed without section-decor, delete
- `content-visibility` and `contain-intrinsic-size` on `.section` — no longer needed without heavy content, delete

**Step 2: Final commit**

```bash
git add css/style.css
git commit -m "cleanup: remove orphaned CSS from old design"
```
