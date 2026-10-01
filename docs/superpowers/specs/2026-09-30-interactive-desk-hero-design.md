# Interactive cinematic desk hero — design

Date: 2026-09-30
Status: approved in conversation, pending spec review

## Intent

Turn the homepage 3D desk into a small, cinematic playground that tells visitors who Shiv is. A visitor clicks the desk, the camera flies to an overhead view, and they can type on the mechanical keyboard (with real-sounding switches), drag the mouse across the mat, swing the microphone boom arm, and open a 3D diary on the table containing handwritten notes about Shiv and rough sketches of Life OS and Astra.

At the same time: load faster, remove UI clutter, and fix janky homepage scroll animations.

### Success criteria

- Hero → desk → diary → back feels continuous: no camera jumps, no duplicated objects, 60 fps on a recent laptop.
- Every interaction moves the *real* modeled object, not an overlay.
- Loader is visibly shorter than today (target: hero visible ≤ 1.5 s after model download on broadband; exit animation ≤ 1.1 s; skipped on repeat visits in the same session).
- Initial model payload ≤ ~400 KB (from ~1.3 MB). Diary, audio and font add nothing to first load.
- Scroll sections track the wheel without lag or stutter; no tweens created per scroll tick.
- Reduced-motion and phone users get a working, readable experience.

### Said vs assumed

- Said by Shiv: overhead desk view on click; keyboard sound; drag mouse; move mic boom; 3D diary on table with handwritten notes + rough project sketches; cinematic; faster loading; less clutter; fix animations (specifically *loader too long* and *page animations*). Sketches: **Life OS** and **Astra**.
- Assumed: desktop is the primary target; phones get a simplified but equivalent experience; copy is drafted from `data/site.ts` and `data/projectsData.ts` and Shiv edits afterwards.

## Current state (why it feels junky)

- `public/desktop_pc/scene.gltf` is merged into 27 meshes by material, so the mouse, mic arm, keys and book cannot move independently. `components/canvas/Computer.jsx` fakes interactivity with primitive stand-ins drawn over the real objects → duplicates.
- Key sound is a square-wave oscillator beep; no key depresses.
- Diary is a 2D HTML modal with one generic SVG.
- Camera transition is an exponential lerp between two poses.
- Loader waits for full scene readiness, then plays a ~2.7 s exit.
- Lenis sets both `lerp` and `duration`; sections add `scrub: 1` on top → double smoothing. `ServiceSection` spawns `gsap.to` calls inside `onUpdate` during a pin. Letter-level splits animate hundreds of spans.
- ~170 MB of unreferenced legacy assets (`public/desktop_pc/hero-bg.mp4`, `scene.bin`, legacy `textures/Material*`, `public/workspace/`, `components/assets/`).

## Design

### 1. Model: split interactive parts (`scripts/model/build-desk.mjs`)

Keep the material-merged static scene, but export these as separate named nodes (not merged):

| Node | Structure | Purpose |
|---|---|---|
| `Interactive_Mouse` | single group, origin at base center | drag on mat |
| `Interactive_Mic_Base` → `Interactive_Mic_Lower` → `Interactive_Mic_Upper` → `Interactive_Mic_Head` | pivot hierarchy, each origin at its joint | 2-bone IK swing |
| `Interactive_Keycaps` | one `InstancedMesh`-ready mesh (a single keycap geometry per size class) + per-key transform table in `extras.keys` (`code`, position, size) | per-key press |
| `Interactive_Diary_Cover`, `Interactive_Diary_Block` | cover pivot on spine hinge; page block | open/close |

Static merged meshes remain for everything else. Added draw calls ≈ 6–8.

Compression: run output through `gltf-transform` (`meshopt` + `quantize` + `dedup` + `prune`), emit `scene.glb`. Loaded via drei `useGLTF(url, false, true)` (meshopt decoder bundled). Update `public/desktop_pc/README.md`.

### 2. Cinematic flow (`components/canvas/desk/`)

Split today's 400-line `Computer.jsx` into focused units:

- `DeskCanvas.jsx` — Canvas, lights, environment, loading signals.
- `CameraDirector.jsx` — owns camera state machine `hero | toDesk | desk | toDiary | diary | toHero`. Each transition is a GSAP timeline over a `CatmullRomCurve3` position path + look-at interpolation (1.6 s, `power3.inOut`). Framing reuses the existing fit math from `getCameraTarget`.
- `DeskStateContext` (plain React context, no new dependency) — current mode, focused object, `setMode`.
- One interaction component per object (below).

