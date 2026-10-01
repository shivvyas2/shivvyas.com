import { clamp } from "./deskMath.mjs";

export function createDrag() {
  let pointer = null;
  return {
    begin(pointerId) {
      if (pointer !== null) return false;
      pointer = pointerId;
      return true;
    },
    end(pointerId) {
      if (pointer === null) return false;
      if (pointerId !== undefined && pointerId !== pointer) return false;
      pointer = null;
      return true;
    },
    owns: (pointerId) => pointer !== null && pointer === pointerId,
    get active() {
      return pointer !== null;
    },
  };
}

// Pitch forward when pushed away (-z), roll against sideways motion.
export const tiltTarget = (vx, vz, max = 0.1) => ({
  x: clamp(vz * 0.03, -max, max) || 0,
  z: clamp(-vx * 0.03, -max, max) || 0,
});
