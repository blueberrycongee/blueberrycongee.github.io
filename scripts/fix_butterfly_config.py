#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复 Butterfly 配置文件中的重复键
"""
import re

CONFIG_PATH = r"D:\Desktop\blog-source\_config.butterfly.yml"

# 读取文件
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 找到 "# 自定义配置 - hecode 博客" 之后的内容并删除重复项
marker = "# ======================================\n# 自定义配置 - hecode 博客"
if marker in content:
    idx = content.find(marker)
    # 保留 marker 之前的内容
    base_content = content[:idx]
    custom_content = content[idx:]
    
    # 只保留需要的自定义配置（删除原主题配置中已存在的重复项）
    new_custom = """# ======================================
# 自定义配置 - hecode 博客
# ======================================

# 公告栏
announcement:
  enable: true
  content: "欢迎来到 hecode 博客！这里记录我的大学生活和技术分享 🎉"

# 侧边栏作者信息
card_author:
  enable: true
  description: "莫名的情愫啊，谁来将它带走呢"
  button:
    enable: true
    icon: fab fa-github
    text: Follow Me
    link: https://github.com/blueberrycongee

# APlayer 音乐播放器
aplayerInject:
  enable: true
  per_page: true

# Meting 配置
metingjs:
  enable: true
  autoplay: false
  api:

# 美化设置
beautify:
  enable: true
  field: post
  title-prefix-icon: '\\f0c1'
  title-prefix-icon-color: '#F47466'

# 暗黑模式
darkmode:
  enable: true
  button: true
  autoChangeMode: false

# 图片灯箱
lightbox: fancybox

# 懒加载
lazyload:
  enable: true
  field: site
  placeholder:
  blur: false

# 页面切换动画
enter_transitions: true

# 彩带背景
canvas_fluttering_ribbon:
  enable: true
  mobile: false

# 点击爱心特效
click_heart:
  enable: true
  mobile: false

# 页脚
footer:
  owner:
    enable: true
    since: 2022
  custom_text: "感谢你的访问 ❤️"
  copyright: true

# 本地搜索
local_search:
  enable: true
  preload: false
  top_n_per_article: 1
  unescape: false

# 字数统计
wordcount:
  enable: true
  post_wordcount: true
  min2read: true
  total_wordcount: true
"""
    content = base_content + new_custom

# 写回文件
with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("配置文件修复完成！")
