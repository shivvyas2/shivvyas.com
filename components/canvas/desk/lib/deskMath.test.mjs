import test from "node:test";
import assert from "node:assert/strict";
import { clamp, clampToRect, springStep, keyPressOffset } from "./deskMath.mjs";

test("clamp and clampToRect", () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.deepEqual(clampToRect({ x: -9, z: 0.5 }, { minX: -1, maxX: 1, minZ: 0, maxZ: 1 }), { x: -1, z: 0.5 });
});

test("critically damped spring converges without overshoot", () => {
  let s = { value: 0, velocity: 0 };
  let max = 0;
  for (let i = 0; i < 120; i++) {
    s = springStep(s, 1, 1 / 60, { stiffness: 300, damping: 2 * Math.sqrt(300) });
    max = Math.max(max, s.value);
  }
  assert.ok(Math.abs(s.value - 1) < 1e-3);
  assert.ok(max <= 1.001);
});

test("spring stays finite for huge dt (tab was hidden)", () => {
  const s = springStep({ value: 0, velocity: 0 }, 1, 5, { stiffness: 300, damping: 10 });
  assert.ok(Number.isFinite(s.value) && Math.abs(s.value) < 2);
});

test("key press curve: down fast, back up, then rest", () => {
  assert.equal(keyPressOffset(0), 0);
  assert.equal(keyPressOffset(0.06), 1);
  assert.ok(keyPressOffset(0.1) > 0 && keyPressOffset(0.1) < 1);
  assert.equal(keyPressOffset(0.2), 0);
  assert.equal(keyPressOffset(-1), 0);
});
