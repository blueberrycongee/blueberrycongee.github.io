# blueberrycongee.github.io

吴佳翮的个人主页，Hugo 静态站，部署于 GitHub Pages（Actions 构建）。

## 技术栈

- Hugo `0.170.0`（`brew install hugo`），无 theme，全部模板在 `layouts/`
- 无前端框架、无外部 CDN/运行时请求；字体自托管（`static/fonts/`）
- 方向：极简「工程师笔记本」风。旧版杂志编辑风已弃用，不要复刻

## 常用命令

- `hugo` — 构建到 `public/`（`--gc` 清理缓存）
- `hugo server --port 1313` — 本地预览
- `.github/workflows/hugo.yml` — push main 自动部署（`hugo --minify`）

## 仓库结构

- `content/posts/` — 44 篇文章（frontmatter: title/date/tags/categories/cover）
- `content/posts/_index.md` — section 标题「文章」
- `content/about.md` / `content/bangumis.md` — 被 `_default/single.html` 按文件名特判解析成结构化页面（**勿改文件名**，新增普通页面会走 `.prose` 默认分支）
- `images/covers/` — 封面图，经 `module.mounts` 挂到 `/images/covers/`（frontmatter `cover` 引用此路径）
- `static/CNAME` — 部署用域名文件（仓库根的 `CNAME` 仅作记录）

## 前端结构（改动时注意归属）

- `layouts/` — `index.html` 首页、`posts/` 文章、`taxonomy.html`+`term.html`（必须在根，`_default/` 下会被 v0.146+ 查找顺序吞掉）、`_default/single.html` 静态页、`_default/baseof.html` 骨架、`partials/` 头尾+head
- `assets/css/NN-*.css` — 按文件名序 concat 成一个 bundle；`01-tokens.css` 是全部设计 token（明暗双套），新样式请用 token 别硬编码颜色
- `assets/js/*.js` — 同样 concat；全部是渐进增强，禁 JS 必须可用，`prefers-reduced-motion` 必须降级
- 明/暗主题：`html[data-theme]`，`head.html` 内联脚本预初始化（勿移到 defer JS 里，会 FOUC）

## 约定

- 文章中英混排，CJK 走系统字体（PingFang SC 等）；webfont 只下 latin 子集
- 新文章只需 `content/posts/xxx.md` + frontmatter，URL 为 `/posts/:slug/`
- `hugo.toml` 的 `[module.mounts]` 把 `content/ assets/ static/ images/` 挂载就位，新增目录需在此登记
