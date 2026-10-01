import test from "node:test";
import assert from "node:assert/strict";
import { heroFrame } from "./heroFrame.mjs";

test("desk fits in the space between the intro text and the bottom of the hero", () => {
  const { heightFraction, drop } = heroFrame({ textBottom: 0.3, mobile: false });
  const top = 0.5 + drop - heightFraction / 2;
  const bottom = 0.5 + drop + heightFraction / 2;
  assert.ok(top >= 0.3 + 0.02, `top ${top} clears the text with a gap`);
  assert.ok(bottom <= 0.95, `bottom ${bottom} stays above the scroll cue`);
});

test("when the intro wraps to more lines, the desk moves down and shrinks", () => {
  const short = heroFrame({ textBottom: 0.3, mobile: false });
  const tall = heroFrame({ textBottom: 0.42, mobile: false });
  assert.ok(tall.heightFraction < short.heightFraction);
  assert.ok(tall.drop > short.drop);
});

test("unknown text height falls back to the previous fixed framing", () => {
  assert.deepEqual(heroFrame({ textBottom: null, mobile: false }), { heightFraction: 0.61, drop: 0.105 });
  assert.deepEqual(heroFrame({ textBottom: null, mobile: true }), { heightFraction: 0.58, drop: 0.11 });
});
