// Subtle generative background for the landing hero
// Particles + soft connections; restrained motion and brightness.
(function () {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  let points = [];
  let rafId = null;
  let width = 0, height = 0;
  let reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const BLUE = [0, 200, 255];
  const MAGENTA = [255, 45, 161];

  function lerp(a, b, t) { return a + (b - a) * t; }
  function mixColor(c1, c2, t) {
    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));
    return `rgba(${r},${g},${b},0.25)`; // restrained alpha
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.round(Math.min(110, Math.max(60, width / 10)));
    const speed = reduceMotion ? 0 : 0.08;
    points = new Array(count).fill(0).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, width, height);

    // soft vignette background
    const grad = ctx.createRadialGradient(width * 0.5, height * 0.5, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.6);
    grad.addColorStop(0, 'rgba(0,0,0,0.0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    const maxDist = Math.min(140, Math.max(80, Math.min(width, height) * 0.25));
    const lineBase = 0.12; // base alpha

    // update positions
    for (const p of points) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;
    }

    // draw connections
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const dx = points[i].x - points[j].x;
        const dy = points[i].y - points[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const t = (points[i].x + points[j].x) / (2 * width);
          ctx.strokeStyle = mixColor(BLUE, MAGENTA, t);
          ctx.globalAlpha = Math.max(0.05, lineBase * (1 - dist / maxDist));
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(points[i].x, points[i].y);
          ctx.lineTo(points[j].x, points[j].y);
          ctx.stroke();
        }
      }
    }

    // draw nodes (very subtle)
    ctx.globalAlpha = 0.08;
    for (const p of points) {
      const t = p.x / width;
      ctx.fillStyle = mixColor(BLUE, MAGENTA, t).replace(',0.25)', ',0.18)');
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    if (!reduceMotion) rafId = requestAnimationFrame(step);
  }

  function start() {
    cancel();
    resize();
    if (reduceMotion) { step(); return; }
    rafId = requestAnimationFrame(step);
  }

  function cancel() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

  // init
  start();
  window.addEventListener('resize', () => start());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancel(); else start();
  });
})();