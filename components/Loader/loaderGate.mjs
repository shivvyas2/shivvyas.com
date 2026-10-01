// The intro covers the page only while the hero itself is loading, and only
// shows its counter when that takes long enough to notice.
export const SHOW_AFTER_MS = 400;
export const MAX_WAIT_MS = 2500;

export function loaderGate({ needsScene, sceneReady, elapsedMs }) {
  const ready = !needsScene || sceneReady || elapsedMs >= MAX_WAIT_MS;
  return { ready, showCounter: !ready && elapsedMs >= SHOW_AFTER_MS };
}

// The number on the intro: an eased climb toward 95 (fast at first, slowing),
// so it always counts up 1-by-1 instead of jumping with the download's
// progress events. The loader finishes the last stretch to 100 when ready.
const CLIMB_MS = 900;
export function loaderCount({ shownMs }) {
  return Math.floor(95 * (1 - Math.exp(-Math.max(0, shownMs) / CLIMB_MS)));
}
