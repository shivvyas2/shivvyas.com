// Keyboard-local layout shared by scripts/model/build-desk.mjs and the runtime
// keycaps. Matches the modeled 15 x 5 grid; space and enter replace cells.
export const KEY_PITCH = 0.119;
export const KEY_TRAVEL = 0.022;
export const KEY_TONES = { slate: "#50585a", light: "#9caaa9", orange: "#f44e00" };

const ROWS = [
  ["Escape", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backslash", "Backspace"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Delete", "Home"],
  ["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "PageUp", null, null],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight", "ArrowUp", "End", "PageDown"],
  ["ControlLeft", "AltLeft", "MetaLeft", null, null, null, null, null, null, null, null, "AltRight", "ArrowLeft", "ArrowDown", "ArrowRight"],
];

const x0 = -0.833;
const z0 = -0.255;

function build() {
  const keys = [];
  ROWS.forEach((row, r) =>
    row.forEach((code, c) => {
      if (!code) return;
      const tone =
        r === 0 && c === 0 ? "orange" : r === 0 || c === 0 || c >= 13 ? "slate" : "light";
      keys.push({ code, x: x0 + c * KEY_PITCH, y: 0.133, z: z0 + r * KEY_PITCH, w: 0.108, h: 0.058, d: 0.102, tone, legend: true });
    }),
  );
  keys.push({ code: "Space", x: -0.065, y: 0.137, z: 0.22, w: 0.6, h: 0.061, d: 0.103, tone: "slate", legend: false });
  keys.push({ code: "Enter", x: 0.772, y: 0.139, z: -0.018, w: 0.18, h: 0.065, d: 0.1, tone: "orange", legend: false });
  return keys;
}

export const KEYS = build();
export const KEY_INDEX = new Map(KEYS.map((k, i) => [k.code, i]));
