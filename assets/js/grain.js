// grain.js — the unexposed frame on the 404 page: a few specks of grain drift
// across the empty ASCII frame. The frame itself is plain text in the markup.
(() => {
  "use strict";

  const pre = document.querySelector("[data-blank-frame]");
  if (!pre || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const rows = pre.textContent.split("\n");
  // the cells strictly inside the inner frame
  const cells = [];
  rows.forEach((row, y) => {
    const m = /^\| \|( +)\| \|$/.exec(row);
    if (m) for (let x = 0; x < m[1].length; x++) cells.push([y, x + 3]);
  });
  if (!cells.length) return;

  const SPECK = ".,'`:";
  const draw = () => {
    const out = rows.map((row) => row.split(""));
    for (let i = 0; i < 7; i++) {
      const [y, x] = cells[Math.floor(Math.random() * cells.length)];
      out[y][x] = SPECK[Math.floor(Math.random() * SPECK.length)];
    }
    pre.textContent = out.map((row) => row.join("")).join("\n");
  };

  let timer = 0;
  const run = () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(draw, 160);
  };
  document.addEventListener("visibilitychange", run);
  run();
})();
