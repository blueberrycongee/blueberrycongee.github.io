#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
博客管理工具 - 交互式创建和发布文章
支持：创建新文章、导入外部md文件、发布博客
"""

import os
import sys
import re
import shutil
import subprocess
from datetime import datetime
from pathlib import Path

# ============ 配置区域 ============
BLOG_SOURCE = r"D:\Desktop\blog-source"
GITHUB_PAGES = r"D:\Desktop\blueberrycongee.github.io"
POSTS_DIR = os.path.join(BLOG_SOURCE, r"source\_posts")
CONFIG_FILE = os.path.join(BLOG_SOURCE, "blog_config.json")

# 默认封面（未配置的分类使用）
DEFAULT_COVER = "/images/covers/default.png"

def load_config():
    """加载配置文件（分类-封面映射）"""
    import json
    default_covers = {
        "Go语言教程": "/images/covers/go.png",
        "GAMES！": "/images/covers/riskofrain2.png",
        "leetcode刷题": "/images/covers/leetcode.png",
    }
    
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                saved = json.load(f)
                default_covers.update(saved.get('covers', {}))
        except:
            pass
    
    return default_covers

def save_config(covers):
    """保存配置文件"""
    import json
    config = {'covers': covers}
    with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

def scan_categories():
    """从现有文章中扫描所有分类"""
    categories = set()
    
    for filename in os.listdir(POSTS_DIR):
        if not filename.endswith('.md'):
            continue
        
        filepath = os.path.join(POSTS_DIR, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 查找 categories 部分
            match = re.search(r'categories:\s*\n\s*-\s*(.+)', content)
            if match:
                cat = match.group(1).strip()
                if cat:
                    categories.add(cat)
        except:
            pass
    
    return sorted(list(categories))

def get_categories_with_covers():
    """获取所有分类及其封面配置"""
    covers = load_config()
    existing_cats = scan_categories()
    
    # 合并：现有分类 + 配置中的分类
    all_cats = set(existing_cats) | set(covers.keys())
    
    result = {}
    for cat in sorted(all_cats):
        result[cat] = covers.get(cat, "")
    
    return result

# ============ 工具函数 ============
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def print_header(title):
    clear_screen()
    print("=" * 50)
    print(f"  {title}")
    print("=" * 50)
    print()

def select_from_list(prompt, options, allow_custom=False):
    """简单的选择菜单"""
    print(f"\n{prompt}\n")
    
    for i, opt in enumerate(options, 1):
        print(f"  [{i}] {opt}")
    
    if allow_custom:
        print(f"  [0] 自定义输入")
    
    print()
    
    while True:
        try:
            choice = input("请选择 (输入数字): ").strip()
            if choice == "0" and allow_custom:
                return input("请输入自定义内容: ").strip()
            
            idx = int(choice) - 1
            if 0 <= idx < len(options):
                return options[idx]
            print("无效选择，请重试")
        except ValueError:
            print("请输入数字")

def input_with_default(prompt, default=""):
    """带默认值的输入"""
    if default:
        result = input(f"{prompt} [{default}]: ").strip()
        return result if result else default
    return input(f"{prompt}: ").strip()

def confirm(prompt):
    """确认操作"""
    result = input(f"{prompt} (y/n): ").strip().lower()
    return result in ['y', 'yes', '是', '']

# ============ 核心功能 ============
def create_post():
    """创建新文章"""
    print_header("📝 创建新文章")
    
    # 动态获取分类
    CATEGORIES = get_categories_with_covers()
    
    # 1. 输入标题
    title = input("文章标题: ").strip()
    if not title:
        print("标题不能为空！")
        return
    
    # 2. 选择分类
    categories = list(CATEGORIES.keys())
    category = select_from_list("选择分类:", categories, allow_custom=True)
    
    # 如果是新分类，询问是否设置封面
    if category not in CATEGORIES:
        print(f"\n检测到新分类: {category}")
        cover_input = input("为此分类设置封面图 (留空使用默认): ").strip()
        if cover_input:
            covers = load_config()
            covers[category] = cover_input
            save_config(covers)
            CATEGORIES[category] = cover_input
            print(f"已保存: {category} -> {cover_input}")
    
    # 3. 输入标签
    tags_input = input("\n标签 (多个用逗号分隔，直接回车跳过): ").strip()
    tags = [t.strip() for t in tags_input.split(",") if t.strip()] if tags_input else []
    
    # 4. 确定封面
    if category in CATEGORIES and CATEGORIES[category]:
        cover = CATEGORIES[category]
        print(f"\n自动使用封面: {cover}")
    else:
        use_default = confirm(f"\n使用默认封面 ({DEFAULT_COVER})?")
        cover = DEFAULT_COVER if use_default else ""
    
    # 5. 生成文件
    date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    content = f"""---
