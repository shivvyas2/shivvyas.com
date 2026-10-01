// The intro covers the page only while the hero itself is loading, and only
// shows its counter when that takes long enough to notice.
export const SHOW_AFTER_MS = 400;
export const MAX_WAIT_MS = 2500;

export function loaderGate({ needsScene, sceneReady, elapsedMs }) {
  const ready = !needsScene || sceneReady || elapsedMs >= MAX_WAIT_MS;
  return { ready, showCounter: !ready && elapsedMs >= SHOW_AFTER_MS };
}
