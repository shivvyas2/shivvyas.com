# Idea: 3D "Shiv at his desk" hero

An alternative home-page hero that replaces the current computer model with an
animated desk scene: Shiv typing at a dual-monitor walnut desk, an eight-second
typing loop, drag-to-rotate with OrbitControls, and a studio environment
generated locally with PMREM. Parked here on 2026-09-28; not wired into the site.

## What is here

- `canvas/ShivDesk.tsx` — the react-three-fiber canvas. Drop it back into
  `components/canvas/` to use it.
- `models/shiv-desk.glb` — the animated desk scene (1.8 MB). Goes in
  `public/models/`; the component loads it from `/models/shiv-desk.glb`.
- `HeroSection/` — the hero as it was when using ShivDesk. The only changes from
  the live hero are the import (`ShivDesk` instead of `ComputersCanvas`) and a
  `pointer: fine` rule in the SCSS that turns pointer events back on for the
  canvas so mouse users can drag the model.
- `package.json.patch` — adds `three` as a direct dependency.

## To bring it back

1. Move `canvas/ShivDesk.tsx` to `components/canvas/` and `models/shiv-desk.glb`
   to `public/models/`.
2. Apply the two HeroSection changes (or copy the files over).
3. `git apply ideas/shiv-desk-hero/package.json.patch && npm install`.
