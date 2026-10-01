// A tiny optimized copy for CSS backgrounds that are heavily blurred anyway
// (the phone project cards). Uses Next's image optimizer; 128 is one of its
// default allowed widths.
export const blurredCoverUrl = (src: string): string =>
  `url(/_next/image?url=${encodeURIComponent(src)}&w=128&q=50)`;
