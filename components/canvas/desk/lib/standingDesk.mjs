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
