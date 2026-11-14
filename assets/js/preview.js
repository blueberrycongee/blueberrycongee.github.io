// preview.js — floating cover image that lerps after the cursor
// on any element carrying [data-cover]. pointer:fine only;
// fully inert under reduced-motion or without JS.
(() => {
  if (!matchMedia("(pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const img = document.createElement("img");
  img.className = "cover-preview";
  img.alt = "";
  img.decoding = "async";
  img.setAttribute("aria-hidden", "true");
  document.body.appendChild(img);

  let tx = 0, ty = 0, x = 0, y = 0, raf = 0, on = false;

  const loop = () => {
    x += (tx - x) * 0.14;
    y += (ty - y) * 0.14;
    img.style.transform =
      `translate3d(${x}px, ${y}px, 0) translate(-50%, -112%) rotate(-2deg) scale(${on ? 1 : 0.94})`;
    if (!on && Math.abs(tx - x) < 0.5 && Math.abs(ty - y) < 0.5) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
  };

  const show = (src) => {
    if (img.getAttribute("src") !== src) img.src = src;
    if (!on) { x = tx; y = ty; }
    on = true;
    img.classList.add("is-on");
    if (!raf) raf = requestAnimationFrame(loop);
  };

  const hide = () => {
    on = false;
    img.classList.remove("is-on");
  };

  document.addEventListener("pointermove", (e) => {
    tx = e.clientX; ty = e.clientY;
  }, { passive: true });

  document.addEventListener("pointerover", (e) => {
    const row = e.target.closest("[data-cover]");
    if (row) show(row.dataset.cover);
  });

  document.addEventListener("pointerout", (e) => {
    const row = e.target.closest("[data-cover]");
    if (row && !(e.relatedTarget && row.contains(e.relatedTarget))) hide();
  });

  document.addEventListener("scroll", hide, { passive: true });
  document.addEventListener("pointerleave", hide);
})();
