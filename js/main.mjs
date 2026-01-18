import { calcShift, clamp, inferPerformanceMode, normalizeParallaxConfig } from "./parallax.mjs";

const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));
const revealItems = Array.from(document.querySelectorAll("[data-reveal]"));
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const viewportQuery = window.matchMedia("(max-width: 900px)");

const state = {
  scrollY: window.scrollY,
  height: window.innerHeight,
  isSmallViewport: viewportQuery.matches,
};

const EPSILON = 0.1;

let rafId = null;
let parallaxState = [];
let perfMode = "full";

const buildParallaxState = () =>
  parallaxItems.map((item) => {
    const rect = item.getBoundingClientRect();
    const offsetTop = rect.top + window.scrollY;
    const config = normalizeParallaxConfig(item.dataset);
    const baseOpacity = Number.parseFloat(getComputedStyle(item).opacity) || 1;

    return {
      element: item,
      center: offsetTop + rect.height * 0.5,
      speedY: config.speedY,
      speedX: config.speedX,
      maxShift: config.maxShift,
      rotate: config.rotate,
      scale: config.scale,
      opacity: config.opacity,
      baseOpacity,
      lastX: 0,
      lastY: 0,
      lastRotate: 0,
      lastScale: 1,
      lastOpacity: baseOpacity,
    };
  });

const refreshParallaxState = () => {
  parallaxState = buildParallaxState();
};

const applyPerfMode = () => {
  perfMode = inferPerformanceMode({
    deviceMemory: navigator.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    prefersReducedMotion: prefersReducedMotion.matches,
    isSmallViewport: state.isSmallViewport,
    forceMode: document.body.dataset.perf,
  });
  document.body.classList.toggle("is-lite", perfMode === "lite");
};

const motionEnabled = () => perfMode === "full" && !prefersReducedMotion.matches;

const applyParallax = () => {
  if (!parallaxState.length) {
    return;
  }

  if (!motionEnabled()) {
    parallaxState.forEach((item) => {
      const needsReset =
        item.lastX !== 0 ||
        item.lastY !== 0 ||
        item.lastRotate !== 0 ||
        item.lastScale !== 1 ||
        item.lastOpacity !== item.baseOpacity;
      if (needsReset) {
        item.element.style.transform = "translate3d(0, 0, 0)";
        item.element.style.opacity = `${item.baseOpacity}`;
        item.lastX = 0;
        item.lastY = 0;
        item.lastRotate = 0;
        item.lastScale = 1;
        item.lastOpacity = item.baseOpacity;
      }
    });
    return;
  }

  const viewportCenter = state.scrollY + state.height * 0.5;

  parallaxState.forEach((item) => {
    const shiftY = calcShift({
      scrollY: viewportCenter,
      start: item.center,
      speed: item.speedY,
      maxShift: item.maxShift,
    });

    const shiftX = calcShift({
      scrollY: viewportCenter,
      start: item.center,
      speed: item.speedX,
      maxShift: item.maxShift,
    });

    const progress = item.maxShift > 0 ? clamp(shiftY / item.maxShift, -1, 1) : 0;
    const nextRotate = item.rotate ? progress * item.rotate : 0;
    const nextScale = item.scale ? 1 + progress * item.scale : 1;
    const opacityShift = item.opacity ? Math.abs(progress) * item.opacity : 0;
    const nextOpacity = clamp(item.baseOpacity - opacityShift, 0, 1);

    const isSameShift = Math.abs(shiftX - item.lastX) < EPSILON && Math.abs(shiftY - item.lastY) < EPSILON;
    const isSameRotate = Math.abs(nextRotate - item.lastRotate) < EPSILON;
    const isSameScale = Math.abs(nextScale - item.lastScale) < EPSILON;
    const isSameOpacity = Math.abs(nextOpacity - item.lastOpacity) < EPSILON;

    if (isSameShift && isSameRotate && isSameScale && isSameOpacity) {
      return;
    }

    item.lastX = shiftX;
    item.lastY = shiftY;
    item.lastRotate = nextRotate;
    item.lastScale = nextScale;
    item.lastOpacity = nextOpacity;
    item.element.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) rotate(${nextRotate}deg) scale(${nextScale})`;
    item.element.style.opacity = `${nextOpacity}`;
  });
};

const requestTick = () => {
  if (rafId) {
    return;
  }
  rafId = window.requestAnimationFrame(() => {
    rafId = null;
    applyParallax();
  });
};

const handleScroll = () => {
  state.scrollY = window.scrollY;
  requestTick();
};

const handleResize = () => {
  state.height = window.innerHeight;
  state.isSmallViewport = viewportQuery.matches;
  applyPerfMode();
  refreshParallaxState();
  requestTick();
};

const handleViewportChange = (event) => {
  state.isSmallViewport = event.matches;
  applyPerfMode();
  refreshParallaxState();
  requestTick();
};

const setupReveals = () => {
  if (!revealItems.length || !motionEnabled()) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.2,
    }
  );

  revealItems.forEach((item) => observer.observe(item));
};

const onMotionPreferenceChange = () => {
  applyPerfMode();
  refreshParallaxState();
  applyParallax();
  setupReveals();
};

if (prefersReducedMotion.addEventListener) {
  prefersReducedMotion.addEventListener("change", onMotionPreferenceChange);
} else if (prefersReducedMotion.addListener) {
  prefersReducedMotion.addListener(onMotionPreferenceChange);
}

window.addEventListener("scroll", handleScroll, { passive: true });
window.addEventListener("resize", handleResize);
if (viewportQuery.addEventListener) {
  viewportQuery.addEventListener("change", handleViewportChange);
} else if (viewportQuery.addListener) {
  viewportQuery.addListener(handleViewportChange);
}

applyPerfMode();
refreshParallaxState();
applyParallax();
setupReveals();

if (document.fonts?.ready) {
  document.fonts.ready.then(() => {
    applyPerfMode();
    refreshParallaxState();
    requestTick();
  });
}
