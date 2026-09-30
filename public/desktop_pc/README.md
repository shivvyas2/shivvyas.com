# Shiv Vyas studio desk

`scene.gltf` is the active homepage model. It was rebuilt as original 3D geometry from Shiv's desk reference, keeping the same asset entry point. The unused `public/workspace/workspace.gltf` alternative is not involved.

The scene contains two differently sized monitors, an open laptop, a mechanical keyboard, a trackpad, an ergonomic mouse, a cream mug, a wooden desktop and tan mat, red/black audio interfaces, a small round speaker, books, a phone, and an articulated microphone arm with a pop filter.

## Runtime assets

- `scene.gltf`: scene, materials, and geometry layout.
- `studio.bin`: geometry, including the keyboard keys, laptop editor details, microphone arm, cables, and accessories.
- `textures/manhattan-dusk.jpg`: generated New York wallpaper used on both 3D monitor surfaces.

The desk and equipment are meshes with physical materials. Only the monitor wallpaper is a flat texture. The source photo is not included in the repository.

The active asset totals about 1.66 MB, compared with about 15.72 MB for the previous model and its referenced assets. Its 38,708 triangles are grouped into 27 meshes/materials to limit draw calls. Lighting is generated locally rather than downloaded from an HDR environment service.

## Regenerate

Run `npm run generate-desk` from the repository root. The source is `scripts/model/build-desk.mjs`, using the project's pinned Three.js version and GLTFExporter. The generated GLTF and binary are committed so normal builds do not need to regenerate the model.

The camera fits the full model to the available hero area. Desktop visitors can drag to orbit within a small range; phones retain normal page scrolling. The existing intro waits for the GLTF, texture, and scene preparation.

## Wallpaper source

Generated with the imagegen skill. Prompt: a flat, edge-to-edge photographic aerial view across Midtown Manhattan, with the Empire State Building as a focal point, dense architectural detail, and golden-hour light fading into charcoal blue. Warm ember-orange facades complement the website. No device frame, UI, text, or watermark. Exported as a 1280px-wide JPEG for the 3D texture.

`license.txt`, `scene.bin`, and the older texture files describe or belong to the previous Gaming Desktop PC model by Yolala1232. They are retained for provenance and are not referenced by the current scene.
