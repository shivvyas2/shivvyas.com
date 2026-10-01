import test from "node:test";
import assert from "node:assert/strict";
import { CAMERA_PHOTOS, INITIAL_CAMERA_UI, pressCameraButton, rowAt } from "./cameraUi.mjs";
import { SCREEN_ROWS } from "./cameraContent.mjs";

const press = (ui, ...buttons) => buttons.reduce((s, b) => pressCameraButton(s, b), ui);

test("MENU toggles the menu and live view; playback toggles the gallery", () => {
  assert.equal(press(INITIAL_CAMERA_UI, "menu").screen, "live");
  assert.equal(press(INITIAL_CAMERA_UI, "menu", "menu").screen, "menu");
  assert.equal(press(INITIAL_CAMERA_UI, "play").screen, "playback");
  assert.equal(press(INITIAL_CAMERA_UI, "play", "play").screen, "live");
});

test("wheel moves the menu selection and opens the photo site from its row", () => {
  const link = SCREEN_ROWS.findIndex((r) => r.link);
  assert.equal(INITIAL_CAMERA_UI.row, link);
  assert.equal(press(INITIAL_CAMERA_UI, "down").row, 0, "wraps");
  assert.equal(press(INITIAL_CAMERA_UI, "up").row, link - 1);
  assert.equal(pressCameraButton(INITIAL_CAMERA_UI, "center").open, true);
  assert.equal(pressCameraButton(press(INITIAL_CAMERA_UI, "up"), "center").open, undefined);
});

test("playback pages through the photos; shutter fires and returns to live view", () => {
  const playing = press(INITIAL_CAMERA_UI, "play");
  assert.equal(press(playing, "right").photo, 1);
  assert.equal(press(playing, "left").photo, CAMERA_PHOTOS.length - 1);
  const shot = press(playing, "shutter");
  assert.equal(shot.screen, "live");
  assert.equal(shot.shots, 1);
});

test("live view: wheel top toggles info, right cycles ISO, bottom exposure", () => {
  const live = press(INITIAL_CAMERA_UI, "menu");
  assert.equal(press(live, "up").info, false);
  assert.equal(press(live, "right").iso, 1);
  assert.notEqual(press(live, "down").ev, live.ev);
});

test("touch rows map to the drawn menu rows", () => {
  assert.equal(rowAt(0.1), -1);
  assert.equal(rowAt((148 + 10) / 640), 0);
  assert.equal(rowAt((148 + 66 * 5 + 10) / 640), 5);
});
