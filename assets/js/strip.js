// strip.js — the home stage: a roll of frames (one statement card, then the
// photographs). Scrolling moves the roll, continuously; a click unfolds a frame;
// scrolling again folds it back.
// Progressive enhancement over a plain scrollable row of links (07-home.css):
// this adds .is-live to the stage, then drives every frame from one rAF loop.
//
//   index pose   every frame is a slit; `x` is the camera centre along the strip.
//                Wheel, trackpad and mouse drag always act here, folding first
//   view pose    frame `p` (fractional while moving) is unfolded to its full
//                aspect ratio, its neighbours wait beside it as slits.
//                Arrow keys and touch swipes step from frame to frame
//   z            0 → 1 cross-fades the two poses
//
// Each frame is a fixed 100×100 box whose transform gives it its real place and
// size, with its content counter-scaled inside. Only transforms change per tick,
// so the whole thing stays on the compositor: no layout, no repaint.
(() => {
  "use strict";

  const stage = document.querySelector("[data-stage]");
  const strip = stage && stage.querySelector("[data-strip]");
  if (!strip) return;

  const body = document.body;
  const probe = stage.querySelector("[data-probe]");
  const ruler = stage.querySelector("[data-ruler]");
  const ticks = [...ruler.children];
  const curEl = stage.querySelector("[data-ruler-cur]");
  const caption = stage.querySelector("[data-caption]");
  const capA = stage.querySelector("[data-cap-a]");
  const capB = stage.querySelector("[data-cap-b]");
  const indexBtn = stage.querySelector("[data-index]");
  const ring = stage.querySelector("[data-ring]");
  const idleA = capA.innerHTML;
  const idleB = capB.innerHTML;
  const still = matchMedia("(prefers-reduced-motion: reduce)");
  const BOX = 100;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  const S = [...strip.querySelectorAll("[data-slice]")].map((el, i) => {
    const link = el.querySelector("a");
    const d = el.dataset;
    const card = d.kind === "card";
    return {
      i, el, link, card, inner: el.querySelector("[data-inner]"),
      no: d.no || "00", ar: parseFloat(d.ar) || 1.5, slug: d.slug || "", color: d.color || "",
      title: d.title || "", place: d.place || "", date: d.date || "", tech: d.tech || "", hint: d.hint || "",
      md: link.dataset.md || "", mdW: +link.dataset.mdW || 0, lg: card ? "" : link.href, lgW: +link.dataset.lgW || 0,
      els: [el.querySelector("[data-inner]")], tier: 0, pending: -1, noLarge: card, lit: false, cur: false,
      ow: 0, oh: 0, w1: 0, l1: 0, l: 0, w: 0, h: 0, tf: "", itf: "",
    };
  });
  const n = S.length;
  if (!n) return;

  /* ---------- geometry ---------- */

  let vw = 0, vh = 0, dpr = 1, Ws = 0, Hs = 0, pitch = 0, xMin = 0, xMax = 0, Wz = 0, Gz = 0, dragSpan = 1;

  const snap = (v) => Math.round(v * dpr) / dpr;
  const centre = (i) => i * pitch + Ws / 2;

  const measure = () => {
    vw = stage.clientWidth;
    vh = stage.clientHeight;
    dpr = window.devicePixelRatio || 1;
    Ws = probe.offsetWidth;
    Hs = probe.offsetHeight;
    pitch = Ws + Math.round(Ws * 0.2);
    const small = vw < 720;
    const total = (n - 1) * pitch + Ws;
    const lead = vw * (small ? 0.28 : 0.36);
    xMin = vw / 2 - lead;
    xMax = total - vw / 2 + lead;
    if (xMax < xMin) xMin = xMax = total / 2;
    const boxW = vw * (small ? 0.9 : 0.72);
    const boxH = vh * (small ? 0.52 : 0.64);
    for (const s of S) {
      if (s.card) s.ar = small ? 0.8 : 1.5;
      s.ow = Math.round(Math.min(boxW, boxH * s.ar));
      s.oh = Math.round(s.ow / s.ar);
      s.inner.style.width = s.ow + "px";
      s.inner.style.height = s.oh + "px";
      s.tf = s.itf = "";
    }
    Wz = Math.round(Ws * (small ? 1.1 : 1.5));
    Gz = Math.round(Math.max(24, vw * 0.045));
    dragSpan = vw * (small ? 0.8 : 0.4);
    ruler.style.setProperty("--tick-gap", clamp(Math.floor(Math.min(vw * 0.5, 420) / n) - 1, 2, 5) + "px");
  };

  /* ---------- state ---------- */

  let x = 0, xT = 0, p = 0, pT = 0, z = 0, zT = 0, vel = 0;
  let xRate = 7, zRate = 6;
  let view = false;
  let hover = -1, focusIdx = -1, scrub = -1, capHold = -1, holdTimer = 0;
  let px = -1, py = -1, pointerOk = false, touching = false;
  let drag = null, swallow = false;
  let cur = -2, litKey = "", capIdx = -2, tickIdx = -1, inA = -1, inB = -2, ringKey = "";
  let raf = 0, last = -1, atRest = true;

  /* ---------- image sizes ----------
     A frame shows its small file while it is a slit and a large one while it (or its
     neighbour) is unfolded. Large files start downloading the moment a frame opens,
     are decoded off the main thread, and are swapped in as ready-made elements — but
     only once the roll is calm, so nothing is decoded or uploaded mid-movement. */

  const sizeFor = (s) => (s.ow * Math.min(dpr, 3) > s.mdW * 1.15 && s.lgW > s.mdW ? 2 : 1);
  const wanted = (s) => (s.noLarge || !view || Math.abs(s.i - cur) > 1 ? 0 : sizeFor(s));

  const large = (s, tier) => {
    if (!s.els[tier]) {
      const el = new Image();
      el.alt = s.els[0].alt;
      el.draggable = false;
      el.setAttribute("data-inner", "");
      el.src = tier === 2 ? s.lg : s.md;
      s.els[tier] = el;
    }
    return s.els[tier];
  };

  const retier = () => {
    for (const s of S) {
      const tier = wanted(s);
      if (tier === s.tier) { s.pending = -1; continue; }
      if (tier === s.pending) continue;
      s.pending = tier;
      const el = tier ? large(s, tier) : s.els[0];
      el.loading = "eager";
      const swap = () => {
        if (s.pending !== tier) return;
        el.style.cssText = s.inner.style.cssText;
        s.inner.replaceWith(el);
        s.inner = el;
        s.tier = tier;
        s.pending = -1;
      };
      // a large file that fails is given up on; the small one goes back in regardless
      el.decode().then(swap, tier ? () => { s.noLarge = true; s.pending = -1; } : swap);
    }
  };

  /* ---------- derived UI: lit frames, caption, ruler, tint, URL ---------- */

  const setCaption = (i) => {
    const s = S[i];
    if (!s) {
      capA.innerHTML = idleA;
      capB.innerHTML = idleB;
    } else if (s.card) {
      capA.innerHTML = idleA;
      capB.textContent = s.hint;
    } else {
      const head = [s.title, s.place].filter(Boolean).join(" · ");
      capA.textContent = s.no + (head ? " — " + head : "");
      capB.textContent = [s.date, s.tech].filter(Boolean).join(" · ");
    }
    capB.classList.toggle("is-data", !!s && !s.card);
    if (!still.matches && caption.animate) {
      caption.animate(
        [{ opacity: 0.15, transform: "translateY(0.25rem)" }, { opacity: 1, transform: "none" }],
        { duration: 340, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
      );
    }
  };

  const sync = () => {
    const c = view ? clamp(Math.round(pT), 0, n - 1) : -1;
    // with no pointer to hover with, the frame crossing the centre is the lit one
    const near = touching && !view ? clamp(Math.round((x - Ws / 2) / pitch), 0, n - 1) : -1;
    const h = scrub >= 0 ? scrub : hover >= 0 ? hover : focusIdx >= 0 ? focusIdx : near;

    const key = c + ":" + h;
    if (key !== litKey) {
      litKey = key;
      for (const s of S) {
        const lit = s.i === c || s.i === h;
        if (lit !== s.lit) { s.lit = lit; s.el.classList.toggle("is-lit", lit); }
        const isCur = s.i === c;
        if (isCur !== s.cur) {
          s.cur = isCur;
          if (isCur) s.link.setAttribute("aria-current", "true");
          else s.link.removeAttribute("aria-current");
        }
      }
    }

    if (h >= 0) { capHold = h; clearTimeout(holdTimer); holdTimer = 0; }
    else if (capHold >= 0 && !holdTimer) {
      holdTimer = setTimeout(() => { holdTimer = 0; capHold = -1; sync(); }, 200);
    }
    // the ruler follows at once…
    const ti = view ? c : h;
    if (ti !== tickIdx) {
      if (tickIdx >= 0) ticks[tickIdx].classList.remove("is-on");
      if (ti >= 0) ticks[ti].classList.add("is-on");
      tickIdx = ti;
    }
    // …the caption waits until the roll is slow enough to read, instead of
    // flickering through every frame that passes under the pointer
    const ci = view ? c : capHold;
    const passing = !view && scrub < 0 && focusIdx < 0 && Math.abs(vel) > 300;
    if (ci !== capIdx && !passing) {
      capIdx = ci;
      setCaption(ci);
    }

    if (c !== cur) {
      cur = c;
      const s = S[c];
      const tinted = !!(s && s.color);
      if (tinted) body.style.setProperty("--photo", s.color);
      body.classList.toggle("is-tinted", tinted);
      if (s) {
        curEl.textContent = s.no;
        for (const f of [s, S[c + 1], S[c - 1]]) if (f && !f.noLarge) large(f, sizeFor(f));
      }
      const url = s && s.slug ? "#" + encodeURIComponent(s.slug) : location.pathname + location.search;
      if ((location.hash || "") !== (s && s.slug ? url : "")) {
        try { history.replaceState(history.state, "", url); } catch (e) {}
      }
    }
  };

  /* ---------- view / index ---------- */

  const openAt = (i) => {
    i = clamp(i, 0, n - 1);
    if (!view) {
      view = true;
      zT = 1;
      zRate = 6;
      if (z < 0.02) p = i;
      stage.classList.add("is-view");
      indexBtn.tabIndex = 0;
    }
    pT = i;
    sync();
    kick();
  };

  const toIndex = () => {
    if (!view) return;
    view = false;
    zT = 0;
    zRate = 6;
    if (z > 0.98) x = xT = clamp(centre(clamp(Math.round(p), 0, n - 1)), xMin, xMax);
    stage.classList.remove("is-view");
    indexBtn.tabIndex = -1;
    sync();
    kick();
  };

  const fromHash = () => {
    let h = location.hash.slice(1);
    if (!h) return -1;
    try { h = decodeURIComponent(h); } catch (e) {}
    return S.findIndex((s) => s.slug === h);
  };

  /* ---------- the tick ---------- */

  // In the strip the gaps between slits belong to the nearer slit, so the lit frame
  // is handed from one to the next without going dark in between.
  const hit = (cx, cy) => {
    const slack = view ? 0 : (pitch - Ws) / 2 + 0.5;
    for (const s of S) {
      if (cx >= s.l - slack && cx <= s.l + s.w + slack && Math.abs(cy - vh / 2) <= s.h / 2) return s.i;
    }
    return -1;
  };

  const render = () => {
    const ze = smooth(clamp(z, 0, 1));
    const unfolding = ze > 0.001;

    let hCur = Hs, cam = 0;
    if (unfolding) {
      const i0 = clamp(Math.floor(p), 0, n - 1);
      const i1 = Math.min(n - 1, i0 + 1);
      const f = clamp(p - i0, 0, 1);
      hCur = lerp(S[i0].oh, S[i1].oh, smooth(f));
      let acc = 0;
      for (const s of S) {
        s.w1 = lerp(Wz, s.ow, smooth(clamp(1 - Math.abs(s.i - p), 0, 1)));
        s.l1 = acc;
        acc += s.w1 + Gz;
      }
      cam = lerp(S[i0].l1 + S[i0].w1 / 2, S[i1].l1 + S[i1].w1 / 2, f);
    }

    const skew = still.matches ? 0 : clamp(vel * -0.0035, -4, 4) * (1 - ze);
    const lean = Math.abs(skew) > 0.02 ? ` skewX(${skew.toFixed(2)}deg)` : "";
    // in motion everything travels in fractions of a pixel (whole-pixel steps stutter
    // at low speed); at rest it lands on device pixels, so edges stay crisp
    const q = atRest ? snap : (v) => v;

    for (const s of S) {
      let l = s.i * pitch - x + vw / 2, w = Ws, h = Hs;
      if (unfolding) {
        l = lerp(l, s.l1 - cam + vw / 2, ze);
        w = lerp(w, s.w1, ze);
        h = lerp(h, hCur, ze);
      }
      l = q(l);
      w = Math.max(q(w), 1);
      h = Math.max(q(h), 1);
      s.l = l;
      s.w = w;
      s.h = h;

      const sx = w / BOX, sy = h / BOX;
      const tf = `translate3d(${+l.toFixed(2)}px,${+q((vh - h) / 2).toFixed(2)}px,0)${lean} scale(${+sx.toFixed(5)},${+sy.toFixed(5)})`;
      if (tf !== s.tf) { s.el.style.transform = s.tf = tf; }
      if (l + w < -120 || l > vw + 120) continue;

      // the box is a window onto its content: cover it, and pan as it crosses the room
      const k = Math.max(h / s.oh, w / s.ow);
      const panX = (s.ow * k - w) * clamp((l + w / 2) / vw, 0, 1);
      const panY = (s.oh * k - h) / 2;
      const itf = `translate(${(-panX / sx).toFixed(3)}px,${(-panY / sy).toFixed(3)}px) scale(${(k / sx).toFixed(5)},${(k / sy).toFixed(5)})`;
      if (itf !== s.itf) { s.inner.style.transform = s.itf = itf; }
    }

    // ruler: brighten the ticks whose frames are on screen
    let a = -1, b = -2;
    if (!view) {
      a = clamp(Math.ceil((x - vw / 2 - Ws) / pitch), 0, n - 1);
      b = clamp(Math.floor((x + vw / 2) / pitch), 0, n - 1);
    }
    if (a !== inA || b !== inB) {
      for (let i = 0; i < n; i++) ticks[i].classList.toggle("is-in", i >= a && i <= b);
      inA = a;
      inB = b;
    }

    // keyboard focus: one ring that follows the focused frame
    const f = S[focusIdx];
    const rk = f ? `${f.l.toFixed(1)}|${f.w.toFixed(1)}|${f.h.toFixed(1)}` : "";
    if (rk !== ringKey) {
      ringKey = rk;
      ring.classList.toggle("is-on", !!f);
      if (f) {
        ring.style.width = f.w.toFixed(1) + "px";
        ring.style.height = f.h.toFixed(1) + "px";
        ring.style.transform = `translate3d(${f.l.toFixed(1)}px,${((vh - f.h) / 2).toFixed(1)}px,0)`;
      }
    }
  };

  const frame = (now) => {
    raf = 0;
    // the loop sleeps when nothing moves; its first frame back is one ordinary frame
    // long, however long the nap was — otherwise every movement would start with a lurch
    const dt = last < 0 ? 1 / 60 : clamp((now - last) / 1000, 0.001, 0.05);
    last = now;
    const k = (rate) => (still.matches ? 1 : 1 - Math.exp(-dt * rate));

    const x0 = x;
    x += (xT - x) * k(xRate);
    p += (pT - p) * k(9);
    z += (zT - z) * k(zRate);
    vel = lerp(vel, (x - x0) / dt, k(14));

    const moving = Math.abs(xT - x) > 0.05 || Math.abs(pT - p) > 0.0004 ||
      Math.abs(zT - z) > 0.0004 || Math.abs(vel) > 4;
    if (!moving) { x = xT; p = pT; z = zT; vel = 0; xRate = 7; zRate = 6; }

    atRest = !moving && !drag;
    render();
    hover = pointerOk && !drag ? hit(px, py) : -1;
    sync();
    if (!drag && Math.abs(xT - x) < 2 && Math.abs(pT - p) < 0.03 && Math.abs(zT - z) < 0.04) retier();
    if (moving || drag) kick();
    else last = -1;
  };

  const kick = () => {
    if (!raf) raf = requestAnimationFrame(frame);
  };

  /* ---------- input: wheel ----------
     Scrolling always moves the roll itself, continuously: every delta — the trackpad's
     own momentum included — goes straight into the target, and an open frame folds
     back into the strip as soon as the roll starts to move. */

  let nudge = 0, nudgeAt = 0;

  stage.addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    let d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (e.deltaMode === 1) d *= 32;
    else if (e.deltaMode === 2) d *= vh;

    if (view) {
      // the twitch of a resting finger should not close a photograph
      if (e.timeStamp - nudgeAt > 200) nudge = 0;
      nudgeAt = e.timeStamp;
      nudge += d;
      if (Math.abs(nudge) < 10) return;
      d = nudge;
      nudge = 0;
      toIndex();
    }
    xRate = 7;
    xT = clamp(xT + d * 1.15, xMin, xMax);
    kick();
  }, { passive: false });

  /* ---------- input: pointer (hover, drag, click) ---------- */

  stage.addEventListener("pointerdown", (e) => {
    touching = e.pointerType === "touch";
    if (e.button !== 0 || e.target.closest("button, [data-ruler], .caption, .stage-links")) return;
    xRate = 7;
    drag = { id: e.pointerId, x0: e.clientX, xT0: xT, pT0: pT, moved: false, lx: e.clientX, lt: e.timeStamp, v: 0 };
  });

  addEventListener("pointermove", (e) => {
    if (drag && e.pointerId === drag.id) {
      let dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 6) {
        drag.moved = true;
        stage.classList.add("is-dragging");
        try { stage.setPointerCapture(e.pointerId); } catch (err) {}
        if (view && e.pointerType === "mouse") {
          // dragging with a mouse moves the roll too, so it folds like scrolling does
          toIndex();
          drag.x0 = e.clientX;
          drag.xT0 = xT;
          dx = 0;
        }
      }
      if (drag.moved) {
        const dt = Math.max(1, e.timeStamp - drag.lt);
        drag.v = lerp(drag.v, ((e.clientX - drag.lx) / dt) * 1000, 0.6);
        drag.lx = e.clientX;
        drag.lt = e.timeStamp;
        if (view) {
          // a touch swipe carries the roll one frame at most, like turning a page
          const base = Math.round(drag.pT0);
          pT = clamp(drag.pT0 - dx / dragSpan, Math.max(0, base - 1), Math.min(n - 1, base + 1));
        } else xT = clamp(drag.xT0 - dx, xMin, xMax);
      }
    }
    if (e.pointerType === "mouse") touching = false;
    pointerOk = e.pointerType !== "touch" && !!e.target.closest && !!e.target.closest("[data-strip]");
    px = e.clientX;
    py = e.clientY;
    kick();
  });

  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moved) {
      stage.classList.remove("is-dragging");
      if (e.timeStamp - drag.lt > 80) drag.v = 0;
      if (view) {
        // far enough, or flicked the same way: turn the page; flicked back: stay
        const base = Math.round(drag.pT0);
        const dir = Math.sign(pT - base);
        const flick = Math.abs(drag.v) > 350 ? -Math.sign(drag.v) : 0;
        const go = flick ? flick === dir : Math.abs(pT - base) > 0.18;
        pT = clamp(base + (go ? dir : 0), 0, n - 1);
      } else xT = clamp(xT - drag.v * 0.3, xMin, xMax);
      swallow = true;
      setTimeout(() => { swallow = false; }, 0);
    }
    drag = null;
    sync();
    kick();
  };
  addEventListener("pointerup", endDrag);
  addEventListener("pointercancel", endDrag);

  document.documentElement.addEventListener("pointerleave", () => {
    pointerOk = false;
    kick();
  });

  stage.addEventListener("dragstart", (e) => e.preventDefault());

  stage.addEventListener("click", (e) => {
    if (swallow) { e.preventDefault(); return; }
    if (e.target.closest("[data-index]")) { toIndex(); return; }
    const a = e.target.closest(".slice-link");
    // a click in the gap beside a lit slit counts as a click on that slit
    const s = a ? S.find((f) => f.link === a) : !view && e.target === strip ? S[hit(e.clientX, e.clientY)] : null;
    if (!s || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (view && s.i === Math.round(pT)) {
      if (s.card) return; // the open card is a plain link: on to About
      e.preventDefault();
      toIndex();
    } else {
      e.preventDefault();
      openAt(s.i);
    }
  });

  /* ---------- input: ruler scrubbing ---------- */

  const scrubTo = (cx) => {
    const r = ruler.getBoundingClientRect();
    scrub = Math.round(clamp((cx - r.left) / r.width, 0, 1) * (n - 1));
    if (view) pT = scrub;
    else xT = clamp(centre(scrub), xMin, xMax);
    sync();
    kick();
  };

  ruler.addEventListener("pointerdown", (e) => {
    try { ruler.setPointerCapture(e.pointerId); } catch (err) {}
    scrubTo(e.clientX);
  });
  ruler.addEventListener("pointermove", (e) => {
    if (e.buttons || scrub >= 0 || e.pointerType !== "touch") scrubTo(e.clientX);
  });
  const endScrub = () => { scrub = -1; sync(); kick(); };
  ruler.addEventListener("pointerup", endScrub);
  ruler.addEventListener("pointercancel", endScrub);
  ruler.addEventListener("pointerleave", (e) => { if (!e.buttons) endScrub(); });

  /* ---------- input: keyboard & focus ---------- */

  addEventListener("keydown", (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
    const fwd = e.key === "ArrowRight" || e.key === "ArrowDown";
    const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (view) {
      if (e.key === "Escape") toIndex();
      else if (fwd || back) openAt(Math.round(pT) + (fwd ? 1 : -1));
      else return;
    } else if (fwd || back) {
      xRate = 7;
      xT = clamp(xT + pitch * 3 * (fwd ? 1 : -1), xMin, xMax);
      kick();
    } else return;
    e.preventDefault();
  });

  strip.addEventListener("focusin", (e) => {
    const a = e.target.closest(".slice-link");
    stage.scrollLeft = stage.scrollTop = 0;
    if (!a || !a.matches(":focus-visible")) return;
    focusIdx = S.findIndex((s) => s.link === a);
    if (view) pT = focusIdx;
    else xT = clamp(centre(focusIdx), xMin, xMax);
    sync();
    kick();
  });
  strip.addEventListener("focusout", () => { focusIdx = -1; sync(); kick(); });

  /* ---------- URL & resize ---------- */

  addEventListener("hashchange", () => {
    const i = fromHash();
    if (i >= 0 && i !== cur) openAt(i);
  });

  addEventListener("resize", () => {
    const r = xMax > xMin ? (xT - xMin) / (xMax - xMin) : 0;
    measure();
    x = xT = lerp(xMin, xMax, clamp(r, 0, 1));
    atRest = true;
    render();
    kick();
  });

  // the strip only fetches the thumbnails near the viewport; once the page has
  // settled, bring in the rest so scrubbing never lands on an empty frame
  const fetchRest = () => {
    for (const s of S) if (!s.card) s.els[0].loading = "eager";
  };
  addEventListener("load", () => (window.requestIdleCallback || setTimeout)(fetchRest, { timeout: 2500 }));

  /* ---------- start ---------- */

  measure();
  stage.classList.add("is-live");
  const first = fromHash();
  if (first >= 0 || still.matches) {
    x = xT = clamp(centre(Math.max(first, 0)), xMin, xMax);
    z = 1;
    openAt(Math.max(first, 0));
  } else {
    // entrance in two beats: the roll develops slit by slit, then the first frame
    // unfolds — unless the visitor has already started moving it themselves
    x = xT = xMin;
    if (S[0].el.animate) {
      for (const s of S) {
        s.el.animate(
          [{ clipPath: "inset(100% 0 0 0)" }, { clipPath: "inset(0 0 0 0)" }],
          { duration: 900, delay: Math.min(s.i, 22) * 30, easing: "cubic-bezier(0.7, 0, 0.2, 1)", fill: "backwards" }
        );
      }
    }
    let auto = setTimeout(() => { auto = 0; openAt(0); zRate = 2.6; }, 650);
    const cancelAuto = () => { clearTimeout(auto); auto = 0; };
    for (const t of ["wheel", "pointerdown", "keydown"]) addEventListener(t, cancelAuto, { capture: true, passive: true });
  }
  render();
  sync();
  kick();
})();
