// Standing-desk lift driven by scrolling past the hero. Model units: the
// worktop is 7.15 wide (~150 cm), so one unit is ~21 cm at full scale; the
// lift is staged for the frame rather than to scale.
export const DESK_LIFT = 0.95;
export const SIT_CM = 72.0;
export const STAND_CM = 118.0;

// 0 at the top of the page, 1 once the visitor has scrolled 70% of a screen.
export function liftProgress(scrollY, viewportHeight) {
  const p = scrollY / (viewportHeight * 0.7);
  return Math.min(1, Math.max(0, p));
}

export function deskHeightCm(progress) {
  const p = Math.min(1, Math.max(0, progress));
  return SIT_CM + (STAND_CM - SIT_CM) * p;
}

// Controller buttons (up / down) raise the desk by hand, but only part way:
// past MANUAL_MAX the worktop would rise into the hero's intro text.
export const MANUAL_MAX = 0.5;
export const STEP = 0.125;
const HOLD_RATE = 0.45; // progress per second while a button is held

const clampManual = (value) => Math.min(MANUAL_MAX, Math.max(0, value));

export const nudge = (manual, direction) => clampManual(manual + direction * STEP);

export const hold = (manual, direction, seconds) => clampManual(manual + direction * HOLD_RATE * seconds);

// The desk sits at whichever is higher: the buttons' height or the scroll lift.
export const deskTarget = ({ scroll, manual }) => Math.min(1, Math.max(0, scroll, manual));

// Bounds the hero camera frames: the model plus the headroom the buttons can
// raise it, so even a fully raised desk stays below the intro text.
export const heroFramingBounds = (bounds) => {
  const framed = bounds.clone();
  framed.max.y += DESK_LIFT * MANUAL_MAX;
  return framed;
};
