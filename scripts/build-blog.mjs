import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "./vendor/marked.esm.mjs";
import {
  buildPostOutputPath,
  extractFrontMatter,
  findNeighbours,
  formatDate,
  parseFrontMatter,
  slugFromFilename,
} from "./blog-utils.mjs";

export {
  renderLayout,
  renderPost,
  renderWriting,
  renderIndex,
  findNeighbours,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "posts");
const writingDir = path.join(root, "writing");
const indexDir = path.join(root, "index");

marked.setOptions({
  mangle: false,
  headerIds: false,
});

const ensureDir = async (filePath) => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const stripLeadingTitle = (markdown, title) => {
  const match = markdown.match(/^#\s+(.+)\n+/);
  if (!match) {
    return markdown;
  }
  if (title && match[1].trim() === title.trim()) {
    return markdown.replace(/^#\s+(.+)\n+/, "");
  }
  return markdown;
};

const extractExcerpt = (html) => {
  const match = html.match(/<p>([\s\S]*?)<\/p>/i);
  if (!match) {
    return "";
  }
  const text = match[1].replace(/<[^>]+>/g, "").trim();
  if (text.length <= 140) {
    return text;
  }
  return `${text.slice(0, 140)}...`;
};

const NAV_ITEMS = [
  { label: "/", path: "/", key: "home" },
  { label: "writing", path: "/writing/", key: "writing" },
  { label: "index", path: "/index/", key: "index" },
  { label: "about", path: "/about/", key: "about" },
];

function renderLayout({ title, description, bodyHtml, currentPath = "" }) {
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
}

function renderPost({ title, dateDisplay, tags, html, prev, next, currentPath }) {
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
}

function renderWriting(posts, currentPath) {
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
      const tags =
        post.tags && post.tags.length
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
}

function renderIndex(posts, view, currentPath) {
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
      const cats = p.categories && p.categories.length ? p.categories : ["uncategorized"];
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
}

const readMarkdownPosts = async () => {
  const entries = await fs.readdir(contentDir);
  const posts = [];

  for (const entry of entries) {
    if (!entry.endsWith(".md")) {
      continue;
    }

    const filePath = path.join(contentDir, entry);
    const raw = await fs.readFile(filePath, "utf-8");
    const { frontMatter, body } = extractFrontMatter(raw);
    const data = parseFrontMatter(frontMatter);
    const slug = slugFromFilename(entry);
    const dateDisplay = formatDate(data.date);

    const markdownBody = stripLeadingTitle(body, data.title);
    const html = marked.parse(markdownBody);

    const outputRelative = buildPostOutputPath({
      date: data.date,
      slug,
    });

    const url = `/${outputRelative.replace(/index\.html$/, "").replace(/\\/g, "/")}`;

    posts.push({
      slug,
      title: data.title || slug,
      date: data.date,
      dateDisplay,
      tags: data.tags || [],
      categories: data.categories || [],
      html,
      excerpt: extractExcerpt(html),
      outputRelative,
      url,
    });
  }

  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
};

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

const writeWritingIndex = async (posts) => {
  await fs.mkdir(writingDir, { recursive: true });
  const html = renderWriting(posts, "writing");
  await fs.writeFile(path.join(writingDir, "index.html"), html, "utf-8");
};

const writeIndexPages = async (posts) => {
  await fs.mkdir(indexDir, { recursive: true });
  await fs.writeFile(path.join(indexDir, "index.html"), renderIndex(posts, "time", "index"), "utf-8");
  await fs.writeFile(path.join(indexDir, "tags.html"), renderIndex(posts, "tags", "index"), "utf-8");
  await fs.writeFile(
    path.join(indexDir, "categories.html"),
    renderIndex(posts, "categories", "index"),
    "utf-8"
  );
};

const writeIndexJson = async (posts) => {
  await fs.mkdir(indexDir, { recursive: true });
  const data = posts.map((p) => ({
    title: p.title,
    date: p.dateDisplay,
    url: p.url,
    tags: p.tags,
    categories: p.categories,
  }));
  await fs.writeFile(
    path.join(indexDir, "posts.json"),
    JSON.stringify(data, null, 2),
    "utf-8"
  );
};

const main = async () => {
  const posts = await readMarkdownPosts();
  await writePosts(posts);
  await writeWritingIndex(posts);
  await writeIndexPages(posts);
  await writeIndexJson(posts);
  console.log(`Generated ${posts.length} posts.`);
};

const isMain = import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