Behavior:
- **Hero:** gentle idle camera drift (±0.6°, 8 s loop); hovering the desk raises a soft rim light; a single small cursor hint "click the desk" replaces the help paragraph.
- **Enter desk:** click anywhere on desk → camera path to overhead; hero text + scroll cue fade out; soft vignette fades in; page scroll locked (Lenis `stop()`), OrbitControls disabled.
- **In desk:** hovered interactive objects lift 4 mm with an outline (drei `Outlines`); cursor changes to grab/pointer. One small "×" button top-right and `Esc` return to hero via reversed path.
- Remove: persistent `deskHelp` paragraph, "Return to hero" pill, `aria-live` interaction chatter (replaced by a single polite announcement on mode change).

### 3. Interactions

**Keyboard (`Keyboard.jsx`, `useSwitchSounds.js`)**
- Keycaps rendered as `InstancedMesh` from `extras.keys`. Pointer down on an instance → that key animates down 1.2 mm and back (60 ms down / 90 ms spring up).
- While in desk mode, physical `keydown` events press the matching `code` key too.
- Sound: 5 short switch samples (down) + 2 (up), generated offline by a Node script (`scripts/audio/build-switch-samples.mjs`: filtered noise transient + resonant body click, rendered to 48 kHz mono, encoded to `.webm/opus` with `.mp3` fallback), ~40 KB total, stored in `public/audio/switches/`. Loaded into Web Audio buffers when desk mode is first entered. Random sample + ±4% playback-rate variance; space/enter use a deeper variant.

**Mouse (`DeskMouse.jsx`)**
- Drag via pointer capture, ray-plane intersection with the mat plane; clamped to mat bounds.
- Spring-damped follow (critically damped, ~120 ms), tilt up to 6° toward velocity, settle wobble on release. Soft friction sound whose gain follows speed (reuses the audio context; one noise loop sample, ~8 KB).

**Mic boom (`MicBoom.jsx`)**
- Drag the mic head; target point projected onto a sphere of reachable space. Base yaws toward target; lower/upper segments solve analytic 2-bone IK; head stays level with pop filter facing the laptop.
- Spring damping on joint angles; small overshoot bounce on release. Clamped yaw and reach so it never clips monitors.

**Diary (`Diary3D.jsx`, `diaryPages.js`)**
- Click book → `toDiary` camera path to close reading pose above the book (desktop frames the spread; phones frame one page and pan when flipping).
- Cover rotates open on hinge (0.9 s). Pages: 4 spreads, each page a subdivided plane bent in a vertex shader by a `turn` uniform (curl along x) for page flips (0.8 s).
- Content drawn at runtime into 2048 px `CanvasTexture`s with a subset of **Caveat** (self-hosted woff2, ~25 KB, loaded on first diary open) on a warm paper background with faint rules, coffee-ring and pencil-smudge details.
  - Spread 1 — *who I am*: name, New York, engineer / musician / photographer, "I like the moment a rough idea starts feeling useful."
  - Spread 2 — *what I do now*: Founding Engineer at Contextual Intelligence; before: FuteurAI; how I work (short bullets).
  - Spread 3 — *Life OS sketch*: rough phone frame with Today screen, module bubbles (Money, Health, Plan, Notes…) arrowed into a "Coach" circle; margin notes ("one OS, not 12 tabs", "Plaid → OAuth → universal link").
  - Spread 4 — *Astra sketch*: birth-chart wheel with a few planet glyphs, arrow "Swiss Ephemeris (wasm)" → "Claude writes" → phone reading; margin note "computed, never guessed".
- Sketch strokes are defined as polylines with slight jitter; on landing on a spread they "ink in" by progressively redrawing the canvas over ~1.2 s.
- Navigation: click right/left page or `→`/`←`; close with `Esc` or click off the book → pages settle, cover closes, camera returns to desk pose.
- Accessibility: a visually-hidden HTML region mirrors the current spread's text, announced on flip; focusable prev/next/close buttons exist off-canvas for keyboard users.

### 4. Loading

