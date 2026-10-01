import { KEY_INDEX } from "./keyboardLayout.mjs";

const EDITABLE = new Set(["INPUT", "TEXTAREA", "SELECT"]);

// Physical typing mirrors onto the 3D keyboard only in desk mode, and never
// while the visitor is typing into a real field.
export function keyIndexFor({ code, repeat, target }, mode) {
  if (mode !== "desk" || repeat) return -1;
  if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return -1;
  return KEY_INDEX.has(code) ? KEY_INDEX.get(code) : -1;
}
