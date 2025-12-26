#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
从旧博客 HTML 中提取文章内容，转换为 Hexo 文章
"""
import os
import re
from html import unescape
from urllib.parse import unquote

OLD_BLOG_DIR = r"D:\Desktop\blueberrycongee.github.io\2022"
OUTPUT_DIR = r"D:\Desktop\blog-source\source\_posts"

# 文章信息列表（从 HTML 中提取的元数据）
ARTICLES = [
    {
        "path": "11/17/NovelAi",
        "title": "NovelAi Keyword",
        "date": "2022-11-17 09:29:20",
        "category": "闲着无聊写着玩的",
        "tags": ["杂谈"],
    },
    {
        "path": "11/17/hello-world",
        "title": "Hello World",
        "date": "2022-11-17 09:00:00",
        "category": "闲着无聊写着玩的",
        "tags": ["杂谈"],
    },
    {
        "path": "11/19/hexo clean",
        "title": "hexo一些操作",
        "date": "2022-11-19 17:33:58",
        "category": "易忘之事",
        "tags": ["杂谈"],
    },
    {
        "path": "11/19/markdown写作模板",
        "title": "markdown写文模板",
        "date": "2022-11-19 19:54:13",
        "category": "易忘之事",
        "tags": ["杂谈"],
    },
    {
        "path": "11/19/闲话",
        "title": "闲话-22.11.19",
        "date": "2022-11-19 19:50:42",
        "category": "日记",
        "tags": ["杂谈"],
    },
    {
        "path": "11/20/雨中冒险2攻略",
        "title": "雨中冒险2攻略",
        "date": "2022-11-20 00:33:44",
        "category": "GAMES！",
        "tags": ["游戏"],
    },
    {
        "path": "11/21/高效休息法",
        "title": "高效休息法",
        "date": "2022-11-21 04:48:46",
        "category": "读书分享",
        "tags": ["读书"],
    },
    {
        "path": "11/22/python脚本自动连接工大校园网",
        "title": "python脚本自动连接工大校园网",
        "date": "2022-11-22 20:32:24",
        "category": "易忘之事",
        "tags": ["python"],
    },
    {
        "path": "12/20/最近在干的事情",
        "title": "最近在干的事情",
        "date": "2022-12-20 01:49:10",
        "category": "日记",
        "tags": ["杂谈"],
    },
]

def extract_content_from_html(html_path):
    """从 HTML 中提取文章正文"""
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    
    # 提取 article-container 中的内容
    match = re.search(r'<article class="post-content" id="article-container">(.*?)</article>', html, re.S)
    if not match:
        return ""
    
    content = match.group(1)
    
    # 简单的 HTML 到 Markdown 转换
    # 标题
    content = re.sub(r'<h1[^>]*><a[^>]*></a>([^<]*)</h1>', r'# \1\n\n', content)
    content = re.sub(r'<h1[^>]*>([^<]*)</h1>', r'# \1\n\n', content)
    content = re.sub(r'<h2[^>]*><a[^>]*></a>([^<]*)</h2>', r'## \1\n\n', content)
    content = re.sub(r'<h2[^>]*>([^<]*)</h2>', r'## \1\n\n', content)
    content = re.sub(r'<h3[^>]*><a[^>]*></a>([^<]*)</h3>', r'### \1\n\n', content)
    content = re.sub(r'<h3[^>]*>([^<]*)</h3>', r'### \1\n\n', content)
    
    # 段落
    content = re.sub(r'<p>([^<]*)</p>', r'\1\n\n', content)
    content = re.sub(r'<p>(.*?)</p>', r'\1\n\n', content, flags=re.S)
    
    # 代码块
    content = re.sub(r'<pre[^>]*><code[^>]*>(.*?)</code></pre>', r'```\n\1\n```\n\n', content, flags=re.S)
    
    # 删除线
    content = re.sub(r'<del>([^<]*)</del>', r'~~\1~~', content)
    
    # 链接
    content = re.sub(r'<a[^>]*href="([^"]*)"[^>]*>([^<]*)</a>', r'[\2](\1)', content)
    
    # 清理 HTML 实体和标签
    content = unescape(content)
    content = re.sub(r'<[^>]+>', '', content)
    
    # 清理多余空行
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    return content.strip()

def slugify(title):
    """生成文件名安全的slug"""
    s = title.strip()
    s = re.sub(r'\s+', '-', s)
    s = s.replace(':', '-')
    s = re.sub(r'[^\w\-\.\u4e00-\u9fa5]', '', s)
    s = re.sub(r'-+', '-', s)
    return s

def create_hexo_post(article):
    """创建 Hexo 文章"""
    html_path = os.path.join(OLD_BLOG_DIR, article["path"], "index.html")
    
    if not os.path.exists(html_path):
        print(f"[跳过] 文件不存在: {html_path}")
        return False
    
    content = extract_content_from_html(html_path)
    
    # 生成 front-matter
    tags_str = "\n".join([f"  - {t}" for t in article["tags"]])
    
    front_matter = f"""---
title: {article["title"]}
date: {article["date"]}
tags:
{tags_str}
categories:
  - {article["category"]}
---

"""
    
    full_content = front_matter + content
    
    # 写入文件
    filename = f"{slugify(article['title'])}.md"
    filepath = os.path.join(OUTPUT_DIR, filename)
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(full_content)
    
    print(f"[创建] {filename}")
    return True

def main():
    print("=" * 50)
    print("从旧博客提取文章")
    print("=" * 50)
    
    success = 0
    for article in ARTICLES:
        if create_hexo_post(article):
            success += 1
    
    print("=" * 50)
    print(f"完成！成功创建 {success} 篇文章")

if __name__ == '__main__':
    main()
