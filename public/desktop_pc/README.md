# Shiv Vyas studio desk

`scene.glb` is the active homepage model. It was rebuilt as original 3D geometry from Shiv's desk reference, keeping the same asset entry point.

The scene contains two differently sized monitors, an open laptop, a mechanical keyboard, a trackpad, an ergonomic mouse, a cream mug, a wooden desktop and tan mat, red/black audio interfaces, a small round speaker, books, a phone, an articulated microphone arm with a pop filter, Shiv's Sony mirrorless camera with a Tamron 70-300 telephoto (`Interactive_Camera`), and the mint cat bottle. The bottle mesh is merged in at build time from the archived alternative desk (`ideas/shiv-desk-hero/models/shiv-desk.glb`).

## Runtime asset

- `scene.glb`: meshopt-compressed scene with no embedded textures. The two monitors are drawn at runtime as a Cursor-style editor showing excerpts of the desk's own source (`components/canvas/desk/interactions/monitorScreens.js`). Static parts are merged by material; the mouse, keyboard case, microphone arm (base, lower, upper, head pivots) and diary (with a hinged cover) are separate `Interactive_*` nodes the homepage animates. Keycaps are instanced at runtime from `components/canvas/desk/lib/keyboardLayout.mjs`.

The active asset is about 430 KB, compared with about 1.66 MB for the previous glTF + bin + texture and about 15.72 MB for the original model. Lighting is generated locally rather than downloaded from an HDR environment service.

## Regenerate

Run `npm run generate-desk` from the repository root. The source is `scripts/model/build-desk.mjs`, using the project's pinned Three.js version and GLTFExporter. The builder writes a temporary glTF, then compresses it with gltf-transform (dedup, prune, meshopt) into `scene.glb`, which is committed so normal builds do not need to regenerate the model.

The camera fits the full model to the available hero area. Desktop visitors can drag to orbit within a small range; phones retain normal page scrolling. The intro waits for the model download; shaders compile asynchronously behind a short fade-in.

## Retired wallpaper

The monitors no longer use `scripts/model/assets/manhattan-dusk.jpg`; it is kept for reference.

Generated with the imagegen skill. Prompt: a flat, edge-to-edge photographic aerial view across Midtown Manhattan, with the Empire State Building as a focal point, dense architectural detail, and golden-hour light fading into charcoal blue. Warm ember-orange facades complement the website. No device frame, UI, text, or watermark. Exported as a 1280px-wide JPEG for the 3D texture.

The previous third-party Gaming Desktop PC model and its textures were removed on 2026-09-30; see git history before that date for provenance.
