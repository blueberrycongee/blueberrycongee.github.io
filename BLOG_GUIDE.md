# hecode 博客使用指南

## 项目结构

```
D:\Desktop\
├── blog-source\              ← Hexo 源项目（在这里写文章）
│   ├── source\_posts\        ← 文章存放目录
│   ├── source\about\         ← 关于页面
│   ├── source\music\         ← 音乐页面
│   ├── source\Gallery\       ← 相册页面
│   ├── source\link\          ← 友链页面
│   ├── source\bangumis\      ← 番剧页面
│   ├── source\movies\        ← 电影页面
│   ├── _config.yml           ← Hexo 主配置
│   ├── _config.butterfly.yml ← 主题配置
│   └── public\               ← 生成的静态文件
│
├── blueberrycongee.github.io\ ← GitHub Pages 仓库
│   └── ...                    ← 部署的静态文件
│
└── allmd\大学自述.md          ← 日记源文件
```

## 发布新文章（完整流程）

### 方法一：命令行创建

```powershell
# 1. 进入 Hexo 源项目
cd D:\Desktop\blog-source

# 2. 创建新文章
npx hexo new "文章标题"
# 会在 source/_posts/ 下生成 文章标题.md

# 3. 编辑文章
# 用你喜欢的编辑器打开 source/_posts/文章标题.md

# 4. 生成静态文件
npx hexo clean; npx hexo generate

# 5. 复制到 GitHub Pages 仓库
Copy-Item -Path "public\*" -Destination "D:\Desktop\blueberrycongee.github.io\" -Recurse -Force

# 6. 推送到 GitHub
cd D:\Desktop\blueberrycongee.github.io
git add -A
git commit -m "新文章：文章标题"
git push
```

### 方法二：手动创建

1. 在 `D:\Desktop\blog-source\source\_posts\` 目录下新建 `.md` 文件
2. 文件开头添加 Front-matter：

```markdown
---
title: 文章标题
date: 2025-12-26 20:00:00
tags:
  - 标签1
  - 标签2
categories:
  - 分类名
---

这里开始写正文...
```

3. 然后执行步骤 4-6

## 文章 Front-matter 模板

```markdown
---
title: 文章标题
date: 2025-12-26 20:00:00
tags:
  - 日记
  - 大学自述
categories:
  - 日记
cover: /images/covers/your-cover.jpg  # 可选：封面图
---
```

## 图片使用

### 图片存放位置

```
D:\Desktop\blueberrycongee.github.io\images\
├── covers\    ← 文章封面图
└── posts\     ← 文章正文配图
```

### 在文章中引用图片

```markdown
![图片描述](/images/posts/your-image.jpg)
```

### 添加图片的完整流程

1. 把图片放到 `D:\Desktop\blueberrycongee.github.io\images\posts\`
2. 在文章中用 `/images/posts/文件名.jpg` 引用
3. 发布文章时图片会一起上传

## 常用命令速查

| 命令 | 说明 |
|------|------|
| `npx hexo new "标题"` | 创建新文章 |
| `npx hexo new page "页面名"` | 创建新页面 |
| `npx hexo clean` | 清除缓存 |
| `npx hexo generate` | 生成静态文件 |
| `npx hexo server` | 本地预览（localhost:4000） |

## 一键发布脚本

把以下内容保存为 `D:\Desktop\blog-source\deploy.ps1`：

```powershell
# 一键发布脚本
Write-Host "开始生成博客..." -ForegroundColor Green
npx hexo clean
npx hexo generate

Write-Host "复制到 GitHub Pages..." -ForegroundColor Green
Copy-Item -Path "public\*" -Destination "D:\Desktop\blueberrycongee.github.io\" -Recurse -Force

Write-Host "推送到 GitHub..." -ForegroundColor Green
Set-Location "D:\Desktop\blueberrycongee.github.io"
git add -A
$msg = Read-Host "请输入提交信息"
git commit -m $msg
git push

Write-Host "发布完成！" -ForegroundColor Green
Set-Location "D:\Desktop\blog-source"
```

使用方法：
```powershell
cd D:\Desktop\blog-source
.\deploy.ps1
```

## 博客网址

**https://blueberrycongee.github.io**

## 注意事项

1. **先写文章，后生成**：修改文章后必须重新 `hexo generate`
2. **图片路径**：使用绝对路径 `/images/...`，不要用相对路径
3. **日期格式**：`YYYY-MM-DD HH:mm:ss`
4. **中文文件名**：建议文章文件名用英文或拼音，避免编码问题

---

最后更新：2025-12-26
