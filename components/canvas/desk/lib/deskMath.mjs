export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const clampToRect = ({ x, z }, { minX, maxX, minZ, maxZ }) => ({
  x: clamp(x, minX, maxX),
  z: clamp(z, minZ, maxZ),
});

// Semi-implicit Euler, sub-stepped so a long frame (hidden tab) stays stable.
export function springStep({ value, velocity }, target, dt, { stiffness, damping }) {
  let v = value;
  let vel = velocity;
  let remaining = Math.min(dt, 0.25);
  while (remaining > 0) {
    const h = Math.min(remaining, 1 / 120);
    vel += (stiffness * (target - v) - damping * vel) * h;
    v += vel * h;
    remaining -= h;
  }
  return { value: v, velocity: vel };
}

const DOWN = 0.06;
const UP = 0.09;
// 0 = resting, 1 = bottomed out.
export function keyPressOffset(t) {
  if (t <= 0 || t >= DOWN + UP) return 0;
  if (t <= DOWN) return t / DOWN;
  const u = (t - DOWN) / UP;
  return 1 - u * u * (3 - 2 * u);
}
