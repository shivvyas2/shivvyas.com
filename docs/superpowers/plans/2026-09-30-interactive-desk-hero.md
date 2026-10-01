# Interactive Cinematic Desk Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage 3D desk a cinematic playground (overhead desk view, playable keyboard with switch sounds, draggable mouse, IK mic boom, 3D handwritten diary), while cutting load time and fixing janky scroll animations.

**Architecture:** The model builder exports interactive parts (mouse, mic pivots, keyboard anchor, diary + cover hinge) as separate named nodes and compresses the scene to a meshopt GLB. The runtime splits the old `Computer.jsx` into `components/canvas/desk/`: a tiny external store (pure reducer) drives a GSAP camera director, and lazy-loaded interaction components portal into the model's nodes. All non-trivial math (key layout, springs, IK, page curl, audio synthesis, diary layout, state machine) lives in pure `.mjs` modules tested with `node --test`.

**Tech Stack:** Next.js 14 (pages router), React 18, three 0.172, @react-three/fiber 8, @react-three/drei 9, GSAP 3 + ScrollTrigger, Lenis, `next/font/google` (Caveat), `@gltf-transform/*` + `meshoptimizer` (build-time only), Node 24 `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-30-interactive-desk-hero-design.md`

## Global Constraints

- No new runtime dependencies. Build-time devDependencies allowed: `@gltf-transform/core`, `@gltf-transform/extensions`, `@gltf-transform/functions`, `meshoptimizer`.
- three stays pinned at `0.172.0`.
- Model file: `public/desktop_pc/scene.glb`, loaded as `/desktop_pc/scene.glb?v=interactive-1`.
- Interactive node names (exact): `Interactive_Mouse`, `Interactive_Keyboard`, `Interactive_Mic_Base`, `Interactive_Mic_Lower`, `Interactive_Mic_Upper`, `Interactive_Mic_Head`, `Interactive_Diary`, `Interactive_Diary_Cover`.
- Camera transitions: 1.6 s, `power3.inOut`.
- Loader exit ≤ 1.1 s; intro skipped on repeat loads in the same tab session (`sessionStorage` key `shiv-intro-seen`, all access in try/catch).
- Diary page textures: 2048 px tall; font Caveat; 4 spreads (who I am / what I do now / Life OS sketch / Astra sketch).
- `prefers-reduced-motion: reduce` → 3D scene not mounted (current behavior preserved).
- Every browser storage access and every audio call must fail silently.
- Commit messages end with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Deviations from spec (flag to Shiv at handoff)

1. **Switch sounds are synthesized at runtime** into `AudioBuffer`s from a deterministic pure function instead of shipping ~40 KB of sample files. Same sound design (noise transient + body thock + bottom-out), 0 KB download.
2. **Hover highlight = 4 mm lift + warm emissive tint**, not drei `Outlines` (Outlines cannot wrap the GLTF multi-mesh groups without a post-processing pass).
3. **Caveat comes from `next/font/google` with `preload: false`** instead of a hand-subsetted woff2 — Next self-hosts and subsets it at build time, and the file downloads only when the diary module loads.
4. **Draw calls rise by ~25** (not 6–8): each interactive node keeps one mesh per material. Still < 60 draws total.
5. **Ink-in** uses a stroke-order mask texture revealed in the shader (no per-frame texture uploads) rather than repainting canvases each frame.

## Review Focus

1. **Tab switch / resize mid-transition** — camera must land at the correct pose for the new size; no half-finished tween leaving the camera frozen between poses.
2. **Physical typing while focus is in the page's other inputs or while in hero mode** — must not press 3D keys, not play sounds, not `preventDefault`.
3. **Esc spam / clicking the desk during a transition** — state machine must ignore actions while `transitioning` except `transitionEnd`, so the camera never gets two competing tweens.
4. **Dragging off the canvas and releasing outside** — pointer capture must release; mouse/mic must settle, friction sound must stop.
5. **Private-mode Safari (`sessionStorage` throws) and blocked AudioContext** — site loads normally, intro just plays, desk silently has no sound.

Tests pinning these: #1 Task 2 `CameraDirector` resize logic + Step 11 manual resize check; #2 Task 4 `keyInput.test.mjs`; #3 Task 1 `deskMachine.test.mjs` ("actions are ignored while transitioning"); #4 Task 5 `drag.test.mjs` (idempotent `end`, `end()` on blur) + Step 6 release-outside-window check; #5 Task 9 `introSession.test.mjs` and Task 4 Step 11 blocked-AudioContext check.

## File Map

| File | Responsibility |
|---|---|
| `components/canvas/desk/lib/keyboardLayout.mjs` | Key codes, positions, tones (runtime keycaps) |
| `components/canvas/desk/lib/deskMath.mjs` | clamp, rect clamp, spring step, key-press curve |
| `components/canvas/desk/lib/deskMachine.mjs` | Pure reducer for hero/desk/diary modes + tiny store |
| `components/canvas/desk/lib/keyInput.mjs` | Which physical keys press 3D keys |
| `components/canvas/desk/lib/drag.mjs` | Single-pointer drag state, tilt target |
| `components/canvas/desk/lib/micIk.mjs` | 2-bone IK for the boom arm |
| `components/canvas/desk/lib/switchSound.mjs` | Deterministic switch/friction sample synthesis |
| `components/canvas/desk/lib/pageCurl.mjs` | Page curl math + matching GLSL |
| `components/canvas/desk/lib/diaryPages.mjs` | Diary copy, sketches, wrap/stroke-order helpers |
| `components/canvas/desk/lib/*.test.mjs` | node:test suites |
| `components/canvas/desk/useDesk.js` | React hook + dispatch over the store |
| `components/canvas/desk/modelUrl.js` | GLB URL (three-free, for preloading) |
| `components/canvas/desk/cameraFraming.js` | Hero/desk/diary camera poses |
| `components/canvas/desk/CameraDirector.jsx` | GSAP curved camera transitions |
| `components/canvas/desk/DeskCanvas.jsx` | Canvas, lights, env, warm-up, lazy interactions (replaces `components/canvas/Computer.jsx`) |
| `components/canvas/desk/DeskModel.jsx` | GLB, shadows, desk hit area, hover rim light, idle drift |
| `components/canvas/desk/Keycaps.jsx` | Instanced keycaps (eager) + `keycapsApi` |
| `components/canvas/desk/interactions/index.jsx` | Lazy bundle entry |
| `components/canvas/desk/interactions/deskAudio.js` | AudioContext + synthesized buffers |
| `components/canvas/desk/interactions/useHoverLift.js` | Hover lift/tint/cursor |
| `components/canvas/desk/interactions/HitProxy.jsx` | Invisible pointer target for GLTF nodes |
| `components/canvas/desk/interactions/useDeskDrag.js` | Pointer-captured drags with ray callbacks |
| `components/canvas/desk/interactions/KeyboardInput.jsx` | Key clicks + physical typing |
| `components/canvas/desk/interactions/DeskMouse.jsx` | Mouse drag |
| `components/canvas/desk/interactions/MicBoom.jsx` | Boom IK drag |
| `components/canvas/desk/interactions/diaryTextures.js` | Canvas page + ink-order mask rendering |
| `components/canvas/desk/interactions/leafMaterial.js` | Curl + ink shader material |
| `components/canvas/desk/interactions/Diary3D.jsx` | Cover, leaves, navigation |
| `components/Loader/introSession.mjs` (+ test) | Safe sessionStorage intro flag |
| `components/Loader/index.tsx` | Shorter exit, session skip |
| `components/HomePage/HeroSection/index.tsx` + `.module.scss` | DOM overlay: exit, a11y buttons, diary text mirror, scroll lock, fade-in |
| `scripts/model/build-desk.mjs` (+ `scene.test.mjs`, `assets/`) | Split interactive nodes; emit meshopt GLB |
| `components/SmoothScrolling/index.tsx`, `utils/textUtils.tsx`, `components/HomePage/{About,Award,Project,Service,BookCall}Section/index.tsx` | Scroll animation fixes |

### Task 0: Baseline measurements (no code)

