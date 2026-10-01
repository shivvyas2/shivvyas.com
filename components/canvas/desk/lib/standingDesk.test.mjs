import test from "node:test";
import assert from "node:assert/strict";
import { SIT_CM, STAND_CM, deskHeightCm, liftProgress } from "./standingDesk.mjs";

test("lift follows the first 70% of a screen of scrolling", () => {
  assert.equal(liftProgress(0, 1000), 0);
  assert.equal(liftProgress(350, 1000), 0.5);
  assert.equal(liftProgress(5000, 1000), 1);
  assert.equal(liftProgress(-20, 1000), 0);
});

test("controller reads sitting to standing height", () => {
  assert.equal(deskHeightCm(0), SIT_CM);
  assert.equal(deskHeightCm(1), STAND_CM);
  assert.equal(deskHeightCm(2), STAND_CM);
});

test("controller buttons step the desk and stop at safe limits", async () => {
  const { MANUAL_MAX, STEP, nudge } = await import("./standingDesk.mjs");
  assert.equal(nudge(0, 1), STEP);
  assert.equal(nudge(0, -1), 0, "never below sitting height");
  let p = 0;
  for (let i = 0; i < 50; i++) p = nudge(p, 1);
  assert.equal(p, MANUAL_MAX, "never above the safe height");
  assert.ok(MANUAL_MAX <= 0.6, "stays clear of the hero text");
});

test("holding a button moves at a steady rate within the limits", async () => {
  const { MANUAL_MAX, hold } = await import("./standingDesk.mjs");
  assert.ok(hold(0, 1, 0.1) > 0);
  assert.equal(hold(MANUAL_MAX, 1, 1), MANUAL_MAX);
  assert.equal(hold(0.05, -1, 1), 0);
});

test("scrolling still raises the desk the rest of the way", async () => {
  const { deskTarget } = await import("./standingDesk.mjs");
  assert.equal(deskTarget({ scroll: 0, manual: 0.3 }), 0.3);
  assert.equal(deskTarget({ scroll: 1, manual: 0.3 }), 1);
  assert.equal(deskTarget({ scroll: 0.1, manual: 0.3 }), 0.3);
});

test("hero framing reserves room for the highest button-raised desk", async () => {
  const { DESK_LIFT, MANUAL_MAX, heroFramingBounds } = await import("./standingDesk.mjs");
  const { Box3, Vector3 } = await import("three");
  const bounds = new Box3(new Vector3(-3, -3.4, -1.5), new Vector3(3.5, 2.5, 1.5));
  const framed = heroFramingBounds(bounds);
  assert.equal(framed.max.y, 2.5 + DESK_LIFT * MANUAL_MAX);
  assert.equal(framed.min.y, -3.4);
  assert.equal(bounds.max.y, 2.5, "does not mutate the model bounds");
});
