import { useEffect } from "react";
import { keycapsApi } from "../Keycaps";
import { deskStore } from "../useDesk";
import { KEYS } from "../lib/keyboardLayout.mjs";
import { keyIndexFor } from "../lib/keyInput.mjs";
import { deskAudio } from "./deskAudio";

const DEEP = new Set(["Space", "Enter", "Backspace", "ShiftLeft", "ShiftRight"]);

export default function KeyboardInput() {
  useEffect(() => {
    keycapsApi.onKey = (index) => {
      if (deskStore.get().mode !== "desk" || index === undefined) return false;
      keycapsApi.press(index);
      deskAudio.key({ deep: DEEP.has(KEYS[index].code) });
      return true;
    };
    const onKeyDown = (event) => {
      const index = keyIndexFor(event, deskStore.get().mode);
      if (index >= 0) keycapsApi.onKey(index);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      keycapsApi.onKey = null;
    };
  }, []);
  return null;
}
