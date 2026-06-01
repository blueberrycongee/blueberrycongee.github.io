# Blog Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the personal site along a Brutalist Swiss / Bauhaus axis: mono-driven, grid-disciplined, manifesto home page, full redesign of every page and the build pipeline.

**Architecture:** Custom static-site generator (`scripts/build-blog.mjs`) compiles markdown from `content/posts/*.md` to date-organised HTML. Replace editorial aesthetic with Brutalist Swiss. Replace 6-item nav with 4-item nav. Drop parallax/animations entirely. Render `writing/`, `index/`, and post pages from the build script; rewrite home, about, bangumis, Gallery as static HTML.

**Tech Stack:** Vanilla Node.js (no framework, no bundler), `marked` for markdown, `node:test` for tests, Google Fonts (JetBrains Mono + Inter).

**Test command:** `node --test "scripts/**/*.test.mjs"` from the repo root.

---

## Phase 1: Cleanup obsolete files

### Task 1: Delete parallax test and ensure baseline green

**Files:**
- Delete: `scripts/parallax-config.test.mjs`

**Step 1: Delete the parallax test file**

```bash
rm scripts/parallax-config.test.mjs
```

**Step 2: Run tests**

Run: `node --test "scripts/**/*.test.mjs"`
Expected: All pass, no parallax test in output.

**Step 3: Commit**

```bash
git add -u scripts/
git commit -m "chore: remove parallax test (parallax system removed)"
```

---

### Task 2: Remove parallax remnants from build script test references

**Files:**
- Modify: `scripts/build-blog.mjs` (no changes needed if no parallax references; verify with grep)

**Step 1: Verify no parallax references remain**

Run: `grep -rn "parallax" scripts/ css/ js/ index.html 2>/dev/null || echo "no matches"`
Expected: `no matches`

**Step 2: Commit any incidental cleanup if needed**

If grep returned matches, remove them. Otherwise no commit.

---

## Phase 2: Build script — TDD for new logic

### Task 3: Add prev/next neighbour computation (TDD)

**Files:**
- Create: `scripts/tests/build-blog-neighbours.test.mjs`
- Modify: `scripts/blog-utils.mjs`

**Step 1: Write the failing test**

Create `scripts/tests/build-blog-neighbours.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import { findNeighbours } from "../blog-utils.mjs";

test("findNeighbours returns prev and next for a middle post", () => {
  const sorted = [
    { url: "/2025/01/01/a/", date: "2025-01-01" },
    { url: "/2025/06/01/b/", date: "2025-06-01" },
    { url: "/2025/12/01/c/", date: "2025-12-01" },
  ];
  const result = findNeighbours(sorted, "/2025/06/01/b/");
  assert.deepEqual(result.prev, sorted[0]);
  assert.deepEqual(result.next, sorted[2]);
});

test("findNeighbours returns null next for newest post", () => {
  const sorted = [
    { url: "/2025/01/01/a/", date: "2025-01-01" },
    { url: "/2025/06/01/b/", date: "2025-06-01" },
  ];
  const result = findNeighbours(sorted, "/2025/06/01/b/");
  assert.equal(result.next, null);
  assert.deepEqual(result.prev, sorted[0]);
});

test("findNeighbours returns null prev for oldest post", () => {
  const sorted = [
    { url: "/2025/01/01/a/", date: "2025-01-01" },
    { url: "/2025/06/01/b/", date: "2025-06-01" },
  ];
  const result = findNeighbours(sorted, "/2025/01/01/a/");
  assert.equal(result.prev, null);
  assert.deepEqual(result.next, sorted[1]);
});

test("findNeighbours returns both null for unknown url", () => {
  const result = findNeighbours(
    [{ url: "/2025/01/01/a/", date: "2025-01-01" }],
    "/2099/01/01/missing/"
  );
  assert.equal(result.prev, null);
  assert.equal(result.next, null);
});
```

**Step 2: Run the test to confirm it fails**

Run: `node --test scripts/tests/build-blog-neighbours.test.mjs`
Expected: FAIL — `findNeighbours is not a function` (or similar import error).

**Step 3: Implement findNeighbours in blog-utils.mjs**

Append to `scripts/blog-utils.mjs`:

```javascript
export function findNeighbours(sortedPosts, currentUrl) {
  const index = sortedPosts.findIndex((post) => post.url === currentUrl);
  if (index === -1) {
    return { prev: null, next: null };
  }
  return {
    prev: index > 0 ? sortedPosts[index - 1] : null,
    next: index < sortedPosts.length - 1 ? sortedPosts[index + 1] : null,
  };
}
```

**Step 4: Run the test to confirm it passes**

Run: `node --test scripts/tests/build-blog-neighbours.test.mjs`
Expected: PASS, 4 tests.

**Step 5: Commit**

```bash
git add scripts/blog-utils.mjs scripts/tests/build-blog-neighbours.test.mjs
git commit -m "feat(blog-utils): add findNeighbours for post prev/next"
```

---

### Task 4: Rewrite renderLayout template

**Files:**
- Modify: `scripts/build-blog.mjs` (`renderLayout` function, lines 50-84)

**Step 1: Write a layout snapshot test**

Create `scripts/tests/build-blog-layout.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderLayout } from "../build-blog.mjs";

test("renderLayout produces 4-item nav with current-page marker", () => {
  const html = renderLayout({
    title: "Test",
    description: "test desc",
    bodyHtml: "<p>body</p>",
    currentPath: "writing",
  });
  assert.ok(html.includes('href="/"'), "nav includes /");
  assert.ok(html.includes('href="/writing/"'), "nav includes /writing/");
  assert.ok(html.includes('href="/index/"'), "nav includes /index/");
  assert.ok(html.includes('href="/about/"'), "nav includes /about/");
  assert.ok(!html.includes("/blog/"), "nav excludes /blog/");
  assert.ok(
    html.includes('data-current="writing"') || html.includes('aria-current="page"'),
    "current page is marked"
  );
});

test("renderLayout uses JetBrains Mono in font preconnect", () => {
  const html = renderLayout({ title: "x", description: "y", bodyHtml: "" });
  assert.ok(html.includes("JetBrains+Mono"), "font preconnect for JetBrains Mono");
  assert.ok(html.includes("Inter"), "font preconnect for Inter");
  assert.ok(!html.includes("Fraunces"), "Fraunces removed");
  assert.ok(!html.includes("Space+Grotesk"), "Space Grotesk removed");
});

test("renderLayout footer is single line with email and github", () => {
  const html = renderLayout({ title: "x", description: "y", bodyHtml: "" });
  assert.ok(html.includes("lpageo@163.com"), "footer has email");
  assert.ok(html.includes("github.com/blueberrycongee"), "footer has github");
  assert.ok(!html.includes("class=\"hero-card\""), "no hero-card class");
});
```

