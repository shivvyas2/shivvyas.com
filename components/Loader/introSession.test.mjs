import test from "node:test";
import assert from "node:assert/strict";
import { INTRO_KEY, hasSeenIntro, markIntroSeen } from "./introSession.mjs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
};
const throwing = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("QuotaExceededError");
  },
};

test("marks and reads the intro flag", () => {
  const s = memory();
  assert.equal(hasSeenIntro(s), false);
  markIntroSeen(s);
  assert.equal(hasSeenIntro(s), true);
  assert.equal(s.getItem(INTRO_KEY), "1");
});

test("blocked or missing storage never throws and never skips the intro", () => {
  assert.equal(hasSeenIntro(throwing), false);
  assert.doesNotThrow(() => markIntroSeen(throwing));
  assert.equal(hasSeenIntro(null), false);
  assert.doesNotThrow(() => markIntroSeen(null));
});
