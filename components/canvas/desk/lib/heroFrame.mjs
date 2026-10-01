// Where the hero camera fits the desk on the full-bleed canvas: the band
// between the bottom of the intro text (measured, as a fraction of the hero
// height) and the bottom of the hero. Returns the fit() parameters.
const GAP = 0.04;
const BOTTOM = { desktop: 0.93, mobile: 0.9 };
const FALLBACK = { desktop: { heightFraction: 0.61, drop: 0.105 }, mobile: { heightFraction: 0.58, drop: 0.11 } };

export function heroFrame({ textBottom, mobile }) {
  const kind = mobile ? "mobile" : "desktop";
  if (textBottom == null || !Number.isFinite(textBottom)) return FALLBACK[kind];
  const top = Math.min(0.6, textBottom + GAP);
  const bottom = BOTTOM[kind];
  return { heightFraction: bottom - top, drop: (top + bottom) / 2 - 0.5 };
}
