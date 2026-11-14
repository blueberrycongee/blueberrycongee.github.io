// theme.js — chrome agent owns this file.
// Theme toggle + persistence + OS-sync, sticky-header state, footer clock.
(() => {
  "use strict";

  const root = document.documentElement;
  const themeMQ = matchMedia("(prefers-color-scheme: dark)");
  const motionMQ = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------------- theme ---------------- */

  const storedTheme = () => {
    try {
      return localStorage.getItem("theme");
    } catch (e) {
      return null;
    }
  };

  const isDark = () => root.dataset.theme === "dark";

  // reflect state onto every toggle (aria-pressed + a helpful label)
  const syncToggles = () => {
    const dark = isDark();
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dark));
      btn.setAttribute(
        "aria-label",
        dark ? "切换到浅色模式" : "切换到深色模式",
      );
    });
  };

  const setTheme = (theme, persist) => {
    root.dataset.theme = theme;
    if (persist) {
      try {
        localStorage.setItem("theme", theme);
      } catch (e) {}
    }
    syncToggles();
  };

  document.addEventListener("click", (e) => {
    if (!e.target.closest("[data-theme-toggle]")) return;
    setTheme(isDark() ? "light" : "dark", true);
  });

  // follow the OS only while the user hasn't made an explicit choice
  const onSystemTheme = (e) => {
    if (!storedTheme()) setTheme(e.matches ? "dark" : "light", false);
  };
  if (themeMQ.addEventListener) themeMQ.addEventListener("change", onSystemTheme);
  else if (themeMQ.addListener) themeMQ.addListener(onSystemTheme); // old Safari

  syncToggles();

  /* ---------------- sticky header ---------------- */

  const header = document.querySelector(".site-header");
  if (header) {
    let ticking = false;
    const update = () =>
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  /* ---------------- local time (progressive enhancement) ---------------- */

  const clock = document.querySelector("[data-local-time]");
  if (clock) {
    const base = {
      timeZone: "Asia/Shanghai",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZoneName: "short",
    };
    // reduced-motion: HH:MM that changes once a minute, not a ticking seconds hand
    const withSeconds = new Intl.DateTimeFormat(
      "en-GB",
      Object.assign({ second: "2-digit" }, base),
    );
    const plain = new Intl.DateTimeFormat("en-GB", base);
    const render = () => {
      clock.textContent = (
        motionMQ.matches ? plain : withSeconds
      ).format(new Date());
    };
    render();
    setInterval(render, 1000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) render();
    });
    if (motionMQ.addEventListener)
      motionMQ.addEventListener("change", render);
  }
})();
