import { useSyncExternalStore } from "react";
import { createDeskStore, INITIAL_DESK_STATE } from "./lib/deskMachine.mjs";

// One store shared by the DOM overlay and the R3F tree (which is a separate
// React renderer, so plain context would not cross the <Canvas> boundary).
export const deskStore = createDeskStore();
export const dispatchDesk = (action) => deskStore.dispatch(action);

export function useDesk(selector) {
  return useSyncExternalStore(
    deskStore.subscribe,
    () => selector(deskStore.get()),
    () => selector(INITIAL_DESK_STATE),
  );
}
