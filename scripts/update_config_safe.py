#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
安全更新 Butterfly 配置 - 只替换必要的值
"""
import re

CONFIG_PATH = r"D:\Desktop\blog-source\_config.butterfly.yml"

# 读取文件
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 替换 menu 部分
old_menu = r'''menu:
  # Home: / \|\| fas fa-home
  # List\|\|fas fa-list:
  #   Music: /music/ \|\| fas fa-music
  #   Movie: /movies/ \|\| fas fa-video'''

new_menu = '''menu:
  首页: / || fas fa-home
  时间轴: /archives/ || fas fa-archive
  标签: /tags/ || fas fa-tags
  分类: /categories/ || fas fa-folder-open
  清单||fa fa-heartbeat:
    音乐: /music/ || fas fa-music
    番剧: /bangumis/ || fas fa-video
    相册: /Gallery/ || fas fa-images
  友链: /link/ || fas fa-link
  关于: /about/ || fas fa-heart
  可视化工具: /visualizer/ || fas fa-code'''

content = re.sub(old_menu, new_menu, content)

# 替换 social
content = re.sub(
    r'social:\s+# fab fa-github:.*?\n\s+# fas fa-envelope:.*?\n',
    '''social:
  fab fa-github: https://github.com/blueberrycongee || Github || '#24292e'

''',
    content
)

# 替换 favicon
content = content.replace('favicon: /img/favicon.png', 'favicon: /img/favicon.ico')

# 替换 index_img
content = re.sub(
    r'index_img:\n\n',
    'index_img: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n\n',
    content
)

# 替换 default_top_img
content = re.sub(
    r'default_top_img:\n\n',
    'default_top_img: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n\n',
    content
)

# 启用本地搜索
content = re.sub(
    r'(local_search:\s+enable:) false',
    r'\1 true',
    content
)

# 启用暗黑模式
content = re.sub(
    r'(darkmode:\s+enable:) false',
    r'\1 true',
    content
)

# 启用 footer
content = re.sub(
    r"(footer:\s+owner:\s+enable:) false\s+(since:)\s*\n",
    r"\1 true\n  \2 2022\n",
    content
)

# 启用彩带
content = re.sub(
    r'(canvas_fluttering_ribbon:\s+enable:) false',
    r'\1 true',
    content
)

# 启用点击爱心
content = re.sub(
    r'(click_heart:\s+enable:) false',
    r'\1 true',
    content
)

# 启用美化
content = re.sub(
    r'(beautify:\s+enable:) false',
    r'\1 true',
    content
)

# 启用懒加载
content = re.sub(
    r'(lazyload:\s+enable:) false',
    r'\1 true',
    content
)

# 写回文件（UTF-8 无 BOM）
with open(CONFIG_PATH, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)

print("配置更新完成！")
