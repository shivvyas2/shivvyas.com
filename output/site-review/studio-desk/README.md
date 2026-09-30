# Reference-inspired studio desk

The active `public/desktop_pc/scene.gltf` was rebuilt to resemble Shiv's reference setup. The unused workspace alternative was not used. The original header, introduction, navigation, buttons, and orange loading screen are retained.

The scene has two monitors, an open laptop, mechanical keyboard, trackpad, mouse, wood worktop and tan mat, mug, audio interfaces, a small speaker, books, phone, and microphone arm. Equipment and editor details are 3D geometry; the generated Manhattan wallpaper is a monitor texture.

Validation covered GLTF buffer/accessor bounds, finite vertex data, triangle indices, material and texture references, and the production build. The final scene contains 38,708 triangles across 27 material groups. Referenced asset size fell from 15,723,542 to 1,659,949 bytes (89.4%).

Browser checks covered desktop and mobile framing, monitor texture orientation, the existing intro/reveal, and constrained desktop orbit interaction. The complete desktop fits the phone viewport; touch devices keep page scrolling. Browser screenshots remain local and ignored by Git.

See [the model README](../../../public/desktop_pc/README.md) for runtime files and regeneration instructions.