- [ ] **Step 1:** `npm run build && npm run start`, then in Chrome run Lighthouse (mobile, http://localhost:3000). Record LCP, Total Blocking Time, total transfer size, and the time from navigation to the intro lifting (Performance panel). Write them into a scratch note; Task 11 compares against them. Nothing is committed.

---

### Task 1: Pure core modules and test harness

**Files:**
- Modify: `package.json` (add `"test"` script)
- Create: `components/canvas/desk/lib/keyboardLayout.mjs`, `deskMath.mjs`, `deskMachine.mjs`
- Test: `components/canvas/desk/lib/keyboardLayout.test.mjs`, `deskMath.test.mjs`, `deskMachine.test.mjs`

**Interfaces:**
- Produces:
  - `KEYS: Array<{code:string,x:number,y:number,z:number,w:number,h:number,d:number,tone:'slate'|'light'|'orange',legend:boolean}>` (keyboard-local coords), `KEY_INDEX: Map<string,number>`, `KEY_TONES: {slate,light,orange}` hex strings, `KEY_TRAVEL = 0.022`.
  - `clamp(v,min,max)`, `clampToRect({x,z},{minX,maxX,minZ,maxZ}) → {x,z}`, `springStep(state:{value,velocity}, target, dt, {stiffness,damping}) → {value,velocity}`, `keyPressOffset(elapsedSeconds) → 0..1`.
  - `INITIAL_DESK_STATE = {mode:'hero', transitioning:false, spread:0, diaryFocus:'right', mobile:false}`, `SPREAD_COUNT = 4`, `deskReducer(state, action) → state`, `createDeskStore(initial?) → {get(), dispatch(action), subscribe(fn) → unsubscribe}`.
  - Actions: `{type:'enterDesk'}`, `{type:'exitDesk'}`, `{type:'openDiary'}`, `{type:'closeDiary'}`, `{type:'escape'}`, `{type:'nextPage'}`, `{type:'prevPage'}`, `{type:'transitionEnd'}`, `{type:'setMobile', mobile:boolean}`.

- [ ] **Step 1: Add the test script**

In `package.json` `"scripts"` add:

```json
"test": "node --test \"components/canvas/desk/lib/*.test.mjs\""
```

- [ ] **Step 2: Write failing tests**

`components/canvas/desk/lib/keyboardLayout.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { KEYS, KEY_INDEX, KEY_TONES, KEY_TRAVEL } from "./keyboardLayout.mjs";

test("layout has 67 keys with unique codes", () => {
  assert.equal(KEYS.length, 67);
  assert.equal(new Set(KEYS.map((k) => k.code)).size, 67);
});

test("index resolves common codes", () => {
  for (const code of ["KeyA", "Space", "Enter", "Escape", "ArrowUp", "Digit5"])
    assert.ok(KEY_INDEX.has(code), code);
  assert.equal(KEYS[KEY_INDEX.get("KeyA")].code, "KeyA");
});

test("every key sits inside the 1.87 x 0.69 case", () => {
  for (const k of KEYS) {
    assert.ok(Math.abs(k.x) + k.w / 2 <= 0.935, k.code);
    assert.ok(Math.abs(k.z) + k.d / 2 <= 0.345, k.code);
  }
});

test("space and enter keep the modeled sizes and tones", () => {
  const space = KEYS[KEY_INDEX.get("Space")];
  assert.deepEqual([space.w, space.x, space.tone], [0.6, -0.065, "slate"]);
  const enter = KEYS[KEY_INDEX.get("Enter")];
  assert.deepEqual([enter.w, enter.tone], [0.18, "orange"]);
  assert.equal(KEYS[KEY_INDEX.get("Escape")].tone, "orange");
  assert.ok(KEY_TONES.light && KEY_TRAVEL > 0);
});
```

`components/canvas/desk/lib/deskMath.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { clamp, clampToRect, springStep, keyPressOffset } from "./deskMath.mjs";

test("clamp and clampToRect", () => {
  assert.equal(clamp(5, 0, 1), 1);
  assert.deepEqual(clampToRect({ x: -9, z: 0.5 }, { minX: -1, maxX: 1, minZ: 0, maxZ: 1 }), { x: -1, z: 0.5 });
});

test("critically damped spring converges without overshoot", () => {
  let s = { value: 0, velocity: 0 };
  let max = 0;
  for (let i = 0; i < 120; i++) {
    s = springStep(s, 1, 1 / 60, { stiffness: 300, damping: 2 * Math.sqrt(300) });
    max = Math.max(max, s.value);
  }
  assert.ok(Math.abs(s.value - 1) < 1e-3);
  assert.ok(max <= 1.001);
});

test("spring stays finite for huge dt (tab was hidden)", () => {
  const s = springStep({ value: 0, velocity: 0 }, 1, 5, { stiffness: 300, damping: 10 });
  assert.ok(Number.isFinite(s.value) && Math.abs(s.value) < 2);
});

test("key press curve: down fast, back up, then rest", () => {
  assert.equal(keyPressOffset(0), 0);
  assert.equal(keyPressOffset(0.06), 1);
  assert.ok(keyPressOffset(0.1) > 0 && keyPressOffset(0.1) < 1);
  assert.equal(keyPressOffset(0.2), 0);
  assert.equal(keyPressOffset(-1), 0);
});
```

`components/canvas/desk/lib/deskMachine.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_DESK_STATE as S0, deskReducer as r, createDeskStore } from "./deskMachine.mjs";

const settle = (s) => r(s, { type: "transitionEnd" });

test("hero -> desk -> diary -> desk -> hero", () => {
  let s = r(S0, { type: "enterDesk" });
  assert.deepEqual([s.mode, s.transitioning], ["desk", true]);
  s = r(settle(s), { type: "openDiary" });
  assert.equal(s.mode, "diary");
  s = r(settle(s), { type: "escape" });
  assert.equal(s.mode, "desk");
  s = r(settle(s), { type: "escape" });
  assert.equal(s.mode, "hero");
});

test("actions are ignored while transitioning", () => {
  const moving = r(S0, { type: "enterDesk" });
  assert.equal(r(moving, { type: "escape" }), moving);
  assert.equal(r(moving, { type: "openDiary" }), moving);
});

test("diary cannot open from hero; escape in hero is a no-op", () => {
  assert.equal(r(S0, { type: "openDiary" }), S0);
  assert.equal(r(S0, { type: "escape" }), S0);
});

test("desktop paging clamps to 0..3 and resets on reopen", () => {
  let s = settle(r(settle(r(S0, { type: "enterDesk" })), { type: "openDiary" }));
  for (let i = 0; i < 6; i++) s = r(s, { type: "nextPage" });
  assert.equal(s.spread, 3);
  s = r(s, { type: "prevPage" });
  assert.equal(s.spread, 2);
  s = settle(r(settle(r(s, { type: "closeDiary" })), { type: "openDiary" }));
  assert.equal(s.spread, 0);
});

test("mobile paging pans between pages before flipping", () => {
  let s = r(S0, { type: "setMobile", mobile: true });
  s = settle(r(settle(r(s, { type: "enterDesk" })), { type: "openDiary" }));
  assert.deepEqual([s.spread, s.diaryFocus], [0, "left"]);
  s = r(s, { type: "nextPage" });
  assert.deepEqual([s.spread, s.diaryFocus], [0, "right"]);
  s = r(s, { type: "nextPage" });
  assert.deepEqual([s.spread, s.diaryFocus], [1, "left"]);
  s = r(s, { type: "prevPage" });
  assert.deepEqual([s.spread, s.diaryFocus], [0, "right"]);
});

test("store notifies subscribers and supports unsubscribe", () => {
  const store = createDeskStore();
  let calls = 0;
  const off = store.subscribe(() => calls++);
  store.dispatch({ type: "enterDesk" });
  off();
  store.dispatch({ type: "transitionEnd" });
  assert.equal(calls, 1);
  assert.equal(store.get().mode, "desk");
});
```

- [ ] **Step 3: Run tests, verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module .../keyboardLayout.mjs` (and the other two).

- [ ] **Step 4: Implement `keyboardLayout.mjs`**

```js
// Keyboard-local layout shared by scripts/model/build-desk.mjs and the runtime
// keycaps. Matches the modeled 15 x 5 grid; space and enter replace cells.
export const KEY_PITCH = 0.119;
export const KEY_TRAVEL = 0.022;
export const KEY_TONES = { slate: "#50585a", light: "#9caaa9", orange: "#f44e00" };

const ROWS = [
  ["Escape", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9", "Digit0", "Minus", "Equal", "Backslash", "Backspace"],
  ["Tab", "KeyQ", "KeyW", "KeyE", "KeyR", "KeyT", "KeyY", "KeyU", "KeyI", "KeyO", "KeyP", "BracketLeft", "BracketRight", "Delete", "Home"],
  ["CapsLock", "KeyA", "KeyS", "KeyD", "KeyF", "KeyG", "KeyH", "KeyJ", "KeyK", "KeyL", "Semicolon", "Quote", "PageUp", null, null],
  ["ShiftLeft", "KeyZ", "KeyX", "KeyC", "KeyV", "KeyB", "KeyN", "KeyM", "Comma", "Period", "Slash", "ShiftRight", "ArrowUp", "End", "PageDown"],
  ["ControlLeft", "AltLeft", "MetaLeft", null, null, null, null, null, null, null, null, "AltRight", "ArrowLeft", "ArrowDown", "ArrowRight"],
];

const x0 = -0.833;
const z0 = -0.255;

function build() {
  const keys = [];
  ROWS.forEach((row, r) =>
    row.forEach((code, c) => {
      if (!code) return;
      const tone =
        r === 0 && c === 0 ? "orange" : r === 0 || c === 0 || c >= 13 ? "slate" : "light";
      keys.push({ code, x: x0 + c * KEY_PITCH, y: 0.133, z: z0 + r * KEY_PITCH, w: 0.108, h: 0.058, d: 0.102, tone, legend: true });
    }),
  );
  keys.push({ code: "Space", x: -0.065, y: 0.137, z: 0.22, w: 0.6, h: 0.061, d: 0.103, tone: "slate", legend: false });
  keys.push({ code: "Enter", x: 0.772, y: 0.139, z: -0.018, w: 0.18, h: 0.065, d: 0.1, tone: "orange", legend: false });
  return keys;
}

export const KEYS = build();
export const KEY_INDEX = new Map(KEYS.map((k, i) => [k.code, i]));
```

- [ ] **Step 5: Implement `deskMath.mjs`**

```js
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const clampToRect = ({ x, z }, { minX, maxX, minZ, maxZ }) => ({
  x: clamp(x, minX, maxX),
  z: clamp(z, minZ, maxZ),
});

// Semi-implicit Euler, sub-stepped so a long frame (hidden tab) stays stable.
export function springStep({ value, velocity }, target, dt, { stiffness, damping }) {
  let v = value;
  let vel = velocity;
  let remaining = Math.min(dt, 0.25);
  while (remaining > 0) {
    const h = Math.min(remaining, 1 / 120);
    vel += (stiffness * (target - v) - damping * vel) * h;
    v += vel * h;
    remaining -= h;
  }
  return { value: v, velocity: vel };
}

const DOWN = 0.06;
const UP = 0.09;
// 0 = resting, 1 = bottomed out.
export function keyPressOffset(t) {
  if (t <= 0 || t >= DOWN + UP) return 0;
  if (t <= DOWN) return t / DOWN;
  const u = (t - DOWN) / UP;
  return 1 - u * u * (3 - 2 * u);
}
```

- [ ] **Step 6: Implement `deskMachine.mjs`**

```js
export const SPREAD_COUNT = 4;
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
  if (state.transitioning) return state;
  switch (action.type) {
    case "enterDesk":
      return state.mode === "hero" ? go(state, "desk") : state;
    case "exitDesk":
      return state.mode === "desk" ? go(state, "hero") : state;
    case "openDiary":
      return state.mode === "desk"
        ? go(state, "diary", { spread: 0, diaryFocus: state.mobile ? "left" : "right" })
        : state;
    case "closeDiary":
      return state.mode === "diary" ? go(state, "desk") : state;
    case "escape":
      if (state.mode === "diary") return go(state, "desk");
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
```

- [ ] **Step 7: Run tests, verify they pass**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json components/canvas/desk/lib
git commit -m "feat(desk): pure layout, spring and mode-machine modules with tests

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 2: Runtime restructure — store hook, camera director, full-bleed canvas, decluttered overlay

Replaces `components/canvas/Computer.jsx` with `components/canvas/desk/`. Still loads the current `scene.gltf` (model split is Task 3). The primitive stand-in mouse/boom, the invisible keyboard/diary boxes, the square-wave beep, the 2D diary modal, the help pill and the "Return to hero" pill are all deleted here; interactions return in Tasks 4–7.

**Files:**
- Create: `components/canvas/desk/useDesk.js`, `cameraFraming.js`, `CameraDirector.jsx`, `DeskModel.jsx`, `DeskCanvas.jsx`
- Modify: `components/canvas/desk/lib/deskMachine.mjs` (+ `reset` action), `deskMachine.test.mjs`
- Modify: `components/HomePage/HeroSection/index.tsx`, `HeroSection.module.scss`
- Delete: `components/canvas/Computer.jsx`

**Interfaces:**
- Consumes (Task 1): `createDeskStore`, `INITIAL_DESK_STATE`, action names.
- Produces:
  - `useDesk(selector: (state) => primitive)`, `dispatchDesk(action)`, `deskStore`.
  - `getPose(mode, {bounds, size, isMobile, diaryAnchor, focus}) → {position: Vector3, center: Vector3, fov: number}`.
  - `DeskModel` props `{isMobile, active, children}`; renders children inside the drifting group; exposes GLTF `nodes` to children through render prop: `children(nodes)`.
  - `DeskCanvas` default export props `{onReady(), onProgress(n), active: boolean}`.
  - New action `{type:'reset'}` → `INITIAL_DESK_STATE` with `mobile` preserved.

- [ ] **Step 1: Failing test for `reset`**

Append to `deskMachine.test.mjs`:

```js
test("reset returns to hero but keeps the mobile flag, even mid-transition", () => {
  let s = r(r(S0, { type: "setMobile", mobile: true }), { type: "enterDesk" });
  s = r(s, { type: "reset" });
  assert.deepEqual(s, { ...S0, mobile: true });
});
```

Run: `npm test` → FAIL (reset returns the transitioning state unchanged).

- [ ] **Step 2: Implement `reset`**

In `deskReducer`, directly after the `transitionEnd` line add:

```js
  if (action.type === "reset") return { ...INITIAL_DESK_STATE, mobile: state.mobile };
```

Run: `npm test` → PASS.

- [ ] **Step 3: Create `useDesk.js`**

```js
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
```

- [ ] **Step 4: Create `cameraFraming.js`** (moves and generalizes `getCameraTarget` from `Computer.jsx`)

```js
import { MathUtils, PerspectiveCamera, Vector3 } from "three";

const DESK_CENTER = new Vector3(0, 0.12, 0.2);
const DESK_MIN = new Vector3(-3.25, 0, -1.35);
const DESK_MAX = new Vector3(3.2, 0, 1.5);
const probe = new PerspectiveCamera();

const boxCorners = (min, max) => {
  const out = [];
  for (const x of [min.x, max.x])
    for (const y of [min.y, max.y])
      for (const z of [min.z, max.z]) out.push(new Vector3(x, y, z));
  return out;
};

// Fits `corners` into the viewport. heightFraction/drop let the hero place the
// desk in the lower part of a full-bleed canvas, under the intro text.
function fit({ center, direction, corners, fov, aspect, framing, heightFraction = 1, drop = 0 }) {
  probe.fov = fov;
  probe.aspect = aspect;
  probe.position.copy(center).addScaledVector(direction, 10);
  probe.lookAt(center);
  probe.updateMatrixWorld();
  const right = new Vector3().setFromMatrixColumn(probe.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(probe.matrixWorld, 1);
  const tanHalf = Math.tan(MathUtils.degToRad(fov / 2));
  const tanY = tanHalf * heightFraction;
  const tanX = tanHalf * aspect;
  let distance = 0;
  for (const corner of corners) {
    const p = corner.clone().sub(center);
    distance = Math.max(
      distance,
      p.dot(direction) + Math.abs(p.dot(right)) / tanX,
      p.dot(direction) + Math.abs(p.dot(up)) / tanY,
    );
  }
  distance *= framing;
  const shift = up.multiplyScalar(2 * drop * distance * tanHalf);
  return {
    position: center.clone().addScaledVector(direction, distance).add(shift),
    center: center.clone().add(shift),
    fov,
  };
}

const aspectOf = (size) => Math.max(size.width, 1) / Math.max(size.height, 1);

export function getPose(mode, { bounds, size, isMobile, diaryAnchor, focus }) {
  const aspect = aspectOf(size);
  if (mode === "desk") {
    return fit({
      center: DESK_CENTER.clone(),
      direction: new Vector3(0.08, 1, 0.11).normalize(),
      corners: boxCorners(
        new Vector3(DESK_MIN.x, -0.04, DESK_MIN.z),
        new Vector3(DESK_MAX.x, 0.48, DESK_MAX.z),
      ),
      fov: isMobile ? 54 : 48,
      aspect,
      framing: isMobile ? 1.02 : 1.08,
    });
  }
  if (mode === "diary" && diaryAnchor) {
    diaryAnchor.updateWorldMatrix(true, false);
    // Open book in Interactive_Diary local space: spine at x=-0.31, spread
    // spans x -0.94..0.33, pages 0.88 deep. Phones frame one page.
    const single = isMobile;
    const localCenter = single
      ? new Vector3(focus === "left" ? -0.62 : 0.01, 0.09, 0)
      : new Vector3(-0.31, 0.09, 0);
    const half = single ? new Vector3(0.32, 0, 0.45) : new Vector3(0.66, 0, 0.47);
    const corners = boxCorners(
      localCenter.clone().sub(half),
      localCenter.clone().add(half),
    ).map((c) => diaryAnchor.localToWorld(c));
    return fit({
      center: diaryAnchor.localToWorld(localCenter.clone()),
      direction: new Vector3(0, 1, 0.28).normalize(),
      corners,
      fov: isMobile ? 50 : 40,
      aspect,
      framing: 1.1,
    });
  }
  return fit({
    center: bounds.getCenter(new Vector3()),
    direction: new Vector3(0.34, 0.3, 1).normalize(),
    corners: boxCorners(bounds.min, bounds.max),
    fov: 36,
    aspect,
    framing: isMobile ? 0.84 : 0.9,
    heightFraction: isMobile ? 0.58 : 0.61,
    drop: isMobile ? 0.11 : 0.105,
  });
}
```

- [ ] **Step 5: Create `CameraDirector.jsx`**

```jsx
import { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { CatmullRomCurve3 } from "three";
import { gsap } from "@/libs/gsap";
import { dispatchDesk, useDesk } from "./useDesk";
import { getPose } from "./cameraFraming";

export default function CameraDirector({ bounds, isMobile, diaryAnchor }) {
  const { camera, size, invalidate } = useThree();
  const mode = useDesk((s) => s.mode);
  const focus = useDesk((s) => s.diaryFocus);
  const transitioning = useDesk((s) => s.transitioning);
  const look = useRef(null);
  const last = useRef({ mode: null, focus: null });

  useEffect(() => {
    const pose = getPose(mode, { bounds, size, isMobile, diaryAnchor, focus });
    const apply = (position, center, fov) => {
      camera.position.copy(position);
      camera.fov = fov;
      camera.updateProjectionMatrix();
      camera.lookAt(center);
      invalidate();
    };
    const changed = last.current.mode !== mode || last.current.focus !== focus;
    last.current = { mode, focus };

    // First frame, or a resize while settled: snap without animating.
    if (!look.current || (!changed && !transitioning)) {
      look.current = pose.center.clone();
      apply(pose.position, pose.center, pose.fov);
      return;
    }

    const fromPos = camera.position.clone();
    const fromLook = look.current.clone();
    const fromFov = camera.fov;
    const mid = fromPos.clone().lerp(pose.position, 0.5);
    mid.y = Math.max(fromPos.y, pose.position.y) + fromPos.distanceTo(pose.position) * 0.15;
    const curve = new CatmullRomCurve3([fromPos, mid, pose.position]);
    const progress = { t: 0 };
    const panOnly = last.current.mode === mode && mode === "diary";
    const tween = gsap.to(progress, {
      t: 1,
      duration: panOnly ? 0.8 : 1.6,
      ease: "power3.inOut",
      onUpdate: () => {
        look.current.lerpVectors(fromLook, pose.center, progress.t);
        apply(
          curve.getPoint(progress.t),
          look.current,
          fromFov + (pose.fov - fromFov) * progress.t,
        );
      },
      onComplete: () => dispatchDesk({ type: "transitionEnd" }),
    });
    return () => tween.kill();
    // transitioning is read, not a trigger: toggling it must not restart tweens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, focus, bounds, size.width, size.height, isMobile, diaryAnchor, camera, invalidate]);

  return null;
}
```

Note: when a resize happens mid-transition, the effect cleanup kills the tween and re-runs; `changed` is false but `transitioning` is true, so it tweens again from the current camera position — the camera never freezes between poses (Review Focus #1).

- [ ] **Step 6: Create `DeskModel.jsx`**

```jsx
import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3, Object3D } from "three";
import CameraDirector from "./CameraDirector";
import { dispatchDesk, useDesk } from "./useDesk";
import { springStep } from "./lib/deskMath.mjs";

export const MODEL_URL = "/desktop_pc/scene.gltf?v=shiv-studio-1";
const DRIFT = 0.0105; // ±0.6°
const DRIFT_PERIOD = 8;

// Fallback for the pre-split model: where the teal book sits.
function makeFallbackDiary() {
  const anchor = new Object3D();
  anchor.position.set(-2.75, 0.05, 0.89);
  anchor.rotation.set(0, -0.16, 0);
  return anchor;
}

export default function DeskModel({ isMobile, active, children }) {
  const { scene, nodes } = useGLTF(MODEL_URL);
  const drift = useRef(null);
  const rim = useRef(null);
  const hover = useRef({ on: false, spring: { value: 0, velocity: 0 } });
  const mode = useDesk((s) => s.mode);
  const drifting = active && mode === "hero";

  useEffect(() => {
    scene.traverse((part) => {
      if (part.isMesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
  }, [scene]);

  const bounds = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    return new Box3().setFromObject(scene);
  }, [scene]);
  const diaryAnchor = useMemo(
    () => nodes.Interactive_Diary ?? makeFallbackDiary(),
    [nodes],
  );

  useFrame((state, delta) => {
    let busy = false;
    if (drift.current) {
      const target = drifting
        ? Math.sin((state.clock.elapsedTime / DRIFT_PERIOD) * Math.PI * 2) * DRIFT
        : 0;
      drift.current.rotation.y += (target - drift.current.rotation.y) * Math.min(1, delta * 4);
      busy = drifting || Math.abs(drift.current.rotation.y) > 1e-4;
    }
    const h = hover.current;
    h.spring = springStep(h.spring, h.on && mode === "hero" ? 1 : 0, delta, { stiffness: 60, damping: 15.5 });
    if (rim.current) rim.current.intensity = h.spring.value * 2.5;
    if (busy || Math.abs(h.spring.velocity) > 1e-3) state.invalidate();
  });

  return (
    <>
      <CameraDirector bounds={bounds} isMobile={isMobile} diaryAnchor={diaryAnchor} />
      <pointLight ref={rim} position={[0, 1.2, 2.2]} color="#f47734" distance={7} intensity={0} />
      <group ref={drift}>
        <primitive object={scene} />
        <mesh
          position={[0, 0.02, 0.18]}
          rotation={[-Math.PI / 2, 0, 0]}
          onPointerOver={() => { hover.current.on = true; }}
          onPointerOut={() => { hover.current.on = false; }}
          onClick={(event) => {
            if (mode !== "hero") return;
            event.stopPropagation();
            dispatchDesk({ type: "enterDesk" });
          }}
        >
          <planeGeometry args={[6.9, 2.8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        {children?.(nodes)}
      </group>
    </>
  );
}
```

Note: `useFrame` only runs when a frame renders; `DeskCanvas` kicks one frame with `invalidate()` whenever `active`/`mode` changes (Step 7) so the drift loop restarts.

- [ ] **Step 7: Create `DeskCanvas.jsx`** (lights/environment copied from `Computer.jsx`, stand-ins removed)

```jsx
import { Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, Preload, useProgress } from "@react-three/drei";
import DeskModel from "./DeskModel";
import { dispatchDesk, useDesk } from "./useDesk";

function SceneReady({ onReady }) {
  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);
  return null;
}

function Kick({ deps }) {
  const invalidate = useThree((s) => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => invalidate(), deps);
  return null;
}

export default function DeskCanvas({ onReady, onProgress, active }) {
  const [isMobile, setIsMobile] = useState(false);
  const mode = useDesk((s) => s.mode);
  const transitioning = useDesk((s) => s.transitioning);
  const progress = useProgress((s) => s.progress);

  useEffect(() => onProgress(progress), [progress, onProgress]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px), (pointer: coarse)");
    const update = () => {
      setIsMobile(query.matches);
      dispatchDesk({ type: "setMobile", mobile: query.matches });
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const orbit = !isMobile && mode === "hero" && !transitioning;

  return (
    <Canvas
      frameloop="demand"
      shadows={isMobile ? "basic" : true}
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [3.4, 4, 10], fov: 36, near: 0.1, far: 80 }}
      gl={{ powerPreference: isMobile ? "low-power" : "high-performance", antialias: true }}
      style={{ touchAction: mode === "hero" ? "manipulation" : "none" }}
    >
      <Kick deps={[active, mode]} />
      {orbit && (
        <OrbitControls
          makeDefault
          enableZoom={false}
          enablePan={false}
          minAzimuthAngle={-0.35}
          maxAzimuthAngle={0.55}
          minPolarAngle={1.02}
          maxPolarAngle={1.43}
          rotateSpeed={0.45}
        />
      )}
      <hemisphereLight intensity={1.1} color="#e9edf4" groundColor="#38251b" />
      <directionalLight
        position={[-3, 7, 5]}
        intensity={3.2}
        color="#fff1df"
        castShadow={!isMobile}
        shadow-mapSize={isMobile ? 512 : 1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[4, 3, -3]} intensity={2} color="#e0e9f6" />
      <pointLight position={[-3, 1, -2]} intensity={4} color="#f47734" distance={9} />
      <Suspense fallback={null}>
        <Environment resolution={isMobile ? 64 : 128} frames={1}>
          <Lightformer form="rect" intensity={2.5} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 5, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-5, 2, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 5, 1]} />
        </Environment>
        <DeskModel isMobile={isMobile} active={active}>
          {() => null}
        </DeskModel>
        <Preload all />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
```

OrbitControls: when it mounts after returning to hero, it reads the camera's current position; its default target `(0,0,0)` would re-aim the camera. Pass the hero look target: add `target={heroTarget}` where `heroTarget` is exported state. Implement by exporting from `CameraDirector.jsx`:

```jsx
export const heroLook = { current: null }; // set in CameraDirector when mode === "hero" pose is computed
```

In `CameraDirector` effect, right after computing `pose`: `if (mode === "hero") heroLook.current = pose.center.clone();`. In `DeskCanvas`: `import { heroLook } from "./CameraDirector";` and `<OrbitControls target={heroLook.current ?? undefined} ... />`.

- [ ] **Step 8: Rewrite `HeroSection/index.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ChevronDown, X } from "lucide-react";
import { useLenis } from "@studio-freight/react-lenis";
import styles from "./HeroSection.module.scss";
import { useSceneLoading } from "@/components/Loader/LoadingContext";
import SceneBoundary from "@/components/Loader/SceneBoundary";
import { dispatchDesk, useDesk } from "@/components/canvas/desk/useDesk";

const DeskCanvas = dynamic(() => import("@/components/canvas/desk/DeskCanvas"), { ssr: false });

const ANNOUNCE: Record<string, string> = {
  hero: "",
  desk: "Desk view. Type on your keyboard, drag the mouse or the microphone, or open the diary.",
  diary: "Diary open.",
};

export default function HeroSection() {
  const [showScene, setShowScene] = useState(false);
  const [active, setActive] = useState(true);
  const [explored, setExplored] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const reducedMotion = useReducedMotion();
  const lenis = useLenis();
  const { finishScene, updateSceneProgress } = useSceneLoading();
  const mode = useDesk((s: { mode: string }) => s.mode);
  const inDesk = mode !== "hero";

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setShowScene(!query.matches);
      if (query.matches) finishScene();
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [finishScene]);

  useEffect(() => () => dispatchDesk({ type: "reset" }), []);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inDesk) return;
    setExplored(true);
    const root = document.documentElement;
    const previous = root.style.overflow;
    lenis?.scrollTo(0, { duration: 0.6, onComplete: () => lenis?.stop() });
    if (!lenis) window.scrollTo({ top: 0 });
    root.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") dispatchDesk({ type: "escape" });
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = previous;
      lenis?.start();
    };
  }, [inDesk, lenis]);

  return (
    <section
      ref={sectionRef}
      className={`${styles.hero} ${inDesk ? styles.inDesk : ""}`}
      aria-labelledby="hero-title"
    >
      <div className={styles["text-container"]}>
        <h1 id="hero-title" aria-label="Hi, I'm Shiv Vyas">
          Hi, I&apos;m <span>Shiv</span>
        </h1>
        <p>
          I&apos;m a <span>Founding Engineer</span> from New York, currently
          building at <span>Contextual Intelligence</span>.
        </p>
      </div>
      <div className={styles.background}>
        {showScene && (
          <SceneBoundary onError={finishScene}>
            <DeskCanvas onReady={finishScene} onProgress={updateSceneProgress} active={active} />
          </SceneBoundary>
        )}
      </div>
      <div className={styles.vignette} aria-hidden="true" />
      {showScene && !inDesk && (
        <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "enterDesk" })}>
          Explore Shiv&apos;s desk
        </button>
      )}
      {showScene && !inDesk && !explored && (
        <p className={styles.deskHint} aria-hidden="true">click the desk</p>
      )}
      {inDesk && (
        <button
          type="button"
          className={styles.deskExit}
          aria-label={mode === "diary" ? "Close the diary" : "Leave the desk"}
          onClick={() => dispatchDesk({ type: "escape" })}
        >
          <X size={18} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
      <p className={styles.srOnly} aria-live="polite">{ANNOUNCE[mode]}</p>
      <button
        type="button"
        aria-label="Scroll to about section"
        className={styles.scrollDown}
        onClick={() => {
          document.getElementById("about")?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
        }}
      >
        <motion.span
          className={styles.scrollDownRing}
          initial={reducedMotion ? false : { opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.span
            className={styles.scrollDownIcon}
            animate={reducedMotion ? { y: 0 } : { y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: reducedMotion ? 0 : Infinity }}
          >
            <ChevronDown strokeWidth={2.5} aria-hidden="true" />
          </motion.span>
        </motion.span>
      </button>
    </section>
  );
}
```

If TS complains that `useDesk` is untyped JS, add `components/canvas/desk/useDesk.d.ts`:

```ts
import type { INITIAL_DESK_STATE } from "./lib/deskMachine.mjs";
export type DeskState = { mode: "hero" | "desk" | "diary"; transitioning: boolean; spread: number; diaryFocus: "left" | "right"; mobile: boolean };
export declare function useDesk<T>(selector: (state: DeskState) => T): T;
export declare function dispatchDesk(action: { type: string; [key: string]: unknown }): void;
export declare const deskStore: { get(): DeskState; dispatch(a: { type: string }): void; subscribe(fn: () => void): () => void };
```

(Drop the unused `import type` line if lint flags it.)

- [ ] **Step 9: Update `HeroSection.module.scss`**

1. Delete the blocks for `.deskHelp`, `.deskClose`, `.diaryBackdrop`, `.diary`, `.diaryClose`, `.diaryPaperclip`, `.diaryKicker`, `.diaryIntro`, `.diaryGrid`, `.diarySketch`, `.diaryProjects`, `.diarySignoff` and the `.deskView` modifier. Run `grep -n "diary\|deskHelp\|deskClose\|deskView" components/HomePage/HeroSection/HeroSection.module.scss` → no matches.
2. Make the canvas full-bleed: replace the `.background` positioning (`top: 30%`, `height: 61%` and the mobile `top: 32%; height: 58%`) with `inset: 0; height: 100%;` and remove the `cursor: grab` rules (cursor is set per-object later).
3. Add inside `.hero`:

```scss
  .text-container,
  .scrollDown {
    position: relative;
    z-index: 2;
    transition: opacity 0.5s ease;
  }

  .text-container {
    pointer-events: none;
  }

  &.inDesk {
    .text-container,
    .scrollDown,
    .deskHint {
      opacity: 0;
      pointer-events: none;
    }

    .vignette {
      opacity: 1;
    }
  }

  .vignette {
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.8s ease;
    background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.55) 100%);
  }

  .deskHint {
    position: absolute;
    z-index: 3;
    left: 50%;
    bottom: 22%;
    transform: translateX(-50%);
    margin: 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.72rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    pointer-events: none;
    animation: deskHintPulse 2.4s ease-in-out infinite;
    transition: opacity 0.4s ease;
  }

  .deskExit {
    position: absolute;
    z-index: 4;
    top: 5.5rem;
    right: 1.5rem;
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.22);
    border-radius: 50%;
    background: rgba(12, 9, 8, 0.5);
    color: #fff;
    backdrop-filter: blur(10px);
    cursor: pointer;

    &:focus-visible {
      outline: 2px solid #f47734;
      outline-offset: 3px;
    }
  }

  .srOnly {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }

  .srFocusable {
    @extend .srOnly;
    z-index: 5;

    &:focus-visible {
      top: 5.5rem;
      left: 1.5rem;
      width: auto;
      height: auto;
      clip: auto;
      padding: 0.5rem 0.9rem;
      border-radius: 999px;
      background: #f47734;
      color: #000;
    }
  }
}

