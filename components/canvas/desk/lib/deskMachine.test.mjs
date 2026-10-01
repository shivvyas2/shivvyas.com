import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_DESK_STATE as S0, SPREAD_COUNT, deskReducer as r, createDeskStore } from "./deskMachine.mjs";

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

test("desktop paging clamps to the last spread and resets on reopen", () => {
  let s = settle(r(settle(r(S0, { type: "enterDesk" })), { type: "openDiary" }));
  for (let i = 0; i < SPREAD_COUNT + 2; i++) s = r(s, { type: "nextPage" });
  assert.equal(s.spread, SPREAD_COUNT - 1);
  s = r(s, { type: "prevPage" });
  assert.equal(s.spread, SPREAD_COUNT - 2);
  s = settle(r(settle(r(s, { type: "closeDiary" })), { type: "openDiary" }));
  assert.equal(s.spread, 0);
});

test("mobile paging pans between pages before flipping (window shrunk to phone size)", () => {
  let s = settle(r(settle(r(S0, { type: "enterDesk" })), { type: "openDiary" }));
  s = { ...r(s, { type: "setMobile", mobile: true }), diaryFocus: "left" };
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

test("camera: pick up from the desk, Esc puts it down, not reachable from hero or diary", () => {
  assert.equal(r(S0, { type: "openCamera" }), S0);
  let s = settle(r(S0, { type: "enterDesk" }));
  s = r(s, { type: "openCamera" });
  assert.deepEqual([s.mode, s.transitioning], ["camera", true]);
  s = settle(s);
  assert.equal(r(s, { type: "openDiary" }), s);
  s = settle(r(s, { type: "escape" }));
  assert.equal(s.mode, "desk");
  s = settle(r(r(s, { type: "openCamera" }), { type: "transitionEnd" }));
  s = settle(r(s, { type: "closeCamera" }));
  assert.equal(s.mode, "desk");
});

test("phones only show the 3D model: entering the desk is a no-op", () => {
  const phone = r(S0, { type: "setMobile", mobile: true });
  assert.equal(r(phone, { type: "enterDesk" }), phone);
});

test("stores where the hero text ends, even mid-transition", () => {
  const moving = r(S0, { type: "enterDesk" });
  assert.equal(r(moving, { type: "setHeroText", bottom: 0.34 }).heroTextBottom, 0.34);
  const same = r(S0, { type: "setHeroText", bottom: null });
  assert.equal(same, S0);
});