**Step 2: Run the test to confirm it fails**

Run: `node --test scripts/tests/build-blog-layout.test.mjs`
Expected: FAIL — assertions on `Fraunces` absence, `/writing/` presence, etc.

**Step 3: Rewrite renderLayout**

In `scripts/build-blog.mjs`, replace the entire `renderLayout` function (the function starting at `const renderLayout = ...`) with:

```javascript
const NAV_ITEMS = [
  { label: "/", path: "/", key: "home" },
  { label: "writing", path: "/writing/", key: "writing" },
  { label: "index", path: "/index/", key: "index" },
  { label: "about", path: "/about/", key: "about" },
];

const renderLayout = ({ title, description, bodyHtml, currentPath = "" }) => {
  const navHtml = NAV_ITEMS.map((item) => {
    const isCurrent = item.key === currentPath;
    const cls = isCurrent ? ' class="is-current"' : "";
    const attr = isCurrent ? ' aria-current="page"' : "";
    return `<a href="${item.path}"${cls}${attr}>${item.label}</a>`;
  }).join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="/css/style.css" />
  </head>
  <body>
    <nav class="nav">${navHtml}</nav>
    <main>${bodyHtml}</main>
    <footer class="footer">
      © 2026 吴佳翮 · <a href="mailto:lpageo@163.com">lpageo@163.com</a> · <a href="https://github.com/blueberrycongee">github</a>
    </footer>
  </body>
</html>
`;
};
```

**Step 4: Run the test to confirm it passes**

Run: `node --test scripts/tests/build-blog-layout.test.mjs`
Expected: PASS, 3 tests.

**Step 5: Commit**

```bash
git add scripts/build-blog.mjs scripts/tests/build-blog-layout.test.mjs
git commit -m "feat(build): rewrite renderLayout to 4-item nav, mono fonts, brutalist footer"
```

---

### Task 5: Update renderPost to support prev/next

**Files:**
- Modify: `scripts/build-blog.mjs` (`renderPost` function)

**Step 1: Write a failing test for renderPost output**

Append to `scripts/tests/build-blog-layout.test.mjs` (or create `scripts/tests/build-blog-post.test.mjs`):

```javascript
test("renderPost includes back link, mono date, and prev/next when present", () => {
  const html = renderPost({
    title: "Test Post",
    dateDisplay: "2025.12.28",
    tags: ["go"],
    html: "<p>hello</p>",
    prev: { title: "Prev Post", url: "/2025/11/01/prev/" },
    next: { title: "Next Post", url: "/2026/01/01/next/" },
    currentPath: "writing",
  });
  assert.ok(html.includes("← writing"), "back link present");
  assert.ok(html.includes("2025 · 12 · 28"), "date in mono Y · M · D format");
  assert.ok(html.includes("Prev Post"), "prev title rendered");
  assert.ok(html.includes("/2025/11/01/prev/"), "prev url rendered");
  assert.ok(html.includes("Next Post"), "next title rendered");
  assert.ok(html.includes("/2026/01/01/next/"), "next url rendered");
  assert.ok(!html.includes('class="markdown-meta"'), "old markdown-meta class removed");
});

test("renderPost omits prev/next side when neighbour is null", () => {
  const html = renderPost({
    title: "Lone Post",
    dateDisplay: "2025.12.28",
    tags: [],
    html: "<p>x</p>",
    prev: null,
    next: null,
    currentPath: "writing",
  });
  assert.ok(!html.includes("← prev:"), "no prev side");
  assert.ok(!html.includes("next: →"), "no next side");
});
```

Note: the test imports `renderPost` from `../build-blog.mjs`. The current module does not export it — see Step 3.

**Step 2: Run the test to confirm it fails**

Run: `node --test scripts/tests/build-blog-post.test.mjs`
Expected: FAIL — import error or missing strings.

**Step 3: Update renderPost and export the rendering functions**

In `scripts/build-blog.mjs`:

Replace the `renderPost` function with:

```javascript
const renderPost = ({ title, dateDisplay, tags, html, prev, next, currentPath }) => {
  const metaParts = [];
  if (dateDisplay) {
    const [y, m, d] = dateDisplay.split(".");
    if (y && m && d) {
      metaParts.push(`${y} · ${parseInt(m, 10)} · ${parseInt(d, 10)}`);
    } else {
      metaParts.push(dateDisplay);
    }
  }
  if (tags && tags.length) {
    metaParts.push(tags.join(" · "));
  }
  const meta = metaParts.join(" · ");
  const metaLine = meta ? `<p class="post-meta">${meta}</p>` : "";

  const prevHtml = prev
    ? `<a class="post-nav-link post-prev" href="${prev.url}">← ${prev.title}</a>`
    : `<span class="post-nav-link post-prev is-empty"></span>`;
  const nextHtml = next
    ? `<a class="post-nav-link post-next" href="${next.url}">${next.title} →</a>`
    : `<span class="post-nav-link post-next is-empty"></span>`;

  return renderLayout({
    title: `${title} | 吴佳翮`,
    description: title,
    currentPath,
    bodyHtml: `
      <article class="post">
        <a class="back-link" href="/writing/">← writing</a>
        ${metaLine}
        <h1 class="post-title">${title}</h1>
        <div class="post-body">${html}</div>
        <nav class="post-nav">${prevHtml}${nextHtml}</nav>
      </article>
    `,
  });
};
```

Then at the bottom of the file, before `main()`, add module exports for testability:

```javascript
export { renderLayout, renderPost, renderWriting, renderIndex };
```

(Note: `renderWriting` and `renderIndex` will be added in Tasks 6 and 7. Add them as empty placeholders for now, or skip the export until later — instead, defer the export to Task 7.)

**Step 4: Run the test to confirm it passes**

Run: `node --test scripts/tests/build-blog-post.test.mjs`
Expected: PASS.

**Step 5: Commit**

```bash
git add scripts/build-blog.mjs scripts/tests/build-blog-post.test.mjs
git commit -m "feat(build): renderPost with mono date, prev/next nav, no reveal"
```

---

### Task 6: Rename renderBlogIndex → renderWriting and update path

**Files:**
- Modify: `scripts/build-blog.mjs` (`renderBlogIndex` function)

**Step 1: Write a failing test**

Create `scripts/tests/build-blog-writing.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderWriting } from "../build-blog.mjs";