- Model: meshopt-compressed GLB (~350 KB target).
- Loader lifts when page assets + model *download* complete (`useProgress` 100), not after full scene prep. Scene prep (shader compile via `gl.compileAsync`, environment bake) happens behind a 300 ms hero fade-in.
- Loader exit shortened to ≤ 1.1 s total; `sessionStorage` flag skips the intro on repeat navigations to `/` in the same session (wrapped in try/catch).
- Desk-only code (`Keyboard`, `DeskMouse`, `MicBoom`, `Diary3D`, audio, font) lazy-loaded with `React.lazy` on first desk entry; pointer-hover over the desk prefetches it.
- Delete unreferenced legacy assets after a grep confirms no references: `public/desktop_pc/{hero-bg.mp4,scene.bin,license.txt,textures/Material*,textures/Tasten*}`, `public/workspace/`, `components/assets/`. README provenance note updated accordingly.

### 5. Page animations

- Lenis: keep `lerp: 0.12`, remove `duration`.
- Replace `scrub: 1` with `scrub: true` in `AboutSection`, `AwardSection`, `ProjectSection`, `ServiceSection` (Lenis already smooths).
- `ServiceSection`: replace per-card `ScrollTrigger` `onUpdate` → `gsap.to` pattern with one scrubbed timeline containing all card flips at staggered positions.
- Heading reveals: split by word instead of letter where stagger ≤ 0.01; add `will-change: transform` only during the animation.
- Hero canvas: pause rendering (`frameloop` stays `demand`, no invalidations) when hero is offscreen via IntersectionObserver.

### 6. Mobile & reduced motion

- Phones (`pointer: coarse`): tap desk to enter; drag with touch (`touch-action: none` only on canvas while in desk mode, so page scroll works in hero mode); no hover effects; diary frames one page.
- `prefers-reduced-motion`: keep the current behavior — the 3D scene is not mounted and the hero shows text only. The interactive desk is not offered to these users in this iteration.

### 7. Error handling

- `SceneBoundary` already catches WebGL/model errors; keep. Audio failures (autoplay policy, decode error) are silent no-ops. Font load failure falls back to `cursive`. Canvas texture generation runs once and is cached; disposal on unmount.

## Testing / verification

- `npm run lint`, `npm run build` pass.
- Browser checks (desktop 1440×900, mobile 390×844): enter/exit desk, key press + sound + physical typing, mouse drag clamping, mic IK limits, diary open/flip/close via mouse and keyboard, Esc everywhere, no duplicate objects.
- Performance: record Lighthouse (mobile) before/after for LCP and total transfer; Chrome performance trace of scrolling through ServiceSection before/after (no long tasks from tween creation).
- Reduced-motion emulation check.

## Out of scope

- New objects beyond keyboard, mouse, mic and diary.
- CMS for diary content (copy lives in `diaryPages.js`).
- Changes to non-home pages' animations.

## Implementation notes (2026-09-30)

Measured with Lighthouse (mobile, production build, localhost):

| | Before | After |
|---|---|---|
| Performance score | 0.38 | 0.80 |
| First Contentful Paint | 1.4 s | 0.9 s |
| Largest Contentful Paint | 85.9 s | 1.8 s |
| Total Blocking Time | 1,640 ms | 850 ms |
| Total transfer | 53,200 KiB | 1,590 KiB |

Most of the transfer drop came from outside the 3D scene: the phone project cards' blurred CSS background pointed at full-size originals (~47 MB), award images bypassed the optimizer (~5 MB), and the intro forced every image on the page to load eagerly. The desk model went from ~1.66 MB to a 447 KB meshopt GLB.

Deviations from this spec:

1. Keyboard sound is Shiv's recorded key press (`public/audio/key-press.mp3`, 6 KB, loaded on desk hover); synthesized clicks remain a fallback and the mouse slide sound is synthesized.
2. Hover highlight is a lift plus warm emissive tint instead of an outline.
3. Caveat is loaded through `next/font/google` with `preload: false`.
4. Draw calls rose by ~25 (each interactive node keeps one mesh per material).
5. Ink-in is a stroke-order mask revealed in the shader (no per-frame texture uploads).
6. Pressed keys also darken (key travel is invisible from directly above).
7. The mic arm lowers its head to reach further when dragged outward (fixed-height IK could only move ~0.7 units).
8. Portrait phones rotate the overhead desk shot 90° so the desk fills the screen.
