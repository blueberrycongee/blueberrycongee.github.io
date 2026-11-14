// passport.js — quiet reading passport: articles you open get a
// small ✓ on index lists + a read counter. localStorage-backed,
// invisible without JS.
(() => {
  const KEY = "read-posts";
  let set;
  try {
    set = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
  } catch {
    set = new Set();
  }

  const path = location.pathname.replace(/\/+$/, "");

  if (/^\/posts\/[^/]+/.test(path)) {
    set.add(path);
    try {
      localStorage.setItem(KEY, JSON.stringify([...set]));
    } catch {}
    return;
  }

  document.querySelectorAll('a.post-row[href*="/posts/"]').forEach((a) => {
    try {
      const p = new URL(a.href, location.origin).pathname.replace(/\/+$/, "");
      if (set.has(p)) a.classList.add("is-read");
    } catch {}
  });

  const meter = document.querySelector("[data-read-total]");
  if (meter) {
    const total = meter.getAttribute("data-read-total");
    meter.textContent = `· ${set.size}/${total} 已读`;
    meter.hidden = false;
  }
})();
