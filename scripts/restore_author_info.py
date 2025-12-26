#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
恢复博客作者信息和签名
"""
import re

# 更新 Hexo 主配置
config_path = r"D:\Desktop\blog-source\_config.yml"
with open(config_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 更新标题
content = re.sub(r"title: hecode.*", "title: hecode🍓🥝", content)
# 更新副标题  
content = re.sub(r"subtitle: .*", "subtitle: '和代码做朋友'", content)
# 更新描述
content = re.sub(r"description: .*", "description: '莫名的情愫啊，谁来将它带走呢'", content)

with open(config_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("主配置更新完成！")

# 更新 Butterfly 主题配置
butterfly_path = r"D:\Desktop\blog-source\_config.butterfly.yml"
with open(butterfly_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 更新侧边栏作者描述（在 aside 部分）
# 找到 card_author 或者添加描述
if "card_author:" not in content:
    # 添加到文件末尾
    content += """

# 侧边栏作者卡片
card_author:
  enable: true
  description: "莫名的情愫啊，谁来将它带走呢"
  button:
    enable: true
    icon: fab fa-github
    text: Follow Me
    link: https://github.com/blueberrycongee
"""

# 更新公告内容
content = re.sub(
    r'(announcement:\s+enable: true\s+content:) .*',
    r'\1 "莫名的情愫啊，谁来将它带走呢，我只能把岁月化成歌，留在山河"',
    content
)

# 更新 index_site_info 打字机效果（如果存在）
# 添加 subtitle 配置
if "subtitle:" not in content or "subtitle:\n  enable:" not in content:
    content += """

# 主页副标题打字机效果
subtitle:
  enable: true
  effect: true
  loop: true
  source: false
  sub:
    - "和代码做朋友"
    - "窗外有月色和雨，而我在想你。"
    - "There is moonlight and rain outside the window, and I miss you."
"""

with open(butterfly_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("主题配置更新完成！")
print("\n恢复的信息：")
print("- 网站标题: hecode🍓🥝")
print("- 副标题: 和代码做朋友")
print("- 描述/签名: 莫名的情愫啊，谁来将它带走呢")
print("- 打字机效果: 3句话循环")