title: {title}
date: {date}
"""
    if tags:
        content += "tags:\n"
        for tag in tags:
            content += f"  - {tag}\n"
    
    content += f"categories:\n  - {category}\n"
    
    if cover:
        content += f"cover: {cover}\n"
    
    content += """---

在这里写正文...

"""
    
    filepath = os.path.join(POSTS_DIR, f"{title}.md")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"\n✅ 文章已创建: {filepath}")
    
    # 打开文件编辑
    if confirm("是否打开编辑器?"):
        os.startfile(filepath)
    
    return filepath

def publish():
    """发布博客"""
    print_header("🚀 发布博客")
    
    # 1. 自定义 commit message
    default_msg = f"更新博客 {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    commit_msg = input_with_default("Commit 信息", default_msg)
    
    print("\n开始发布...\n")
    
    try:
        # 2. 生成静态文件
        print("[1/4] 清理旧文件...")
        os.chdir(BLOG_SOURCE)
        subprocess.run(["npx", "hexo", "clean"], check=True, capture_output=True)
        
        print("[2/4] 生成静态文件...")
        result = subprocess.run(["npx", "hexo", "generate"], check=True, capture_output=True, text=True)
        
        # 3. 复制文件
        print("[3/4] 复制到 GitHub Pages 仓库...")
        import shutil
        public_dir = os.path.join(BLOG_SOURCE, "public")
        for item in os.listdir(public_dir):
            src = os.path.join(public_dir, item)
            dst = os.path.join(GITHUB_PAGES, item)
            if os.path.isdir(src):
                if os.path.exists(dst):
                    shutil.rmtree(dst)
                shutil.copytree(src, dst)
            else:
                shutil.copy2(src, dst)
        
        # 4. Git 提交和推送
        print("[4/4] 提交并推送...")
        os.chdir(GITHUB_PAGES)
        subprocess.run(["git", "add", "-A"], check=True, capture_output=True)
        subprocess.run(["git", "commit", "-m", commit_msg], check=True, capture_output=True)
        subprocess.run(["git", "push", "origin", "main"], check=True, capture_output=True)
        
        print("\n" + "=" * 50)
        print("✅ 发布成功!")
        print(f"   Commit: {commit_msg}")
        print("   访问: https://blueberrycongee.github.io")
        print("=" * 50)
        
    except subprocess.CalledProcessError as e:
        print(f"\n❌ 发布失败: {e}")
        if e.output:
            print(e.output)

def create_and_publish():
    """创建文章并直接发布"""
    filepath = create_post()
    if filepath:
        print("\n" + "-" * 40)
        if confirm("文章写完了吗？现在发布?"):
            publish()

def list_posts():
    """列出最近的文章"""
    print_header("📋 最近的文章")
    
    posts = []
    for f in os.listdir(POSTS_DIR):
        if f.endswith('.md'):
            path = os.path.join(POSTS_DIR, f)
            mtime = os.path.getmtime(path)
            posts.append((f, mtime))
    
    posts.sort(key=lambda x: x[1], reverse=True)
    
    print("最近修改的 10 篇文章:\n")
    for i, (name, mtime) in enumerate(posts[:10], 1):
        date = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M")
        print(f"  {i}. [{date}] {name[:-3]}")
    
    input("\n按回车返回...")

def manage_categories():
    """管理分类和封面"""
    while True:
        print_header("⚙️  管理分类封面")
        
        CATEGORIES = get_categories_with_covers()
        
        print("当前分类和封面配置:\n")
        cats = list(CATEGORIES.items())
        for i, (cat, cover) in enumerate(cats, 1):
            cover_str = cover if cover else "(默认封面)"
            print(f"  [{i}] {cat}")
            print(f"      封面: {cover_str}")
        
        print(f"\n  [A] 添加新分类")
        print(f"  [E] 编辑分类封面")
        print(f"  [Q] 返回")
        
        choice = input("\n请选择: ").strip().upper()
        
        if choice == 'Q':
            break
        elif choice == 'A':
            new_cat = input("\n新分类名称: ").strip()
            if new_cat:
                new_cover = input("封面图路径 (留空使用默认): ").strip()
                covers = load_config()
                covers[new_cat] = new_cover
                save_config(covers)
                print(f"\n✅ 已添加: {new_cat}")
        elif choice == 'E':
            try:
                idx = int(input("输入分类编号: ")) - 1
                if 0 <= idx < len(cats):
                    cat_name = cats[idx][0]
                    new_cover = input(f"新封面路径 (\'{cat_name}\'): ").strip()
                    covers = load_config()
                    covers[cat_name] = new_cover
                    save_config(covers)
                    print(f"\n✅ 已更新: {cat_name} -> {new_cover}")
            except:
                print("无效输入")
        
        input("\n按回车继续...")

def normalize_path(path_str):
    """处理各种路径格式"""
    if not path_str:
        return None
    
    # 去除引号和空格
    path_str = path_str.strip().strip('"').strip("'")
    
    # 处理拖拽时可能带的特殊字符
    path_str = path_str.replace('\\', '\\').strip()
    
    # 转换为 Path 对象
    path = Path(path_str)
    
    # 尝试解析路径
    if path.exists():
        return path.resolve()
    
    # 尝试相对路径
    cwd_path = Path.cwd() / path_str
    if cwd_path.exists():
        return cwd_path.resolve()
    
    return None

def parse_yaml_frontmatter(content):
    """解析 YAML 头部"""
    pattern = r'^---\s*\n(.*?)\n---\s*\n'
    match = re.match(pattern, content, re.DOTALL)
    
    if match:
        yaml_content = match.group(1)
        body = content[match.end():]
        
        # 简单解析 YAML
        frontmatter = {}
        for line in yaml_content.split('\n'):
            if ':' in line and not line.startswith(' ') and not line.startswith('-'):
                key, value = line.split(':', 1)
                frontmatter[key.strip()] = value.strip()
        
        return frontmatter, body
    
    return None, content

def import_md_file():
    """导入外部 md 文件"""
    print_header("📥 导入 Markdown 文件")
    
    print("提示：可以直接拖拽文件到这里，或者输入文件路径")
    print()
    
    path_input = input("文件路径: ").strip()
    
    # 处理路径
    file_path = normalize_path(path_input)
    
    if not file_path:
        print(f"\n❌ 文件不存在: {path_input}")
        input("按回车返回...")
        return
    
    if not str(file_path).lower().endswith('.md'):
        print(f"\n❌ 不是 Markdown 文件: {file_path}")
        input("按回车返回...")
        return
    
    print(f"\n✅ 找到文件: {file_path}")
    
    # 读取文件内容
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"\n❌ 读取文件失败: {e}")
        input("按回车返回...")
        return
    
    # 解析 YAML 头部
    frontmatter, body = parse_yaml_frontmatter(content)
    
    if frontmatter:
        print("\n检测到 YAML 头部:")
        for k, v in frontmatter.items():
            print(f"  {k}: {v}")
        
        has_title = 'title' in frontmatter
        has_date = 'date' in frontmatter
        has_category = 'categories' in frontmatter or 'category' in frontmatter
    else:
        print("\n⚠️  未检测到 YAML 头部，将自动生成")
        has_title = False
        has_date = False
        has_category = False
        body = content
    
    # 确定标题
    if has_title:
        title = frontmatter['title']
    else:
        default_title = file_path.stem  # 文件名作为默认标题
        title = input_with_default("\n文章标题", default_title)
    
    # 选择分类
    if not has_category:
        print()
        CATEGORIES = get_categories_with_covers()
        categories = list(CATEGORIES.keys())
        category = select_from_list("选择分类:", categories, allow_custom=True)
        
        # 新分类处理
        if category not in CATEGORIES:
            print(f"\n检测到新分类: {category}")
            cover_input = input("为此分类设置封面图 (留空使用默认): ").strip()
            if cover_input:
                covers = load_config()
                covers[category] = cover_input
                save_config(covers)
                CATEGORIES[category] = cover_input
    else:
        CATEGORIES = get_categories_with_covers()
        category = frontmatter.get('categories', frontmatter.get('category', ''))
        print(f"\n使用现有分类: {category}")
    
    # 确定封面
    cover = ""
    if 'cover' in frontmatter:
        cover = frontmatter['cover']
        print(f"使用现有封面: {cover}")
    elif category in CATEGORIES and CATEGORIES[category]:
        cover = CATEGORIES[category]
        print(f"自动匹配封面: {cover}")
    else:
        if confirm(f"\n使用默认封面 ({DEFAULT_COVER})?"):
            cover = DEFAULT_COVER
    
    # 生成新的 YAML 头部
    date = frontmatter.get('date', datetime.now().strftime("%Y-%m-%d %H:%M:%S")) if frontmatter else datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    new_content = f"""---
