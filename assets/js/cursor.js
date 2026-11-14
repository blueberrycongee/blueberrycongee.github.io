// cursor.js — motion agent owns this file.
// Custom cursor for fine pointers only: a tight dot plus a lazy
// lerped ring. Interactive elements grow the ring ~1.6x and the
// dot tightens. The layer is injected only while the mode is
// active and torn down on any media flip — so the native cursor
// (hidden via html.has-cursor in 12-cursor.css) can never be
// left without a replacement. Reduced-motion and touch get
// nothing at all.
(() => {
  "use strict";

  var fine = matchMedia("(pointer: fine)");
  var calm = matchMedia("(prefers-reduced-motion: reduce)");

  var HOT =
    "a, button, summary, input, textarea, select, label," +
    " .post-row, .work-row, .term-pill, [role='button']";

  var dot = null;
  var ring = null;
  var raf = 0;
  var live = false;
  var shown = false;
  var moved = false;

  var x = -100; // pointer target
  var y = -100;
  var dx = -100; // dot position — fast lerp
  var dy = -100;
  var rx = -100; // ring position — damped spring (overshoots, settles)
  var ry = -100;
  var rvx = 0; // ring velocity
  var rvy = 0;
  var rs = 1; // ring scale
  var ds = 1; // dot scale
  var hot = false; // hovering an interactive
  var press = false; // primary button held

  function show(on) {
    if (on === shown) return;
    shown = on;
    dot.classList.toggle("is-vis", on);
    ring.classList.toggle("is-vis", on);
  }

  function onMove(e) {
    // secondary touch pointers on hybrids must not wake the layer
    if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
    x = e.clientX;
    y = e.clientY;
    if (!moved) {
      moved = true;
      dx = rx = x;
      dy = ry = y;
      rvx = rvy = 0;
    }
    hot = !!(e.target && e.target.closest
      ? e.target.closest(HOT)
      : null);
    show(true);
  }

  function onOut(e) {
    if (!e.relatedTarget) {
      show(false);
      hot = false;
    }
  }

  function onDown(e) {
    if (e.button !== 0) return; // primary button only
    if (e.pointerType === "mouse" || e.pointerType === "pen")
      press = true;
  }

  function onUp() {
    press = false;
  }

  function onBlur() {
    show(false);
    press = false;
  }

  function frame() {
    dx += (x - dx) * 0.5;
    dy += (y - dy) * 0.5;
    // damped spring — the ring accelerates in, overshoots a hair,
    // and settles; reads as elastic rather than linear-follow
    rvx = (rvx + (x - rx) * 0.15) * 0.74;
    rvy = (rvy + (y - ry) * 0.15) * 0.74;
    rx += rvx;
    ry += rvy;
    // press squash wins over the hot grow — tactile click feel
    var trs = press ? 0.82 : hot ? 1.6 : 1;
    var tds = press ? 0.45 : hot ? 0.55 : 1;
    rs += (trs - rs) * 0.2;
    ds += (tds - ds) * 0.28;
    dot.style.transform =
      "translate(" +
      dx.toFixed(1) +
      "px," +
      dy.toFixed(1) +
      "px) scale(" +
      ds.toFixed(3) +
      ")";
    ring.style.transform =
      "translate(" +
      rx.toFixed(1) +
      "px," +
      ry.toFixed(1) +
      "px) scale(" +
      rs.toFixed(3) +
      ")";
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (live) return;
    live = true;
    dot = document.createElement("div");
    dot.className = "cursor-dot";
    dot.setAttribute("aria-hidden", "true");
    ring = document.createElement("div");
    ring.className = "cursor-ring";
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add("has-cursor");
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("pointerup", onUp, { passive: true });
    addEventListener("pointercancel", onUp, { passive: true });
    document.addEventListener("pointerout", onOut);
    addEventListener("blur", onBlur);
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    if (!live) return;
    live = false;
    shown = false;
    moved = false;
    hot = false;
    press = false;
    rvx = rvy = 0;
    cancelAnimationFrame(raf);
    raf = 0;
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", onDown);
    removeEventListener("pointerup", onUp);
    removeEventListener("pointercancel", onUp);
    document.removeEventListener("pointerout", onOut);
    removeEventListener("blur", onBlur);
    if (dot) {
      dot.remove();
      dot = null;
    }
    if (ring) {
      ring.remove();
      ring = null;
    }
    document.documentElement.classList.remove("has-cursor");
  }

  function sync() {
    if (fine.matches && !calm.matches) start();
    else stop();
  }

  if (fine.addEventListener) fine.addEventListener("change", sync);
  if (calm.addEventListener) calm.addEventListener("change", sync);
  sync();
})();
