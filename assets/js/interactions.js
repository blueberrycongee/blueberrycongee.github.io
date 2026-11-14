// interactions.js — interactions agent owns this file.
// Global micro-interactions: external-link affordances, reveal-on-scroll,
// reading progress. All progressive enhancement — the site is fully
// usable with JS disabled. (Article-page behaviors — heading anchors,
// TOC scroll-spy, code copy — live in post.js, owned by posts agent.)
(() => {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- external links in authored content → new tab + noopener + ↗ ----
     .prose plus typography's authored-markdown scopes (about lede,
     entry descriptions, bangumi intro…) — everything except component
     chrome, which keeps its own link treatment.                      */
  document
    .querySelectorAll(
      ".prose a[href], .lede a[href], .now-text a[href]," +
        " .sec-text a[href], .sec-note a[href], .entry-desc a[href]," +
        " .fact-v a[href], .bangumi-intro a[href]"
    )
    .forEach(function (a) {
      if (!a.hostname || a.hostname === location.hostname) return;
      a.target = "_blank";
      a.rel = "noopener";
      if (!a.querySelector("img")) a.classList.add("ext");
    });

  /* ---- reveal-on-scroll ------------------------------------------------
     Elements get .rv (hidden) up front, then .is-in when they intersect —
     a 6px settle keyed off rv-in, staggered by sibling index via --rv-d.
     Nothing is hidden unless JS + IntersectionObserver both exist.      */
  if (!reduced && "IntersectionObserver" in window) {
    var targets = new Set();
    document
      .querySelectorAll(
        ".hero, .page-head, .back-link, .post-head," +
          " .home-section, .post-year-head," +
          " .post-year .post-row, .post-list-flat > .post-row," +
          " .term-cloud, .toc-inline, .toc-rail," +
          " .post > .prose, .page > .prose, .post-nav," +
          " .site-footer, .page-404 > *"
      )
      .forEach(function (el) {
        targets.add(el);
      });
    // structured single pages (about / bangumis): reveal each block
    document.querySelectorAll(".page-body").forEach(function (body) {
      if (body.classList.contains("prose")) return; // unit fade via .prose
      Array.prototype.forEach.call(body.children, function (c) {
        targets.add(c);
      });
    });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px" }
    );

    targets.forEach(function (el) {
      // skip elements currently display:none (e.g. .toc-rail on mobile)
      // so they never get stuck hidden if shown later
      if (el.getClientRects().length === 0) return;
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty(
        "--rv-d",
        Math.min(Math.max(i, 0) * 35, 210) + "ms"
      );
      el.classList.add("rv");
      // once the keyframe settles, drop the hooks so the element returns
      // to its own transitions/animations cleanly
      var done = function (e) {
        if (e.target !== el || e.animationName !== "rv-in") return;
        el.removeEventListener("animationend", done);
        el.classList.remove("rv", "is-in");
        el.style.removeProperty("--rv-d");
      };
      el.addEventListener("animationend", done);
      io.observe(el);
    });
  }

  /* ---- reading progress hairline (posts only) ---- */
  var article = document.querySelector("article.post");
  if (article) {
    var bar = document.createElement("div");
    bar.className = "read-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var raf = 0;
    var update = function () {
      raf = 0;
      var top = article.offsetTop;
      var span = article.offsetHeight - window.innerHeight;
      var p = 1;
      if (span > 0) {
        p = (window.scrollY - top) / span;
        p = Math.min(1, Math.max(0, p));
      }
      bar.style.transform = "scaleX(" + p + ")";
    };
    window.addEventListener(
      "scroll",
      function () {
        if (!raf) raf = requestAnimationFrame(update);
      },
      { passive: true }
    );
    window.addEventListener("resize", update);
    update();
  }
})();
