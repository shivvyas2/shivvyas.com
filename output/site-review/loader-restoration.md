# Original loading screen restored

The orange gradient, oversized counter, and upward reveal are restored. The website stays mounted underneath the intro so its assets can load concurrently.

- The counter follows page-image decoding, fonts, document loading, and the Three.js loading manager. The homepage reveal also waits for the model and environment to mount and the scene preload to compile.
- Current-page images are requested eagerly during the intro, including the project and heritage images.
- The intro runs once per full page load. Client-side navigation does not replay it. Pages without the hero scene do not wait for a model.
- Scrolling and underlying controls are locked until the reveal completes; scroll measurements refresh afterward.
- Failed images settle their loading tasks. A failed 3D scene is contained so the rest of the website remains usable. A continuation button appears after eight seconds, with an automatic fallback after thirty seconds.
- Reduced motion skips the intro's movement and the existing decorative scene. A no-JavaScript style hides the overlay so server-rendered content stays accessible.

## Verification

- Production build passed, including lint, TypeScript, and all 20 generated pages.
- Desktop and mobile browser checks confirmed the original orange counter, complete page-image loading, visible 3D scene after the reveal, unlocked content, and working menu/navigation.
- A temporary local proxy delayed the model by 12 seconds: the intro remained present while the model was pending, then revealed the loaded scene.
- Simulated HTTP 503 responses for the model and a heritage image: the loader completed and the rest of the page remained usable.
- Screenshots are kept out of GitHub. Native OS reduced-motion settings and real-device Safari were not changed or tested in this pass.
