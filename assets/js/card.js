// card.js — the statement card under a loupe. With a mouse over the open card, a
// small ring follows the pointer and the sentence re-breaks around it, line by line.
// The line breaking is done by Pretext (assets/vendor/pretext.js, fetched only here,
// only for fine pointers): no DOM measurement in the loop, just arithmetic and
// transforms. Without it the card is the plain paragraph it always was.
(() => {
  "use strict";

  const say = document.querySelector(".card-say[data-flow]");
  if (!say || !say.dataset.flow) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const card = say.closest(".card");
  const link = say.closest("a");
  const text = say.textContent.replace(/\s+/g, " ").trim();
  const aside = say.querySelector("span");
  const asideAt = aside ? text.indexOf(aside.textContent.trim()) : -1;

  let lib = null, prepared = null, flow = null, orb = null;
  let fs = 0, lh = 0, W = 0, R = 0;
  const lines = [];
  let ox = 0, oy = 0, tx = 0, ty = 0, r = 0, rT = 0, raf = 0, last = -1;

  const setup = () => {
    const cs = getComputedStyle(say);
    fs = parseFloat(cs.fontSize);
    lh = parseFloat(cs.lineHeight) || fs * 1.22;
    W = say.clientWidth;
    R = fs * 1.55;
    prepared = lib.prepareWithSegments(text, `${cs.fontWeight} ${fs}px ${cs.fontFamily}`, {
      letterSpacing: parseFloat(cs.letterSpacing) || 0,
    });
    flow.style.left = say.offsetLeft + "px";
    flow.style.top = say.offsetTop + "px";
    flow.style.width = W + "px";
    orb.style.width = orb.style.height = R * 2 + "px";
  };

  // the free runs of a row, left to right, once the ring has taken its share
  const slots = (y) => {
    if (r < 1) return [[0, W]];
    const dy = oy < y ? y - oy : oy > y + lh ? oy - y - lh : 0;
    if (dy >= r) return [[0, W]];
    const half = Math.sqrt(r * r - dy * dy) + fs * 0.4 * (r / R);
    const out = [];
    if (ox - half >= fs * 3) out.push([0, ox - half]);
    if (W - ox - half >= fs * 3) out.push([ox + half, W]);
    return out;
  };

  const place = (k, str, at, x, y) => {
    let ln = lines[k];
    if (!ln) {
      const el = document.createElement("span");
      flow.append(el);
      ln = lines[k] = { el, key: "" };
    }
    const cut = asideAt < 0 ? str.length : Math.min(str.length, Math.max(0, asideAt - at));
    const key = cut + "|" + str;
    if (key !== ln.key) {
      ln.key = key;
      ln.el.textContent = str.slice(0, cut);
      if (cut < str.length) {
        const em = document.createElement("em");
        em.textContent = str.slice(cut);
        ln.el.append(em);
      }
    }
    ln.el.style.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px)`;
  };

  const layout = () => {
    let cursor, k = 0, at = 0, y = 0, done = false;
    for (let row = 0; row < 40 && !done; row++, y += lh) {
      const free = slots(y);
      for (const [a, b] of free) {
        const line = lib.layoutNextLine(prepared, b - a, cursor);
        if (!line) { done = true; break; }
        // a run too narrow for the next word is left empty rather than splitting the word
        if (b - a < W && (line.end.graphemeIndex !== 0 || line.width > b - a + 0.5)) continue;
        const str = line.text.replace(/\s+$/, "");
        const found = text.indexOf(str, at);
        if (found >= 0) at = found;
        place(k++, str, at, a, y);
        at += str.length;
        cursor = line.end;
      }
    }
    for (let i = k; i < lines.length; i++) {
      if (lines[i].key) { lines[i].key = ""; lines[i].el.textContent = ""; }
    }
    orb.style.transform = `translate(${(ox - R).toFixed(2)}px,${(oy - R).toFixed(2)}px) scale(${(r / R).toFixed(4)})`;
  };

  const frame = (now) => {
    raf = 0;
    const dt = last < 0 ? 1 / 60 : Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    ox += (tx - ox) * (1 - Math.exp(-dt * 16));
    oy += (ty - oy) * (1 - Math.exp(-dt * 16));
    r += (rT - r) * (1 - Math.exp(-dt * 9));
    const moving = Math.abs(rT - r) > 0.2 || Math.abs(tx - ox) > 0.1 || Math.abs(ty - oy) > 0.1;
    if (!moving) { r = rT; ox = tx; oy = ty; }
    layout();
    if (moving) raf = requestAnimationFrame(frame);
    else last = -1;
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };

  const onMove = (e) => {
    let on = false;
    if (!e.buttons && e.pointerType === "mouse" && link.getAttribute("aria-current") === "true") {
      const box = card.getBoundingClientRect();
      const rect = say.getBoundingClientRect();
      const sc = rect.width / (say.offsetWidth || 1);
      // only once the card has finished unfolding and sits 1:1 on screen
      if (Math.abs(sc - 1) < 0.02 && e.clientX >= box.left && e.clientX <= box.right &&
          e.clientY >= box.top && e.clientY <= box.bottom) {
        on = true;
        tx = e.clientX - rect.left;
        ty = e.clientY - rect.top;
        if (r < 1) { ox = tx; oy = ty; }
      }
    }
    rT = on ? R : 0;
    kick();
  };
  const off = () => { rT = 0; kick(); };

  const start = (mod) => {
    lib = mod;
    flow = document.createElement("div");
    flow.className = "card-flow";
    flow.setAttribute("aria-hidden", "true");
    orb = document.createElement("i");
    orb.className = "card-orb";
    flow.append(orb);
    say.after(flow);
    setup();
    layout();
    card.classList.add("is-flow");
    if (window.ResizeObserver) new ResizeObserver(() => { setup(); layout(); }).observe(card);
    addEventListener("pointermove", onMove, { passive: true });
    addEventListener("pointerdown", off, { passive: true });
    addEventListener("wheel", off, { passive: true });
    addEventListener("keydown", off);
    document.documentElement.addEventListener("pointerleave", off);
  };

  const load = () => {
    const fonts = document.fonts ? document.fonts.ready : Promise.resolve();
    Promise.all([import(say.dataset.flow), fonts]).then(([mod]) => start(mod), () => {});
  };
  const idle = () => (window.requestIdleCallback || setTimeout)(load, { timeout: 2000 });
  if (document.readyState === "complete") idle();
  else addEventListener("load", idle);
})();
