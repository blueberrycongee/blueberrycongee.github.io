import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "./vendor/marked.esm.mjs";
import {
  buildPostOutputPath,
  extractFrontMatter,
  formatDate,
  parseFrontMatter,
  slugFromFilename,
} from "./blog-utils.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const contentDir = path.join(root, "content", "posts");
const blogDir = path.join(root, "blog");

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
      href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
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

    <footer class="footer">© 2025 吴佳翮 · Built for performance-first storytelling.</footer>

    <script type="module" src="/js/main.mjs"></script>
  </body>
</html>
`;

const renderPost = ({ title, date, tags, html }) => {
  const meta = [date, ...(tags ?? [])].filter(Boolean).join(" · ");

  return renderLayout({
    title: `${title} | 吴佳翮`,
    description: title,
    bodyHtml: `
      <section class="section">
        <article class="markdown">
          ${meta ? `<p class="markdown-meta">${meta}</p>` : ""}
          <h1>${title}</h1>
          ${html}
        </article>
      </section>
    `,
  });
};

const renderBlogIndex = (posts) => {
  const tagCounts = new Map();
  posts.forEach((post) => {
    (post.tags || []).forEach((tag) => {
      if (!tag) {
        return;
      }
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
    });
  });

  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 12)
    .map(([tag]) => tag);

  const cards = posts
    .map((post, index) => {
      const delay = 80 + index * 60;
      const tags = post.tags.length
        ? `<div class="blog-tags">${post.tags
            .map((tag) => `<span class="tag">${tag}</span>`)
            .join("")}</div>`
        : "";
      const excerpt = post.excerpt ? `<p class="blog-excerpt">${post.excerpt}</p>` : "";

      return `
        <a class="blog-card" href="${post.url}" data-reveal style="--delay: ${delay}ms">
          <div class="blog-meta">
            <span>${post.dateDisplay}</span>
          </div>
          <h3 class="blog-title">${post.title}</h3>
          ${excerpt}
          ${tags}
        </a>
      `;
    })
    .join("\n");

  const tagBlock = topTags.length
    ? `
        <div class="sidebar-card">
          <h3>Topics</h3>
          <div class="sidebar-tags">
            ${topTags.map((tag) => `<span class="tag">${tag}</span>`).join("")}
          </div>
        </div>
      `
    : "";

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
        <div class="blog-layout">
          <div class="blog-main">
            <div class="blog-list">
              ${cards}
            </div>
          </div>
          <aside class="blog-side">
            <div class="sidebar-card">
              <h3>About</h3>
              <p>Journal entries, study notes, and quiet reflections on the world.</p>
            </div>
            ${tagBlock}
          </aside>
        </div>
      </section>
    `,
  });
};

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
    const outputPath = path.join(root, post.outputRelative);
    await ensureDir(outputPath);
    const pageHtml = renderPost({
      title: post.title,
      date: post.dateDisplay,
      tags: post.tags,
      html: post.html,
    });
    await fs.writeFile(outputPath, pageHtml, "utf-8");
  }
};

const writeBlogIndex = async (posts) => {
  await fs.mkdir(blogDir, { recursive: true });
  const pageHtml = renderBlogIndex(posts);
  await fs.writeFile(path.join(blogDir, "index.html"), pageHtml, "utf-8");
};

const writePostsIndex = async (posts) => {
  const data = posts.map((post) => ({
    title: post.title,
    date: post.dateDisplay,
    url: post.url,
    tags: post.tags,
    excerpt: post.excerpt,
  }));
  await fs.writeFile(path.join(blogDir, "posts.json"), JSON.stringify(data, null, 2), "utf-8");
};

const main = async () => {
  const posts = await readMarkdownPosts();
  await writePosts(posts);
  await writeBlogIndex(posts);
  await writePostsIndex(posts);
  console.log(`Generated ${posts.length} posts.`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
