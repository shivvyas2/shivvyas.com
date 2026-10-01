import test from "node:test";
import assert from "node:assert/strict";
import { renderSwitch, renderFriction } from "./switchSound.mjs";

const rms = (a, from, to) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i] * a[i];
  return Math.sqrt(s / (to - from));
};

test("switch sample: 70 ms down, 45 ms up, finite and normalized", () => {
  const down = renderSwitch(48000, { seed: 1 });
  const up = renderSwitch(48000, { seed: 1, up: true });
  assert.equal(down.length, 3360);
  assert.equal(up.length, 2160);
  const peak = Math.max(...down.map(Math.abs));
  assert.ok(Math.abs(peak - 0.9) < 1e-6);
  assert.ok(down.every(Number.isFinite));
});

test("switch sample decays (click, not a tone)", () => {
  const s = renderSwitch(48000, { seed: 3 });
  const tenth = Math.floor(s.length / 10);
  assert.ok(rms(s, s.length - tenth, s.length) < rms(s, 0, tenth) * 0.2);
});

test("deterministic per seed, different across seeds", () => {
  assert.deepEqual(renderSwitch(44100, { seed: 2 }), renderSwitch(44100, { seed: 2 }));
  assert.notDeepEqual(renderSwitch(44100, { seed: 2 }), renderSwitch(44100, { seed: 4 }));
});

test("friction loop is quiet noise", () => {
  const f = renderFriction(48000, 1, 7);
  assert.equal(f.length, 48000);
  assert.ok(Math.max(...f.map(Math.abs)) <= 0.5 + 1e-6);
});
