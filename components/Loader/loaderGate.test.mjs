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