@keyframes deskHintPulse {
  0%, 100% { opacity: 0.35; }
  50% { opacity: 0.8; }
```

(The trailing `}` of `.hero` moves to close before `@keyframes`; make sure braces balance — `npm run build` will fail otherwise.) Check `.deskExit`'s `top` clears the site Nav; adjust if the Nav is taller.

- [ ] **Step 10: Delete the old canvas and verify**

```bash
git rm components/canvas/Computer.jsx
grep -rn "canvas/Computer" components pages || echo "no references"
npm test && npm run lint && npm run build
```

Expected: tests pass, lint clean, build succeeds.

- [ ] **Step 11: Browser check** (`npm run dev`, http://localhost:3000, desktop 1440×900 then 390×844 via Chrome device toolbar)

- Hero: desk sits below the intro text as before; slow ±0.6° drift; hovering the desk warms the front; the "click the desk" hint pulses.
- Click desk → camera arcs overhead in 1.6 s; text/scroll cue fade; vignette appears; page does not scroll; X button top-right.
- Esc or X → arcs back; orbit works again (desktop) and does not snap the view.
- Resize the window during a transition → camera still lands correctly.
- Tab to "Explore Shiv's desk" → visible focus pill → Enter enters desk.
- No doubled mouse/mic.

- [ ] **Step 12: Commit**

```bash
git add -A components/canvas components/HomePage/HeroSection
git commit -m "feat(desk): cinematic camera director and decluttered hero overlay

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 3: Split interactive nodes in the model, emit a meshopt GLB, render keycaps as instances

**Files:**
- Modify: `package.json` (devDependencies, test glob), `scripts/model/build-desk.mjs`, `public/desktop_pc/README.md`, `components/canvas/desk/DeskModel.jsx`
- Create: `components/canvas/desk/Keycaps.jsx`, `scripts/model/assets/manhattan-dusk.jpg` (moved + resized), `scripts/model/scene.test.mjs`
- Generated: `public/desktop_pc/scene.glb`
- Delete: `public/desktop_pc/scene.gltf`, `public/desktop_pc/studio.bin`, `public/desktop_pc/textures/manhattan-dusk.jpg`

**Interfaces:**
- Consumes: `KEYS`, `KEY_TONES`, `KEY_TRAVEL` (Task 1); `keyPressOffset` (Task 1); `DeskModel` (Task 2).
- Produces:
  - GLB nodes (exact names, Global Constraints). Hierarchy: `Interactive_Mic_Base > Interactive_Mic_Lower > Interactive_Mic_Upper > Interactive_Mic_Head`; `Interactive_Diary > Interactive_Diary_Cover` (hinge at diary-local `[-0.31, 0.075, 0]`, cover extends to +x).
  - Mic rest geometry (in `Interactive_Mic_Base` space): shoulder `[0,0,0]`, elbow `[0, 1.09, -0.15]`, tip `[-0.11, 2.05, -0.63]`; forward is local `-z`.
  - `keycapsApi.press(index: number): void` (module-level object exported from `Keycaps.jsx`; no-op until mounted).
  - `MODEL_URL = "/desktop_pc/scene.glb?v=interactive-1"`.

- [ ] **Step 1: Install build-time deps and widen the test glob**

```bash
npm i -D @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
```

Change the `test` script to:

```json
"test": "node --test \"components/canvas/desk/lib/*.test.mjs\" \"scripts/**/*.test.mjs\""
```

- [ ] **Step 2: Move and shrink the wallpaper source**

```bash
mkdir -p scripts/model/assets
sips -Z 1024 -s formatOptions 72 public/desktop_pc/textures/manhattan-dusk.jpg --out scripts/model/assets/manhattan-dusk.jpg
ls -la scripts/model/assets/manhattan-dusk.jpg   # expect roughly 120–200 KB
```

Open it to eyeball quality. If banding is visible, redo with `formatOptions 80`.

- [ ] **Step 3: Write the failing model test** — `scripts/model/scene.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { MeshoptDecoder } from "meshoptimizer";

const file = fileURLToPath(new URL("../../public/desktop_pc/scene.glb", import.meta.url));
const REQUIRED = [
  "Interactive_Mouse",
  "Interactive_Keyboard",
  "Interactive_Mic_Base",
  "Interactive_Mic_Lower",
  "Interactive_Mic_Upper",
  "Interactive_Mic_Head",
  "Interactive_Diary",
  "Interactive_Diary_Cover",
];

test("scene.glb is small and exposes the interactive hierarchy", async () => {
  const { size } = await stat(file);
  assert.ok(size < 460_000, `scene.glb is ${size} bytes`);
  await MeshoptDecoder.ready;
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ "meshopt.decoder": MeshoptDecoder });
  const doc = await io.read(file);
  const nodes = Object.fromEntries(doc.getRoot().listNodes().map((n) => [n.getName(), n]));
  for (const name of REQUIRED) assert.ok(nodes[name], `missing ${name}`);
  const childOf = (parent, child) => nodes[parent].listChildren().includes(nodes[child]);
  assert.ok(childOf("Interactive_Mic_Base", "Interactive_Mic_Lower"));
  assert.ok(childOf("Interactive_Mic_Lower", "Interactive_Mic_Upper"));
  assert.ok(childOf("Interactive_Mic_Upper", "Interactive_Mic_Head"));
  assert.ok(childOf("Interactive_Diary", "Interactive_Diary_Cover"));
  assert.deepEqual(nodes.Interactive_Mic_Upper.getTranslation().map((v) => +v.toFixed(3)), [0, 1.09, -0.15]);
});
```

Run: `npm test` → FAIL with `ENOENT ... scene.glb`.

- [ ] **Step 4: Builder — imports and `interactive` helper**

Replace the `node:fs/promises` / `node:url` import lines at the top of `scripts/model/build-desk.mjs` with:

```js
import { copyFile, mkdir, mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";
```

Below the `group()` function add:

```js
// Interactive groups are exported as their own nodes (merged per material
// inside), so the runtime can move them. Everything else is batched statically.
function interactive(object) {
  object.userData.interactive = true;
  return object;
}
```

Update the header comment's second sentence to: `Static geometry is merged by material; interactive groups keep their own nodes.`

- [ ] **Step 5: Builder — keyboard and mouse**

1. Change the keyboard group line to:

```js
const keyboard = interactive(
  group("Interactive_Keyboard", [0.04, 0.073, 1.0], [-0.035, 0, 0]),
);
```

2. Delete the keycap `for (let row …)` double loop, the `"Keyboard spacebar"` box and the `"Keyboard orange enter"` box (keycaps are now runtime instances from `keyboardLayout.mjs`). Keep the case, mounting plate and cable. Replace the section comment with `// Mechanical keyboard case; keycaps are instanced at runtime (keyboardLayout.mjs).`

3. Change the mouse group line to:

```js
const mouse = interactive(
  group("Interactive_Mouse", [1.38, 0.1, 1.02], [0, -0.12, 0]),
);
```

- [ ] **Step 6: Builder — replace the whole microphone block**

Replace everything from `// Right-hand articulated recording arm…` through the `"Microphone cable"` `cable(...)` call with:

```js
// Right-hand articulated recording arm. Pivot groups let the runtime bend it:
// Base (yaw) > Lower (shoulder pitch) > Upper (elbow pitch) > Head (kept level).
const ELBOW = [0, 1.09, -0.15];
const TIP = [-0.11, 2.05, -0.63];
const from = (origin, point) => point.map((v, i) => v - origin[i]);
const micBase = interactive(group("Interactive_Mic_Base", [3.24, 0.018, 0.51]));
const micLower = interactive(group("Interactive_Mic_Lower", [0, 0, 0], [0, 0, 0], micBase));
const micUpper = interactive(group("Interactive_Mic_Upper", ELBOW, [0, 0, 0], micLower));
const micHead = interactive(
  group("Interactive_Mic_Head", from(ELBOW, TIP), [0, 0, 0], micUpper),
);

box("Desk microphone clamp", [0.2, 0.11, 0.32], [0, -0.032, 0], mats.black, micBase, 0.015);

rod("Mic upright", [0, 0, 0], ELBOW, 0.037, mats.black, micLower);
rod("Mic arm parallel", [0.105, 0.34, -0.044], [0.105, 1.09, -0.15], 0.018, mats.black, micLower);
cylinder("Microphone arm pivot", 0.063, 0.125, [0, 0.15, -0.02], mats.graphite, micLower, [0, 0, Math.PI / 2]);
for (let i = 0; i < 17; i++)
  mesh(
    "Arm tension spring",
    new THREE.TorusGeometry(0.033, 0.006, 5, 10),
    mats.silver,
    [0.084, 0.27 + i * 0.026, -0.04 - i * 0.0036],
    micLower,
    [Math.PI / 2, 0, 0],
  );
cable("Microphone cable lower", [[0, 1.15, -0.17], [0, 0.3, -0.01], [-0.26, 0.1, -0.04]], 0.015, micLower);

rod("Mic arm upper", [0, 0, 0], from(ELBOW, TIP), 0.037, mats.graphite, micUpper);
rod("Mic upper parallel", [0.105, 0, 0], from(ELBOW, [-0.005, 2.05, -0.63]), 0.018, mats.black, micUpper);
for (const p of [[0, 0, 0], from(ELBOW, TIP)])
  cylinder("Microphone arm pivot", 0.063, 0.125, p, mats.graphite, micUpper, [0, 0, Math.PI / 2]);
cable(
  "Microphone cable upper",
  [[-0.29, 0.86, -0.5], [-0.39, 0.54, -0.46], [-0.18, 0.3, -0.27], [0, 0.06, -0.02]],
  0.015,
  micUpper,
);

const capsule = group("Microphone capsule", from(TIP, [-0.29, 2.08, -0.65]), [0, 0, -0.24], micHead);
cylinder("Microphone barrel", 0.075, 0.22, [0, 0, 0], mats.graphite, capsule);
cylinder("Microphone mesh grille", 0.079, 0.23, [0, 0.217, 0], mats.grille, capsule);
for (let i = 0; i < 12; i++)
  mesh(
    "Grille horizontal wire",
    new THREE.TorusGeometry(0.08, 0.003, 4, 16),
    mats.graphite,
    [0, 0.118 + i * 0.018, 0],
    capsule,
    [Math.PI / 2, 0, 0],
  );
mesh(
  "Microphone shock mount",
  new THREE.TorusGeometry(0.113, 0.012, 8, 20),
  mats.black,
  [0, -0.04, 0],
  capsule,
  [Math.PI / 2, 0, 0],
);
rod("Pop filter stem", from(TIP, [-0.22, 1.76, -0.59]), from(TIP, [-0.51, 2.01, -0.49]), 0.012, mats.black, micHead);
cylinder("Round pop filter", 0.148, 0.023, from(TIP, [-0.51, 2.18, -0.47]), mats.rubber, micHead, [Math.PI / 2, 0, -0.15]);
mesh(
  "Pop filter rim",
  new THREE.TorusGeometry(0.148, 0.011, 8, 24),
  mats.graphite,
  from(TIP, [-0.51, 2.18, -0.455]),
  micHead,
);
```

- [ ] **Step 7: Builder — replace the books block with the diary**

Replace from `// Two books, a phone…` through the `"Book cover lettering"` loop (stop before `const phone = …`) with:

```js
// Shiv's diary: page block and back cover stay put; the front cover hinges on
// the spine so the runtime can open it. The phone and desk controller follow.
const diary = interactive(group("Interactive_Diary", [-2.75, 0.05, 0.89], [0, -0.16, 0]));
box("Book paper", [0.6, 0.067, 0.9], [0, 0.033, 0], mats.paper, diary, 0.008);
box("Teal book cover", [0.64, 0.013, 0.93], [0, -0.006, 0], mats.teal, diary, 0.008);
box("Book spine band", [0.023, 0.085, 0.93], [-0.31, 0.035, 0], mats.orange, diary, 0.003);
const diaryCover = interactive(group("Interactive_Diary_Cover", [-0.31, 0.075, 0], [0, 0, 0], diary));
box("Teal book cover", [0.64, 0.013, 0.93], [0.31, 0, 0], mats.teal, diaryCover, 0.008);
for (let i = 0; i < 4; i++)
  box(
    "Book cover lettering",
    [0.27 - i * 0.04, 0.002, 0.012],
    [0.35, 0.008, -0.22 + i * 0.06],
    mats.paper,
    diaryCover,
    0.001,
  );
```

Run `grep -n "books\|const mic \| mic)" scripts/model/build-desk.mjs` → no matches.

- [ ] **Step 8: Builder — replace the batching/export tail**

Replace everything from `scene.updateMatrixWorld(true);` to the end of the file with:

