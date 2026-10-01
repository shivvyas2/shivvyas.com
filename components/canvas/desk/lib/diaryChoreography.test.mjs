import test from "node:test";
import assert from "node:assert/strict";
import { openChoreography } from "./diaryChoreography.mjs";

test("the cover opens as the camera settles over the book, then sketches ink in", () => {
  const flight = 1.6;
  const { coverStart, coverDuration, inkStart } = openChoreography(flight);
  assert.ok(coverStart >= flight * 0.4, "camera is already descending when the cover lifts");
  const coverEnd = coverStart + coverDuration;
  assert.ok(Math.abs(coverEnd - flight) <= 0.35, "cover lands with the camera");
  assert.ok(coverDuration >= 1, "slow enough to read as a heavy cover");
  assert.ok(inkStart >= coverEnd, "ink starts once the spread is open");
});
