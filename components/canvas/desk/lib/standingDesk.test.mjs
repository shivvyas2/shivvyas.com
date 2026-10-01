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
