/* Global theme toggle with persistence and auto-injected button */
(function () {
  const STORAGE_KEY = 'theme'; // 'dark' | 'light'
  const root = document.documentElement;

  function applyTheme(mode) {
    if (mode === 'light') {
      root.classList.add('theme-light');
    } else {
      root.classList.remove('theme-light');
    }
    const ev = new CustomEvent('themechange', { detail: { theme: mode } });
    window.dispatchEvent(ev);
  }

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  function createToggle(mode) {
    // Avoid duplicate injection
    if (document.querySelector('.theme-toggle')) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle' + (mode === 'light' ? ' is-light' : '');
    btn.type = 'button';
    btn.setAttribute('aria-label', '切换黑白模式');
    btn.innerHTML = '<span class="icon" aria-hidden="true"></span><span class="label">主题</span>';
    btn.addEventListener('click', () => {
      const next = root.classList.contains('theme-light') ? 'dark' : 'light';
      applyTheme(next);
      btn.classList.toggle('is-light', next === 'light');
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
    });
    document.body.appendChild(btn);
  }

  const initial = getInitialTheme();
  applyTheme(initial);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => createToggle(initial));
  } else {
    createToggle(initial);
  }
})();