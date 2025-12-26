#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
更新 Butterfly 主题配置（无重复）
"""
import re

CONFIG_PATH = r"D:\Desktop\blog-source\_config.butterfly.yml"

# 读取当前配置
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 要修改的配置项（键: 新值）
modifications = {
    'menu:': '''menu:
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
''',
}

# 处理文件
new_lines = []
skip_until_next_section = False
current_section = None

for i, line in enumerate(lines):
    stripped = line.strip()
    
    # 检测新的顶级配置项
    if stripped and not stripped.startswith('#') and not stripped.startswith('-') and ':' in stripped:
        key = stripped.split(':')[0] + ':'
        if not line.startswith(' ') and not line.startswith('\t'):
            skip_until_next_section = False
            current_section = key
            
            if key in modifications:
                new_lines.append(modifications[key])
                skip_until_next_section = True
                continue
    
    if not skip_until_next_section:
        new_lines.append(line)

# 组合内容
content = ''.join(new_lines)

# 替换特定值
replacements = [
    (r'favicon: /img/favicon\.png', 'favicon: /img/favicon.ico'),
    (r'index_img:\s*\n', 'index_img: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n'),
    (r'default_top_img:\s*\n', 'default_top_img: https://pic3.zhimg.com/v2-edf4242e9751d9e0cbdd134f85a4aa01_r.jpg?source=1940ef5c\n'),
    (r'# fab fa-github: https://github.com/xxxxx', 'fab fa-github: https://github.com/blueberrycongee'),
    (r'enable: false\s+#\s*Enable local search', 'enable: true  # Enable local search'),
]

for pattern, replacement in replacements:
    content = re.sub(pattern, replacement, content)

# 在末尾添加自定义配置
custom_config = """

# ======================================
# 自定义配置 - hecode 博客
# ======================================

# 公告栏
announcement:
  enable: true
  content: "欢迎来到 hecode 博客！这里记录我的大学生活和技术分享 🎉"

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
"""

content += custom_config

# 写回文件
with open(CONFIG_PATH, 'w', encoding='utf-8') as f:
    f.write(content)

print("配置文件更新完成！")
