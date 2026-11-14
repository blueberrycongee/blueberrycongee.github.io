// post.js — posts agent owns this file.
// Article-page behaviors: heading anchors, TOC scroll-spy, code copy.
// Everything is progressive enhancement: no JS, no problem.
(() => {
  "use strict";

  const prose = document.querySelector(".post .prose");
  if (!prose) return;

  /* -------------------------------------------------------
     1. Heading anchors — inject "#" links into h2–h4[id].
     ------------------------------------------------------- */
  const heads = [...prose.querySelectorAll("h2[id], h3[id], h4[id]")];
  heads.forEach((h) => {
    if (h.querySelector(".anchor")) return;
    const a = document.createElement("a");
    a.className = "anchor";
    a.href = "#" + h.id;
    a.textContent = "#";
    a.setAttribute("aria-label", "链接到此节");
    a.tabIndex = -1;
    h.prepend(a);
  });

  /* -------------------------------------------------------
     2. TOC scroll-spy — mark the current section's link
        with .is-active (rail TOC + inline <details> TOC).
     ------------------------------------------------------- */
  const tocLinks = [
    ...document.querySelectorAll('.toc-nav a[href^="#"]'),
  ];
  if (tocLinks.length) {
    const byId = new Map();
    tocLinks.forEach((a) => {
      let id;
      try {
        id = decodeURIComponent(a.getAttribute("href").slice(1));
      } catch (e) {
        id = a.getAttribute("href").slice(1);
      }
      const arr = byId.get(id) || [];
      arr.push(a);
      byId.set(id, arr);
    });

    const spyHeads = heads.filter((h) => byId.has(h.id));
    let current = null;

    const setActive = (id) => {
      if (id === current) return;
      current = id;
      tocLinks.forEach((a) => a.classList.remove("is-active"));
      (byId.get(id) || []).forEach((a) => a.classList.add("is-active"));
    };

    const OFFSET = 96; // px below viewport top that counts as "current"
    const pick = () => {
      let active = null;
      for (const h of spyHeads) {
        if (h.getBoundingClientRect().top <= OFFSET) active = h;
        else break;
      }
      setActive(active ? active.id : null);
    };

    if ("IntersectionObserver" in window && spyHeads.length) {
      // IO fires the cheap "recompute" whenever a heading crosses the band…
      const io = new IntersectionObserver(pick, {
        rootMargin: "-80px 0px -70% 0px",
      });
      spyHeads.forEach((h) => io.observe(h));
    }
    // …and a rAF-throttled scroll listener covers gaps between
    // sparsely-placed headings where nothing intersects.
    let ticking = false;
    addEventListener(
      "scroll",
      () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
          pick();
          ticking = false;
        });
      },
      { passive: true }
    );
    pick();
  }

  /* -------------------------------------------------------
     3. Code copy — wrap every pre (or .highlight) in a
        .code-block div and append a .code-copy button.
     ------------------------------------------------------- */
  const finish = (btn, ok) => {
    btn.textContent = ok ? "已复制" : "失败";
    btn.classList.toggle("is-done", ok);
    setTimeout(() => {
      btn.textContent = "复制";
      btn.classList.remove("is-done");
    }, 1400);
  };

  const copyText = async (text) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for non-secure contexts / older browsers.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "absolute";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {}
    document.body.removeChild(ta);
    return ok;
  };

  prose.querySelectorAll("pre").forEach((pre) => {
    const host = pre.closest(".highlight") || pre;
    if (
      !host.parentNode ||
      host.parentNode.classList.contains("code-block")
    ) {
      return;
    }
    const wrap = document.createElement("div");
    wrap.className = "code-block";
    host.parentNode.insertBefore(wrap, host);
    wrap.appendChild(host);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.textContent = "复制";
    btn.setAttribute("aria-label", "复制代码到剪贴板");
    wrap.appendChild(btn);

    btn.addEventListener("click", () => {
      copyText(pre.textContent)
        .then((ok) => finish(btn, ok !== false))
        .catch(() => finish(btn, false));
    });
  });
})();
