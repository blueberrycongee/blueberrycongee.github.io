import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeParallaxConfig } from "../js/parallax.mjs";

test("normalizeParallaxConfig supports rotate, scale, opacity", () => {
  const config = normalizeParallaxConfig({
    speed: "0.2",
    speedX: "0.1",
    maxShift: "120",
    rotate: "6",
    scale: "0.08",
    opacity: "0.2",
  });

  assert.equal(config.speedY, 0.2);
  assert.equal(config.speedX, 0.1);
  assert.equal(config.maxShift, 120);
  assert.equal(config.rotate, 6);
  assert.equal(config.scale, 0.08);
  assert.equal(config.opacity, 0.2);
});

test("normalizeParallaxConfig clamps invalid scale/opacity", () => {
  const config = normalizeParallaxConfig({
    rotate: "-4",
    scale: "-1",
    opacity: "-0.2",
  });

  assert.equal(config.rotate, -4);
  assert.equal(config.scale, 0);
  assert.equal(config.opacity, 0);
});
