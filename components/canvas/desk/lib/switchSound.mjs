// Deterministic mechanical-switch synthesis: a sharp noise transient (stem
// click), a short resonant "thock" from the case, and a low-passed bottom-out.
const rng = (seed) => {
  let s = seed >>> 0 || 1;
  return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
};

function normalize(out, peak) {
  let max = 0;
  for (const v of out) max = Math.max(max, Math.abs(v));
  if (max > 0) for (let i = 0; i < out.length; i++) out[i] *= peak / max;
  return out;
}

export function renderSwitch(sampleRate, { seed = 1, deep = false, up = false } = {}) {
  const n = Math.round(sampleRate * (up ? 0.045 : 0.07));
  const out = new Float32Array(n);
  const rand = rng(seed);
  const body = (deep ? 170 : up ? 880 : 410) * (1 + rand() * 0.03);
  const bodyDecay = deep ? 55 : 85;
  let lowpassed = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate;
    const click = rand() * Math.exp(-t * 900) * (up ? 0.35 : 1);
    lowpassed += 0.3 * (rand() - lowpassed);
    const thock = Math.sin(2 * Math.PI * body * t) * Math.exp(-t * bodyDecay) * (up ? 0.2 : 0.6);
    const bottom = !up && t > 0.006 ? lowpassed * Math.exp(-(t - 0.006) * 160) * 0.5 : 0;
    out[i] = click * 0.8 + thock + bottom;
  }
  return normalize(out, 0.9);
}

export function renderFriction(sampleRate, seconds = 1, seed = 7) {
  const n = Math.round(sampleRate * seconds);
  const out = new Float32Array(n);
  const rand = rng(seed);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    brown = (brown + rand() * 0.02) * 0.995;
    out[i] = brown;
  }
  // Crossfade the ends so the loop has no click.
  const fade = Math.round(sampleRate * 0.02);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    out[i] *= g;
    out[n - 1 - i] *= g;
  }
  return normalize(out, 0.5);
}
