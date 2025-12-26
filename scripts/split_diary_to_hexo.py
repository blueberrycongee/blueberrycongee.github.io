#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
将「大学自述.md」拆分成独立的 Hexo 文章
"""
import os
import re
from datetime import datetime

# 路径配置
MD_PATH = r"D:\Desktop\allmd\大学自述.md"
OUTPUT_DIR = r"D:\Desktop\blog-source\source\_posts"

def parse_date(title):
    """从标题解析日期"""
    # 格式1: 2025.4.26
    m = re.match(r'^(\d{4})\.(\d{1,2})\.(\d{1,2})', title)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return datetime(y, mo, d)
    
    # 格式2: 2025年6月7日
    m = re.match(r'^(\d{4})年(\d{1,2})月(\d{1,2})日', title)
    if m:
        y, mo, d = int(m.group(1)), int(m.group(2)), int(m.group(3))
        return datetime(y, mo, d)
    
    return None

def slugify(title):
    """生成文件名安全的slug"""
    s = title.strip()
    s = re.sub(r'\s+', '-', s)
    s = s.replace(':', '-')
    s = re.sub(r'[^\w\-\.\u4e00-\u9fa5]', '', s)
    s = re.sub(r'-+', '-', s)
    return s

def split_diary(md_content):
    """拆分日记为多篇文章"""
    lines = md_content.splitlines()
    entries = []
    
    # 日期模式
    date_patterns = [
        re.compile(r'^\s*####\s+(\d{4}\.\d{1,2}\.\d{1,2}.*)'),  # #### 2025.4.27
        re.compile(r'^\s*####\s+(\d{4}年\d{1,2}月\d{1,2}日.*)'),  # #### 2025年6月7日
        re.compile(r'^(\d{4}\.\d{1,2}\.\d{1,2}.*)$'),  # 2025.4.26 (无####)
        re.compile(r'^(\d{4}年\d{1,2}月\d{1,2}日.*)$'),  # 2025年6月7日 (无####)
    ]
    
    current_title = None
    current_lines = []
    
    for line in lines:
        matched = False
        for pat in date_patterns:
            m = pat.match(line.strip())
            if m:
                # 保存之前的条目
                if current_title:
                    content = '\n'.join(current_lines).strip()
                    if content:
                        entries.append((current_title, content))
                
                current_title = m.group(1).strip()
                current_lines = []
                matched = True
                break
        
        if not matched and current_title:
            current_lines.append(line)
    
    # 保存最后一个条目
    if current_title:
        content = '\n'.join(current_lines).strip()
        if content:
            entries.append((current_title, content))
    
    return entries

def create_hexo_post(title, content, output_dir):
    """创建 Hexo 文章"""
    date = parse_date(title)
    if not date:
        print(f"[跳过] 无法解析日期: {title}")
        return False
    
    # 生成 front-matter
    date_str = date.strftime('%Y-%m-%d %H:%M:%S')
    post_title = f"大学自述 · {title}"
    slug = slugify(f"大学自述-{title}")
    
    front_matter = f"""---
title: {post_title}
date: {date_str}
tags:
  - 日记
  - 大学自述
categories:
  - 日记
---

"""
    
    full_content = front_matter + content
    
    # 写入文件
    filename = f"{slug}.md"
    filepath = os.path.join(output_dir, filename)
    os.makedirs(output_dir, exist_ok=True)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(full_content)
    
    print(f"[创建] {filename}")
    return True

def main():
    print("=" * 50)
    print("拆分大学自述.md 为 Hexo 文章")
    print("=" * 50)
    
    # 读取源文件
    with open(MD_PATH, 'r', encoding='utf-8') as f:
        md_content = f.read()
    
    # 拆分
    entries = split_diary(md_content)
    print(f"\n找到 {len(entries)} 篇日记\n")
    
    # 创建文章
    success = 0
    for title, content in entries:
        if create_hexo_post(title, content, OUTPUT_DIR):
            success += 1
    
    print("=" * 50)
    print(f"完成！成功创建 {success} 篇文章")
    print(f"输出目录: {OUTPUT_DIR}")

if __name__ == '__main__':
    main()
