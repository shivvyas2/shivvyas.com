import test from "node:test";
import assert from "node:assert/strict";
import { keyIndexFor } from "./keyInput.mjs";
import { KEY_INDEX } from "./keyboardLayout.mjs";

const body = { tagName: "BODY", isContentEditable: false };

test("maps physical keys only in desk mode", () => {
  assert.equal(keyIndexFor({ code: "KeyA", target: body }, "desk"), KEY_INDEX.get("KeyA"));
  assert.equal(keyIndexFor({ code: "KeyA", target: body }, "hero"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: body }, "diary"), -1);
});

test("ignores repeats, unknown keys and editable targets", () => {
  assert.equal(keyIndexFor({ code: "KeyA", repeat: true, target: body }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "F13", target: body }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: { tagName: "INPUT" } }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: { tagName: "DIV", isContentEditable: true } }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: null }, "desk"), KEY_INDEX.get("KeyA"));
});
