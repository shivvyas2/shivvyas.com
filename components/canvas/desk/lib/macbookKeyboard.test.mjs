import test from "node:test";
import assert from "node:assert/strict";
import { MACBOOK_ROWS, ROW_UNITS } from "./macbookKeyboard.mjs";

const width = (row) => row.reduce((sum, key) => sum + (key.w ?? 1), 0);

test("six MacBook rows, each exactly the full keyboard width", () => {
  assert.equal(MACBOOK_ROWS.length, 6);
  MACBOOK_ROWS.forEach((row, i) => assert.ok(Math.abs(width(row) - ROW_UNITS) < 1e-9, `row ${i}: ${width(row)}`));
});

test("QWERTY letter rows in the right order", () => {
  const letters = (i) => MACBOOK_ROWS[i].map((k) => k.label).filter((l) => /^[A-Z]$/.test(l)).join("");
  assert.equal(letters(2), "QWERTYUIOP");
  assert.equal(letters(3), "ASDFGHJKL");
  assert.equal(letters(4), "ZXCVBNM");
});

test("Mac modifiers, Touch ID and inverted-T arrows", () => {
  const labels = MACBOOK_ROWS.flat().map((k) => k.label);
  for (const label of ["esc", "delete", "tab", "return", "shift", "fn", "control", "option", "command", "touchid"])
    assert.ok(labels.includes(label), label);
  const arrows = MACBOOK_ROWS[5].find((k) => k.arrows);
  assert.ok(arrows, "arrow cluster on the bottom row");
});
