import test from "node:test";
import assert from "node:assert/strict";
import { PAGES, PAGE_SIZE, PROJECTS, SPREAD_COUNT, sketchItems, spreadText, wrapLines } from "./diaryPages.mjs";

test("an even number of pages, every page has a heading and a sketch inside the page", () => {
  assert.equal(PAGES.length % 2, 0);
  assert.equal(SPREAD_COUNT, PAGES.length / 2);
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

test("opens with Shiv's info and toolbox, then every project", () => {
  assert.match(PAGES[0].heading, /Shiv/);
  assert.match(spreadText(0), /Contextual Intelligence/);
  assert.match(PAGES[1].heading, /toolbox/);
  const everything = PAGES.map((_, i) => i).filter((i) => i % 2 === 0).map((i) => spreadText(i / 2)).join(" ");
  for (const project of PROJECTS) {
    assert.ok(everything.includes(project.title), `${project.title} is in the diary`);
    assert.ok(project.stack.length >= 2, `${project.title} lists its stack`);
    for (const tech of project.stack) assert.ok(everything.includes(tech), `${project.title}: ${tech}`);
  }
  assert.ok(PROJECTS.length >= 14);
});

test("wrapLines breaks on words within the width", () => {
  const measure = (s) => s.length * 10;
  assert.deepEqual(wrapLines("one two three four", 100, measure), ["one two", "three four"]);
  assert.deepEqual(wrapLines("", 90, measure), [""]);
  assert.deepEqual(wrapLines("supercalifragilistic", 50, measure), ["supercalifragilistic"]);
});

test("spreadText includes both pages", () => {
  const text = spreadText(0);
  assert.match(text, /hi, I'm Shiv/);
  assert.match(text, /toolbox/);
});

test("phones paint diary pages at half resolution (memory)", async () => {
  const { pageResolution } = await import("./diaryPages.mjs");
  assert.deepEqual(pageResolution(false), { width: 1366, height: 2048, maskScale: 0.5 });
  assert.deepEqual(pageResolution(true), { width: 683, height: 1024, maskScale: 0.5 });
});
