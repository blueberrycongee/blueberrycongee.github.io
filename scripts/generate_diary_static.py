#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import re
import html


SITE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_DIR = os.path.dirname(SITE_DIR)

MD_LOCAL_PATH = os.path.join(ROOT_DIR, "大学自述.md")
ABOUT_TEMPLATE = os.path.join(SITE_DIR, "about", "index.html")
DIARY_DIR = os.path.join(SITE_DIR, "diary")
DIARY_INDEX = os.path.join(DIARY_DIR, "index.html")


def read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def write_text(path: str, content: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


def parse_index_targets(index_html: str) -> list:
    targets = re.findall(r"href=\"\.\/entry\.html\?h=([^\"]+)\"", index_html)
    return [html.unescape(t).strip() for t in targets]


def extract_targets_from_md(md: str) -> list:
    """
    从整份 Markdown 中提取条目标题（用于生成与目录）。
    规则：
    - 收集所有以 "#### " 开头的小标题内容；
    - 额外包含文件前 5 行内出现的日期行（如 "2025.4.26"、"2025年6月7日"）。
    保持出现顺序，去重。
    """
    lines = md.splitlines()
    targets: list[str] = []

    date_patterns = [
        re.compile(r"^\s*\d{4}\.\d{1,2}\.\d{1,2}.*"),
        re.compile(r"^\s*\d{4}年\d{1,2}月\d{1,2}日.*"),
    ]

    # 收集 #### 标题与任意日期行（按出现顺序去重）
    for raw in lines:
        line = raw.strip()
        if line.startswith("#### "):
            t = line[5:].strip()
            if t and t not in targets:
                targets.append(t)
            continue
        for pat in date_patterns:
            if pat.match(line):
                t = line
                if t and t not in targets:
                    targets.append(t)
                break
    return targets


def find_section_bounds(md: str, target: str):
    lines = md.splitlines()
    start = -1
    t = target.strip()
    for i, raw in enumerate(lines):
        line = raw.strip()
        if line.startswith("#### "):
            heading = line[5:].strip()
            if heading == t or heading.startswith(t):
                start = i
                break
        else:
            if line == t or line.startswith(t):
                start = i
                break
    if start == -1:
        return 0, len(lines)
    end = len(lines)
    date_line_pat = re.compile(r"^\s*(\d{4}\.\d{1,2}\.\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日)\b.*")
    for j in range(start + 1, len(lines)):
        line = lines[j].strip()
        if line.startswith("#### "):
            end = j
            break
        # 如果出现新的日期行（如 2025.10.14），也视为下一个条目开始
        if date_line_pat.match(line):
            end = j
            break
    return start, end


def slugify(title: str) -> str:
    s = title.strip()
    s = re.sub(r"\s+", "-", s)
    s = s.replace(":", "-")
    s = re.sub(r"[^\w\-\.\u4e00-\u9fa5]", "", s)
    s = re.sub(r"-+", "-", s)
    return s


def escape_script_end(s: str) -> str:
    # 防止切片中出现 </script> 造成标签提前结束
    return s.replace("</script>", "</scr" + "ipt>")


def render_html(base_html: str, page_title: str, md_slice: str) -> str:
    # 更新 <title>
    base_html = re.sub(
        r"<title>.*?</title>",
        f"<title>大学自述 · {html.escape(page_title)} | hecode🍓🥝</title>",
        base_html,
        count=1,
        flags=re.S,
    )

    # 更新页眉标题
    base_html = re.sub(
        r"(<div id=\"page-site-info\">\s*<h1 id=\"site-title\">)(.*?)(</h1>)",
        rf"\1大学自述 · {html.escape(page_title)}\3",
        base_html,
        count=1,
        flags=re.S,
    )

    # 标记为文章页，并注入“杂谈”标签（与博客文章一致）
    # 1) og:type 改为 article
    base_html = re.sub(
        r"<meta property=\"og:type\" content=\"[^\"]+\">",
        "<meta property=\"og:type\" content=\"article\">",
        base_html,
        count=1,
    )
    # 2) 将 isPost: false 改为 true，以启用文章相关的样式/功能
    base_html = re.sub(r"(isPost:\s*)(false)", r"\1true", base_html)
    # 3) 在 </head> 前注入文章标签 meta
    base_html = re.sub(
        r"</head>",
        "<meta property=\"article:tag\" content=\"杂谈\"></head>",
        base_html,
        count=1,
        flags=re.S,
    )

    # 将文章容器替换为 markdown 片段 + marked 渲染
    ac_pattern = r"(<div id=\"article-container\">)(.*?)(</div></div>)"
    md_block = escape_script_end(md_slice)
    # 使用独立的 md 容器，避免覆盖标签区块
    tag_block = (
        "<div class=\"tag_share\">"
        "<div class=\"post-meta__tag-list\">"
        "<a class=\"post-meta__tags\" href=\"/tags/%E6%9D%82%E8%B0%88/\">杂谈</a>"
        "</div>"
        "</div>"
    )
    replacement = (
        "<div id=\"md-container\"></div>"
        "<script id=\"md\" type=\"text/markdown\">" + md_block + "</script>"
        "<script src=\"https://cdn.jsdelivr.net/npm/marked/marked.min.js\"></script>"
        "<script>document.getElementById('md-container').innerHTML = marked.parse(document.getElementById('md').textContent);</script>"
        + tag_block
    )
    base_html = re.sub(ac_pattern, rf"\1{replacement}\3", base_html, count=1, flags=re.S)
    return base_html


def main():
    print("[generate] start")
    index_html = read_text(DIARY_INDEX)
    md = read_text(MD_LOCAL_PATH)
    # 目标集合：以 Markdown 为准，保证全部条目被生成
    targets = extract_targets_from_md(md)
    if not targets:
        raise RuntimeError("未在《大学自述.md》内找到任何条目标题（#### 或日期行）")
    print(f"[generate] targets(from md): {len(targets)}")
    base_tpl = read_text(ABOUT_TEMPLATE)
    for t in targets:
        start, end = find_section_bounds(md, t)
        lines = md.splitlines()
        slice_text = "\n".join(lines[start:end]).strip()
        html_out = render_html(base_tpl, t, slice_text)
        out_path = os.path.join(DIARY_DIR, f"{slugify(t)}.html")
        write_text(out_path, html_out)
        print(f"[generate] wrote {out_path}")

    # 更新索引：根据全部 targets 重写 <ul class="toc"> 列表
    def build_list(ts: list[str]) -> str:
        items = []
        for t in ts:
            items.append(f'<li><a href="./{slugify(t)}.html">{html.escape(t)}</a></li>')
        return "\n".join(items)

    toc_list = build_list(targets)
    new_index = re.sub(
        r"(<ul class=\"toc\">)(.*?)(</ul>)",
        rf"\1\n{toc_list}\n\3",
        index_html,
        flags=re.S,
    )
    write_text(DIARY_INDEX, new_index)
    print("[generate] index updated")
    print("[generate] done")


if __name__ == "__main__":
    main()