```js
scene.updateMatrixWorld(true);
const ownerOf = (object) => {
  for (let p = object.parent; p; p = p.parent) if (p.userData.interactive) return p;
  return scene;
};
const inverse = new Map();
const batches = new Map(); // owner -> Map(material -> geometries)
scene.traverse((object) => {
  if (!object.isMesh) return;
  const owner = ownerOf(object);
  if (!inverse.has(owner))
    inverse.set(owner, owner === scene ? new THREE.Matrix4() : owner.matrixWorld.clone().invert());
  let geometry = object.geometry
    .clone()
    .applyMatrix4(inverse.get(owner).clone().multiply(object.matrixWorld));
  // A uniform attribute set lets parts share a draw call.
  if (geometry.index) {
    const expanded = geometry.toNonIndexed();
    geometry.dispose();
    geometry = expanded;
  }
  if (!batches.has(owner)) batches.set(owner, new Map());
  const byMaterial = batches.get(owner);
  if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
  byMaterial.get(object.material).push(geometry);
});

const optimized = new THREE.Scene();
optimized.name = scene.name;
const exported = new Map([[scene, optimized]]);
const exportNode = (owner) => {
  if (exported.has(owner)) return exported.get(owner);
  const parentOwner = ownerOf(owner);
  const node = new THREE.Group();
  node.name = owner.name;
  const local =
    parentOwner === scene
      ? owner.matrixWorld.clone()
      : parentOwner.matrixWorld.clone().invert().multiply(owner.matrixWorld);
  local.decompose(node.position, node.quaternion, node.scale);
  exportNode(parentOwner).add(node);
  exported.set(owner, node);
  return node;
};
scene.traverse((object) => {
  if (object.userData.interactive) exportNode(object);
});
let triangles = 0;
for (const [owner, byMaterial] of batches) {
  for (const [mat, geometries] of byMaterial) {
    const combined = mergeVertices(mergeGeometries(geometries, false), 1e-5);
    triangles += combined.index.count / 3;
    const part = new THREE.Mesh(combined, mat);
    part.name = owner === scene ? mat.name : `${owner.name} ${mat.name}`;
    exportNode(owner).add(part);
  }
}

// GLTFExporter uses browser FileReader only to serialize its geometry Blob.
// Node's native Blob provides the same bytes without a DOM or extra packages.
globalThis.FileReader = class {
  async readAsDataURL(blob) {
    this.result = `data:${blob.type};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
    this.onloadend?.();
  }
};
const gltf = await new GLTFExporter().parseAsync(optimized, { binary: false });
const buffer = Buffer.from(gltf.buffers[0].uri.split(",")[1], "base64");
gltf.buffers[0].uri = "studio.bin";
gltf.asset.extras = {
  title: scene.name,
  author: "Shiv Vyas",
  description:
    "Original geometric reconstruction of Shiv Vyas’s desk reference: dual displays, laptop, mechanical keyboard and music equipment.",
  source: "scripts/model/build-desk.mjs",
};
gltf.images = [{ uri: "textures/manhattan-dusk.jpg", name: "Generated Manhattan dusk wallpaper" }];
gltf.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }];
gltf.textures = [{ source: 0, sampler: 0 }];
gltf.materials.find((m) => m.name === "Manhattan wallpaper").pbrMetallicRoughness.baseColorTexture = {
  index: 0,
};

// Write a plain glTF to a scratch folder, then compress it into one GLB.
const work = await mkdtemp(join(tmpdir(), "shiv-desk-"));
await mkdir(join(work, "textures"));
await copyFile(
  fileURLToPath(new URL("./assets/manhattan-dusk.jpg", import.meta.url)),
  join(work, "textures/manhattan-dusk.jpg"),
);
await writeFile(join(work, "scene.gltf"), JSON.stringify(gltf));
await writeFile(join(work, "studio.bin"), buffer);

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
const doc = await io.read(join(work, "scene.gltf"));
await doc.transform(
  dedup(),
  prune({ keepLeaves: true }),
  meshopt({ encoder: MeshoptEncoder, level: "medium" }),
);
await mkdir(destination, { recursive: true });
await io.write(`${destination}scene.glb`, doc);
await rm(work, { recursive: true, force: true });

console.log(
  JSON.stringify(
    {
      nodes: [...exported.values()].length - 1,
      materials: gltf.materials.length,
      triangles,
      rawGeometryBytes: buffer.length,
      glbBytes: (await stat(`${destination}scene.glb`)).size,
    },
    null,
    2,
  ),
);
```

- [ ] **Step 9: Generate and run the model test**

```bash
npm run generate-desk
npm test
```

Expected: the build prints `glbBytes` under 460000 and `nodes: 8`; all tests PASS. If `glbBytes` is over, re-run Step 2 with `-Z 896`.

- [ ] **Step 10: Create `Keycaps.jsx`**

```jsx
import { useLayoutEffect, useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, Color, Object3D } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { KEYS, KEY_TONES, KEY_TRAVEL } from "./lib/keyboardLayout.mjs";
import { keyPressOffset } from "./lib/deskMath.mjs";

// Lets the lazily loaded keyboard input press keys without owning the meshes.
export const keycapsApi = { press: () => {} };

const dummy = new Object3D();
const LEGEND_KEYS = KEYS.flatMap((k, i) => (k.legend ? [i] : []));
const LEGEND_OF = new Map(LEGEND_KEYS.map((keyIndex, j) => [keyIndex, j]));

export default function Keycaps({ anchor }) {
  const caps = useRef(null);
  const legends = useRef(null);
  const pressedAt = useRef(new Float64Array(KEYS.length).fill(-1));
  const invalidate = useThree((s) => s.invalidate);
  const capGeometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12), []);
  const legendGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);

  const place = (i, offset) => {
    const k = KEYS[i];
    const drop = offset * KEY_TRAVEL;
    dummy.position.set(k.x, k.y - drop, k.z);
    dummy.scale.set(k.w, k.h, k.d);
    dummy.updateMatrix();
    caps.current.setMatrixAt(i, dummy.matrix);
    const j = LEGEND_OF.get(i);
    if (j === undefined) return;
    dummy.position.set(k.x - 0.023, 0.163 - drop, k.z - 0.019);
    dummy.scale.set(0.025, 0.002, 0.007);
    dummy.updateMatrix();
    legends.current.setMatrixAt(j, dummy.matrix);
  };

  useLayoutEffect(() => {
    const color = new Color();
    KEYS.forEach((k, i) => {
      place(i, 0);
      caps.current.setColorAt(i, color.set(KEY_TONES[k.tone]));
    });
    caps.current.instanceMatrix.needsUpdate = true;
    caps.current.instanceColor.needsUpdate = true;
    legends.current.instanceMatrix.needsUpdate = true;
    caps.current.computeBoundingSphere();
    keycapsApi.press = (i) => {
      if (i === undefined || i < 0 || i >= KEYS.length) return;
      // performance.now, not the R3F clock: with frameloop="demand" the clock
      // is stale between frames and the press would be skipped.
      pressedAt.current[i] = performance.now() / 1000;
      invalidate();
    };
    return () => {
      keycapsApi.press = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const now = performance.now() / 1000;
    let moving = false;
    let dirty = false;
    pressedAt.current.forEach((at, i) => {
      if (at < 0) return;
      const t = now - at;
      const done = t >= 0.15;
      place(i, done ? 0 : keyPressOffset(t));
      if (done) pressedAt.current[i] = -1;
      else moving = true;
      dirty = true;
    });
    if (dirty) {
      caps.current.instanceMatrix.needsUpdate = true;
      legends.current.instanceMatrix.needsUpdate = true;
    }
    if (moving) invalidate();
  });

  return createPortal(
    <>
      <instancedMesh ref={caps} args={[capGeometry, undefined, KEYS.length]} castShadow receiveShadow name="Keycaps">
        <meshStandardMaterial roughness={0.63} />
      </instancedMesh>
      <instancedMesh ref={legends} args={[legendGeometry, undefined, LEGEND_KEYS.length]}>
        <meshStandardMaterial color="#c7d0ce" roughness={0.75} />
      </instancedMesh>
    </>,
    anchor,
  );
}
```

- [ ] **Step 11: Point the runtime at the GLB**

In `DeskModel.jsx`:
- `export const MODEL_URL = "/desktop_pc/scene.glb?v=interactive-1";`
- `import Keycaps from "./Keycaps";`
- Inside the drift `<group>`, before `{children?.(nodes)}`: `{nodes.Interactive_Keyboard && <Keycaps anchor={nodes.Interactive_Keyboard} />}`
- Delete `makeFallbackDiary` and use `const diaryAnchor = nodes.Interactive_Diary;` (drop the `Object3D` import).

- [ ] **Step 12: Remove superseded files and update the asset README**

```bash
git rm public/desktop_pc/scene.gltf public/desktop_pc/studio.bin public/desktop_pc/textures/manhattan-dusk.jpg
grep -rn "scene.gltf\|studio.bin" components pages scripts || echo "no references"
```

In `public/desktop_pc/README.md` replace the first paragraph's file name with `scene.glb`, and replace the "Runtime assets" section with:

```markdown
## Runtime asset

- `scene.glb`: meshopt-compressed scene with the Manhattan wallpaper embedded. Static parts are merged by material; the mouse, keyboard case, microphone arm (base, lower, upper, head pivots) and diary (with a hinged cover) are separate `Interactive_*` nodes the homepage animates. Keycaps are instanced at runtime from `components/canvas/desk/lib/keyboardLayout.mjs`.

The wallpaper source lives at `scripts/model/assets/manhattan-dusk.jpg` (1024 px).
```

Update the size paragraph with the `glbBytes` printed in Step 9.

- [ ] **Step 13: Verify**

```bash
npm test && npm run lint && npm run build
```

Browser (`npm run dev`): the desk looks identical to before (keys in place with orange Esc/Enter, mic arm, diary on the left), no console errors about meshopt. Network tab: `scene.glb` is the only model request, < 460 KB.

- [ ] **Step 14: Commit**

```bash
git add -A package.json package-lock.json scripts/model public/desktop_pc components/canvas/desk
git commit -m "feat(desk): split interactive nodes and ship a meshopt GLB

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 4: Lazy interaction bundle, hover helpers, playable keyboard with synthesized switch sounds

**Files:**
- Create: `components/canvas/desk/lib/switchSound.mjs`, `lib/switchSound.test.mjs`, `lib/keyInput.mjs`, `lib/keyInput.test.mjs`
- Create: `components/canvas/desk/interactions/index.jsx`, `deskAudio.js`, `useHoverLift.js`, `HitProxy.jsx`, `KeyboardInput.jsx`
- Modify: `components/canvas/desk/Keycaps.jsx`, `DeskModel.jsx`, `DeskCanvas.jsx`

**Interfaces:**
- Consumes: `keycapsApi` (Task 3), `KEYS`, `KEY_INDEX` (Task 1), `useDesk`, `deskStore` (Task 2), `springStep` (Task 1).
- Produces:
  - `renderSwitch(sampleRate, {seed, deep, up}) → Float32Array`, `renderFriction(sampleRate, seconds, seed) → Float32Array`.
  - `keyIndexFor({code, repeat, target}, mode) → number` (`-1` = ignore).
  - `deskAudio.key({deep})`, `deskAudio.friction(level0to1)`, `deskAudio.stopFriction()` — all silent no-ops when audio is unavailable.
  - `useHoverLift(object, {lift=0.03, enabled=true, cursor='grab'}) → {onPointerOver, onPointerOut, hovered: {current:boolean}}`; clones the subtree's materials once so tinting never leaks into static parts that share a material.
  - `<HitProxy node={Object3D} padding={number} {...pointerHandlers} />` — invisible box portaled into `node`, sized to its direct mesh children.
  - `DeskInteractions` default export of `interactions/index.jsx`, props `{nodes, isMobile}`.
  - `keycapsApi.onKey: ((index) => boolean) | null`.

- [ ] **Step 1: Failing tests**

`components/canvas/desk/lib/switchSound.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { renderSwitch, renderFriction } from "./switchSound.mjs";

const rms = (a, from, to) => {
  let s = 0;
  for (let i = from; i < to; i++) s += a[i] * a[i];
  return Math.sqrt(s / (to - from));
};

test("switch sample: 70 ms down, 45 ms up, finite and normalized", () => {
  const down = renderSwitch(48000, { seed: 1 });
  const up = renderSwitch(48000, { seed: 1, up: true });
  assert.equal(down.length, 3360);
  assert.equal(up.length, 2160);
  const peak = Math.max(...down.map(Math.abs));
  assert.ok(Math.abs(peak - 0.9) < 1e-6);
  assert.ok(down.every(Number.isFinite));
});

test("switch sample decays (click, not a tone)", () => {
  const s = renderSwitch(48000, { seed: 3 });
  const tenth = Math.floor(s.length / 10);
  assert.ok(rms(s, s.length - tenth, s.length) < rms(s, 0, tenth) * 0.2);
});

test("deterministic per seed, different across seeds", () => {
  assert.deepEqual(renderSwitch(44100, { seed: 2 }), renderSwitch(44100, { seed: 2 }));
  assert.notDeepEqual(renderSwitch(44100, { seed: 2 }), renderSwitch(44100, { seed: 4 }));
});

test("friction loop is quiet noise", () => {
  const f = renderFriction(48000, 1, 7);
  assert.equal(f.length, 48000);
  assert.ok(Math.max(...f.map(Math.abs)) <= 0.5 + 1e-6);
});
```

`components/canvas/desk/lib/keyInput.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { keyIndexFor } from "./keyInput.mjs";
import { KEY_INDEX } from "./keyboardLayout.mjs";

const body = { tagName: "BODY", isContentEditable: false };

test("maps physical keys only in desk mode", () => {
  assert.equal(keyIndexFor({ code: "KeyA", target: body }, "desk"), KEY_INDEX.get("KeyA"));
  assert.equal(keyIndexFor({ code: "KeyA", target: body }, "hero"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: body }, "diary"), -1);
});

test("ignores repeats, unknown keys and editable targets", () => {
  assert.equal(keyIndexFor({ code: "KeyA", repeat: true, target: body }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "F13", target: body }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: { tagName: "INPUT" } }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: { tagName: "DIV", isContentEditable: true } }, "desk"), -1);
  assert.equal(keyIndexFor({ code: "KeyA", target: null }, "desk"), KEY_INDEX.get("KeyA"));
});
```

Run: `npm test` → FAIL (modules missing).

- [ ] **Step 2: Implement `switchSound.mjs`**

```js
// Deterministic mechanical-switch synthesis: a sharp noise transient (stem
// click), a short resonant "thock" from the case, and a low-passed bottom-out.
const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
};

function normalize(out, peak) {
  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] *= peak / max;
  return out;
}

export function renderSwitch(sampleRate, { seed = 1, deep = false, up = false } = {}) {
  const n = Math.round(sampleRate * (up ? 0.045 : 0.07));
  const out = new Float32Array(n);
  const rand = rng(seed);
  const body = (deep ? 170 : up ? 880 : 410) * (1 + rand() * 0.03);
  const bodyDecay = deep ? 55 : 85;
  let lowpassed = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const click = rand() * Math.exp(-t * 900) * (up ? 0.35 : 1);
    lowpassed += 0.3 * (rand() - lowpassed);
    const thock = Math.sin(2 * Math.PI * body * t) * Math.exp(-t * bodyDecay) * (up ? 0.2 : 0.6);
    const bottom = !up && t > 0.006 ? lowpassed * Math.exp(-(t - 0.006) * 160) * 0.5 : 0;
    out[i] = click * 0.8 + thock + bottom;
  }
  return normalize(out, 0.9);
}

export function renderFriction(sampleRate, seconds = 1, seed = 7) {
  const n = Math.round(sampleRate * seconds);
  const out = new Float32Array(n);
  const rand = rng(seed);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    brown = (brown + rand() * 0.02) * 0.995;
    out[i] = brown;
  }
  // Crossfade the ends so the loop has no click.
  const fade = Math.round(sampleRate * 0.02);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] *= g;
    out[n - 1 - i] *= g;
  }
  return normalize(out, 0.5);
}
```

- [ ] **Step 3: Implement `keyInput.mjs`**

```js
import { KEY_INDEX } from "./keyboardLayout.mjs";

const EDITABLE = new Set(["INPUT", "TEXTAREA", "SELECT"]);

// Physical typing mirrors onto the 3D keyboard only in desk mode, and never
// while the visitor is typing into a real field.
export function keyIndexFor({ code, repeat, target }, mode) {
  if (mode !== "desk" || repeat) return -1;
  if (target && (EDITABLE.has(target.tagName) || target.isContentEditable)) return -1;
  return KEY_INDEX.has(code) ? KEY_INDEX.get(code) : -1;
}
```

Run: `npm test` → PASS.

- [ ] **Step 4: Create `interactions/deskAudio.js`**

```js
import { renderFriction, renderSwitch } from "../lib/switchSound.mjs";

let ctx = null;
let master = null;
let buffers = null;
let friction = null;

// Created on the first key press/drag (a user gesture), so autoplay rules pass.
function ready() {
  try {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      ctx = new AudioContext();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      const sr = ctx.sampleRate;
      const make = (data) => {
        const buffer = ctx.createBuffer(1, data.length, sr);
        buffer.copyToChannel(data, 0);
        return buffer;
      };
      buffers = {
        down: [1, 2, 3, 4, 5].map((seed) => make(renderSwitch(sr, { seed }))),
        up: [11, 12].map((seed) => make(renderSwitch(sr, { seed, up: true }))),
        deep: make(renderSwitch(sr, { seed: 21, deep: true })),
        friction: make(renderFriction(sr, 1, 7)),
      };
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return Boolean(buffers);
  } catch {
    ctx = null;
    buffers = null;
    return false;
  }
}

function play(buffer, { gain = 1, rate = 1, delay = 0 } = {}) {
  try {
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const level = ctx.createGain();
    level.gain.value = gain;
    source.connect(level).connect(master);
    source.start(ctx.currentTime + delay);
  } catch {
    // Audio is decoration; never let it break interaction.
  }
}

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const jitter = () => 1 + (Math.random() * 0.08 - 0.04);

export const deskAudio = {
  key({ deep = false } = {}) {
    if (!ready()) return;
    play(deep ? buffers.deep : pick(buffers.down), { rate: jitter() });
    play(pick(buffers.up), { gain: 0.45, rate: jitter(), delay: 0.09 });
  },
  friction(level) {
    if (!ready()) return;
    try {
      if (!friction) {
        const source = ctx.createBufferSource();
        source.buffer = buffers.friction;
        source.loop = true;
        const gain = ctx.createGain();
        gain.gain.value = 0;
        source.connect(gain).connect(master);
        source.start();
        friction = { source, gain };
      }
      friction.gain.gain.setTargetAtTime(Math.min(1, level) * 0.18, ctx.currentTime, 0.03);
    } catch {
      friction = null;
    }
  },
  stopFriction() {
    if (!friction) return;
    const { source, gain } = friction;
    friction = null;
    try {
      gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
      source.stop(ctx.currentTime + 0.25);
    } catch {
      // already stopped
    }
  },
};
```

- [ ] **Step 5: Create `interactions/useHoverLift.js`**

