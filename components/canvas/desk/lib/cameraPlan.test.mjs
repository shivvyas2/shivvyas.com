import test from "node:test";
import assert from "node:assert/strict";
import { cameraPlan } from "./cameraPlan.mjs";

test("first mount while a transition is pending snaps AND ends the transition", () => {
  // enterDesk dispatched before the model loaded: nobody else would end it.
  assert.deepEqual(cameraPlan({ hasLook: false, prev: { mode: null, focus: null }, mode: "desk", focus: "right", transitioning: true }), { kind: "snap", endTransition: true });
});

test("first mount at rest snaps without dispatching", () => {
  assert.deepEqual(cameraPlan({ hasLook: false, prev: { mode: null, focus: null }, mode: "hero", focus: "right", transitioning: false }), { kind: "snap", endTransition: false });
});

test("resize while settled snaps", () => {
  assert.equal(cameraPlan({ hasLook: true, prev: { mode: "desk", focus: "right" }, mode: "desk", focus: "right", transitioning: false }).kind, "snap");
});

test("entering the diary is a full 1.6 s flight", () => {
  assert.deepEqual(cameraPlan({ hasLook: true, prev: { mode: "desk", focus: "right" }, mode: "diary", focus: "right", transitioning: true }), { kind: "tween", duration: 1.6 });
});

test("panning between diary pages is a 0.8 s move", () => {
  assert.deepEqual(cameraPlan({ hasLook: true, prev: { mode: "diary", focus: "left" }, mode: "diary", focus: "right", transitioning: false }), { kind: "tween", duration: 0.8 });
});

test("resize mid-flight restarts the flight", () => {
  assert.deepEqual(cameraPlan({ hasLook: true, prev: { mode: "desk", focus: "right" }, mode: "desk", focus: "right", transitioning: true }), { kind: "tween", duration: 1.6 });
});
