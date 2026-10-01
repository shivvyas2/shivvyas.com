// A page is a strip from the spine (x = 0) to its free edge (x = width).
// Turning rotates it about the spine by turn·π while bending it with constant
// curvature, so the free edge lags. Integrating the tangent keeps arc length.
export const PAGE = Object.freeze({ width: 0.6, depth: 0.88, segments: 24, bend: 0.9 });

export function curlAngle(x, turn, width = PAGE.width, bend = PAGE.bend) {
  const theta = turn * Math.PI;
  return theta - ((Math.sin(theta) * bend) / width) * x;
}

export function curlPoint(x, turn, width = PAGE.width, bend = PAGE.bend) {
  const theta = turn * Math.PI;
  const k = (Math.sin(theta) * bend) / width;
  if (Math.abs(k) < 1e-6) return [x * Math.cos(theta), x * Math.sin(theta)];
  return [
    (Math.sin(theta) - Math.sin(theta - k * x)) / k,
    (Math.cos(theta - k * x) - Math.cos(theta)) / k,
  ];
}

export const CURL_GLSL = /* glsl */ `
float curlAngle(float x, float turn, float width, float bend) {
  float theta = turn * 3.141592653589793;
  return theta - (sin(theta) * bend / width) * x;
}
vec2 curlPoint(float x, float turn, float width, float bend) {
  float theta = turn * 3.141592653589793;
  float k = sin(theta) * bend / width;
  if (abs(k) < 1e-6) return vec2(x * cos(theta), x * sin(theta));
  return vec2((sin(theta) - sin(theta - k * x)) / k, (cos(theta - k * x) - cos(theta)) / k);
}
`;
