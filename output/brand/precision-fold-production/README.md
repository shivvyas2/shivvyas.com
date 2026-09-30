# Precision Fold website branding

Archive note: this records the initial monochrome-header rollout. The subsequent [orange header pulse](../header-pulse/README.md) supersedes that header treatment. See [the current branding guide](../../../branding/README.md) for current usage.

Selected direction: `../isometric-signal-refinements/precision-fold.png`.

The site keeps its original header, centered menu, hero, typography, and About layout. Branding adds a small home link mark and a footer mark without changing those compositions.

## Assets and usage

| Asset | Use |
| --- | --- |
| `public/brand/precision-fold-mono.png` | 128px white mark on black, displayed at 36px in the header and menu |
| `public/brand/precision-fold-3d.png` | 512px orange isometric mark with transparency, used in the footer and social card |
| `public/favicon.ico` | Browser favicon containing 16, 32, and 48px PNG frames |
| `public/favicon-96x96.png` | 96px favicon alternative |
| `public/apple-touch-icon.png` | 180px touch icon |
| `public/brand/icon-192.png`, `icon-512.png` | Manifest icons |
| `public/images/shiv-vyas-social.png` | 1200 × 630px Open Graph and Twitter sharing preview |

The small marks use the monochrome silhouette for legibility. The navigation applies a luminance mask from that same PNG to remove its black backing; the logo geometry is the original image, with no recreated drawing. The header retains its existing difference blend. The orange material is reserved for larger placements. Keep the mark's proportions, clear space, and orange finish intact.

Logo links have the accessible name “Shiv Vyas — home”; their images are decorative. The mobile home link has a 44px tap area. The centered menu control and existing wordmark typography are preserved.

## Rebuild

Run `npm run generate-brand` to regenerate all PNG/ICO exports and the social card from `public/brand/precision-fold-*-master.png`. This uses the project's existing React and `next/og` dependencies.

The master images were derived with ImageGen from the selected concept. Generation prompts are saved in `prompts.json`. The original generated files remain in the Codex generated-images directory. These are raster assets, not SVG/vector originals. The initial transparent monochrome attempt was rejected for visible edge artifacts; the accepted version uses an opaque black background.

## Verification

See project-root `design-qa.md` for browser captures, responsive checks, comparison history, and build results. The branding changes have since been pushed to `main` and deployed.