```js
import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { springStep } from "../lib/deskMath.mjs";

const WARM = [0.96, 0.47, 0.2];

export function useHoverLift(object, { lift = 0.03, enabled = true, cursor = "grab" } = {}) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const hovered = useRef(false);
  const state = useRef({ spring: { value: 0, velocity: 0 }, baseY: 0, materials: [] });

  useEffect(() => {
    if (!object) return;
    const materials = [];
    // GLTFLoader shares one material per glTF material across nodes; clone so
    // tinting this object never tints the static desk parts.
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.material = child.material.clone();
      materials.push(child.material);
    });
    state.current.materials = materials;
    state.current.baseY = object.position.y;
  }, [object]);

  useFrame((_, delta) => {
    if (!object) return;
    const s = state.current;
    const target = hovered.current && enabled ? 1 : 0;
    s.spring = springStep(s.spring, target, delta, { stiffness: 220, damping: 2 * Math.sqrt(220) });
    if (lift) object.position.y = s.baseY + s.spring.value * lift;
    for (const material of s.materials)
      material.emissive?.setRGB(...WARM).multiplyScalar(0.18 * s.spring.value);
    if (Math.abs(s.spring.value - target) > 1e-3) invalidate();
  });

  useEffect(() => {
    if (!enabled) hovered.current = false;
    invalidate();
  }, [enabled, invalidate]);

  return {
    hovered,
    onPointerOver: (event) => {
      if (!enabled) return;
      event.stopPropagation();
      hovered.current = true;
      gl.domElement.style.cursor = cursor;
      invalidate();
    },
    onPointerOut: () => {
      hovered.current = false;
      gl.domElement.style.cursor = "";
      invalidate();
    },
  };
}
```

- [ ] **Step 6: Create `interactions/HitProxy.jsx`**

```jsx
import { useMemo } from "react";
import { createPortal } from "@react-three/fiber";
import { Box3, Vector3 } from "three";

// Pointer target for a GLTF node: an invisible box (three raycasts invisible
// meshes; nothing is drawn) sized to the node's own merged meshes.
export default function HitProxy({ node, padding = 0.04, ...handlers }) {
  const { center, size } = useMemo(() => {
    const box = new Box3();
    for (const child of node.children) {
      if (!child.isMesh) continue;
      child.geometry.computeBoundingBox();
      box.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrix));
    }
    return {
      center: box.getCenter(new Vector3()),
      size: box.getSize(new Vector3()).addScalar(padding * 2),
    };
  }, [node, padding]);

  return createPortal(
    <mesh position={center} visible={false} {...handlers}>
      <boxGeometry args={size.toArray()} />
    </mesh>,
    node,
  );
}
```

- [ ] **Step 7: Keycaps pointer hook**

In `Keycaps.jsx`:
- Extend the api: `export const keycapsApi = { press: () => {}, onKey: null };`
- Add at the top of the component: `const gl = useThree((s) => s.gl);`
- Add to the caps `<instancedMesh>`:

```jsx
onPointerDown={(event) => {
  if (keycapsApi.onKey?.(event.instanceId)) event.stopPropagation();
}}
onPointerOver={() => {
  if (keycapsApi.onKey) gl.domElement.style.cursor = "pointer";
}}
onPointerOut={() => {
  gl.domElement.style.cursor = "";
}}
```

- [ ] **Step 8: Create `interactions/KeyboardInput.jsx`**

```jsx
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
```

- [ ] **Step 9: Create `interactions/index.jsx`**

```jsx
import KeyboardInput from "./KeyboardInput";

// Loaded on first desk hover/entry so the hero's first paint stays light.
export default function DeskInteractions() {
  return <KeyboardInput />;
}
```

(Tasks 5–7 add `DeskMouse`, `MicBoom` and `Diary3D` here and start using the `{nodes, isMobile}` props.)

- [ ] **Step 10: Lazy-load from `DeskCanvas.jsx` and prefetch on hover**

In `DeskCanvas.jsx`:

```jsx
import { Suspense, lazy, useEffect, useState } from "react";
// …
const DeskInteractions = lazy(() => import("./interactions"));
const prefetchInteractions = () => import("./interactions");
```

Inside the component:

```jsx
const [interactive, setInteractive] = useState(false);
useEffect(() => {
  if (mode !== "hero") setInteractive(true);
}, [mode]);
```

Replace `<DeskModel …>{() => null}</DeskModel>` with:

```jsx
<DeskModel isMobile={isMobile} active={active} onHoverDesk={prefetchInteractions}>
  {(nodes) =>
    interactive && (
      <Suspense fallback={null}>
        <DeskInteractions nodes={nodes} isMobile={isMobile} />
      </Suspense>
    )
  }
</DeskModel>
```

In `DeskModel.jsx`, accept `onHoverDesk` and call it in the hit plane's `onPointerOver` (`onHoverDesk?.()`; repeat calls are free because the module promise is cached).

- [ ] **Step 11: Verify**

```bash
npm test && npm run lint && npm run build
```

Browser: hero → hover desk (Network shows the interactions chunk loading) → click desk → click keys: each key dips and returns with a click; space/enter thock deeper. Type on the real keyboard: matching keys dip. Press keys while in hero mode: nothing. Esc still exits. In DevTools, block `AudioContext` (Console: `window.AudioContext = undefined; window.webkitAudioContext = undefined` before entering desk) → keys still animate, no errors.

- [ ] **Step 12: Commit**

```bash
git add components/canvas/desk
git commit -m "feat(desk): playable keyboard with synthesized switch sounds

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 5: Draggable mouse (shared drag hook)

**Files:**
- Create: `components/canvas/desk/lib/drag.mjs`, `lib/drag.test.mjs`
- Create: `components/canvas/desk/interactions/useDeskDrag.js`, `interactions/DeskMouse.jsx`
- Modify: `components/canvas/desk/interactions/index.jsx`

**Interfaces:**
- Consumes: `clampToRect`, `springStep`, `clamp` (Task 1); `useHoverLift`, `HitProxy`, `deskAudio` (Task 4); `useDesk` (Task 2).
- Produces:
  - `createDrag() → {begin(pointerId) → boolean, end(pointerId?) → boolean, owns(pointerId) → boolean, readonly active: boolean}`; `end()` with no id ends any drag; calling `end` twice returns `false` the second time.
  - `tiltTarget(vx, vz, max = 0.1) → {x, z}` radians.
  - `useDeskDrag({enabled, onStart?, onMove(ray: Ray), onEnd?}) → {onPointerDown, drag}` — captures the pointer on the canvas so drags continue outside it; ends on pointerup/cancel/lostpointercapture/window blur/disable/unmount.

- [ ] **Step 1: Failing tests** — `components/canvas/desk/lib/drag.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createDrag, tiltTarget } from "./drag.mjs";

test("one pointer at a time", () => {
  const d = createDrag();
  assert.equal(d.begin(1), true);
  assert.equal(d.begin(2), false);
  assert.equal(d.owns(1), true);
  assert.equal(d.owns(2), false);
});

test("end is idempotent and ignores foreign pointers", () => {
  const d = createDrag();
  d.begin(7);
  assert.equal(d.end(8), false);
  assert.equal(d.active, true);
  assert.equal(d.end(7), true);
  assert.equal(d.end(7), false);
  assert.equal(d.active, false);
});

test("end() without id ends any drag (window blur)", () => {
  const d = createDrag();
  d.begin(3);
  assert.equal(d.end(), true);
  assert.equal(d.active, false);
});

test("tilt follows velocity and clamps", () => {
  assert.deepEqual(tiltTarget(0, 0), { x: 0, z: 0 });
  const t = tiltTarget(100, -100);
  assert.equal(t.z, -0.1);
  assert.equal(t.x, -0.1);
});
```

Run: `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement `lib/drag.mjs`**

```js
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
```

Run: `npm test` → PASS.

- [ ] **Step 3: Create `interactions/useDeskDrag.js`**

```js
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Raycaster, Vector2 } from "three";
import { createDrag } from "../lib/drag.mjs";

export function useDeskDrag({ enabled, onStart, onMove, onEnd }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const raycaster = useMemo(() => new Raycaster(), []);
  const drag = useMemo(createDrag, []);
  const callbacks = useRef({ onStart, onMove, onEnd });
  callbacks.current = { onStart, onMove, onEnd };
  const cleanup = useRef(null);

  const end = useCallback(
    (pointerId) => {
      if (!drag.end(pointerId)) return;
      cleanup.current?.();
      cleanup.current = null;
      gl.domElement.style.cursor = "";
      callbacks.current.onEnd?.();
    },
    [drag, gl],
  );

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled) return;
      event.stopPropagation();
      if (!drag.begin(event.pointerId)) return;
      const element = gl.domElement;
      const pointerId = event.pointerId;
      const ndc = new Vector2();
      const move = (e) => {
        if (!drag.owns(e.pointerId)) return;
        const rect = element.getBoundingClientRect();
        ndc.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(ndc, camera);
        callbacks.current.onMove(raycaster.ray);
      };
      const up = (e) => end(e.pointerId);
      const blur = () => end();
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", up);
      element.addEventListener("pointercancel", up);
      element.addEventListener("lostpointercapture", up);
      window.addEventListener("blur", blur);
      try {
        element.setPointerCapture(pointerId);
      } catch {
        // Synthetic pointers cannot be captured; window listeners still end the drag.
      }
      cleanup.current = () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", up);
        element.removeEventListener("pointercancel", up);
        element.removeEventListener("lostpointercapture", up);
        window.removeEventListener("blur", blur);
        try {
          element.releasePointerCapture(pointerId);
        } catch {
          // already released
        }
      };
      element.style.cursor = "grabbing";
      callbacks.current.onStart?.();
      callbacks.current.onMove(event.ray);
    },
    [enabled, drag, gl, camera, raycaster, end],
  );

  useEffect(() => {
    if (!enabled) end();
  }, [enabled, end]);
  useEffect(() => () => end(), [end]);

  return { onPointerDown, drag };
}
```

- [ ] **Step 4: Create `interactions/DeskMouse.jsx`**

```jsx
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { useDesk } from "../useDesk";
import { clampToRect, springStep } from "../lib/deskMath.mjs";
import { tiltTarget } from "../lib/drag.mjs";
import { useHoverLift } from "./useHoverLift";
import { useDeskDrag } from "./useDeskDrag";
import HitProxy from "./HitProxy";
import { deskAudio } from "./deskAudio";

const BOUNDS = { minX: -2.25, maxX: 2.65, minZ: -0.15, maxZ: 1.38 };
const FOLLOW = { stiffness: 300, damping: 2 * Math.sqrt(300) };
const WOBBLE = { stiffness: 180, damping: 9 };

export default function DeskMouse({ node }) {
  const enabled = useDesk((s) => s.mode === "desk");
  const invalidate = useThree((s) => s.invalidate);
  const hover = useHoverLift(node, { enabled, cursor: "grab" });
  const hit = useMemo(() => new Vector3(), []);
  const plane = useMemo(() => {
    const world = node.getWorldPosition(new Vector3());
    return new Plane(new Vector3(0, 1, 0), -world.y);
  }, [node]);
  const sim = useRef({
    x: { value: node.position.x, velocity: 0 },
    z: { value: node.position.z, velocity: 0 },
    tx: { value: 0, velocity: 0 },
    tz: { value: 0, velocity: 0 },
    target: { x: node.position.x, z: node.position.z },
    base: node.rotation.clone(),
    dragging: false,
  });

  const { onPointerDown } = useDeskDrag({
    enabled,
    onStart: () => {
      sim.current.dragging = true;
    },
    onMove: (ray) => {
      if (!ray.intersectPlane(plane, hit)) return;
      const local = node.parent.worldToLocal(hit.clone());
      sim.current.target = clampToRect({ x: local.x, z: local.z }, BOUNDS);
      invalidate();
    },
    onEnd: () => {
      sim.current.dragging = false;
      deskAudio.stopFriction();
      invalidate();
    },
  });

  useFrame((_, delta) => {
    const s = sim.current;
    s.x = springStep(s.x, s.target.x, delta, FOLLOW);
    s.z = springStep(s.z, s.target.z, delta, FOLLOW);
    const tilt = s.dragging ? tiltTarget(s.x.velocity, s.z.velocity) : { x: 0, z: 0 };
    s.tx = springStep(s.tx, tilt.x, delta, WOBBLE);
    s.tz = springStep(s.tz, tilt.z, delta, WOBBLE);
    node.position.x = s.x.value;
    node.position.z = s.z.value;
    node.rotation.x = s.base.x + s.tx.value;
    node.rotation.z = s.base.z + s.tz.value;
    const speed = Math.hypot(s.x.velocity, s.z.velocity);
    if (s.dragging) deskAudio.friction(speed / 3);
    const settling =
      speed > 1e-3 ||
      Math.abs(s.tx.value) + Math.abs(s.tz.value) > 1e-4 ||
      Math.abs(s.x.value - s.target.x) + Math.abs(s.z.value - s.target.z) > 1e-4;
    if (settling) invalidate();
  });

  return <HitProxy node={node} {...hover} hovered={undefined} onPointerDown={onPointerDown} />;
}
```

(`hovered={undefined}` stops the ref object being forwarded to the mesh as a prop.)

- [ ] **Step 5: Mount it**

`interactions/index.jsx`:

```jsx
import KeyboardInput from "./KeyboardInput";
import DeskMouse from "./DeskMouse";

// Loaded on first desk hover/entry so the hero's first paint stays light.
export default function DeskInteractions({ nodes }) {
  return (
    <>
      <KeyboardInput />
      {nodes.Interactive_Mouse && <DeskMouse node={nodes.Interactive_Mouse} />}
    </>
  );
}
```

- [ ] **Step 6: Verify**

```bash
npm test && npm run lint && npm run build
```

Browser, desk mode: hover the mouse → lifts and warms, cursor `grab`; drag → follows smoothly, tilts in the direction of travel, quiet slide sound tracks speed; release → wobble settles; drag past the desk edge → stops at the bounds. Drag and release **outside the browser window** → mouse settles, sound stops. Start a drag then press Esc → drag ends, camera returns. In hero mode the mouse does not react.

- [ ] **Step 7: Commit**

```bash
git add components/canvas/desk
git commit -m "feat(desk): drag the mouse across the desk

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Microphone boom with 2-bone IK

**Files:**
- Create: `components/canvas/desk/lib/micIk.mjs`, `lib/micIk.test.mjs`, `components/canvas/desk/interactions/MicBoom.jsx`
- Modify: `components/canvas/desk/interactions/index.jsx`

**Interfaces:**
- Consumes: mic node hierarchy and rest geometry (Task 3); `useDeskDrag`, `useHoverLift`, `HitProxy` (Tasks 4–5); `springStep`, `clamp` (Task 1).
- Produces:
  - `MIC_ARM = {lower, upper, restLower, restUpper, restReach, restHeight, minYaw, maxYaw, minReach}`.
  - `solveMicArm({x, z, height?}, arm?) → {yaw, lower, upper, head, reach, clamped}` — `x,z` in `Interactive_Mic_Base` parent space relative to the base origin; returned joint values are **deltas from the rest pose** (radians, positive = lean forward).
  - `micTip({yaw, lower, upper}, arm?) → {x, z, height}` (forward kinematics, for tests).
  - Node mapping: `base.rotation.y = yaw`; `lower.rotation.x = -lower`; `upper.rotation.x = -upper`; `head.rotation.x = -head`.

- [ ] **Step 1: Failing tests** — `components/canvas/desk/lib/micIk.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { MIC_ARM, micTip, solveMicArm } from "./micIk.mjs";

const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("rest target solves to the rest pose", () => {
  const s = solveMicArm({ x: 0, z: -MIC_ARM.restReach, height: MIC_ARM.restHeight });
  for (const k of ["yaw", "lower", "upper", "head"]) close(s[k], 0);
  assert.equal(s.clamped, false);
});

test("reachable targets round-trip through forward kinematics", () => {
  for (const target of [
    { x: -0.3, z: -0.9, height: 1.8 },
    { x: -0.6, z: -0.4, height: 1.95 },
    { x: 0.1, z: -1.2, height: 1.6 },
  ]) {
    const s = solveMicArm(target);
    assert.equal(s.clamped, false);
    const tip = micTip(s);
    close(tip.x, target.x);
    close(tip.z, target.z);
    close(tip.height, target.height);
  }
});

test("head stays level: head delta cancels the upper bone's absolute change", () => {
  const s = solveMicArm({ x: -0.3, z: -0.9, height: 1.8 });
  close(s.head, -(s.lower + s.upper));
});

test("out-of-reach targets clamp to the arm length", () => {
  const s = solveMicArm({ x: 0, z: -5, height: 2.05 });
  assert.equal(s.clamped, true);
  assert.ok(Math.hypot(s.reach, 2.05) <= MIC_ARM.lower + MIC_ARM.upper);
  assert.ok([s.lower, s.upper].every(Number.isFinite));
});

test("yaw is clamped so the arm never swings into the monitors or off the desk", () => {
  assert.equal(solveMicArm({ x: 2, z: 0.1 }).yaw, MIC_ARM.minYaw);
  assert.equal(solveMicArm({ x: -3, z: 0.5 }).yaw, MIC_ARM.maxYaw);
});

test("targets at the base fold to the minimum reach", () => {
  const s = solveMicArm({ x: 0, z: 0 });
  assert.equal(s.reach, MIC_ARM.minReach);
  assert.equal(s.clamped, true);
});
```

Run: `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement `lib/micIk.mjs`**

