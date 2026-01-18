# 轻量 Markdown 博客使用指南

## 项目结构

```
blueberrycongee.github.io/
├── content/
│   └── posts/                ← 文章 Markdown 源文件
├── blog/
│   ├── index.html            ← 博客列表页（生成）
│   └── posts.json            ← 文章索引（生成）
├── YYYY/MM/DD/slug/          ← 文章详情页（生成）
├── css/style.css             ← 统一风格样式
├── js/main.mjs               ← 交互与动效
└── scripts/
    ├── build-blog.mjs        ← 博客生成脚本
    └── blog-utils.mjs        ← Front-matter 解析
```

## 写新文章

1. 在 `content/posts/` 新建 `.md` 文件
2. 文件名就是文章的 URL slug（支持中文）
3. 添加 front-matter：

```markdown
---
title: 文章标题
date: 2025-12-28 20:00:00
tags:
  - 标签
categories:
  - 分类
---

正文开始...
```

## 生成博客页面

在仓库根目录执行：

```bash
node scripts/build-blog.mjs
```

它会：
- 根据 `date` 生成 `/YYYY/MM/DD/slug/` 路径
- 生成 `blog/index.html` 列表页与 `blog/posts.json`
- 输出每篇文章的 `index.html`

如果没有 `date`，文章会输出到 `/posts/<文件名>/`。

## 图片使用

图片放到 `images/posts/`，在 Markdown 中使用绝对路径：

```markdown
![说明](/images/posts/your-image.jpg)
```

## 发布

```bash
git add -A
git commit -m "更新文章"
git push
```

## 常见问题

- **文章标题重复？** 用不同的文件名即可。
- **链接是否会断？** 采用 Hexo 的 `YYYY/MM/DD/slug` 结构，旧链接可继续使用。

---

最后更新：2025-01-18