test("renderWriting groups posts by year and shows red year headings", () => {
  const posts = [
    { title: "A", dateDisplay: "2026.01.18", url: "/2026/01/18/a/", tags: ["x"] },
    { title: "B", dateDisplay: "2025.12.28", url: "/2025/12/28/b/", tags: ["y"] },
    { title: "C", dateDisplay: "2025.11.03", url: "/2025/11/03/c/", tags: [] },
  ];
  const html = renderWriting(posts, "writing");
  assert.ok(html.includes('class="year"') || html.includes("<h2"), "year heading present");
  assert.ok(html.includes("2026"), "year 2026 present");
  assert.ok(html.includes("2025"), "year 2025 present");
  assert.ok(html.includes('href="/2026/01/18/a/"'), "post A link present");
  assert.ok(html.includes('href="/index/"'), "link to /index/ present");
  assert.ok(!html.includes("excerpt"), "no excerpt");
  assert.ok(!html.includes('class="hero-card"'), "no hero-card");
});

test("renderWriting shows post count", () => {
  const posts = [
    { title: "A", dateDisplay: "2025.01.01", url: "/x/", tags: [] },
  ];
  const html = renderWriting(posts, "writing");
  assert.ok(html.includes("1 posts") || html.includes("1 post"), "post count rendered");
});
```

**Step 2: Run the test to confirm it fails**

Run: `node --test scripts/tests/build-blog-writing.test.mjs`
Expected: FAIL — `renderWriting is not a function`.

**Step 3: Rename and update the function**

In `scripts/build-blog.mjs`:

Replace the entire `renderBlogIndex` function with:

```javascript
const renderWriting = (posts, currentPath) => {
  const grouped = new Map();
  posts.forEach((post) => {
    const year = post.dateDisplay ? post.dateDisplay.slice(0, 4) : "Other";
    if (!grouped.has(year)) {
      grouped.set(year, []);
    }
    grouped.get(year).push(post);
  });

  let listHtml = "";
  for (const [year, yearPosts] of grouped) {
    listHtml += `<h2 class="year">${year}</h2>\n`;
    for (const post of yearPosts) {
      const monthDay = post.dateDisplay ? post.dateDisplay.slice(5).replace(".", "/") : "";
      const tags = post.tags && post.tags.length
        ? `<span class="post-tags">${post.tags.join(" · ")}</span>`
        : "";
      listHtml += `
        <a class="post-row" href="${post.url}">
          <span class="post-row-date">${monthDay}</span>
          <span class="post-row-title">${post.title}</span>
          ${tags}
        </a>
`;
    }
  }

  return renderLayout({
    title: "writing | 吴佳翮",
    description: "writing, notes, and reflections.",
    currentPath,
    bodyHtml: `
      <section class="section">
        <header class="section-header">
          <h1 class="section-title">writing</h1>
          <a class="section-aside" href="/index/">→ index</a>
        </header>
        <p class="section-meta">${posts.length} ${posts.length === 1 ? "post" : "posts"}</p>
        <div class="post-list">${listHtml}</div>
      </section>
    `,
  });
};
```

**Step 4: Run the test to confirm it passes**

Run: `node --test scripts/tests/build-blog-writing.test.mjs`
Expected: PASS, 2 tests.

**Step 5: Commit**

```bash
git add scripts/build-blog.mjs scripts/tests/build-blog-writing.test.mjs
git commit -m "feat(build): rename renderBlogIndex to renderWriting, brutalist year groups"
```

---

### Task 7: Add renderIndex function (tags, categories, time views)

**Files:**
- Modify: `scripts/build-blog.mjs` (add `renderIndex`)

**Step 1: Write a failing test**

Create `scripts/tests/build-blog-index.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderIndex } from "../build-blog.mjs";

const samplePosts = [
  { title: "A", dateDisplay: "2026.01.18", url: "/2026/01/18/a/", tags: ["go", "essay"] },
  { title: "B", dateDisplay: "2025.12.28", url: "/2025/12/28/b/", tags: ["go"] },
  { title: "C", dateDisplay: "2025.11.03", url: "/2025/11/03/c/", tags: [] },
];

test("renderIndex time view lists posts by date", () => {
  const html = renderIndex(samplePosts, "time", "index");
  assert.ok(html.includes("/2026/01/18/a/"), "post A present");
  assert.ok(html.includes("/2025/12/28/b/"), "post B present");
});

test("renderIndex tags view groups by tag with counts", () => {
  const html = renderIndex(samplePosts, "tags", "index");
  assert.ok(html.includes("go"), "tag 'go' present");
  assert.ok(html.includes("2"), "count of 2 for 'go' present");
  assert.ok(html.includes("essay"), "tag 'essay' present");
});

test("renderIndex categories view groups by category", () => {
  const html = renderIndex(samplePosts, "categories", "index");
  // posts without categories are grouped under "uncategorized"
  assert.ok(html.includes("uncategorized") || html.includes("Other"), "uncategorized bucket present");
});

