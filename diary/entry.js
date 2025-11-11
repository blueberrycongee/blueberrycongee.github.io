// Diary entry renderer: fetch markdown and render specific section by heading
const MD_URL = "https://raw.githubusercontent.com/blueberrycongee/data-structure-visualizer/main/%E5%A4%A7%E5%AD%A6%E8%87%AA%E8%BF%B0.md";

function findSectionBounds(md, target) {
  const lines = md.split(/\r?\n/);
  let startLine = -1;

  // normalize target (trim extra spaces)
  const t = target.trim();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#### ")) {
      // match prefix: allow headings like "#### 5.1 23:00    补充..."
      const headingText = line.substring(5).trim();
      if (headingText === t || headingText.startsWith(t)) {
        startLine = i;
        break;
      }
    } else {
      // handle first entry without #### heading (e.g., "2025.4.26" at top)
      if (i < 5 && (line === t || line.startsWith(t))) {
        startLine = i;
        break;
      }
    }
  }

  if (startLine === -1) {
    return { start: 0, end: lines.length }; // fallback to whole doc
  }

  let endLine = lines.length;
  for (let j = startLine + 1; j < lines.length; j++) {
    const line = lines[j].trim();
    if (line.startsWith("#### ")) {
      endLine = j;
      break;
    }
  }

  return { start: startLine, end: endLine };
}

async function renderEntry(target, meta) {
  const container = document.getElementById("content");
  const metaEl = document.getElementById("meta");
  try {
    const res = await fetch(MD_URL);
    const md = await res.text();
    const { start, end } = findSectionBounds(md, target);
    const lines = md.split(/\r?\n/);
    const slice = lines.slice(start, end).join("\n");

    // Render markdown using marked
    const html = marked.parse(slice);
    container.innerHTML = html;

    // Set meta info and document title
    if (metaEl && meta) {
      metaEl.textContent = meta;
    }
    if (meta) {
      document.title = `大学自述 - ${meta}`;
    }
  } catch (err) {
    container.innerHTML = `<p>加载失败：${String(err)}</p>`;
  }
}

// Utility: read query param h as target heading
function getTargetFromQuery() {
  const u = new URL(window.location.href);
  return u.searchParams.get("h") || "";
}

function initDiaryPage() {
  const target = getTargetFromQuery();
  const meta = document.body?.dataset?.meta || target;
  if (!target) {
    document.getElementById("content").innerHTML = "<p>未指定条目。</p>";
    return;
  }
  renderEntry(target, meta);
}

// Expose for inline calls if needed
window.__diary = { renderEntry, initDiaryPage };

// 自动初始化：在 DOM 就绪后渲染当前条目
document.addEventListener('DOMContentLoaded', function(){
  try {
    window.__diary && window.__diary.initDiaryPage();
  } catch (e) {
    console.error('Diary init failed:', e);
  }
});