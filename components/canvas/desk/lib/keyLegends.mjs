// Keychron-style Mac legends for the 65% board in keyboardLayout.mjs.
// Shifted symbols sit above their base character; modifiers are small
// lowercase words, as on Keychron's K-series caps.
const SHIFTED = {
  Digit1: ["!", "1"], Digit2: ["@", "2"], Digit3: ["#", "3"], Digit4: ["$", "4"],
  Digit5: ["%", "5"], Digit6: ["^", "6"], Digit7: ["&", "7"], Digit8: ["*", "8"],
  Digit9: ["(", "9"], Digit0: [")", "0"], Minus: ["_", "-"], Equal: ["+", "="],
  Backslash: ["|", "\\"], BracketLeft: ["{", "["], BracketRight: ["}", "]"],
  Semicolon: [":", ";"], Quote: ["\"", "'"], Comma: ["<", ","], Period: [">", "."],
  Slash: ["?", "/"],
};
const WORDS = {
  Escape: "esc", Backspace: "delete", Tab: "tab", Delete: "del", Home: "home",
  CapsLock: "caps lock", PageUp: "pgup", ShiftLeft: "shift", ShiftRight: "shift",
  End: "end", PageDown: "pgdn", ControlLeft: "control", AltLeft: "option",
  MetaLeft: "command", AltRight: "option", Enter: "return",
};
const ARROWS = { ArrowUp: "▲", ArrowLeft: "◀", ArrowDown: "▼", ArrowRight: "▶" };

// { kind: "letter" | "pair" | "word" | "arrow", text: string[] } or null.
export function legendFor(code) {
  if (/^Key[A-Z]$/.test(code)) return { kind: "letter", text: [code.slice(3)] };
  if (SHIFTED[code]) return { kind: "pair", text: SHIFTED[code] };
  if (WORDS[code]) return { kind: "word", text: [WORDS[code]] };
  if (ARROWS[code]) return { kind: "arrow", text: [ARROWS[code]] };
  return null;
}