test("renderIndex has tab nav with current view marked", () => {
  const html = renderIndex(samplePosts, "tags", "index");
  assert.ok(html.includes("/index/"), "default tab link");
  assert.ok(html.includes("/index/tags"), "tags tab link");
  assert.ok(html.includes("/index/categories"), "categories tab link");
  assert.ok(html.includes("is-current") || html.includes("aria-current"), "current view marked");
});
```

**Step 2: Run the test to confirm it fails**

Run: `node --test scripts/tests/build-blog-index.test.mjs`
Expected: FAIL — `renderIndex is not a function`.

**Step 3: Implement renderIndex**

In `scripts/build-blog.mjs`, add the function before `main()`:

```javascript
const renderIndex = (posts, view, currentPath) => {
  const tabs = [
    { key: "time", label: "WRITING", href: "/index/" },
    { key: "tags", label: "TAGS", href: "/index/tags" },
    { key: "categories", label: "CATEGORIES", href: "/index/categories" },
  ];
  const tabsHtml = tabs
    .map((t) => {
      const isCurrent = t.key === view;
      const cls = isCurrent ? ' class="is-current"' : "";
      const attr = isCurrent ? ' aria-current="page"' : "";
      return `<a href="${t.href}"${cls}${attr}>${t.label}</a>`;
    })
    .join("");

  let bodyHtml = "";
  if (view === "time") {
    const rows = posts
      .map(
        (p) => `<a class="post-row" href="${p.url}">
          <span class="post-row-date">${p.dateDisplay ? p.dateDisplay.slice(5).replace(".", "/") : ""}</span>
          <span class="post-row-title">${p.title}</span>
        </a>`
      )
      .join("\n");
    bodyHtml = `<div class="post-list">${rows}</div>`;
  } else if (view === "tags") {
    const tagMap = new Map();
    posts.forEach((p) => {
      (p.tags || []).forEach((tag) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    });
    const rows = Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag, count]) => `<li><span>${tag}</span><span class="count">${count}</span></li>`)
      .join("");
    bodyHtml = `<ul class="tag-list">${rows}</ul>`;
  } else if (view === "categories") {
    const catMap = new Map();
    posts.forEach((p) => {
      const cats = (p.categories && p.categories.length) ? p.categories : ["uncategorized"];
      cats.forEach((cat) => {
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      });
    });
    const rows = Array.from(catMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([cat, count]) => `<li><span>${cat}</span><span class="count">${count}</span></li>`)
      .join("");
    bodyHtml = `<ul class="cat-list">${rows}</ul>`;
  }

  return renderLayout({
    title: `index · ${view} | 吴佳翮`,
    description: "site-wide index",
    currentPath,
    bodyHtml: `
      <section class="section">
        <header class="section-header">
          <h1 class="section-title">index</h1>
          <nav class="section-tabs">${tabsHtml}</nav>
        </header>
        ${bodyHtml}
      </section>
    `,
  });
};
```

**Step 4: Run the test to confirm it passes**

Run: `node --test scripts/tests/build-blog-index.test.mjs`
Expected: PASS, 4 tests.

**Step 5: Commit**

```bash
git add scripts/build-blog.mjs scripts/tests/build-blog-index.test.mjs
git commit -m "feat(build): renderIndex with time, tags, categories views"
```

---

### Task 8: Update main flow and writeIndexJson

**Files:**
- Modify: `scripts/build-blog.mjs` (`writePostsIndex`, `writeBlogIndex`, `main`)

**Step 1: Update the main flow to write to new paths**

In `scripts/build-blog.mjs`:

Replace `writeBlogIndex` with:

```javascript
const writeWritingIndex = async (posts) => {
  await fs.mkdir(writingDir, { recursive: true });
  const html = renderWriting(posts, "writing");
  await fs.writeFile(path.join(writingDir, "index.html"), html, "utf-8");
};
```

Replace `writePostsIndex` with:

```javascript
const writeIndexJson = async (posts) => {
  const indexDir = path.join(root, "index");
  await fs.mkdir(indexDir, { recursive: true });
  const data = posts.map((p) => ({
    title: p.title,
    date: p.dateDisplay,
    url: p.url,
    tags: p.tags,
    categories: p.categories,
  }));
  await fs.writeFile(path.join(indexDir, "posts.json"), JSON.stringify(data, null, 2), "utf-8");
};
```

Add new writer:

```javascript
const writeIndexPages = async (posts) => {
  const indexDir = path.join(root, "index");
  await fs.mkdir(indexDir, { recursive: true });
  await fs.writeFile(path.join(indexDir, "index.html"), renderIndex(posts, "time", "index"), "utf-8");
  await fs.writeFile(path.join(indexDir, "tags.html"), renderIndex(posts, "tags", "index"), "utf-8");
  await fs.writeFile(path.join(indexDir, "categories.html"), renderIndex(posts, "categories", "index"), "utf-8");
};
```

Update the path constants at the top:

```javascript
const writingDir = path.join(root, "writing");
```

Remove the old `const blogDir = path.join(root, "blog");` line.

Update `writePosts` to compute neighbours and pass them to `renderPost`:

```javascript
const writePosts = async (posts) => {
  for (const post of posts) {
    const { prev, next } = findNeighbours(posts, post.url);
    const outputPath = path.join(root, post.outputRelative);
    await ensureDir(outputPath);
    const pageHtml = renderPost({
      title: post.title,
      dateDisplay: post.dateDisplay,
      tags: post.tags,
      html: post.html,
      prev,
      next,
      currentPath: "writing",
    });
    await fs.writeFile(outputPath, pageHtml, "utf-8");
  }
};
```

Update `main`:

```javascript
const main = async () => {
  const posts = await readMarkdownPosts();
  await writePosts(posts);
  await writeWritingIndex(posts);
  await writeIndexPages(posts);
  await writeIndexJson(posts);
  console.log(`Generated ${posts.length} posts.`);
};
```

Add the export line (deferred from Task 5):

```javascript
export { renderLayout, renderPost, renderWriting, renderIndex, findNeighbours };
```

(Also import `findNeighbours` from `./blog-utils.mjs` at the top.)

**Step 2: Run the build**

Run: `node scripts/build-blog.mjs`
Expected: `Generated N posts.` with no error.

**Step 3: Verify output paths exist**

Run: `ls writing/index.html index/index.html index/tags.html index/categories.html`
Expected: all four files exist.

**Step 4: Run all tests**

Run: `node --test "scripts/**/*.test.mjs"`
Expected: all pass.

**Step 5: Commit**

```bash
git add scripts/build-blog.mjs
git commit -m "feat(build): main flow writes writing/, index/, posts.json; pass neighbours to renderPost"
```

---

## Phase 3: CSS rewrite

### Task 9: Rewrite style.css with Brutalist Swiss design system

**Files:**
- Modify: `css/style.css`

**Step 1: Replace the entire file**

The new file uses the tokens from the design doc. Save this as `css/style.css`:

```css
:root {
  --ink: #0a0a0a;
  --paper: #f5f3ee;
  --rule: #1a1a1a;
  --red: #dc2626;
  --red-soft: #fef2f2;
  --red-hover: #b91c1c;
  --muted: #6b665e;
}

