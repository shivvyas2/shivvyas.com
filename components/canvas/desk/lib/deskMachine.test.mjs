import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_DESK_STATE as S0, deskReducer as r, createDeskStore } from "./deskMachine.mjs";

const settle = (s) => r(s, { type: "transitionEnd" });

test("hero -> desk -> diary -> desk -> hero", () => {
  let s = r(S0, { type: "enterDesk" });
  assert.deepEqual([s.mode, s.transitioning], ["desk", true]);
  s = r(settle(s), { type: "openDiary" });
  assert.equal(s.mode, "diary");
  s = r(settle(s), { type: "escape" });
  assert.equal(s.mode, "desk");
  s = r(settle(s), { type: "escape" });
  assert.equal(s.mode, "hero");
});

test("actions are ignored while transitioning", () => {
  const moving = r(S0, { type: "enterDesk" });
  assert.equal(r(moving, { type: "escape" }), moving);
  assert.equal(r(moving, { type: "openDiary" }), moving);
});

test("diary cannot open from hero; escape in hero is a no-op", () => {
  assert.equal(r(S0, { type: "openDiary" }), S0);
  assert.equal(r(S0, { type: "escape" }), S0);
});

test("desktop paging clamps to 0..3 and resets on reopen", () => {
  let s = settle(r(settle(r(S0, { type: "enterDesk" })), { type: "openDiary" }));
  for (let i = 0; i < 6; i++) s = r(s, { type: "nextPage" });
  assert.equal(s.spread, 3);
  s = r(s, { type: "prevPage" });
  assert.equal(s.spread, 2);
  s = settle(r(settle(r(s, { type: "closeDiary" })), { type: "openDiary" }));
  assert.equal(s.spread, 0);
});

test("mobile paging pans between pages before flipping", () => {
  let s = r(S0, { type: "setMobile", mobile: true });
  s = settle(r(settle(r(s, { type: "enterDesk" })), { type: "openDiary" }));
  assert.deepEqual([s.spread, s.diaryFocus], [0, "left"]);
  s = r(s, { type: "nextPage" });
  assert.deepEqual([s.spread, s.diaryFocus], [0, "right"]);
  s = r(s, { type: "nextPage" });
  assert.deepEqual([s.spread, s.diaryFocus], [1, "left"]);
  s = r(s, { type: "prevPage" });
  assert.deepEqual([s.spread, s.diaryFocus], [0, "right"]);
});

test("store notifies subscribers and supports unsubscribe", () => {
  const store = createDeskStore();
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.dispatch({ type: "enterDesk" });
  off();
  store.dispatch({ type: "transitionEnd" });
  assert.equal(calls, 1);
  assert.equal(store.get().mode, "desk");
});
test("reset returns to hero but keeps the mobile flag, even mid-transition", () => {
  let s = r(r(S0, { type: "setMobile", mobile: true }), { type: "enterDesk" });
  s = r(s, { type: "reset" });
  assert.deepEqual(s, { ...S0, mobile: true });
});
