import test from "node:test";
import assert from "node:assert/strict";
import { PAGES, PAGE_SIZE, sketchItems, spreadText, wrapLines } from "./diaryPages.mjs";

test("four spreads, every page has a heading and a sketch inside the page", () => {
  assert.equal(PAGES.length, 8);
  PAGES.forEach((page, i) => {
    assert.ok(page.heading, `page ${i}`);
    const items = sketchItems(page, i);
    assert.ok(items.length > 0, `page ${i} sketch`);
    for (const item of items) {
      const pts = item.kind === "stroke" ? item.points : [[item.x, item.y]];
      for (const [x, y] of pts) {
        assert.ok(x >= 0 && x <= PAGE_SIZE.width && y >= 0 && y <= PAGE_SIZE.height, `page ${i} (${x},${y})`);
      }
    }
  });
});

test("sketch orders run 0 -> 1 without gaps or reversals", () => {
  PAGES.forEach((page, i) => {
    const items = sketchItems(page, i);
    assert.equal(items[0].order0, 0);
    assert.ok(Math.abs(items.at(-1).order1 - 1) < 1e-9);
    items.forEach((item, j) => {
      assert.ok(item.order1 > item.order0);
      if (j > 0) assert.ok(Math.abs(item.order0 - items[j - 1].order1) < 1e-9);
    });
  });
});

test("jitter is deterministic", () => {
  assert.deepEqual(sketchItems(PAGES[5], 5), sketchItems(PAGES[5], 5));
});

test("Life OS and Astra each get a notes page and a sketch page", () => {
  assert.match(PAGES[4].heading, /Life OS/);
  assert.match(PAGES[5].heading, /Life OS/);
  assert.match(PAGES[6].heading, /Astra/);
  assert.match(PAGES[7].heading, /Astra/);
});

test("wrapLines breaks on words within the width", () => {
  const measure = (s) => s.length * 10;
  assert.deepEqual(wrapLines("one two three four", 100, measure), ["one two", "three four"]);
  assert.deepEqual(wrapLines("", 90, measure), [""]);
  assert.deepEqual(wrapLines("supercalifragilistic", 50, measure), ["supercalifragilistic"]);
});

test("spreadText includes both pages", () => {
  const text = spreadText(2);
  assert.match(text, /Life OS/);
  assert.match(text, /Today/);
});

test("phones paint diary pages at half resolution (memory)", async () => {
  const { pageResolution } = await import("./diaryPages.mjs");
  assert.deepEqual(pageResolution(false), { width: 1366, height: 2048, maskScale: 0.5 });
  assert.deepEqual(pageResolution(true), { width: 683, height: 1024, maskScale: 0.5 });
});