* { box-sizing: border-box; }

html { scroll-behavior: smooth; }

body {
  margin: 0;
  min-height: 100vh;
  font-family: "JetBrains Mono", ui-monospace, "Menlo", monospace;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ink);
  background: var(--paper);
}

a { color: inherit; text-decoration: none; transition: color 120ms ease; }
a:hover, a:focus { color: var(--red); }
img { max-width: 100%; display: block; }

/* Nav */
.nav {
  position: sticky;
  top: 0;
  z-index: 5;
  display: flex;
  gap: 24px;
  align-items: center;
  padding: 16px 32px;
  background: var(--paper);
  border-bottom: 1px solid var(--ink);
  font-size: 0.875rem;
}
.nav a { padding: 4px 8px; }
.nav a.is-current {
  background: var(--red);
  color: var(--paper);
}
.nav a.is-current:hover, .nav a.is-current:focus {
  color: var(--paper);
}

/* Footer */
.footer {
  padding: 48px 32px 32px;
  border-top: 1px solid var(--ink);
  font-size: 0.8125rem;
  color: var(--muted);
}
.footer a:hover, .footer a:focus { color: var(--red); }

/* Home (manifesto) */
.home {
  min-height: 92vh;
  padding: 8vh 32px 4vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.home-label {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 8px;
}
.home-name {
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  margin: 0 0 48px;
}
.home h1 {
  font-size: clamp(3rem, 9vw, 7.5rem);
  line-height: 0.95;
  font-weight: 700;
  margin: 0 0 32px;
  grid-column: 1 / span 9;
}
.home h1 .red { color: var(--red); }
.home-meta {
  font-size: 0.875rem;
  margin: 0 0 24px;
  color: var(--ink);
}
.home-meta::before {
  content: "";
  display: block;
  width: 96px;
  height: 1px;
  background: var(--ink);
  margin: 0 0 16px;
}
.home-now {
  font-size: 0.8125rem;
  color: var(--muted);
  margin: 0;
  max-width: 56ch;
}
.home-now::before { content: "/now — "; color: var(--ink); }

/* Sections */
.section {
  padding: 64px 32px;
  max-width: 1440px;
}
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1px solid var(--ink);
  padding-bottom: 12px;
  margin-bottom: 32px;
  gap: 16px;
}
.section-title {
  font-size: clamp(1.5rem, 3vw, 2.25rem);
  font-weight: 700;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.section-aside {
  font-size: 0.875rem;
  color: var(--muted);
}
.section-aside:hover, .section-aside:focus { color: var(--red); }
.section-meta {
  font-size: 0.75rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 24px;
}
.section-tabs {
  display: flex;
  gap: 16px;
  font-size: 0.875rem;
  letter-spacing: 0.08em;
}
.section-tabs a.is-current { color: var(--red); }

/* Year headings + post list */
.year {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--red);
  margin: 48px 0 8px;
  letter-spacing: 0.04em;
}
.year:first-of-type { margin-top: 0; }
.year::after {
  content: "";
  display: block;
  width: 32px;
  height: 1px;
  background: var(--red);
  margin-top: 4px;
}
.post-list { display: flex; flex-direction: column; }
.post-row {
  display: grid;
  grid-template-columns: 64px 1fr auto;
  gap: 16px;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid var(--rule);
  font-size: 0.9375rem;
}
.post-row-date {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}
.post-row-title { color: var(--ink); }
.post-tags { font-size: 0.75rem; color: var(--muted); }
.post-row:hover .post-row-title,
.post-row:focus .post-row-title { color: var(--red); }
.post-row:hover, .post-row:focus { background: var(--red-soft); }

/* Post page */
.post {
  max-width: 68ch;
  margin: 0 auto;
  padding: 64px 32px;
}
.back-link {
  display: inline-block;
  font-size: 0.875rem;
  color: var(--muted);
  margin-bottom: 32px;
}
.back-link:hover, .back-link:focus { color: var(--red); }
.post-meta {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 0 0 12px;
}
.post-title {
  font-size: clamp(2.25rem, 5vw, 4rem);
  line-height: 1.05;
  font-weight: 700;
  margin: 0 0 32px;
}
.post-body {
  font-family: "Inter", system-ui, sans-serif;
  font-size: 1rem;
  line-height: 1.6;
}
.post-body h2 {
  font-family: "JetBrains Mono", monospace;
  font-size: 1.5rem;
  font-weight: 700;
  margin: 3em 0 0.6em;
}
.post-body h3 {
  font-family: "JetBrains Mono", monospace;
  font-size: 1.25rem;
  font-weight: 700;
  margin: 2em 0 0.4em;
}
.post-body p { margin: 0 0 1.4em; }
.post-body a { color: var(--red); text-decoration: underline; text-underline-offset: 3px; }
.post-body a:hover, .post-body a:focus { color: var(--red-hover); }
.post-body ul, .post-body ol { padding-left: 1.4em; margin: 0 0 1.4em; }
.post-body li { margin: 0.2em 0; }
.post-body blockquote {
  margin: 2em 0;
  padding: 0 0 0 24px;
  border-left: 3px solid var(--red);
  color: var(--muted);
}
.post-body code {
  font-family: "JetBrains Mono", monospace;
  font-size: 0.9em;
  border-bottom: 1px solid var(--ink);
}
.post-body pre {
  margin: 1.6em 0;
  padding: 16px;
  background: var(--paper);
  border: 1px solid var(--ink);
  overflow-x: auto;
  font-size: 0.875rem;
}
.post-body pre code {
  border-bottom: none;
}
.post-body img { margin: 2em auto; }
.post-body hr {
  border: none;
  border-top: 1px solid var(--ink);
  margin: 3em 0;
}
.post-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 64px;
  padding-top: 24px;
  border-top: 1px solid var(--ink);
  font-size: 0.875rem;
}
.post-nav-link.is-empty { visibility: hidden; }
.post-next { text-align: right; }

