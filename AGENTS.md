# blueberrycongee.github.io

吴佳翮的个人主页，Hugo 静态站，部署于 GitHub Pages（Actions 构建）。

## 技术栈

- Hugo `0.170.0`（`brew install hugo`），无 theme，全部模板在 `layouts/`
- 无前端框架、无外部 CDN/运行时请求；字体自托管（`static/fonts/`）

## 常用命令

- `hugo` — 构建到 `public/`（`--gc` 清理缓存）
- `hugo server --port 1313` — 本地预览
- `python3 scripts/import-photos.py <目录或文件…>` — 导入照片到 `assets/photos/`（需要 Pillow；HEIC 走 macOS `sips`）
- `.github/workflows/hugo.yml` — push main 自动部署（`hugo --minify`）

## 照片

- 原片放在仓库**外**，只通过 `scripts/import-photos.py` 进 `assets/photos/`：转正、转 sRGB、长边压到 2560、存 JPEG，EXIF 按白名单重建（机身/镜头/曝光/拍摄时间），GPS、序列号、机主名不会进仓库。**不要手动拷原片进去**（Hugo 也处理不了 HEIC，构建时会 WARN 并跳过）
- 展示顺序 = 文件名顺序，改名即可重排
- `data/photos.yaml` 可选：按文件名（不含扩展名）写 `title` / `place` / `date` / `tech` / `hide`；日期与曝光参数默认读 EXIF
- `layouts/partials/photos.html` 是照片数据的唯一入口（用 `partialCached` 调用），每张产出 `xs`/`thumb`/`md`/`lg` 四档 WebP 和主色；站点只发布这些派生图，不发布 `assets/photos/` 里的文件
- `assets/photos-sample/` 是本地生成的占位图（已 gitignore，新 clone 里没有），仅当 `assets/photos/` 为空时使用；两者都空时首页只剩自述卡
- CI 不缓存 `resources/`，每次构建都重新处理全部照片；照片多到拖慢部署时，给 `resources/_gen` 加 `actions/cache`

## 仓库结构

- `content/posts/` — 文章（frontmatter: title/date/tags/categories/cover）
- `content/posts/_index.md` — section 标题「文章」
- `content/about.md` — 被 `_default/single.html` 按文件名特判解析成结构化页面（**勿改文件名**，新增普通页面会走 `.prose` 默认分支）
- `assets/photos/` + `data/photos.yaml` — 首页照片及其说明（见上）
- `images/covers/` — 封面图，经 `module.mounts` 挂到 `/images/covers/`（frontmatter `cover` 引用此路径）
- 域名：直接用 `blueberrycongee.github.io`，仓库里没有 `CNAME`（Pages 设置里也不填自定义域名）

## 前端结构（改动时注意归属）

- `layouts/` — `index.html` 首页舞台、`posts/` 文章、`taxonomy.html`+`term.html`（必须在根，`_default/` 下会被 v0.146+ 查找顺序吞掉）、`_default/single.html` 静态页、`_default/baseof.html` 骨架、`partials/`（head、头尾、`photos.html`、`roll.html` 页脚底片条、`post-row.html` 文章行）
- `assets/css/NN-*.css` — 按文件名序 concat 成一个 bundle；`01-tokens.css` 是全部设计 token（明暗双套），新样式请用 token 别硬编码颜色
- `assets/js/*.js` — 同样 concat；全部是渐进增强，禁 JS 必须可用，`prefers-reduced-motion` 必须降级
- 首页舞台 = `07-home.css` + `assets/js/strip.js`：无 JS 时是一行可横向滚动的链接；`strip.js` 加上 `.is-live` 后接管全部定位。每一格是固定 100×100 的盒子，位置和尺寸全靠 `transform`，内容在盒内反向缩放——逐帧只改 transform，别在 tick 里写 width/height/left 或读布局。两种姿态由 `z` 插值：index（全部是细条，连续滚动）和 view（一格展开）。落地时自述卡展开；**滚轮、触控板、鼠标拖动永远作用在 index 上**——有格子展开时先收回再连续滚动，不要做成"一次翻一格"的分页（触控板惯性会被截断，手感很差）；逐格翻看只留给方向键和触摸滑动
- 舞台手感的几条硬规矩：运动中用亚像素坐标、静止时才对齐设备像素；循环休眠后第一帧的 `dt` 固定为一帧（否则每次起步都会跳一下）；大图只在运动平静后、用 `decode()` 解码完再整个替换元素，收回后换回小图
- 首页的自述文案在 `layouts/index.html` 的 `.card-say`
- 明/暗主题：`html[data-theme]`，默认暗色（不跟随系统），用户切到浅色后记在 `localStorage`；`head.html` 内联脚本预初始化（勿移到 defer JS 里，会 FOUC）

## 约定

- 文章中英混排，CJK 走系统字体（PingFang SC 等）；webfont 只下 latin 子集
- 新文章只需 `content/posts/xxx.md` + frontmatter，URL 为 `/posts/:slug/`
- `hugo.toml` 的 `[module.mounts]` 把 `content/ assets/ static/ images/` 挂载就位，新增目录需在此登记（`data/`、`layouts/` 走默认挂载，无需登记）
