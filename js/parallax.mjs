export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function toNumber(value, fallback = 0) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const DEFAULT_PARALLAX = Object.freeze({
  speedY: 0,
  speedX: 0,
  maxShift: 140,
});

export function normalizeParallaxConfig(config = {}) {
  const speedY = toNumber(config.speed ?? config.speedY, DEFAULT_PARALLAX.speedY);
  const speedX = toNumber(config.speedX, DEFAULT_PARALLAX.speedX);
  const maxShift = Math.max(0, toNumber(config.maxShift, DEFAULT_PARALLAX.maxShift));

  return { speedY, speedX, maxShift };
}

export function inferPerformanceMode(options = {}) {
  const forceMode = options.forceMode;
  if (forceMode === "lite" || forceMode === "full") {
    return forceMode;
  }

  if (options.prefersReducedMotion) {
    return "lite";
  }

  const deviceMemory = Number.isFinite(options.deviceMemory) ? options.deviceMemory : 8;
  const hardwareConcurrency = Number.isFinite(options.hardwareConcurrency) ? options.hardwareConcurrency : 8;
  const isSmallViewport = Boolean(options.isSmallViewport);

  if (deviceMemory <= 4 || hardwareConcurrency <= 4 || isSmallViewport) {
    return "lite";
  }

  return "full";
}

export function calcShift({ scrollY, start, speed, maxShift }) {
  if (!Number.isFinite(scrollY) || !Number.isFinite(start) || !Number.isFinite(speed)) {
    return 0;
  }
  if (!Number.isFinite(maxShift) || maxShift <= 0 || speed === 0) {
    return 0;
  }

  const raw = (scrollY - start) * speed;
  return clamp(raw, -maxShift, maxShift);
}