```js
import { clamp } from "./deskMath.mjs";

// Planar rest geometry from scripts/model/build-desk.mjs, measured as
// (forward = -z, up = +y). The tip's small x offset rotates with the yaw.
const ELBOW = { d: 0.15, h: 1.09 };
const TIP_FROM_ELBOW = { d: 0.48, h: 0.96 };

export const MIC_ARM = Object.freeze({
  lower: Math.hypot(ELBOW.d, ELBOW.h),
  upper: Math.hypot(TIP_FROM_ELBOW.d, TIP_FROM_ELBOW.h),
  restLower: Math.atan2(ELBOW.d, ELBOW.h),
  restUpper: Math.atan2(TIP_FROM_ELBOW.d, TIP_FROM_ELBOW.h),
  restReach: ELBOW.d + TIP_FROM_ELBOW.d,
  restHeight: ELBOW.h + TIP_FROM_ELBOW.h,
  minYaw: -0.5,
  maxYaw: 1.1,
  minReach: 0.25,
});

export function solveMicArm({ x, z, height = MIC_ARM.restHeight }, arm = MIC_ARM) {
  let clamped = false;
  let yaw = Math.atan2(-x, -z);
  if (yaw < arm.minYaw || yaw > arm.maxYaw) {
    yaw = clamp(yaw, arm.minYaw, arm.maxYaw);
    clamped = true;
  }
  // Forward distance along the (possibly clamped) yaw direction.
  let reach = -x * Math.sin(yaw) - z * Math.cos(yaw);
  if (reach < arm.minReach) {
    reach = arm.minReach;
    clamped = true;
  }
  const maxDist = arm.lower + arm.upper - 1e-4;
  if (Math.hypot(reach, height) > maxDist) {
    reach = Math.max(arm.minReach, Math.sqrt(Math.max(0, maxDist * maxDist - height * height)));
    clamped = true;
  }
  const dist = Math.min(Math.hypot(reach, height), maxDist);
  const toTarget = Math.atan2(reach, height);
  const shoulder = Math.acos(
    clamp((arm.lower ** 2 + dist ** 2 - arm.upper ** 2) / (2 * arm.lower * dist), -1, 1),
  );
  const lowerAbs = toTarget - shoulder;
  const elbowD = arm.lower * Math.sin(lowerAbs);
  const elbowH = arm.lower * Math.cos(lowerAbs);
  const upperAbs = Math.atan2(reach - elbowD, height - elbowH);
  const lower = lowerAbs - arm.restLower;
  const upperTotal = upperAbs - arm.restUpper;
  return { yaw, lower, upper: upperTotal - lower, head: -upperTotal, reach, clamped };
}

export function micTip({ yaw, lower, upper }, arm = MIC_ARM) {
  const lowerAbs = arm.restLower + lower;
  const upperAbs = arm.restUpper + lower + upper;
  const d = arm.lower * Math.sin(lowerAbs) + arm.upper * Math.sin(upperAbs);
  const height = arm.lower * Math.cos(lowerAbs) + arm.upper * Math.cos(upperAbs);
  return { x: -d * Math.sin(yaw), z: -d * Math.cos(yaw), height };
}
```

Run: `npm test` → PASS.

- [ ] **Step 3: Create `interactions/MicBoom.jsx`**

```jsx
import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { useDesk } from "../useDesk";
import { springStep } from "../lib/deskMath.mjs";
import { solveMicArm } from "../lib/micIk.mjs";
import { useHoverLift } from "./useHoverLift";
import { useDeskDrag } from "./useDeskDrag";
import HitProxy from "./HitProxy";

// Slightly under-damped so the arm lags the hand and bounces when let go.
const SPRING = { stiffness: 140, damping: 12 };
const JOINTS = ["yaw", "lower", "upper", "head"];

export default function MicBoom({ nodes }) {
  const base = nodes.Interactive_Mic_Base;
  const lower = nodes.Interactive_Mic_Lower;
  const upper = nodes.Interactive_Mic_Upper;
  const head = nodes.Interactive_Mic_Head;
  const enabled = useDesk((s) => s.mode === "desk");
  const invalidate = useThree((s) => s.invalidate);
  const hover = useHoverLift(head, { lift: 0, enabled, cursor: "grab" });
  const hit = useMemo(() => new Vector3(), []);
  const plane = useMemo(() => {
    const world = head.getWorldPosition(new Vector3());
    return new Plane(new Vector3(0, 1, 0), -world.y);
  }, [head]);
  const sim = useRef({
    joints: Object.fromEntries(JOINTS.map((k) => [k, { value: 0, velocity: 0 }])),
    target: { yaw: 0, lower: 0, upper: 0, head: 0 },
  });

  const { onPointerDown } = useDeskDrag({
    enabled,
    onMove: (ray) => {
      if (!ray.intersectPlane(plane, hit)) return;
      const local = base.parent.worldToLocal(hit.clone()).sub(base.position);
      sim.current.target = solveMicArm({ x: local.x, z: local.z });
      invalidate();
    },
  });

  useFrame((_, delta) => {
    const s = sim.current;
    let moving = false;
    for (const k of JOINTS) {
      s.joints[k] = springStep(s.joints[k], s.target[k], delta, SPRING);
      if (Math.abs(s.joints[k].velocity) > 1e-4 || Math.abs(s.joints[k].value - s.target[k]) > 1e-4)
        moving = true;
    }
    base.rotation.y = s.joints.yaw.value;
    lower.rotation.x = -s.joints.lower.value;
    upper.rotation.x = -s.joints.upper.value;
    head.rotation.x = -s.joints.head.value;
    if (moving) invalidate();
  });

  return <HitProxy node={head} padding={0.08} {...hover} hovered={undefined} onPointerDown={onPointerDown} />;
}
```

- [ ] **Step 4: Mount it** — in `interactions/index.jsx` add `import MicBoom from "./MicBoom";` and inside the fragment:

```jsx
{nodes.Interactive_Mic_Head && <MicBoom nodes={nodes} />}
```

- [ ] **Step 5: Verify**

```bash
npm test && npm run lint && npm run build
```

Browser, desk mode: hover the mic head → warm tint, `grab` cursor. Drag it around: base swivels, both arm segments bend at the shoulder and elbow, the mic and pop filter stay level and attached (no gaps at the joints), the arm lags slightly and bounces on release. Drag far right/behind → stops at the yaw limit; never passes through the monitors. Drag onto the base → the arm folds upright without flipping.

- [ ] **Step 6: Commit**

```bash
git add components/canvas/desk
git commit -m "feat(desk): swing the mic boom with two-joint IK

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 7: Diary content, page-curl math and handwritten page textures

**Files:**
- Create: `components/canvas/desk/lib/diaryPages.mjs`, `lib/diaryPages.test.mjs`, `lib/pageCurl.mjs`, `lib/pageCurl.test.mjs`
- Create: `components/canvas/desk/interactions/diaryTextures.js`

**Interfaces:**
- Produces:
  - `PAGE_SIZE = {width: 1000, height: 1500}` (page units; 2:3 like the 0.6 × 0.9 book).
  - `PAGES`: 8 pages `{heading: string, lines: string[], sketch: SketchItem[], ring?: boolean}`; spread `s` shows `PAGES[2s]` (left) and `PAGES[2s+1]` (right).
  - `SketchItem` = `{path: [x,y][]}` | `{rect: [x,y,w,h]}` | `{circle: [cx,cy,r]}` | `{arrow: [[x1,y1],[x2,y2]]}` | `{label: [x,y,text,size]}`.
  - `sketchItems(page, pageIndex) → Array<{kind:'stroke', points:[x,y][], order0, order1} | {kind:'label', x, y, text, size, order0, order1}>` — jittered, ordered 0→1 by drawing time.
  - `wrapLines(text, maxWidth, measure: (s) => number) → string[]`.
  - `spreadText(spread) → string` plain text of both pages (screen readers).
  - `PAGE = {width: 0.6, depth: 0.88, segments: 24, bend: 0.9}`; `curlPoint(x, turn, width?, bend?) → [x, y]`; `curlAngle(x, turn, width?, bend?) → radians`; `CURL_GLSL` (same math, GLSL function `vec2 curlPoint(float x, float turn, float width, float bend)` and `float curlAngle(...)`).
  - `drawPage(page, index, fontFamily) → {color: CanvasTexture, mask: CanvasTexture}`; `drawBlankPage() → same`; `loadDiaryFont(fontFamily) → Promise<void>`; `PAPER = "#efe6cf"`.

- [ ] **Step 1: Failing tests**

`components/canvas/desk/lib/pageCurl.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { CURL_GLSL, PAGE, curlPoint } from "./pageCurl.mjs";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("flat on the right at turn 0, flat on the left at turn 1", () => {
  const [x0, y0] = curlPoint(0.4, 0);
  close(x0, 0.4);
  close(y0, 0);
  const [x1, y1] = curlPoint(0.4, 1);
  close(x1, -0.4);
  close(y1, 0, 1e-9);
});

