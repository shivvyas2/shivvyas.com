import { Color, DoubleSide, MeshStandardMaterial } from "three";
import { CURL_GLSL, PAGE } from "../lib/pageCurl.mjs";
import { PAPER } from "./diaryTextures";

// One double-sided leaf: the vertex shader curls it about the spine (same
// math as pageCurl.mjs), the fragment shader picks the front/back page and
// hides sketch strokes whose draw order is later than the ink level.
export function makeLeafMaterial(front, back) {
  const material = new MeshStandardMaterial({ roughness: 0.92, side: DoubleSide });
  material.defines = { USE_UV: "" };
  const uniforms = {
    uTurn: { value: 0 },
    uLift: { value: 0 },
    uWidth: { value: PAGE.width },
    uBend: { value: PAGE.bend },
    uFront: { value: front.color },
    uBack: { value: back.color },
    uMaskFront: { value: front.mask },
    uMaskBack: { value: back.mask },
    uInkFront: { value: 0 },
    uInkBack: { value: 0 },
    uPaper: { value: new Color(PAPER) },
  };
  material.userData.uniforms = uniforms;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTurn;
uniform float uLift;
uniform float uWidth;
uniform float uBend;
${CURL_GLSL}`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `float pageAngle = curlAngle(position.x, uTurn, uWidth, uBend);
vec3 objectNormal = vec3(-sin(pageAngle), cos(pageAngle), 0.0);
#ifdef USE_TANGENT
vec3 objectTangent = vec3(tangent.xyz);
#endif`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec2 curled = curlPoint(position.x, uTurn, uWidth, uBend);
vec3 transformed = vec3(curled.x, curled.y + uLift, position.z);
#ifdef USE_ALPHAHASH
vPosition = vec3(position);
#endif`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform sampler2D uMaskFront;
uniform sampler2D uMaskBack;
uniform float uInkFront;
uniform float uInkBack;
uniform vec3 uPaper;`,
      )
      .replace(
        "#include <map_fragment>",
        `vec2 pageUv = gl_FrontFacing ? vUv : vec2(1.0 - vUv.x, vUv.y);
vec4 pageTexel = gl_FrontFacing ? texture2D(uFront, pageUv) : texture2D(uBack, pageUv);
vec4 inkMask = gl_FrontFacing ? texture2D(uMaskFront, pageUv) : texture2D(uMaskBack, pageUv);
float inkLevel = gl_FrontFacing ? uInkFront : uInkBack;
if (inkMask.a > 0.5 && inkMask.r > inkLevel) pageTexel.rgb = uPaper;
diffuseColor *= pageTexel;`,
      );
  };
  return material;
}
