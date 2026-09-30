# Precision Fold header pulse

The header and open-menu logo use the existing transparent orange 3D asset. The 36px image keeps the existing layout and the mobile home link retains its 44 × 44px tap target.

The visual treatment uses brighter highlights, a small edge glow, and a blurred duplicate of the actual logo for the warm bloom. A 3.8-second CSS animation scales the image from 1 to 1.055 and the glow from 0.96 to 1.1, with glow opacity from 0.22 to 0.62. Only transform and opacity animate; the filters stay constant. No new bitmap or animation dependency was added.

The navbar uses normal blending so the orange identity does not invert against page imagery. Its position, wordmark, menu control, and links retain their existing sizes and arrangement. The footer, favicon, and other logo files are unchanged.

Both animations are declared only within `prefers-reduced-motion: no-preference`. A reduced-motion preference leaves the illuminated logo static. The effect is HDR-style rather than HDR-encoded media.

## Verification

- Production build passed, including lint and type checking.
- Desktop browser checked at 1440 × 1000 and narrow mobile at 320 × 740, with no horizontal overflow.
- Observed animation advance from scale 1.00005 / glow opacity 0.220361 to scale 1.05498 / opacity 0.619869.
- Verified the compiled animation declarations are inside the no-preference media condition. Native OS reduced-motion settings were not changed.
- Mobile home link remains 44 × 44px, with no overlapping control bounds.
- Mobile menu opens and closes with Escape; the dimensional logo loads in both header states.
- No browser console errors observed.
- Evidence: `desktop.png`, `header-detail.png`, `mobile-320.png`, and `mobile-menu.png`.

This pass has since been pushed to `main` and deployed to [shivvyas.com](https://www.shivvyas.com/).