/* Tag and category lists */
.tag-list, .cat-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
}
.tag-list li, .cat-list li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 12px 0;
  border-bottom: 1px solid var(--rule);
  font-size: 0.9375rem;
}
.tag-list .count, .cat-list .count {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

/* About page */
.about {
  max-width: 68ch;
  margin: 0 auto;
  padding: 64px 32px;
}
.about h1 {
  font-size: clamp(2.25rem, 5vw, 4rem);
  font-weight: 700;
  margin: 0 0 48px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.about h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin: 3em 0 1em;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-top: 1px solid var(--ink);
  padding-top: 1em;
}
.about h2 .num {
  color: var(--red);
  margin-right: 12px;
}
.about ul { padding-left: 1.4em; }
.about p { margin: 0 0 1.4em; }

/* Mobile */
@media (max-width: 720px) {
  .nav { padding: 12px 6vw; gap: 12px; font-size: 0.8125rem; }
  .section, .post, .about, .home { padding-left: 6vw; padding-right: 6vw; }
  .post-row { grid-template-columns: 56px 1fr; }
  .post-row .post-tags { grid-column: 1 / -1; padding-left: 72px; }
  .section-header { flex-direction: column; align-items: flex-start; }
  .post-nav { grid-template-columns: 1fr; }
  .post-next { text-align: left; }
}
```

**Step 2: Verify it parses**

Run: `node -e "require('fs').readFileSync('css/style.css','utf-8')" && echo "ok"`
Expected: `ok`

**Step 3: Commit**

```bash
git add css/style.css
git commit -m "feat(css): Brutalist Swiss design system, mono + 1px rules + red accent"
```

---

### Task 10: Remove obsolete CSS files

**Files:**
- Delete: `css/var.css`, `css/index.css`, `css/recommend.css`, `css/custom.css`

**Step 1: Verify they are not referenced**

Run: `grep -rn "var.css\|index.css\|recommend.css\|custom.css" --include="*.html" --include="*.mjs" .`
Expected: no matches.

**Step 2: Delete the files**

```bash
rm css/var.css css/index.css css/recommend.css css/custom.css
```

**Step 3: Commit**

```bash
git add -u css/
git commit -m "chore(css): remove obsolete style fragments (merged into style.css)"
```

---

## Phase 4: Static pages

### Task 11: Rewrite home page (index.html)

**Files:**
- Modify: `index.html`

**Step 1: Replace the file with the manifesto template**

The home page is no longer generated by the build script. It is hand-maintained. Save this as `index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>吴佳翮 | LLM Systems Engineer</title>
    <meta name="description" content="吴佳翮的个人主页：LLM 系统工程与产品体验并重。" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="css/style.css" />
  </head>
  <body>
    <nav class="nav">
      <a href="/" class="is-current" aria-current="page">/</a>
      <a href="writing/">writing</a>
      <a href="index/">index</a>
      <a href="about/">about</a>
    </nav>

    <main class="home">
      <p class="home-label">// LLM SYSTEMS ENGINEER</p>
      <p class="home-name">WU, JIAGE</p>

      <h1>
        I BUILD<br />
        <span class="red">LANGUAGE TOOLS</span><br />
        AND AGENT SYSTEMS.
      </h1>

      <p class="home-meta">吴佳翮 · Guangzhou · 2026</p>
      <p class="home-now">designing the Wuu language · shipping v0.2 of LLMux · writing about agents and compilers</p>
    </main>

    <footer class="footer">
      © 2026 吴佳翮 · <a href="mailto:lpageo@163.com">lpageo@163.com</a> · <a href="https://github.com/blueberrycongee">github</a>
    </footer>
  </body>
</html>
```

**Step 2: Verify it is valid HTML**

Run: `node -e "const h=require('fs').readFileSync('index.html','utf-8'); if(!h.includes('I BUILD')) throw 'no h1'; if(!h.includes('home')) throw 'no class'; console.log('ok');"`
Expected: `ok`.

**Step 3: Commit**

```bash
git add index.html
git commit -m "feat(home): manifesto single-screen with mono label, red-accent h1, /now line"
```

---

### Task 12: Rewrite about page

**Files:**
- Modify: `about/index.html`

**Step 1: Replace the file**

Save as `about/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>about | 吴佳翮</title>
    <meta name="description" content="About 吴佳翮 — LLM Systems Engineer." />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../css/style.css" />
  </head>
  <body>
    <nav class="nav">
      <a href="../">/</a>
      <a href="../writing/">writing</a>
      <a href="../index/">index</a>
      <a href="./" class="is-current" aria-current="page">about</a>
    </nav>

    <main class="about">
      <h1>about</h1>

      <p>我是吴佳翮，做 LLM 系统与编程语言。日常写代码比写文章多，但偶尔会想清楚一些事情然后记下来。</p>

      <h2 id="now"><span class="num">01</span>now</h2>
      <p>designing the Wuu language · shipping v0.2 of LLMux · writing about agents and compilers</p>
      <p>主要在关注：人机（AI）协作的潜力边界，PL / Go / 云原生 / 高性能 / vLLM，Agent 系统，热爱开源以及开源社区。</p>

      <h2 id="work"><span class="num">02</span>work</h2>
      <h3>Lumina Note</h3>
      <p>个人知识库 Agent，聚焦多 Agent 协作与桌面体验。Rust + Tauri v2 + SQLite Vector + LangGraph。2025。</p>
      <h3>LLMux</h3>
      <p>LLM 代理网关，支持路由、多租户与可观测。Go + Postgres + Redis + OpenTelemetry。2026。</p>
      <h3>Wuu</h3>
      <p>实验性质的自研语言，正在推进自举（self-hosting）。编译器、运行时一手包办。2026。</p>

      <h2 id="experience"><span class="num">03</span>experience</h2>
      <h3>清华大学智能产业研究院（AIR） · 研究实习生</h3>
      <p>LLM 量化方向，参与 AWQ 复现与实验分析。</p>
      <h3>广东工业大学 · 计算机科学与技术 本科</h3>
      <p>研究方向：LLM 量化与系统工程。</p>

      <h2 id="contact"><span class="num">04</span>contact</h2>
      <p>email: <a href="mailto:lpageo@163.com">lpageo@163.com</a></p>
      <p>github: <a href="https://github.com/blueberrycongee">github.com/blueberrycongee</a></p>
      <p>Guangzhou, China · 欢迎讨论 LLM 系统与工具链。</p>
    </main>

    <footer class="footer">
      © 2026 吴佳翮 · <a href="mailto:lpageo@163.com">lpageo@163.com</a> · <a href="https://github.com/blueberrycongee">github</a>
    </footer>
  </body>
</html>
```

**Step 2: Verify it is valid**

Run: `node -e "const h=require('fs').readFileSync('about/index.html','utf-8'); if(!h.includes('class=\"num\"')) throw 'no numerals'; console.log('ok');"`
Expected: `ok`.

**Step 3: Commit**

```bash
git add about/index.html
git commit -m "feat(about): 4-section long form, mono chapter numerals"
```

---

### Task 13: Rewrite bangumis and Gallery

**Files:**
- Modify: `bangumis/index.html`
- Modify: `Gallery/index.html`

**Step 1: Check existing content for both pages**

Run: `head -20 bangumis/index.html Gallery/index.html`
Note existing structure to preserve any data.

**Step 2: Replace each with minimal list**

Save as `bangumis/index.html`:

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>bangumis | 吴佳翮</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&family=JetBrains+Mono:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <link rel="stylesheet" href="../css/style.css" />
  </head>
  <body>
    <nav class="nav">
      <a href="../">/</a>
      <a href="../writing/">writing</a>
      <a href="../index/">index</a>
      <a href="../about/">about</a>
    </nav>
    <main class="section">
      <p class="section-meta">// archived collection</p>
      <h1 class="section-title">bangumis</h1>
      <p>placeholder list — preserved from old site.</p>
    </main>
    <footer class="footer">© 2026 吴佳翮 · <a href="mailto:lpageo@163.com">lpageo@163.com</a> · <a href="https://github.com/blueberrycongee">github</a></footer>
  </body>
</html>
```

Save as `Gallery/index.html` (replace the `<h1>` text with `gallery` and adjust title accordingly).

**Step 3: Verify**

Run: `node -e "['bangumis/index.html','Gallery/index.html'].forEach(f => require('fs').readFileSync(f,'utf-8'))" && echo "ok"`
Expected: `ok`.

**Step 4: Commit**

```bash
git add bangumis/index.html Gallery/index.html
git commit -m "feat(collections): bangumis & Gallery minimal list with archived marker"
```

---

## Phase 5: Delete obsolete

### Task 14: Delete archives, blog, and old JS

**Files:**
- Delete: `archives/` (whole tree)
- Delete: `blog/` (whole tree, after writing/ generated)
- Delete: `js/main.mjs`

**Step 1: Verify the new outputs are in place**

Run: `ls writing/index.html index/index.html index/tags.html index/categories.html`
Expected: all four exist.

**Step 2: Remove the old artefacts**

```bash
rm -rf archives/ blog/
rm js/main.mjs
```

**Step 3: Verify nothing references them**

Run: `grep -rn "archives/\|/blog/\|main.mjs" --include="*.html" --include="*.mjs" . 2>/dev/null || echo "no matches"`
Expected: `no matches`.

**Step 4: Commit**

```bash
git add -u
git commit -m "chore: remove archives, blog, and main.mjs (replaced by writing/, index/, no JS)"
```

---

## Phase 6: Update tests

### Task 15: Update homepage tests for new structure

**Files:**
- Modify: `scripts/homepage.test.mjs`
- Modify: `scripts/homepage-links.test.mjs`
- Modify: `scripts/homepage-focus.test.mjs`

**Step 1: Rewrite homepage.test.mjs**

Save as `scripts/homepage.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");

test("homepage has 4-item nav and marks current page", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes('href="/"'), "nav has /");
  assert.ok(html.includes('href="writing/"'), "nav has writing/");
  assert.ok(html.includes('href="index/"'), "nav has index/");
  assert.ok(html.includes('href="about/"'), "nav has about/");
  assert.ok(html.includes('class="is-current"'), "current page marked");
});

test("homepage has manifesto h1 with red accent line", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes("I BUILD"), "first line of h1");
  assert.ok(html.includes("LANGUAGE TOOLS"), "red accent line");
  assert.ok(html.includes('class="red"'), "red class on accent line");
  assert.ok(html.includes("AND AGENT SYSTEMS"), "third line of h1");
});

test("homepage has /now line", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes("home-now"), "/now line present");
  assert.ok(html.includes("Wuu language") || html.includes("LLMux"), "/now content present");
});

test("homepage has no removed sections", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(!html.includes("Selected Work"), "Selected Work removed");
  assert.ok(!html.includes("hero-card"), "hero-card removed");
  assert.ok(!html.includes("data-reveal"), "data-reveal removed");
});
```

**Step 2: Rewrite homepage-links.test.mjs**

Save as `scripts/homepage-links.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "..", "index.html");
const aboutPath = path.join(__dirname, "..", "about", "index.html");

test("footer has email and github", async () => {
  const html = await fs.readFile(indexPath, "utf-8");
  assert.ok(html.includes("lpageo@163.com"), "email present");
  assert.ok(html.includes("github.com/blueberrycongee"), "github present");
});

test("about page references selected projects", async () => {
  const html = await fs.readFile(aboutPath, "utf-8");
  assert.ok(html.includes("Lumina-Note") || html.includes("Lumina Note"), "Lumina Note project");
  assert.ok(html.includes("LLMux"), "LLMux project");
  assert.ok(html.includes("Wuu"), "Wuu project");
});
```

**Step 3: Rewrite homepage-focus.test.mjs**

Save as `scripts/homepage-focus.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const homePath = path.join(__dirname, "..", "index.html");
const aboutPath = path.join(__dirname, "..", "about", "index.html");

test("homepage /now line matches about /now section", async () => {
  const home = await fs.readFile(homePath, "utf-8");
  const about = await fs.readFile(aboutPath, "utf-8");

  // Extract /now content from home (after the home-now prefix)
  const homeNowMatch = home.match(/class="home-now">([^<]+)</);
  const aboutNowMatch = about.match(/id="now">[\s\S]*?<p>([^<]+)</);

  assert.ok(homeNowMatch, "home has home-now line");
  assert.ok(aboutNowMatch, "about has /now section");
  assert.equal(
    homeNowMatch[1].trim(),
    aboutNowMatch[1].trim(),
    "home /now content matches about /now content"
  );
});
```

**Step 4: Run tests**

Run: `node --test "scripts/**/*.test.mjs"`
Expected: all pass.

**Step 5: Commit**

```bash
git add scripts/homepage.test.mjs scripts/homepage-links.test.mjs scripts/homepage-focus.test.mjs
git commit -m "test: rewrite homepage tests for brutalist manifesto structure"
```

---

### Task 16: Add writing-index test

**Files:**
- Create: `scripts/tests/writing-index.test.mjs`

**Step 1: Write the test**

Save as `scripts/tests/writing-index.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const writingPath = path.join(__dirname, "..", "..", "writing", "index.html");

test("writing index groups by year and links to posts", async () => {
  const html = await fs.readFile(writingPath, "utf-8");
  assert.ok(html.includes("/writing/") || html.includes("writing"), "writing title present");
  assert.ok(html.includes("/index/"), "link to /index/ present");
  assert.ok(html.match(/<h2[^>]*class="year">20\d\d/), "year heading");
  assert.ok(html.includes("post-row"), "post-row class present");
  assert.ok(!html.includes("excerpt"), "no excerpt");
});
```

**Step 2: Run build and test**

Run: `node scripts/build-blog.mjs && node --test scripts/tests/writing-index.test.mjs`
Expected: build runs, test passes.

**Step 3: Commit**

```bash
git add scripts/tests/writing-index.test.mjs
git commit -m "test: writing index year groups and link to /index/"
```

---

### Task 17: Add post prev/next test

**Files:**
- Create: `scripts/tests/post-prev-next.test.mjs`

**Step 1: Write the test**

Save as `scripts/tests/post-prev-next.test.mjs`:

```javascript
import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

test("at least one post has both prev and next links", async () => {
  // Find any generated post HTML
  const candidates = await collectPosts(root);
  assert.ok(candidates.length > 0, "at least one post exists");

  let found = 0;
  for (const file of candidates) {
    const html = await fs.readFile(file, "utf-8");
    if (html.includes("post-prev") && html.includes("post-next") &&
        !html.includes('class="post-prev is-empty"') &&
        !html.includes('class="post-next is-empty"')) {
      found += 1;
    }
  }
  assert.ok(found > 0, "at least one post with both prev and next");
});

test("newest post has empty prev side and populated next side", async () => {
  // The newest post is the first one rendered
  const candidates = (await collectPosts(root)).sort();
  const html = await fs.readFile(candidates[0], "utf-8");
  // First post in iteration = newest. It should have NO prev (empty placeholder)
  // and yes next.
  assert.ok(html.includes("post-prev is-empty"), "newest post has no prev");
  assert.ok(!html.includes("post-next is-empty"), "newest post has next");
});

async function collectPosts(rootDir) {
  const out = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (["node_modules", ".git", "scripts", "css", "js", "assets", "img", "images", "index", "writing", "about", "bangumis", "Gallery", "categories", "tags"].includes(e.name)) continue;
        await walk(full);
      } else if (e.name === "index.html") {
        // Only consider YYYY/MM/DD paths
        if (/\/\d{4}\/\d{2}\/\d{2}\//.test(full)) {
          out.push(full);
        }
      }
    }
  }
  await walk(rootDir);
  return out;
}
```

**Step 2: Run build and test**

Run: `node scripts/build-blog.mjs && node --test scripts/tests/post-prev-next.test.mjs`
Expected: build runs, tests pass.

**Step 3: Commit**

```bash
git add scripts/tests/post-prev-next.test.mjs
git commit -m "test: post prev/next rendering on generated posts"
```

---

## Phase 7: Final verification and ship

### Task 18: Run all tests and full build

**Step 1: Run full build**

Run: `node scripts/build-blog.mjs`
Expected: `Generated N posts.` with no error.

**Step 2: Run all tests**

Run: `node --test "scripts/**/*.test.mjs"`
Expected: all pass.

**Step 3: Verify the four key pages exist and have content**

Run: `ls index.html writing/index.html index/index.html about/index.html 2>&1`
Expected: all four paths print successfully.

**Step 4: Sanity check the new home page renders without CSS errors**

Open `index.html` in a browser locally (manual step). Verify:
- Mono font for body and headings
- Black text on warm paper
- Red on `LANGUAGE TOOLS` line
- No rounded corners, no shadows
- Nav has 4 items, `/` is red-highlighted

**Step 5: Sanity check writing index**

Open `writing/index.html` in browser. Verify:
- Year headings in red
- One-line post rows
- No card UI
- `/index/` link visible

**Step 6: Sanity check a post page**

Open any `/YYYY/MM/DD/<slug>/index.html` in browser. Verify:
- Inter for body, mono for h2/h3
- Back link to `/writing/`
- Prev/next at bottom

**Step 7: Commit any final fixes**

If any manual step required a fix, commit the fix. Otherwise no commit.

---

### Task 19: Final commit and push

**Step 1: Verify clean working tree**

Run: `git status`
Expected: clean (no `M` or `??`).

**Step 2: Push**

Run: `git push origin main`
Expected: push succeeds.

**Step 3: Confirm remote is in sync**

Run: `git fetch && git status -sb`
Expected: `## main...origin/main` with no ahead/behind.

---

## Done

The site is now:

- Brutalist Swiss / Bauhaus throughout
- Single manifesto home page
- 4-item nav: `/`, `writing/`, `index/`, `about/`
- Prev/next post navigation
- Tags and categories index pages
- No animations, no parallax, no JS
- Build script generates: posts, writing, index (3 views)
- All tests pass
