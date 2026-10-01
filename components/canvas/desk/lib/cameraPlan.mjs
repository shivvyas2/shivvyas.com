// What the camera director does when mode, diary focus or viewport size
// changes. Pure so the edge cases (model arriving mid-transition, resizes,
// page pans) are testable.
export function cameraPlan({ hasLook, prev, mode, focus, transitioning }) {
  const modeChanged = prev.mode !== mode;
  const focusChanged = prev.focus !== focus;
  // First frame: snap. If a transition was requested before the scene
  // existed, nothing else will end it, so the snap must.
  if (!hasLook) return { kind: "snap", endTransition: transitioning };
  if (!modeChanged && !focusChanged && !transitioning) return { kind: "snap", endTransition: false };
  const panOnly = !modeChanged && focusChanged && mode === "diary";
  return { kind: "tween", duration: panOnly ? 0.8 : 1.6 };
}
