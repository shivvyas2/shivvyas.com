import test from "node:test";
import assert from "node:assert/strict";
import { KEYS, KEY_INDEX, KEY_TONES, KEY_TRAVEL } from "./keyboardLayout.mjs";

test("layout has 67 keys with unique codes", () => {
  assert.equal(KEYS.length, 67);
  assert.equal(new Set(KEYS.map((k) => k.code)).size, 67);
});

test("index resolves common codes", () => {
  for (const code of ["KeyA", "Space", "Enter", "Escape", "ArrowUp", "Digit5"])
    assert.ok(KEY_INDEX.has(code), code);
  assert.equal(KEYS[KEY_INDEX.get("KeyA")].code, "KeyA");
});

test("every key sits inside the 1.87 x 0.69 case", () => {
  for (const k of KEYS) {
    assert.ok(Math.abs(k.x) + k.w / 2 <= 0.935, k.code);
    assert.ok(Math.abs(k.z) + k.d / 2 <= 0.345, k.code);
  }
});

test("space and enter keep the modeled sizes and tones", () => {
  const space = KEYS[KEY_INDEX.get("Space")];
  assert.deepEqual([space.w, space.x, space.tone], [0.6, -0.065, "slate"]);
  const enter = KEYS[KEY_INDEX.get("Enter")];
  assert.deepEqual([enter.w, enter.tone], [0.18, "orange"]);
  assert.equal(KEYS[KEY_INDEX.get("Escape")].tone, "orange");
  assert.ok(KEY_TONES.light && KEY_TRAVEL > 0);
});
