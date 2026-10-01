// What the camera's LCD shows and how its buttons change it. Pure, so the
// button wiring can be tested without three.js.
import { SCREEN_ROWS } from "./cameraContent.mjs";

export const CAMERA_PHOTOS = [1, 2, 3, 4, 5].map((n) => `/images/desk/photos/${n}.jpg`);
export const ISO_STEPS = ["AUTO", "100", "400", "1600", "6400"];
export const EV_STEPS = ["-1.0", "-0.3", "±0.0", "+0.3", "+1.0"];

export const INITIAL_CAMERA_UI = {
  screen: "menu", // "menu" | "live" | "playback" | "quick"
  row: SCREEN_ROWS.length - 1, // start on "Open Photos"
  photo: 0,
  info: true,
  iso: 0,
  ev: 2,
  shots: 0, // bumps on every shutter press (drives the flash)
  toast: null,
};

const wrap = (value, length) => (value + length) % length;

// Returns the next UI state, plus `open` when the photo site should open.
export function pressCameraButton(ui, button) {
  const next = { ...ui, toast: null };
  switch (button) {
    case "menu":
      next.screen = ui.screen === "menu" ? "live" : "menu";
      return next;
    case "play":
      next.screen = ui.screen === "playback" ? "live" : "playback";
      return next;
    case "fn":
      next.screen = ui.screen === "quick" ? "live" : "quick";
      return next;
    case "up":
    case "down": {
      const step = button === "up" ? -1 : 1;
      if (ui.screen === "menu") next.row = wrap(ui.row + step, SCREEN_ROWS.length);
      else if (ui.screen === "playback") next.photo = wrap(ui.photo + step, CAMERA_PHOTOS.length);
      else if (button === "up") next.info = !ui.info; // wheel top is DISP
      else next.ev = wrap(ui.ev + 1, EV_STEPS.length); // wheel bottom is exposure comp
      return next;
    }
    case "left":
    case "right":
      if (ui.screen === "playback")
        next.photo = wrap(ui.photo + (button === "left" ? -1 : 1), CAMERA_PHOTOS.length);
      else if (button === "right") next.iso = wrap(ui.iso + 1, ISO_STEPS.length); // wheel right is ISO
      else next.toast = "Drive: single shooting";
      return next;
    case "center":
      if (ui.screen === "menu" && SCREEN_ROWS[ui.row]?.link) return { ...next, open: true };
      if (ui.screen === "playback") return { ...next, open: true };
      return next;
    case "disp":
      next.info = !ui.info;
      return next;
    case "trash":
      next.toast = ui.screen === "playback" ? "This image is protected" : "Nothing to delete";
      return next;
    case "shutter":
      next.screen = "live";
      next.shots = ui.shots + 1;
      return next;
    case "zoom":
      next.toast = "Focus magnifier ×5.9";
      return next;
    case "ael":
      next.toast = "AE locked";
      return next;
    case "c2":
      next.toast = "C2: Focus mode";
      return next;
    default:
      return ui;
  }
}

// Row hit on the LCD (touch screen): v is 0 at the top of the screen.
export function rowAt(v) {
  const top = 148 / 640;
  const height = 66 / 640;
  const row = Math.floor((v - top) / height);
  return row >= 0 && row < SCREEN_ROWS.length ? row : -1;
}
