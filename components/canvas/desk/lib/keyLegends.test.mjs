import test from "node:test";
import assert from "node:assert/strict";
import { KEYS } from "./keyboardLayout.mjs";
import { legendFor } from "./keyLegends.mjs";

test("every key except the space bar has a Keychron legend", () => {
  const missing = KEYS.filter((k) => k.code !== "Space" && !legendFor(k.code)).map((k) => k.code);
  assert.deepEqual(missing, []);
  assert.equal(legendFor("Space"), null);
});

test("qwerty letters, shifted pairs and Mac modifiers", () => {
  assert.deepEqual(legendFor("KeyQ"), { kind: "letter", text: ["Q"] });
  assert.deepEqual(legendFor("Digit2").text, ["@", "2"]);
  assert.equal(legendFor("MetaLeft").text[0], "command");
  assert.equal(legendFor("AltLeft").text[0], "option");
  assert.equal(legendFor("Escape").text[0], "esc");
});
