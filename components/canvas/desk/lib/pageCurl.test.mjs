import test from "node:test";
import assert from "node:assert/strict";
import { CURL_GLSL, PAGE, curlPoint } from "./pageCurl.mjs";

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} vs ${b}`);

test("flat on the right at turn 0, flat on the left at turn 1", () => {
  const [x0, y0] = curlPoint(0.4, 0);
  close(x0, 0.4);
  close(y0, 0);
  const [x1, y1] = curlPoint(0.4, 1);
  close(x1, -0.4);
  close(y1, 0, 1e-9);
});

test("paper does not stretch: arc length equals x at any turn", () => {
  for (const turn of [0.2, 0.5, 0.8]) {
    let length = 0;
    let prev = curlPoint(0, turn);
    const steps = 400;
    for (let i = 1; i <= steps; i++) {
      const p = curlPoint((PAGE.width * i) / steps, turn);
      length += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      prev = p;
    }
    close(length, PAGE.width, 1e-4);
  }
});

test("mid-turn the free edge lags behind the spine (it curls)", () => {
  const [x, y] = curlPoint(PAGE.width, 0.5);
  assert.ok(x > 0.05 && y > 0.3);
});

test("GLSL mirrors the JS function names", () => {
  assert.match(CURL_GLSL, /vec2 curlPoint\(float x, float turn, float width, float bend\)/);
  assert.match(CURL_GLSL, /float curlAngle\(/);
});
