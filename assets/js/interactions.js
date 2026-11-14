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

  /* ---- line-masked hero entrance ---------------------------------------
     The signature: each glyph of .hero-name and each word of .hero-role
     gets an overflow:hidden shell (.lm) around a rising unit (.lm-g) —
     translateY(110%)→0, 700ms expo, ~50ms stagger, once on load. Only
     text nodes are wrapped, so the absolutely positioned .hero-coord
     spine inside .hero-name is untouched. Units start hidden via
     animation-fill backwards — no flash, no extra trigger class.      */
  if (!reduced) {
    var lm = function (el, byWord, d) {
      if (!el) return d;
      Array.prototype.slice.call(el.childNodes).forEach(function (n) {
        if (n.nodeType !== 3) return; // elements (e.g. .hero-coord) stay
        var frag = document.createDocumentFragment();
        var parts = byWord
          ? n.nodeValue.split(/(\s+)/) // words keep their whitespace
          : Array.from(n.nodeValue); // code points — surrogate-safe
        parts.forEach(function (p) {
          if (!p) return;
          if (!/\S/.test(p)) {
            frag.appendChild(document.createTextNode(p));
            return;
          }
          var m = document.createElement("span");
          m.className = "lm";
          var g = document.createElement("span");
          g.className = "lm-g";
          g.style.setProperty("--lm-d", d + "ms");
          g.textContent = p;
          m.appendChild(g);
          frag.appendChild(m);
          d += byWord ? 45 : 55;
        });
        n.parentNode.replaceChild(frag, n);
      });
      return d;
    };
    // name glyphs chase the eyebrow's .rv; role words trail the name
    var dEnd = lm(document.querySelector(".hero-name"), false, 140);
    lm(document.querySelector(".hero-role"), true, dEnd + 90);
  }

  /* ---- reveal-on-scroll ------------------------------------------------
     Elements get .rv (hidden) up front, then .is-in when they intersect —
     a 14px rise out of a 6px blur keyed off rv-in, staggered by sibling
     index via --rv-d (capped at 8 steps). Blocks only — never list rows:
     .post-row is stable chrome (and preview.js owns its hover layer).
     Nothing is hidden unless JS + IntersectionObserver both exist.      */
  if (!reduced && "IntersectionObserver" in window) {
    var targets = new Set();
    document
      .querySelectorAll(
        ".hero-eyebrow, .hero-meta, .trace, .page-head, .back-link," +
          " .post-head, .home-section, .post-year-head," +
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
      { rootMargin: "0px 0px -5% 0px", threshold: 0.1 }
    );

    targets.forEach(function (el) {
      // skip elements currently display:none (e.g. .toc-rail on mobile)
      // so they never get stuck hidden if shown later
      if (el.getClientRects().length === 0) return;
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.setProperty(
        "--rv-d",
        Math.min(Math.max(i, 0), 8) * 35 + "ms"
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

  /* ---- bfcache restore: settle instantly -------------------------------
     Back/forward through a persisted page must never replay entrances —
     everything frozen mid-flight (or still hidden waiting on IO) just
     lands in its final state.                                            */
  addEventListener("pageshow", function (e) {
    if (!e.persisted) return;
    document.querySelectorAll(".rv").forEach(function (el) {
      el.classList.remove("rv", "is-in");
      el.style.removeProperty("--rv-d");
    });
    document.querySelectorAll(".lm-g").forEach(function (g) {
      g.style.animation = "none";
    });
  });

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

  /* ---- magnetic hover ----------------------------------------------------
     Nav links, theme toggle, see-all / back-link lean ~3px toward the
     cursor, then spring home. Driven through the independent `translate`
     property so no `transform` transition in the cascade re-eases the
     per-frame writes. Fine pointers + motion-allowed only; mid-session
     media flips release every element cleanly.                            */
  var fineMQ = window.matchMedia("(pointer: fine)");
  var motionMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (fineMQ.matches && !motionMQ.matches) {
    var magOff = false;
    var mags = [];
    document
      .querySelectorAll(".site-nav a, .theme-toggle, .see-all, .back-link")
      .forEach(function (el) {
        var st = {
          el: el,
          x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0,
          hot: false, raf: 0
        };
        mags.push(st);

        var frame = function () {
          st.raf = 0;
          // semi-implicit spring — snappy tracking, soft overshoot home
          st.vx = (st.vx + (st.tx - st.x) * 0.22) * 0.7;
          st.vy = (st.vy + (st.ty - st.y) * 0.22) * 0.7;
          st.x += st.vx;
          st.y += st.vy;
          el.style.translate =
            st.x.toFixed(2) + "px " + st.y.toFixed(2) + "px";
          var settled =
            Math.abs(st.vx) + Math.abs(st.vy) +
              Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) <
            0.06;
          if (st.hot || !settled) {
            st.raf = requestAnimationFrame(frame);
          } else {
            st.x = st.y = 0;
            el.style.translate = "";
          }
        };
        var kick = function () {
          if (!st.raf && !magOff) st.raf = requestAnimationFrame(frame);
        };
        var release = function () {
          st.tx = 0;
          st.ty = 0;
          st.hot = false;
          kick();
        };

        el.addEventListener("pointerenter", function (e) {
          if (e.pointerType !== "mouse" || magOff) return;
          st.hot = true;
          kick();
        });
        el.addEventListener("pointermove", function (e) {
          if (e.pointerType !== "mouse" || magOff) return;
          var r = el.getBoundingClientRect();
          st.tx = Math.max(
            -3,
            Math.min(3, (e.clientX - (r.left + r.width / 2)) * 0.16)
          );
          st.ty = Math.max(
            -3,
            Math.min(3, (e.clientY - (r.top + r.height / 2)) * 0.16)
          );
          st.hot = true;
          kick();
        });
        el.addEventListener("pointerleave", release);
        el.addEventListener("pointercancel", release);
      });

    // never leave an element displaced if a media query flips mid-session
    var clearMags = function () {
      magOff = true;
      mags.forEach(function (st) {
        st.hot = false;
        st.x = st.y = st.vx = st.vy = st.tx = st.ty = 0;
        if (st.raf) cancelAnimationFrame(st.raf);
        st.raf = 0;
        st.el.style.translate = "";
      });
    };
    if (motionMQ.addEventListener)
      motionMQ.addEventListener("change", function (e) {
        if (e.matches) clearMags();
        else magOff = false;
      });
    if (fineMQ.addEventListener)
      fineMQ.addEventListener("change", function (e) {
        if (!e.matches) clearMags();
        else magOff = false;
      });
  }
})();