test("paper does not stretch: arc length equals x at any turn", () => {
  for (const turn of [0.2, 0.5, 0.8]) {
    let length = 0;
    let prev = curlPoint(0, turn);
    const steps = 400;
    for (let i = 1; i <= steps; i++) {
      const p = curlPoint((PAGE.width * i) / steps, turn);
      length += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    close(length, PAGE.width, 1e-4);
  }
});

test("mid-turn the free edge lags behind the spine (it curls)", () => {
  const [x, y] = curlPoint(PAGE.width, 0.5);
  assert.ok(x > 0.05 && y > 0.3);
});

test("GLSL mirrors the JS function names", () => {
  assert.match(CURL_GLSL, /vec2 curlPoint\(float x, float turn, float width, float bend\)/);
  assert.match(CURL_GLSL, /float curlAngle\(/);
});
```

`components/canvas/desk/lib/diaryPages.test.mjs`:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { PAGES, PAGE_SIZE, sketchItems, spreadText, wrapLines } from "./diaryPages.mjs";

test("four spreads, every page has a heading and a sketch inside the page", () => {
  assert.equal(PAGES.length, 8);
  PAGES.forEach((page, i) => {
    assert.ok(page.heading, `page ${i}`);
    const items = sketchItems(page, i);
    assert.ok(items.length > 0, `page ${i} sketch`);
    for (const item of items) {
      const pts = item.kind === "stroke" ? item.points : [[item.x, item.y]];
      for (const [x, y] of pts) {
        assert.ok(x >= 0 && x <= PAGE_SIZE.width && y >= 0 && y <= PAGE_SIZE.height, `page ${i} (${x},${y})`);
      }
    }
  });
});

test("sketch orders run 0 -> 1 without gaps or reversals", () => {
  PAGES.forEach((page, i) => {
    const items = sketchItems(page, i);
    assert.equal(items[0].order0, 0);
    assert.ok(Math.abs(items.at(-1).order1 - 1) < 1e-9);
    items.forEach((item, j) => {
      assert.ok(item.order1 > item.order0);
      if (j > 0) assert.ok(Math.abs(item.order0 - items[j - 1].order1) < 1e-9);
    });
  });
});

test("jitter is deterministic", () => {
  assert.deepEqual(sketchItems(PAGES[5], 5), sketchItems(PAGES[5], 5));
});

test("Life OS and Astra each get a notes page and a sketch page", () => {
  assert.match(PAGES[4].heading, /Life OS/);
  assert.match(PAGES[5].heading, /Life OS/);
  assert.match(PAGES[6].heading, /Astra/);
  assert.match(PAGES[7].heading, /Astra/);
});

test("wrapLines breaks on words within the width", () => {
  const measure = (s) => s.length * 10;
  assert.deepEqual(wrapLines("one two three four", 100, measure), ["one two", "three four"]);
  assert.deepEqual(wrapLines("", 90, measure), [""]);
  assert.deepEqual(wrapLines("supercalifragilistic", 50, measure), ["supercalifragilistic"]);
});

test("spreadText includes both pages", () => {
  const text = spreadText(2);
  assert.match(text, /Life OS/);
  assert.match(text, /Today/);
});
```

Run: `npm test` → FAIL (modules missing).

- [ ] **Step 2: Implement `lib/pageCurl.mjs`**

```js
// A page is a strip from the spine (x = 0) to its free edge (x = width).
// Turning rotates it about the spine by turn·π while bending it with constant
// curvature, so the free edge lags. Integrating the tangent keeps arc length.
export const PAGE = Object.freeze({ width: 0.6, depth: 0.88, segments: 24, bend: 0.9 });

export function curlAngle(x, turn, width = PAGE.width, bend = PAGE.bend) {
  const theta = turn * Math.PI;
  return theta - ((Math.sin(theta) * bend) / width) * x;
}

export function curlPoint(x, turn, width = PAGE.width, bend = PAGE.bend) {
  const theta = turn * Math.PI;
  const k = (Math.sin(theta) * bend) / width;
  if (Math.abs(k) < 1e-6) return [x * Math.cos(theta), x * Math.sin(theta)];
  return [
    (Math.sin(theta) - Math.sin(theta - k * x)) / k,
    (Math.cos(theta - k * x) - Math.cos(theta)) / k,
  ];
}

export const CURL_GLSL = /* glsl */ `
float curlAngle(float x, float turn, float width, float bend) {
  float theta = turn * 3.141592653589793;
  return theta - (sin(theta) * bend / width) * x;
}
vec2 curlPoint(float x, float turn, float width, float bend) {
  float theta = turn * 3.141592653589793;
  float k = sin(theta) * bend / width;
  if (abs(k) < 1e-6) return vec2(x * cos(theta), x * sin(theta));
  return vec2((sin(theta) - sin(theta - k * x)) / k, (cos(theta - k * x) - cos(theta)) / k);
}
`;
```

- [ ] **Step 3: Implement `lib/diaryPages.mjs`**

```js
// Shiv's diary. Copy is a first draft for Shiv to edit; coordinates are page
// units (1000 x 1500, origin top-left). Sketch items draw in array order.
export const PAGE_SIZE = Object.freeze({ width: 1000, height: 1500 });

const spokes = (cx, cy, r0, r1, n = 12) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { path: [[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]] };
  });
const wave = (x0, x1, y, amp, step = 20) => {
  const points = [];
  for (let x = x0; x <= x1; x += step)
    points.push([x, y + Math.sin((x - x0) / 23) * amp * Math.sin(((x - x0) / (x1 - x0)) * Math.PI)]);
  return { path: points };
};

export const PAGES = [
  {
    heading: "hi, I'm Shiv",
    lines: [
      "engineer in New York.",
      "musician between builds.",
      "photographer when the light is good.",
      "",
      "I like the moment a rough idea",
      "starts feeling useful.",
    ],
    sketch: [
      { rect: [600, 1060, 260, 170] },
      { circle: [730, 1145, 55] },
      { path: [[640, 1060], [670, 1025], [740, 1025], [760, 1060]] },
      { label: [540, 1310, "always carrying one", 52] },
    ],
  },
  {
    heading: "things I keep coming back to",
    lines: ["- small, useful tools", "- making music", "- photographing the city", "- learning by building"],
    ring: true,
    sketch: [wave(130, 870, 1120, 70), { label: [150, 1300, "music between builds", 52] }],
  },
  {
    heading: "now",
    lines: ["Founding Engineer at", "Contextual Intelligence.", "", "building the product", "end to end."],
    sketch: [
      { rect: [140, 1000, 300, 200] },
      { arrow: [[460, 1100], [590, 1100]] },
      { circle: [710, 1100, 95] },
      { label: [210, 1280, "idea", 52] },
      { label: [610, 1280, "real thing", 52] },
    ],
  },
  {
    heading: "before + how I work",
    lines: ["FuteurAI, wrapped May 12.", "", "- ship small, ship often", "- write it down", "- make it feel good to use"],
    sketch: [
      { circle: [500, 1150, 170] },
      { arrow: [[640, 1050], [668, 1092]] },
      { arrow: [[360, 1250], [332, 1208]] },
      { label: [460, 955, "idea", 48] },
      { label: [700, 1165, "sketch", 48] },
      { label: [455, 1370, "ship", 48] },
      { label: [190, 1165, "learn", 48] },
    ],
  },
  {
    heading: "Life OS",
    lines: [
      "one OS, not 12 tabs.",
      "",
      "SwiftUI + LifeOSKit + Supabase",
      "Plaid -> OAuth -> universal link",
      "   (almanac.shivvyas.com)",
      "Coach reads across everything.",
    ],
    sketch: [
      { rect: [150, 1060, 40, 40] },
      { path: [[158, 1080], [172, 1094], [198, 1048]] },
      { label: [215, 1094, "handbook before code", 48] },
      { rect: [150, 1150, 40, 40] },
      { path: [[158, 1170], [172, 1184], [198, 1138]] },
      { label: [215, 1184, "TestFlight now", 48] },
    ],
  },
  {
    heading: "Life OS - rough sketch",
    lines: [],
    sketch: [
      { rect: [330, 200, 340, 620] },
      { label: [370, 280, "Today", 56] },
      { path: [[370, 330], [630, 330]] },
      { path: [[370, 400], [560, 400]] },
      { path: [[370, 460], [600, 460]] },
      { path: [[370, 520], [520, 520]] },
      { arrow: [[500, 830], [500, 930]] },
      { circle: [180, 1010, 70] },
      { label: [125, 1020, "Money", 40] },
      { circle: [400, 1050, 70] },
      { label: [345, 1060, "Health", 40] },
      { circle: [620, 1050, 70] },
      { label: [580, 1060, "Plan", 40] },
      { circle: [830, 1010, 65] },
      { label: [785, 1020, "Notes", 40] },
      { arrow: [[220, 1075], [430, 1290]] },
      { arrow: [[410, 1120], [470, 1260]] },
      { arrow: [[610, 1120], [540, 1260]] },
      { arrow: [[790, 1070], [580, 1290]] },
      { circle: [500, 1330, 85] },
      { label: [440, 1345, "Coach", 48] },
    ],
  },
  {
    heading: "Astra",
    lines: [
      "computed, never guessed.",
      "",
      "birth date + time + place",
      "   -> a real chart",
      "Swiss Ephemeris (wasm)",
      "Claude writes the reading",
      "   from verified positions only.",
      "web + iOS, one Supabase backend.",
    ],
    ring: true,
    sketch: [
      { path: [[700, 1180], [725, 1240], [790, 1245], [740, 1285], [760, 1350], [700, 1312], [640, 1350], [660, 1285], [610, 1245], [675, 1240], [700, 1180]] },
      { label: [430, 1430, "astra.shivvyas.com", 46] },
    ],
  },
  {
    heading: "Astra - rough sketch",
    lines: [],
    sketch: [
      { circle: [320, 520, 230] },
      { circle: [320, 520, 150] },
      ...spokes(320, 520, 150, 230),
      { circle: [250, 470, 14] },
      { circle: [390, 600, 14] },
      { circle: [360, 420, 14] },
      { arrow: [[570, 520], [690, 520]] },
      { rect: [700, 430, 230, 180] },
      { label: [725, 535, "Claude", 54] },
      { arrow: [[815, 620], [815, 790]] },
      { rect: [705, 800, 220, 380] },
      { path: [[735, 870], [895, 870]] },
      { path: [[735, 930], [870, 930]] },
      { path: [[735, 990], [890, 990]] },
      { label: [720, 1240, "your reading", 44] },
      { label: [140, 860, "chart first,", 50] },
      { label: [140, 920, "words second", 50] },
      { label: [560, 1400, "- Shiv", 72] },
    ],
  },
];

const rng = (seed) => {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
};
const clampPoint = ([x, y]) => [
  Math.min(PAGE_SIZE.width, Math.max(0, x)),
  Math.min(PAGE_SIZE.height, Math.max(0, y)),
];
const polygon = (cx, cy, r, n = 40) =>
  Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cy + Math.sin((i / n) * Math.PI * 2) * r]);

function strokesOf(item) {
  if (item.path) return [item.path];
  if (item.rect) {
    const [x, y, w, h] = item.rect;
    return [[[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]]];
  }
  if (item.circle) return [polygon(...item.circle)];
  if (item.arrow) {
    const [[x1, y1], [x2, y2]] = item.arrow;
    const a = Math.atan2(y2 - y1, x2 - x1);
    const head = (da) => [x2 - Math.cos(a + da) * 28, y2 - Math.sin(a + da) * 28];
    return [[[x1, y1], [x2, y2]], [head(0.5), [x2, y2], head(-0.5)]];
  }
  return [];
}

const lengthOf = (points) =>
  points.reduce((sum, p, i) => (i ? sum + Math.hypot(p[0] - points[i - 1][0], p[1] - points[i - 1][1]) : 0), 0);

export function sketchItems(page, pageIndex) {
  const rand = rng(pageIndex + 1);
  const raw = [];
  for (const item of page.sketch) {
    if (item.label) {
      const [x, y, text, size] = item.label;
      raw.push({ kind: "label", x, y, text, size, cost: text.length * size * 0.6 });
      continue;
    }
    for (const stroke of strokesOf(item)) {
      // Hand wobble: subdivide long segments, nudge every point a little.
      const points = [];
      stroke.forEach((p, i) => {
        if (i > 0) {
          const prev = stroke[i - 1];
          const steps = Math.max(1, Math.round(Math.hypot(p[0] - prev[0], p[1] - prev[1]) / 40));
          for (let s = 1; s < steps; s++) {
            const t = s / steps;
            points.push([prev[0] + (p[0] - prev[0]) * t, prev[1] + (p[1] - prev[1]) * t]);
          }
        }
        points.push(p);
      });
      const jittered = points.map(([x, y]) => clampPoint([x + rand() * 3, y + rand() * 3]));
      raw.push({ kind: "stroke", points: jittered, cost: Math.max(1, lengthOf(jittered)) });
    }
  }
  const total = raw.reduce((sum, item) => sum + item.cost, 0);
  let at = 0;
  return raw.map(({ cost, ...item }, i) => {
    const order0 = at / total;
    at += cost;
    return { ...item, order0, order1: i === raw.length - 1 ? 1 : at / total };
  });
}

export function wrapLines(text, maxWidth, measure) {
  if (!text) return [""];
  const out = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && measure(next) > maxWidth) {
      out.push(line);
      line = word;
    } else line = next;
  }
  out.push(line);
  return out;
}

const pageText = (page) =>
  [page.heading, ...page.lines, ...page.sketch.filter((i) => i.label).map((i) => i.label[2])]
    .filter(Boolean)
    .join(". ");

export const spreadText = (spread) => `${pageText(PAGES[spread * 2])}. ${pageText(PAGES[spread * 2 + 1])}`;
```

Run: `npm test` → PASS. If a bounds test fails, the failing message names the page and point — move that item inside the page (do not widen the bounds).

- [ ] **Step 4: Create `interactions/diaryTextures.js`** (browser-only; verified visually in Task 8)

```js
import { CanvasTexture, SRGBColorSpace } from "three";
import { PAGE_SIZE, sketchItems, wrapLines } from "../lib/diaryPages.mjs";

export const PAPER = "#efe6cf";
const INK = "#1f2c4c";
const WIDTH = 1366;
const HEIGHT = 2048;
const SCALE = WIDTH / PAGE_SIZE.width;
const MASK_SCALE = 0.5;

export async function loadDiaryFont(fontFamily) {
  try {
    await Promise.all([
      document.fonts.load(`400 60px ${fontFamily}`),
      document.fonts.load(`700 92px ${fontFamily}`),
    ]);
  } catch {
    // Falls back to the next family in the stack.
  }
}

function canvas(scale) {
  const element = document.createElement("canvas");
  element.width = Math.round(WIDTH * scale);
  element.height = Math.round(HEIGHT * scale);
  const g = element.getContext("2d");
  g.scale(SCALE * scale, SCALE * scale);
  return { element, g };
}

function paper(g, seed) {
  g.fillStyle = PAPER;
  g.fillRect(0, 0, PAGE_SIZE.width, PAGE_SIZE.height);
  let s = seed * 9301 + 49297;
  const rand = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  g.fillStyle = "rgba(90, 70, 40, 0.05)";
  for (let i = 0; i < 3500; i++) g.fillRect(rand() * PAGE_SIZE.width, rand() * PAGE_SIZE.height, 1.2, 1.2);
  g.strokeStyle = "rgba(70, 100, 150, 0.16)";
  g.lineWidth = 1.5;
  for (let y = 210; y < PAGE_SIZE.height - 60; y += 60) {
    g.beginPath();
    g.moveTo(40, y);
    g.lineTo(PAGE_SIZE.width - 40, y);
    g.stroke();
  }
}

function texture(element, srgb) {
  const result = new CanvasTexture(element);
  if (srgb) result.colorSpace = SRGBColorSpace;
  result.anisotropy = 4;
  return result;
}

export function drawBlankPage(seed = 99) {
  const color = canvas(1);
  paper(color.g, seed);
  const mask = canvas(MASK_SCALE);
  return { color: texture(color.element, true), mask: texture(mask.element, false) };
}

export function drawPage(page, index, fontFamily) {
  const { element, g } = canvas(1);
  paper(g, index + 1);
  g.fillStyle = INK;
  g.strokeStyle = INK;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.textBaseline = "alphabetic";

  g.font = `700 92px ${fontFamily}`;
  g.fillText(page.heading, 80, 150);
  g.font = `400 60px ${fontFamily}`;
  let y = 260;
  for (const line of page.lines)
    for (const wrapped of wrapLines(line, 840, (t) => g.measureText(t).width)) {
      g.fillText(wrapped, 90, y);
      y += 60;
    }

  if (page.ring) {
    g.strokeStyle = "rgba(120, 80, 40, 0.14)";
    g.lineWidth = 9;
    g.beginPath();
    g.arc(820, 230, 95, 0.3, Math.PI * 2 - 0.2);
    g.stroke();
    g.strokeStyle = INK;
  }

  const items = sketchItems(page, index);
  const mask = canvas(MASK_SCALE);
  const m = mask.g;
  m.lineCap = "round";
  m.lineJoin = "round";
  for (const item of items) {
    if (item.kind === "label") {
      g.font = `400 ${item.size}px ${fontFamily}`;
      g.fillText(item.text, item.x, item.y);
      m.font = `700 ${item.size}px ${fontFamily}`;
      m.fillStyle = `rgb(${Math.round(item.order1 * 255)}, 0, 0)`;
      m.strokeStyle = m.fillStyle;
      m.lineWidth = 6;
      m.strokeText(item.text, item.x, item.y);
      m.fillText(item.text, item.x, item.y);
      continue;
    }
    g.lineWidth = 4.5;
    g.beginPath();
    item.points.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py)));
    g.stroke();
    // Mask: each segment carries the moment it is drawn, so the shader can
    // reveal strokes in order without re-uploading textures every frame.
    m.lineWidth = 16;
    const n = item.points.length - 1;
    for (let i = 0; i < n; i++) {
      const order = item.order0 + ((item.order1 - item.order0) * (i + 1)) / n;
      m.strokeStyle = `rgb(${Math.round(order * 255)}, 0, 0)`;
      m.beginPath();
      m.moveTo(...item.points[i]);
      m.lineTo(...item.points[i + 1]);
      m.stroke();
    }
  }

  g.font = `400 40px ${fontFamily}`;
  g.fillStyle = "rgba(31, 44, 76, 0.55)";
  g.textAlign = "center";
  g.fillText(String(index + 1), PAGE_SIZE.width / 2, PAGE_SIZE.height - 50);

  return { color: texture(element, true), mask: texture(mask.element, false) };
}
```

- [ ] **Step 5: Verify and commit**

```bash
npm test && npm run lint
git add components/canvas/desk
git commit -m "feat(desk): diary copy, sketches, page-curl math and page textures

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: all tests PASS, lint clean.

---
### Task 8: The 3D diary — cover, curling pages, ink-in, navigation and accessible mirror

**Files:**
- Create: `components/canvas/desk/interactions/Diary3D.jsx`, `interactions/leafMaterial.js`
- Modify: `components/canvas/desk/interactions/index.jsx`, `components/canvas/desk/DeskModel.jsx`, `components/HomePage/HeroSection/index.tsx`

**Interfaces:**
- Consumes: `PAGES`, `spreadText` (Task 7), `PAGE`, `CURL_GLSL` (Task 7), `drawPage`, `drawBlankPage`, `loadDiaryFont`, `PAPER` (Task 7), `useHoverLift`, `HitProxy` (Task 4), store actions `openDiary`, `closeDiary`, `nextPage`, `prevPage` (Task 1), `getPose('diary', …)` (Task 2, uses `Interactive_Diary`).
- Produces: `makeLeafMaterial(front: {color, mask}, back: {color, mask}) → MeshStandardMaterial` with `material.userData.uniforms = {uTurn, uLift, uWidth, uBend, uFront, uBack, uMaskFront, uMaskBack, uInkFront, uInkBack, uPaper}`.

Leaf layout (diary-local, spine at `x = -0.3`, `y = 0.086`):

| Leaf | Front (right side) | Back (left side) | Turn |
|---|---|---|---|
| S | blank | `PAGES[0]` | always 1 |
| L0 | `PAGES[1]` | `PAGES[2]` | 1 when spread > 0 |
| L1 | `PAGES[3]` | `PAGES[4]` | 1 when spread > 1 |
| L2 | `PAGES[5]` | `PAGES[6]` | 1 when spread > 2 |
| R | `PAGES[7]` | blank | always 0 |

Stack lift for leaf `Lj`: right side `(3 - j) · 0.0025`, left side `(j + 1) · 0.0025`, interpolated by turn (S and R: 0), so the most recently turned page is always on top.

- [ ] **Step 1: Create `interactions/leafMaterial.js`**

```js
import { Color, DoubleSide, MeshStandardMaterial } from "three";
import { CURL_GLSL, PAGE } from "../lib/pageCurl.mjs";
import { PAPER } from "./diaryTextures";

// One double-sided leaf: the vertex shader curls it about the spine (same
// math as pageCurl.mjs), the fragment shader picks the front/back page and
// hides sketch strokes whose draw order is later than the ink level.
export function makeLeafMaterial(front, back) {
  const material = new MeshStandardMaterial({ roughness: 0.92, side: DoubleSide });
  material.defines = { USE_UV: "" };
  const uniforms = {
    uTurn: { value: 0 },
    uLift: { value: 0 },
    uWidth: { value: PAGE.width },
    uBend: { value: PAGE.bend },
    uFront: { value: front.color },
    uBack: { value: back.color },
    uMaskFront: { value: front.mask },
    uMaskBack: { value: back.mask },
    uInkFront: { value: 0 },
    uInkBack: { value: 0 },
    uPaper: { value: new Color(PAPER) },
  };
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTurn;
uniform float uLift;
uniform float uWidth;
uniform float uBend;
${CURL_GLSL}`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float pageAngle = curlAngle(position.x, uTurn, uWidth, uBend);
vec3 objectNormal = vec3(-sin(pageAngle), cos(pageAngle), 0.0);
#ifdef USE_TANGENT
vec3 objectTangent = vec3(tangent.xyz);
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec2 curled = curlPoint(position.x, uTurn, uWidth, uBend);
vec3 transformed = vec3(curled.x, curled.y + uLift, position.z);
#ifdef USE_ALPHAHASH
vPosition = vec3(position);
#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform sampler2D uMaskFront;
uniform sampler2D uMaskBack;
uniform float uInkFront;
uniform float uInkBack;
uniform vec3 uPaper;`,
      )
      .replace(
        "#include <map_fragment>",
        `vec2 pageUv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
vec4 pageTexel = gl_FrontFacing ? texture2D(uFront, pageUv) : texture2D(uBack, pageUv);
vec4 inkMask = gl_FrontFacing ? texture2D(uMaskFront, pageUv) : texture2D(uMaskBack, pageUv);
float inkLevel = gl_FrontFacing ? uInkFront : uInkBack;
if (inkMask.a > 0.5 && inkMask.r > inkLevel) pageTexel.rgb = uPaper;
diffuseColor *= pageTexel;`,
      );
  };
  return material;
}
```

Before relying on the chunk names, confirm they exist in three 0.172:

```bash
grep -l "beginnormal_vertex\|begin_vertex\|map_fragment" node_modules/three/src/renderers/shaders/ShaderLib/meshphysical.glsl.js
```

Expected: the file path prints (all three chunk includes are present).

- [ ] **Step 2: Create `interactions/Diary3D.jsx`**

```jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import { PlaneGeometry } from "three";
import { Caveat } from "next/font/google";
import { gsap } from "@/libs/gsap";
import { dispatchDesk, useDesk } from "../useDesk";
import { PAGE } from "../lib/pageCurl.mjs";
import { PAGES } from "../lib/diaryPages.mjs";
import { drawBlankPage, drawPage, loadDiaryFont } from "./diaryTextures";
import { makeLeafMaterial } from "./leafMaterial";
import { useHoverLift } from "./useHoverLift";
import HitProxy from "./HitProxy";

// Self-hosted by next/font; downloads only when this lazy chunk loads.
const caveat = Caveat({ subsets: ["latin"], weight: ["400", "700"], preload: false, display: "swap" });

const SPINE = [-0.3, 0.086, 0];
const COVER_OPEN = Math.PI;
const STACK = 0.0025;
const LEAVES = [
  { front: null, back: 0, fixedTurn: 1 },
  { front: 1, back: 2, index: 0 },
  { front: 3, back: 4, index: 1 },
  { front: 5, back: 6, index: 2 },
  { front: 7, back: null, fixedTurn: 0 },
];
const restTurns = () => Object.fromEntries(LEAVES.map((leaf, k) => [k, leaf.fixedTurn ?? 0]));

