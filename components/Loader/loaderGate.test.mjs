import test from "node:test";
import assert from "node:assert/strict";
import { MAX_WAIT_MS, SHOW_AFTER_MS, loaderGate } from "./loaderGate.mjs";

test("pages without the 3D hero never wait", () => {
  assert.deepEqual(loaderGate({ needsScene: false, sceneReady: false, elapsedMs: 0 }), { ready: true, showCounter: false });
});

test("home waits only for the hero scene", () => {
  assert.equal(loaderGate({ needsScene: true, sceneReady: false, elapsedMs: 1000 }).ready, false);
  assert.equal(loaderGate({ needsScene: true, sceneReady: true, elapsedMs: 1000 }).ready, true);
});

test("never holds the site longer than the cap", () => {
  assert.equal(MAX_WAIT_MS <= 3000, true);
  assert.equal(loaderGate({ needsScene: true, sceneReady: false, elapsedMs: MAX_WAIT_MS }).ready, true);
});

test("fast loads never flash the counter", () => {
  assert.equal(loaderGate({ needsScene: true, sceneReady: false, elapsedMs: SHOW_AFTER_MS - 1 }).showCounter, false);
  assert.equal(loaderGate({ needsScene: true, sceneReady: false, elapsedMs: SHOW_AFTER_MS }).showCounter, true);
  assert.equal(loaderGate({ needsScene: true, sceneReady: true, elapsedMs: 100 }).showCounter, false);
});

test("counter climbs smoothly instead of jumping", async () => {
  const { loaderCount } = await import("./loaderGate.mjs");
  assert.equal(loaderCount({ shownMs: 0, realProgress: 0, ready: false }), 0);
  let previous = -1;
  for (let ms = 0; ms <= 4000; ms += 16) {
    const value = loaderCount({ shownMs: ms, realProgress: 0, ready: false });
    assert.ok(value >= previous, `monotonic at ${ms}ms`);
    assert.ok(value - previous <= 3 || previous < 0, `no jump at ${ms}ms (${previous}→${value})`);
    assert.ok(value <= 95, "holds below 100 until ready");
    previous = value;
  }
  assert.ok(previous > 80, "gets most of the way while waiting");
});

test("real progress never makes the counter jump ahead of a smooth climb", async () => {
  const { loaderCount } = await import("./loaderGate.mjs");
  // useProgress often reports 0 then 100 for a single file; that must not leap.
  const a = loaderCount({ shownMs: 100, realProgress: 100, ready: false });
  const b = loaderCount({ shownMs: 116, realProgress: 100, ready: false });
  assert.ok(b - a <= 3);
});
