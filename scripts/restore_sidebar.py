#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
恢复侧边栏卡片配置
"""
import re

butterfly_path = r"D:\Desktop\blog-source\_config.butterfly.yml"
with open(butterfly_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 检查是否已有 aside 配置，如果有则更新，没有则添加
aside_config = """
# ======================================
# 侧边栏配置
# ======================================

aside:
  enable: true
  hide: false
  button: true
  mobile: true
  position: right
  display:
    archive: true
    tag: true
    category: true
  card_author:
    enable: true
    description: "莫名的情愫啊，谁来将它带走呢"
    button:
      enable: true
      icon: fab fa-github
      text: Follow Me
      link: https://github.com/blueberrycongee
  card_announcement:
    enable: true
    content: "莫名的情愫啊，谁来将它带走呢，我只能把岁月化成歌，留在山河"
  card_recent_post:
    enable: true
    limit: 5
    sort: date
  card_categories:
    enable: true
    limit: 8
    expand: none
  card_tags:
    enable: true
    limit: 40
    color: true
    orderby: random
  card_archives:
    enable: true
    type: monthly
    format: MMMM YYYY
    order: -1
    limit: 8
  card_webinfo:
    enable: true
    post_count: true
    last_push_date: true

# 头像配置
avatar:
  img: https://avatars.githubusercontent.com/u/114110588
  effect: true

# 社交链接
social:
  fab fa-github: https://github.com/blueberrycongee || Github || '#24292e'
"""

# 移除已有的 aside 和 avatar 配置（如果存在）
content = re.sub(r'\n# 侧边栏.*?(?=\n# [A-Z]|\n# =|\Z)', '', content, flags=re.DOTALL)
content = re.sub(r'\naside:\s*\n(?:  .*\n)*', '\n', content)
content = re.sub(r'\navatar:\s*\n(?:  .*\n)*', '\n', content)

# 添加新配置
content += aside_config

with open(butterfly_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("侧边栏配置已更新！")
print("\n恢复的内容：")
print("- 作者信息卡（带GitHub头像）")
print("- 公告卡")
print("- 最新文章卡")
print("- 分类卡")
print("- 标签卡")
print("- 归档卡")
print("- 网站资讯卡")
