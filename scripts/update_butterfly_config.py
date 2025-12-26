#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 Butterfly 主题配置
"""
import re

CONFIG_PATH = r"D:\Desktop\blog-source\_config.butterfly.yml"

# 读取当前配置
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

# 替换配置项
replacements = [
    # Menu 导航菜单
    (r"menu:\s*\n(?:  #.*\n)*", """menu:
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
  可视化工具: /visualizer/ || fas fa-code

"""),
    # Social
    (r"social:\s*\n(?:  #.*\n)*", """social:
  fab fa-github: https://github.com/blueberrycongee || Github || '#24292e'

"""),
    # Favicon
    (r"favicon: /img/favicon\.png", "favicon: /img/favicon.ico"),
    # Index image
    (r"index_img:\s*\n", "index_img: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n"),
    # Default top image
    (r"default_top_img:\s*\n", "default_top_img: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n"),
    # Background
    (r"background:\s*\n\ncover:", "background: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n\ncover:"),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# 在文件末尾添加更多配置
additional_config = """

# ======================================
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

# Live2D 看板娘 (需要在 _config.yml 中配置)
# 使用 hexo-helper-live2d 插件

# 自定义 CSS/JS 注入
inject:
  head:
    - <link rel="stylesheet" href="/css/custom.css">
  bottom:
    - <script src="/js/custom.js"></script>

# APlayer 音乐播放器
aplayerInject:
  enable: true
  per_page: true

# Aplayer
aplayer:
  meting: true
  asset_inject: false

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

# 检查是否已有自定义配置
if "# 自定义配置 - hecode 博客" not in content:
    content += additional_config

# 写回文件
with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("配置文件更新完成！")
