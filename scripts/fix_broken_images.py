#!/usr/bin/env python3
"""
批量替换失效图片链接为本地 404 图片
"""
import os
import re
import glob

# 项目根目录
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# 失效的图片 URL 模式（正则表达式）
BROKEN_PATTERNS = [
    r'https?://bu\.dusays\.com/[^"\'>\s]+\.(jpg|jpeg|png|gif|webp)',  # 杜老师图床
    r'https?://i\.hexuexiao\.cn/[^"\'>\s]+\.(jpg|jpeg|png|gif|webp)',  # hexuexiao 图床
    r'https?://ts\d\.cn\.mm\.bing\.net/[^"\'>\s]+',  # Bing 头像
    r'https?://tse\d-mm\.cn\.bing\.net/[^"\'>\s]+',  # Bing 封面图
]

# 保留的图片（没有失效）
KEEP_PATTERNS = [
    r'pic3\.zhimg\.com',  # 知乎图片没失效
]

# 替换目标
REPLACEMENT = '/img/404.jpg'

def should_keep(url):
    """检查 URL 是否应该保留（没有失效）"""
    for pattern in KEEP_PATTERNS:
        if re.search(pattern, url):
            return True
    return False

def replace_broken_images(content):
    """替换内容中的失效图片链接"""
    count = 0
    
    for pattern in BROKEN_PATTERNS:
        def replacer(match):
            nonlocal count
            url = match.group(0)
            if should_keep(url):
                return url
            count += 1
            return REPLACEMENT
        
        content = re.sub(pattern, replacer, content, flags=re.IGNORECASE)
    
    return content, count

def process_file(filepath):
    """处理单个文件"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        new_content, count = replace_broken_images(content)
        
        if count > 0:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"[已修复] {filepath} - 替换了 {count} 个失效链接")
            return count
        return 0
    except Exception as e:
        print(f"[错误] {filepath}: {e}")
        return 0

def main():
    """主函数"""
    total = 0
    file_count = 0
    
    # 处理所有 HTML 文件
    html_files = glob.glob(os.path.join(ROOT_DIR, '**', '*.html'), recursive=True)
    
    print(f"扫描到 {len(html_files)} 个 HTML 文件")
    print("=" * 50)
    
    for filepath in html_files:
        count = process_file(filepath)
        if count > 0:
            total += count
            file_count += 1
    
    print("=" * 50)
    print(f"完成！共处理 {file_count} 个文件，替换了 {total} 个失效图片链接")

if __name__ == '__main__':
    main()
