# Precision Fold branding QA

final result: passed

Browser screenshots referenced in this report are kept locally and excluded from Git. Logo concepts and reusable branding assets remain tracked.

## Latest header enhancement

The user subsequently requested an HDR-style pulsing navbar logo. The current header now uses the selected orange 3D mark with brighter highlights and a gentle 3.8-second glow/scale pulse. The earlier monochrome header comparisons below describe the original rollout; this later treatment intentionally supersedes them. Layout and typography are preserved. Normal blending keeps the logo orange over page imagery.

The production build and browser checks passed at 1440 × 1000 and 320 × 740. No horizontal overflow or console errors were observed. Both animation rules are gated by `prefers-reduced-motion: no-preference`. See `output/brand/header-pulse/README.md` and its browser captures for the current implementation evidence. The effect uses the original PNG and CSS, not an HDR-encoded asset.

## Scope and visual truth

Implement the user's selected Precision Fold logo throughout the existing website. Preserve the restored header, centered navigation, hero, About layout, fonts, and black/orange palette.

- Logo source: `output/brand/isometric-signal-refinements/precision-fold.png` (1536 × 1024 presentation sheet).
- Website layout sources: `output/site-review/restored-design/desktop-home.png` and `mobile-home.png`.
- Implementation: http://127.0.0.1:3000/ using the final production build.
- Final evidence directory: `output/brand/precision-fold-production/`.

## Comparison evidence

Source and implementation images were supplied together in the same visual comparison input. Full-view desktop and mobile pairs show the existing hero geometry, text wrapping, colors, and centered menu preserved. The source presentation sheet was also compared in the same input with the browser header detail and generated social card. The board is a logo presentation, not a website mockup; its wordmark size and composition are intentionally not copied into the site.

| State | CSS viewport | Captured pixels | Implementation evidence |
| --- | --- | --- | --- |
| Desktop home, menu closed, no hover | 1440 × 1000 | 1430 × 993 | `desktop-home-final.png` |
| Mobile home, menu closed | 390 × 844 | 380 × 822 | `mobile-home-final.png` |
| Narrow mobile home | 320 × 740 | 310 × 717 | `mobile-320.png` |
| Desktop menu open | 1440 × 1000 | 1440 × 1000 | `desktop-menu-final.png` |
| Mobile menu open | 390 × 844 | 390 × 844 | `mobile-menu-final.png` |
| Desktop footer | 1440 × 1000 | 1430 × 993 | `desktop-footer.png` |
| Mobile footer placement | 390 × 844 | 380 × 822 | `mobile-footer.png` |
| Focused header region | 190 × 55 clip | 190 × 55 | `header-detail.png` |

The browser's viewport capture scales the closed-menu screenshots slightly; both baseline and final captures have identical dimensions and were compared at equal pixel sizes. No device-scale override was applied. Menu captures include the complete modal viewport. The mobile footer capture shows the mark and contact/navigation area, not the whole footer. The social asset was inspected directly at 1200 × 630; the favicon was inspected at 96 × 96. These raster exports do not have a CSS viewport.

## Findings and comparison history

No actionable P0/P1/P2 findings remain.

1. Asset preparation: rejected the initial transparent monochrome extraction because it had visible speckling around the cutouts. Regenerated the reference's white silhouette on black. The accepted 128px export is clean at its 36px display size.
2. First browser comparison, blocked: [P2] a black tile was visible behind the white logo on the blurred menu (`desktop-menu.png`). This made the mark look pasted onto the header. Screen blending improved the desktop result (`desktop-menu-blend-check.png`), but the mobile backing still required cleanup.
3. Final browser comparison, passed: applied a luminance mask sourced from the exact same logo PNG. No geometry was redrawn or approximated. `desktop-menu-final.png` and `mobile-menu-final.png` show a clean silhouette over the blur. Rechecked the homepage and small-screen header after the fix.

## Required fidelity surfaces

- **Fonts and typography:** existing PP wordmark and page type remain unchanged. The small logo sits beside the desktop name without changing its weight or uppercase treatment. Mobile preserves its existing hidden wordmark. Hero line breaks match the baselines.
- **Spacing and layout:** the 36px header image has clear space from the centered menu; its mobile home link measures 44 × 44px. No horizontal overflow at 320, 390, or 1440px. Footer logo occupies the existing contact column; navigation and oversized footer name remain intact.
- **Colors:** white monochrome for small marks, original orange for the folded mark. The open menu retains its original blur and normal blending; the outer header retains difference blending.
- **Image quality:** generated production assets follow the selected folded SV geometry. Orange 3D mark has transparent surroundings and is clean at 80px in the footer and 260px in the sharing card. Monochrome uses the real PNG as both image and mask, with no CSS/SVG redrawing. ICO contains 16, 32, and 48px frames; 96px PNG and 180/192/512px icons are present.
- **Copy:** page text remains intact. Header and footer links are named “Shiv Vyas — home” for assistive technology; decorative logo images have empty alt text. No design-process labels appear in the product.

## Verification

- `npm run generate-brand`: passed, including social card generation.
- `tsc --noEmit`: passed; final `npm run build` also passed type checking, lint, compilation, and all 20 generated pages.
- Generated page/icon references and manifest asset paths checked.
- `git diff --check`: passed.
- Browser: menu open/close, Escape, logo closes menu, header logo returns to top of home, image loading, mobile tap area, and overflow checked.
- Homepage icon/manifest links, canonical, one H1, and Open Graph image verified in rendered DOM.
- Browser console errors checked: none observed.

## Checklist and limits

- [x] Favicon, touch/browser icons, header/menu, footer, and sharing preview branded.
- [x] Original hero and navigation appearance preserved.
- [x] Final desktop/mobile captures and local preview available.
- [x] Source assets, export script, prompts, and usage README saved.

No remaining visual fixes from this branding review. Native iOS home-screen installation and a separate Safari/Firefox device run were not performed. Assets are PNG/ICO, not vector originals. The existing Browserslist database-age notice is unrelated to this branding change. The branding changes have since been pushed to `main` and deployed; see [the archive index](output/README.md) for the final direction.
