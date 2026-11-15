// theme.js — Theme toggle and persistence. Dark (the darkroom) is the default;
// a stored choice of "light" wins. Initial [data-theme] is set synchronously in
// head.html to prevent FOUC.
(() => {
  "use strict";

  const root = document.documentElement;
  const meta = document.querySelector('meta[name="theme-color"]');
  const isDark = () => root.dataset.theme !== "light";

  const syncButtons = () => {
    const dark = isDark();
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(!dark));
      btn.setAttribute("aria-label", dark ? "切换到浅色主题" : "切换到深色主题");
    });
    if (meta) meta.content = dark ? "#121211" : "#ebeae6";
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-theme-toggle]")) return;
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {}
    syncButtons();
  });

  syncButtons();
})();