export default function Diary3D({ nodes }) {
  const diary = nodes.Interactive_Diary;
  const cover = nodes.Interactive_Diary_Cover;
  const mode = useDesk((s) => s.mode);
  const spread = useDesk((s) => s.spread);
  const open = mode === "diary";
  const invalidate = useThree((s) => s.invalidate);
  const hover = useHoverLift(diary, { enabled: mode === "desk", cursor: "pointer", lift: 0.02 });
  const [leaves, setLeaves] = useState(null);
  const group = useRef(null);
  const anim = useRef({ cover: 0, turns: LEAVES.map((l) => l.fixedTurn ?? 0), ink: PAGES.map(() => 0) });
  const geometry = useMemo(
    () =>
      new PlaneGeometry(PAGE.width, PAGE.depth, PAGE.segments, 1)
        .translate(PAGE.width / 2, 0, 0)
        .rotateX(-Math.PI / 2),
    [],
  );

  const sync = useRef(() => {});
  sync.current = () => {
    const a = anim.current;
    cover.rotation.z = a.cover;
    leaves?.forEach((material, k) => {
      const leaf = LEAVES[k];
      const u = material.userData.uniforms;
      const turn = a.turns[k];
      const right = leaf.index === undefined ? 0 : (3 - leaf.index) * STACK;
      const left = leaf.index === undefined ? 0 : (leaf.index + 1) * STACK;
      u.uTurn.value = turn;
      u.uLift.value = right + (left - right) * turn;
      u.uInkFront.value = leaf.front === null ? 1 : a.ink[leaf.front];
      u.uInkBack.value = leaf.back === null ? 1 : a.ink[leaf.back];
    });
    if (group.current) group.current.visible = Boolean(leaves) && a.cover > 0.05;
    invalidate();
  };

  // Paint the pages the first time the diary opens.
  useEffect(() => {
    if (!open || leaves) return;
    let cancelled = false;
    const family = caveat.style.fontFamily;
    loadDiaryFont(family).then(() => {
      if (cancelled) return;
      const pages = PAGES.map((page, i) => drawPage(page, i, family));
      const blank = drawBlankPage();
      setLeaves(
        LEAVES.map((leaf) =>
          makeLeafMaterial(
            leaf.front === null ? blank : pages[leaf.front],
            leaf.back === null ? blank : pages[leaf.back],
          ),
        ),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [open, leaves]);

  useEffect(
    () => () => {
      leaves?.forEach((material) => {
        const u = material.userData.uniforms;
        [u.uFront, u.uBack, u.uMaskFront, u.uMaskBack].forEach((t) => t.value.dispose());
        material.dispose();
      });
    },
    [leaves],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Cover opens after the camera has started its move; closing settles pages first.
  useEffect(() => {
    const a = anim.current;
    const timeline = gsap.timeline({ onUpdate: () => sync.current() });
    if (open) {
      timeline.to(a, { cover: COVER_OPEN, duration: 0.9, ease: "power2.inOut", delay: 0.5 });
    } else {
      timeline
        .to(a.turns, { ...restTurns(), duration: 0.5, ease: "power2.inOut" })
        .to(a, { cover: 0, duration: 0.8, ease: "power2.inOut" });
    }
    return () => timeline.kill();
  }, [open, leaves]);

  // Turn to the current spread, then ink in its sketches once.
  useEffect(() => {
    if (!open || !leaves) return;
    const a = anim.current;
    const targets = Object.fromEntries(
      LEAVES.map((leaf, k) => [k, leaf.fixedTurn ?? (leaf.index < spread ? 1 : 0)]),
    );
    const turn = gsap.to(a.turns, {
      ...targets,
      duration: 0.8,
      ease: "power2.inOut",
      onUpdate: () => sync.current(),
    });
    const ink = gsap.to(a.ink, {
      [spread * 2]: 1,
      [spread * 2 + 1]: 1,
      duration: 1.2,
      ease: "none",
      delay: a.cover < COVER_OPEN - 0.01 ? 1.4 : 0.5,
      onUpdate: () => sync.current(),
    });
    return () => {
      turn.kill();
      ink.kill();
    };
  }, [open, spread, leaves]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => {
      if (event.key === "ArrowRight") dispatchDesk({ type: "nextPage" });
      if (event.key === "ArrowLeft") dispatchDesk({ type: "prevPage" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const page = (type) => (event) => {
    event.stopPropagation();
    dispatchDesk({ type });
  };

  return (
    <>
      {mode === "desk" && (
        <HitProxy
          node={diary}
          {...hover}
          hovered={undefined}
          onClick={(event) => {
            event.stopPropagation();
            dispatchDesk({ type: "openDiary" });
          }}
        />
      )}
      {createPortal(
        <group ref={group} position={SPINE} visible={false}>
          {leaves?.map((material, k) => (
            <mesh key={k} geometry={geometry} material={material} frustumCulled={false} receiveShadow />
          ))}
          {open && (
            <>
              <mesh position={[-PAGE.width / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} onClick={page("prevPage")}>
                <planeGeometry args={[PAGE.width, PAGE.depth]} />
              </mesh>
              <mesh position={[PAGE.width / 2, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} onClick={page("nextPage")}>
                <planeGeometry args={[PAGE.width, PAGE.depth]} />
              </mesh>
            </>
          )}
        </group>,
        diary,
      )}
    </>
  );
}
```

- [ ] **Step 3: Mount it and close on desk clicks**

`interactions/index.jsx`: add `import Diary3D from "./Diary3D";` and inside the fragment:

```jsx
{nodes.Interactive_Diary && <Diary3D nodes={nodes} />}
```

`DeskModel.jsx`, desk hit-plane `onClick` becomes:

```jsx
onClick={(event) => {
  if (mode === "hero") {
    event.stopPropagation();
    dispatchDesk({ type: "enterDesk" });
  } else if (mode === "diary") {
    event.stopPropagation();
    dispatchDesk({ type: "closeDiary" });
  }
}}
```

- [ ] **Step 4: Accessible mirror in `HeroSection/index.tsx`**

Add imports:

```tsx
import { spreadText, PAGES } from "@/components/canvas/desk/lib/diaryPages.mjs";
```

Read the spread: `const spread = useDesk((s: { spread: number }) => s.spread);`

Replace the `aria-live` paragraph with:

```tsx
<p className={styles.srOnly} aria-live="polite">
  {mode === "diary"
    ? `Diary, pages ${spread * 2 + 1} and ${spread * 2 + 2} of ${PAGES.length}. ${spreadText(spread)}`
    : ANNOUNCE[mode]}
</p>
{mode === "desk" && (
  <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "openDiary" })}>
    Open Shiv&apos;s diary
  </button>
)}
{mode === "diary" && (
  <>
    <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "prevPage" })}>
      Previous page
    </button>
    <button type="button" className={styles.srFocusable} onClick={() => dispatchDesk({ type: "nextPage" })}>
      Next page
    </button>
  </>
)}
```

Delete the now-unused `diary` entry from `ANNOUNCE` (keep `hero` and `desk`) and type it as `Record<string, string>` so `ANNOUNCE[mode]` still compiles. If TypeScript cannot type the `.mjs` import, add `components/canvas/desk/lib/diaryPages.d.mts`:

```ts
export declare const PAGES: { heading: string; lines: string[] }[];
export declare function spreadText(spread: number): string;
```

- [ ] **Step 5: Verify**

```bash
npm test && npm run lint && npm run build
```

Browser, desktop:
- Desk mode → hover the diary (lifts, pointer cursor) → click: camera glides to a close reading view, the cover swings open on its spine, pages appear; text in Caveat is crisp; on spread 1 the camera doodle and the wave sketch ink in stroke by stroke.
- Click right page / press → : the page curls over (free edge lags), next sketches ink in. ← goes back. Spread 4 → → does nothing.
- Esc or click the desk outside the book: pages settle, cover closes, camera returns to the overhead desk. Reopen: starts at spread 1 and already-inked sketches stay inked.
- 390×844: camera frames one page; tapping the right page pans to it, tapping again flips; left mirrors.
- Screen reader (VoiceOver, `Cmd+F5`): tab to "Open Shiv's diary" in desk mode; the live region reads the spread text; "Next page" works.
- DevTools Performance: flipping pages shows no texture uploads per frame (no long `texImage2D` tasks).

- [ ] **Step 6: Commit**

```bash
git add components/canvas/desk components/HomePage/HeroSection
git commit -m "feat(desk): 3D handwritten diary with curling pages and ink-in sketches

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---
### Task 9: Faster first paint — shorter intro, session skip, async shader warm-up, early model fetch, legacy cleanup

**Files:**
- Create: `components/Loader/introSession.mjs`, `components/Loader/introSession.test.mjs`, `components/canvas/desk/modelUrl.js`
- Modify: `package.json` (test glob), `components/Loader/index.tsx`, `components/canvas/desk/DeskCanvas.jsx`, `components/canvas/desk/DeskModel.jsx`, `components/HomePage/HeroSection/index.tsx`, `HeroSection.module.scss`, `public/desktop_pc/README.md`
- Delete: `public/desktop_pc/hero-bg.mp4`, `public/desktop_pc/scene.bin`, `public/desktop_pc/license.txt`, `public/desktop_pc/textures/`, `public/workspace/`, `components/assets/`

**Interfaces:**
- Produces: `INTRO_KEY = "shiv-intro-seen"`, `sessionStore() → Storage | null`, `hasSeenIntro(storage) → boolean`, `markIntroSeen(storage) → void` (never throw); `MODEL_URL` moves to `components/canvas/desk/modelUrl.js`; `DeskCanvas` gains prop `onWarm()`.

- [ ] **Step 1: Failing test** — `components/Loader/introSession.test.mjs`

```js
import test from "node:test";
import assert from "node:assert/strict";
import { INTRO_KEY, hasSeenIntro, markIntroSeen } from "./introSession.mjs";

const memory = () => {
  const data = new Map();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => data.set(k, String(v)) };
};
const throwing = {
  getItem() {
    throw new Error("SecurityError");
  },
  setItem() {
    throw new Error("QuotaExceededError");
  },
};

test("marks and reads the intro flag", () => {
  const s = memory();
  assert.equal(hasSeenIntro(s), false);
  markIntroSeen(s);
  assert.equal(hasSeenIntro(s), true);
  assert.equal(s.getItem(INTRO_KEY), "1");
});

test("blocked or missing storage never throws and never skips the intro", () => {
  assert.equal(hasSeenIntro(throwing), false);
  assert.doesNotThrow(() => markIntroSeen(throwing));
  assert.equal(hasSeenIntro(null), false);
  assert.doesNotThrow(() => markIntroSeen(null));
});
```

Change the `test` script to also include `"components/Loader/*.test.mjs"`:

```json
"test": "node --test \"components/canvas/desk/lib/*.test.mjs\" \"components/Loader/*.test.mjs\" \"scripts/**/*.test.mjs\""
```

Run: `npm test` → FAIL (module missing).

- [ ] **Step 2: Implement `components/Loader/introSession.mjs`**

```js
export const INTRO_KEY = "shiv-intro-seen";

// Private browsing and blocked site data can make sessionStorage throw on
// access; the intro then simply plays every time.
export function sessionStore() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function hasSeenIntro(storage) {
  try {
    return storage?.getItem(INTRO_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen(storage) {
  try {
    storage?.setItem(INTRO_KEY, "1");
  } catch {
    // ignore
  }
}
```

Run: `npm test` → PASS.

- [ ] **Step 3: Shorter intro + session skip in `components/Loader/index.tsx`**

1. Import: `import { hasSeenIntro, markIntroSeen, sessionStore } from "./introSession.mjs";`
2. Add a mount effect right after the state declarations:

```tsx
useEffect(() => {
  // Repeat loads in the same tab go straight to the site.
  if (hasSeenIntro(sessionStore())) setFinished(true);
}, []);
```

3. In the existing `finished` effect's `if (finished) { … }` branch, add `markIntroSeen(sessionStore());` before `ScrollTrigger.refresh();`.
4. In the timeline effect change durations: counter tween `duration: reducedMotion ? 0 : 0.3`; percentage exit `duration: reducedMotion ? 0 : 0.4`; intro exit `duration: reducedMotion ? 0 : 0.6` with position `reducedMotion ? ">" : "-=0.2"`. Total exit ≈ 1.1 s.

If TypeScript cannot type the `.mjs` import, add `components/Loader/introSession.d.mts`:

```ts
export declare const INTRO_KEY: string;
export declare function sessionStore(): Storage | null;
export declare function hasSeenIntro(storage: Pick<Storage, "getItem"> | null): boolean;
export declare function markIntroSeen(storage: Pick<Storage, "setItem"> | null): void;
```

- [ ] **Step 4: Async shader warm-up instead of `<Preload all />`**

`components/canvas/desk/modelUrl.js`:

```js
// Kept free of three.js imports so the hero can preload it cheaply.
export const MODEL_URL = "/desktop_pc/scene.glb?v=interactive-1";
```

`DeskModel.jsx`: replace the `MODEL_URL` declaration with `import { MODEL_URL } from "./modelUrl";` and keep `export { MODEL_URL };` only if something else imports it from `DeskModel` (grep; otherwise drop the export).

`DeskCanvas.jsx`: remove `Preload` from the drei import, accept `onWarm` and replace `<Preload all />` with `<WarmUp onWarm={onWarm} />`:

```jsx
// Compiles every shader without blocking the main thread (KHR_parallel_shader_compile)
// so the intro can lift as soon as the model is parsed and the hero fades in clean.
function WarmUp({ onWarm }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    const done = () => alive && onWarm?.();
    const task = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve(gl.compile(scene, camera));
    task.then(done, done);
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}
```

- [ ] **Step 5: Hero fade-in and early model fetch in `HeroSection/index.tsx`**

1. `import { MODEL_URL } from "@/components/canvas/desk/modelUrl";`
2. State: `const [warm, setWarm] = useState(false);` and `const onWarm = useCallback(() => setWarm(true), []);` (add `useCallback` to the React import).
3. In the reduced-motion effect, inside `update`, when `!query.matches` start the model download before the three.js chunk arrives:

```tsx
if (!query.matches && !document.querySelector(`link[href="${MODEL_URL}"]`)) {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "fetch";
  link.href = MODEL_URL;
  link.crossOrigin = "anonymous";
  document.head.appendChild(link);
}
```

4. `<div className={`${styles.background} ${warm ? styles.warm : ""}`}>` and pass `onWarm={onWarm}` to `DeskCanvas`.
5. SCSS inside `.background`: `opacity: 0; transition: opacity 0.3s ease;` and add `&.warm { opacity: 1; }`.

- [ ] **Step 6: Delete unreferenced legacy assets**

```bash
git grep -n "hero-bg\|workspace\.gltf\|desktop_pc/textures\|components/assets\|scene\.bin\|/workspace/\|license\.txt" -- ':!docs' ':!ideas' ':!output' ':!public/desktop_pc/README.md'
```

Expected: no output. If anything prints, keep that file and note it in the commit message. Then:

```bash
git rm -r public/desktop_pc/hero-bg.mp4 public/desktop_pc/scene.bin public/desktop_pc/license.txt public/desktop_pc/textures public/workspace components/assets
du -sh public components
```

In `public/desktop_pc/README.md` delete the sentence about `public/workspace/workspace.gltf` and the final paragraph about `license.txt`/`scene.bin`; add one line: `The previous third-party Gaming Desktop PC model and its textures were removed on 2026-09-30; see git history before that date for provenance.`

- [ ] **Step 7: Verify**

```bash
npm test && npm run lint && npm run build
```

Browser (Chrome DevTools → Network → "Fast 4G", cache disabled):
- `scene.glb` request starts before the three.js chunk finishes (Waterfall).
- Intro counts up, lifts in ≈1.1 s once at 100; hero fades in without a stall (Performance panel: no single main-thread task > 200 ms around the reveal).
- Reload the tab: no intro, hero appears directly. New tab: intro plays.
- Safari private window (or DevTools → Application → block storage): site loads, intro plays, no console errors.

- [ ] **Step 8: Commit**

```bash
git add -A package.json components/Loader components/canvas/desk components/HomePage/HeroSection public scripts
git commit -m "perf: shorter intro, async warm-up, early model fetch, drop 170 MB of unused assets

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Smooth scroll animations

**Files:**
- Modify: `components/SmoothScrolling/index.tsx`, `utils/textUtils.tsx`, `components/HomePage/AboutSection/index.tsx`, `AwardSection/index.tsx`, `ProjectSection/index.tsx`, `ServiceSection/index.tsx`, `BookCallSection/index.tsx`

**Interfaces:** `splitText(text)` keeps its signature and the `"span span"` selector contract (now matches one span per word instead of per letter).

- [ ] **Step 1: Record the "before" trace**

`npm run dev`, open http://localhost:3000 at 1440×900, Performance panel → record while wheel-scrolling from the About section through Services and back. Note the count of long tasks (> 50 ms) and dropped frames in the Services pin. Save as `output/site-review/scroll-before.json` (gitignored folder for screenshots is fine; do not commit the trace).

- [ ] **Step 2: Single smoothing source**

`components/SmoothScrolling/index.tsx`: options become

```tsx
options={{ lerp: 0.12, smoothWheel, syncTouch: false }}
```

Then make the section scrubs follow Lenis directly:

```bash
sed -i '' 's/scrub: 1,/scrub: true,/' components/HomePage/AboutSection/index.tsx components/HomePage/AwardSection/index.tsx components/HomePage/ProjectSection/index.tsx
grep -rn "scrub: 1" components/HomePage || echo "none left outside ServiceSection"
```

- [ ] **Step 3: Word-level split**

Replace the body of `utils/textUtils.tsx` with:

```tsx
// utils/textUtils.tsx
import React from "react";

// One masked span per word: `span span` selects the inner word span that
// animations slide up. Word-level keeps tween counts small on long headings.
export const splitText = (text: string): JSX.Element[] => [
  <span key="accessible-text" className="sr-only">
    {text}
  </span>,
  ...text.split(" ").map((word, index) => (
    <span
      aria-hidden="true"
      key={index}
      style={{ display: "inline-block", overflow: "hidden", verticalAlign: "top" }}
    >
      <span style={{ display: "inline-block" }}>{word}&nbsp;</span>
    </span>
  )),
];
```

Raise the reveal staggers to suit words:

```bash
sed -i '' 's/stagger: 0.003 }/stagger: 0.04 }/; s/stagger: 0.002 }/stagger: 0.04 }/' components/HomePage/BookCallSection/index.tsx
sed -i '' 's/{ y: "110%", duration: 0.6, stagger: 0.01 }/{ y: "110%", duration: 0.6, stagger: 0.04 }/' components/HomePage/ServiceSection/index.tsx components/HomePage/ProjectSection/index.tsx components/HomePage/AwardSection/index.tsx
grep -rn "stagger: 0.0[0-3]" components/HomePage || echo "ok"
```

(AwardSection's `stagger: 0.1` list animation is intentionally unchanged.) If a `sed` pattern doesn't match because of formatting, edit the line by hand — `grep -n "stagger" components/HomePage/*/index.tsx` lists them.

- [ ] **Step 4: Rewrite the ServiceSection card choreography as one scrubbed timeline**

In `components/HomePage/ServiceSection/index.tsx`, replace everything from `// Cards animations` through the pin `ScrollTrigger.create({ … });` (inclusive) with:

```tsx
          // Cards: one pinned, scrubbed timeline. Timeline units map to the
          // pin length (3 units = 3 viewport heights): spread during 0→1,
          // then each card flips and straightens, staggered.
          const positions = [13, 37.7, 62.4, 87];
          const rotations = [-15, -7.5, 7.5, 15];
          const cards = cardRefs.current.filter(Boolean);
          const timeline = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: container.current,
              start: "top top",
              end: () => `+=${window.innerHeight * 3}`,
              pin: true,
              pinSpacing: true,
              anticipatePin: 1,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
          cards.forEach((card, index) => {
            timeline.to(
              card,
              { left: `${positions[index]}%`, top: "50%", yPercent: -50, rotation: rotations[index], duration: 1 },
              0,
            );
          });
          cards.forEach((card, index) => {
            const start = 1 + index * 0.15;
            const front = card.querySelector(".flipCardFrontA");
            const back = card.querySelector(".flipCardBackB");
            if (front && back) {
              timeline
                .fromTo(front, { rotateY: 0 }, { rotateY: -180, duration: 1 }, start)
                .fromTo(back, { rotateY: 180 }, { rotateY: 0, duration: 1 }, start);
            }
            timeline.to(card, { rotation: 0, duration: 1 }, start);
          });
          timeline.set({}, {}, 3);
```

Remove `ScrollTrigger` from the `@/libs/gsap` import if it is now unused (lint will say so).

- [ ] **Step 5: Verify**

```bash
npm run lint && npm run build
```

Browser at 1440×900: scroll About → Services → Awards → Book call and back up.
- Headings reveal word by word; About's letter-opacity scrub tracks the wheel without trailing.
- Services: section pins, cards spread, then flip one after another and straighten; scrolling back up reverses exactly; fast wheel flicks don't leave cards half-flipped.
- Performance recording (same path as Step 1): fewer long tasks than `scroll-before`, no tween creation during scroll (no `gsap.to` frames in the flame chart under `ScrollTrigger.update`).
- At 390×844 and with reduced motion emulated, sections render statically as before (their `matchMedia` guards are unchanged).

- [ ] **Step 6: Commit**

```bash
git add components/SmoothScrolling utils/textUtils.tsx components/HomePage
git commit -m "fix: smoother scroll animations (single smoothing, word splits, one scrubbed services timeline)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: End-to-end verification and handoff notes

**Files:**
- Modify: `public/desktop_pc/README.md` (final numbers), `docs/superpowers/specs/2026-09-30-interactive-desk-hero-design.md` (append "Implementation notes" listing the five deviations)

- [ ] **Step 1: Full check**

```bash
npm test && npm run lint && npm run build && npm run start
```

- [ ] **Step 2: Lighthouse (mobile) on the production build** — http://localhost:3000, compare with the Task 0 baseline: LCP, Total Blocking Time, total transfer. Record the numbers.

- [ ] **Step 3: Golden-path walkthrough** (desktop 1440×900 and 390×844), recording a GIF with the Chrome extension's gif tool named `interactive-desk.gif`:
hero drift → click desk → type "shiv" on the real keyboard → click keys → drag mouse → swing mic → open diary → flip to Astra sketch → Esc → Esc → scroll the page through Services.

- [ ] **Step 4: Review Focus checks** — run each of the five Review Focus scenarios at the top of this plan and confirm the expected behavior.

- [ ] **Step 5: Append implementation notes to the spec** (the five deviations from this plan's "Deviations" section, plus the measured before/after numbers) and update the size line in `public/desktop_pc/README.md`.

- [ ] **Step 6: Commit**

```bash
git add docs public/desktop_pc/README.md
git commit -m "docs: record interactive desk results and deviations

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
