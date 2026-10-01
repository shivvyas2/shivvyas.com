import { SPREAD_COUNT } from "./diaryPages.mjs";

export { SPREAD_COUNT };
export const INITIAL_DESK_STATE = Object.freeze({
  mode: "hero",
  transitioning: false,
  spread: 0,
  diaryFocus: "right",
  mobile: false,
});

const go = (state, mode, extra = {}) => ({ ...state, mode, transitioning: true, ...extra });

export function deskReducer(state, action) {
  if (action.type === "setMobile") return state.mobile === action.mobile ? state : { ...state, mobile: action.mobile };
  if (action.type === "transitionEnd") return state.transitioning ? { ...state, transitioning: false } : state;
  if (action.type === "reset") return { ...INITIAL_DESK_STATE, mobile: state.mobile };
  if (state.transitioning) return state;
  switch (action.type) {
    case "enterDesk":
      // Phones get the 3D model as a display piece only.
      return state.mode === "hero" && !state.mobile ? go(state, "desk") : state;
    case "exitDesk":
      return state.mode === "desk" ? go(state, "hero") : state;
    case "openDiary":
      return state.mode === "desk"
        ? go(state, "diary", { spread: 0, diaryFocus: state.mobile ? "left" : "right" })
        : state;
    case "closeDiary":
      return state.mode === "diary" ? go(state, "desk") : state;
    case "openCamera":
      return state.mode === "desk" ? go(state, "camera") : state;
    case "closeCamera":
      return state.mode === "camera" ? go(state, "desk") : state;
    case "escape":
      if (state.mode === "diary" || state.mode === "camera") return go(state, "desk");
      if (state.mode === "desk") return go(state, "hero");
      return state;
    case "nextPage": {
      if (state.mode !== "diary") return state;
      if (state.mobile && state.diaryFocus === "left") return { ...state, diaryFocus: "right" };
      if (state.spread >= SPREAD_COUNT - 1) return state;
      return { ...state, spread: state.spread + 1, diaryFocus: state.mobile ? "left" : "right" };
    }
    case "prevPage": {
      if (state.mode !== "diary") return state;
      if (state.mobile && state.diaryFocus === "right") return { ...state, diaryFocus: "left" };
      if (state.spread <= 0) return state;
      return { ...state, spread: state.spread - 1, diaryFocus: "right" };
    }
    default:
      return state;
  }
}

export function createDeskStore(initial = INITIAL_DESK_STATE) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    dispatch(action) {
      const next = deskReducer(state, action);
      if (next === state) return;
      state = next;
      listeners.forEach((listener) => listener());
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
