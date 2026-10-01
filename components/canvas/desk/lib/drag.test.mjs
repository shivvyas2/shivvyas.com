import test from "node:test";
import assert from "node:assert/strict";
import { createDrag, tiltTarget } from "./drag.mjs";

test("one pointer at a time", () => {
  const d = createDrag();
  assert.equal(d.begin(1), true);
  assert.equal(d.begin(2), false);
  assert.equal(d.owns(1), true);
  assert.equal(d.owns(2), false);
});

test("end is idempotent and ignores foreign pointers", () => {
  const d = createDrag();
  d.begin(7);
  assert.equal(d.end(8), false);
  assert.equal(d.active, true);
  assert.equal(d.end(7), true);
  assert.equal(d.end(7), false);
  assert.equal(d.active, false);
});

test("end() without id ends any drag (window blur)", () => {
  const d = createDrag();
  d.begin(3);
  assert.equal(d.end(), true);
  assert.equal(d.active, false);
});

test("tilt follows velocity and clamps", () => {
  assert.deepEqual(tiltTarget(0, 0), { x: 0, z: 0 });
  const t = tiltTarget(100, -100);
  assert.equal(t.z, -0.1);
  assert.equal(t.x, -0.1);
});