title: {title}
date: {date}
categories:
  - {category}
"""
    
    if cover:
        new_content += f"cover: {cover}\n"
    
    # 保留原有的 tags
    if frontmatter and 'tags' in str(frontmatter):
        # 从原文件提取 tags 部分
        tags_match = re.search(r'tags:\s*\n((?:\s+-.*\n)*)', content)
        if tags_match:
            new_content += "tags:\n" + tags_match.group(1)
    
    new_content += "---\n\n" + body.lstrip()
    
    # 保存到 _posts 目录
    new_filename = f"{title}.md"
    new_filepath = os.path.join(POSTS_DIR, new_filename)
    
    # 检查是否已存在
    if os.path.exists(new_filepath):
        if not confirm(f"\n文件已存在: {new_filename}，是否覆盖?"):
            print("已取消")
            input("按回车返回...")
            return
    
    with open(new_filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    
    print(f"\n✅ 文章已导入: {new_filepath}")
    print(f"   标题: {title}")
    print(f"   分类: {category}")
    if cover:
        print(f"   封面: {cover}")
    
    # 是否立即发布
    if confirm("\n是否立即发布?"):
        publish()
    else:
        input("按回车返回...")

def main_menu():
    """主菜单"""
    while True:
        print_header("🦋 Blueberry 博客管理工具")
        
        # 显示当前分类数量
        cats = get_categories_with_covers()
        print(f"  当前分类: {len(cats)} 个\n")
        
        options = [
            "创建新文章",
            "导入 md 文件",
            "发布博客",
            "创建并发布",
            "查看最近文章",
            "管理分类封面",
            "退出",
        ]
        
        for i, opt in enumerate(options, 1):
            print(f"  [{i}] {opt}")
        
        print()
        choice = input("请选择: ").strip()
        
        if choice == "1":
            create_post()
        elif choice == "2":
            import_md_file()
        elif choice == "3":
            publish()
        elif choice == "4":
            create_and_publish()
        elif choice == "5":
            list_posts()
        elif choice == "6":
            manage_categories()
        elif choice == "7" or choice.lower() == 'q':
            print("\n再见! 👋\n")
            break
        else:
            print("无效选择")

if __name__ == "__main__":
    try:
        main_menu()
    except KeyboardInterrupt:
        print("\n\n已取消")
