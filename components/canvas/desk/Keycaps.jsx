import { useLayoutEffect, useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, Color, InstancedBufferAttribute, Object3D, PlaneGeometry, SRGBColorSpace } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { KEYS, KEY_TONES, KEY_TRAVEL } from "./lib/keyboardLayout.mjs";
import { keyPressOffset } from "./lib/deskMath.mjs";
import { legendFor } from "./lib/keyLegends.mjs";

// Lets the lazily loaded keyboard input press keys without owning the meshes.
export const keycapsApi = { press: () => {}, onKey: null };

const dummy = new Object3D();
const tint = new Color();
const TONES = Object.fromEntries(Object.entries(KEY_TONES).map(([k, v]) => [k, new Color(v)]));
const LEGEND_KEYS = KEYS.flatMap((k, i) => (legendFor(k.code) ? [i] : []));
const LEGEND_OF = new Map(LEGEND_KEYS.map((keyIndex, j) => [keyIndex, j]));
// Legend ink per cap colour, like Keychron's dye-sub sets.
const INK = { light: new Color("#262b2d"), slate: new Color("#eef1ef"), orange: new Color("#ffffff") };

// All legends in one atlas (white on transparent, tinted per instance); each
// instance reads its own cell through the `aCell` attribute.
const COLS = 10;
const CELL = 128;
const ROWS = Math.ceil(LEGEND_KEYS.length / COLS);
const SANS = '"Helvetica Neue", Helvetica, Arial, sans-serif';

function legendAtlas() {
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const g = canvas.getContext("2d");
  g.fillStyle = "#fff";
  g.textBaseline = "middle";
  LEGEND_KEYS.forEach((keyIndex, j) => {
    const { kind, text } = legendFor(KEYS[keyIndex].code);
    const x = (j % COLS) * CELL;
    const y = Math.floor(j / COLS) * CELL;
    if (kind === "letter") {
      g.textAlign = "center";
      g.font = `500 58px ${SANS}`;
      g.fillText(text[0], x + CELL / 2, y + CELL / 2 + 2);
    } else if (kind === "pair") {
      g.textAlign = "center";
      g.font = `500 40px ${SANS}`;
      g.fillText(text[0], x + CELL / 2, y + 38);
      g.fillText(text[1], x + CELL / 2, y + 88);
    } else if (kind === "arrow") {
      g.textAlign = "center";
      g.font = `500 40px ${SANS}`;
      g.fillText(text[0], x + CELL / 2, y + CELL / 2);
    } else {
      g.textAlign = "left";
      g.font = `500 ${text[0].length > 6 ? 21 : 25}px ${SANS}`;
      g.fillText(text[0], x + 14, y + CELL - 24);
    }
  });
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function legendGeometryWithCells() {
  const geometry = new PlaneGeometry(1, 1);
  geometry.rotateX(-Math.PI / 2); // lie on the cap, glyph tops toward the back
  const cells = new Float32Array(LEGEND_KEYS.length * 2);
  LEGEND_KEYS.forEach((_, j) => {
    cells[j * 2] = (j % COLS) / COLS;
    cells[j * 2 + 1] = 1 - (Math.floor(j / COLS) + 1) / ROWS;
  });
  geometry.setAttribute("aCell", new InstancedBufferAttribute(cells, 2));
  return geometry;
}

const patchLegendShader = (shader) => {
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nattribute vec2 aCell;")
    .replace(
      "#include <uv_vertex>",
      `#include <uv_vertex>\n  vMapUv = uv * vec2(${(1 / COLS).toFixed(6)}, ${(1 / ROWS).toFixed(6)}) + aCell;`,
    );
};

export default function Keycaps({ anchor }) {
  const caps = useRef(null);
  const legends = useRef(null);
  const pressedAt = useRef(new Float64Array(KEYS.length).fill(-1));
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const capGeometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12), []);
  const legendGeometry = useMemo(() => legendGeometryWithCells(), []);
  const atlas = useMemo(() => legendAtlas(), []);

  const place = (i, offset) => {
    const k = KEYS[i];
    const drop = offset * KEY_TRAVEL;
    dummy.position.set(k.x, k.y - drop, k.z);
    dummy.scale.set(k.w, k.h, k.d);
    dummy.updateMatrix();
    caps.current.setMatrixAt(i, dummy.matrix);
    // From the overhead camera travel is along the view axis, so a pressed
    // key also darkens to read as "down".
    caps.current.setColorAt(i, tint.copy(TONES[k.tone]).multiplyScalar(1 - 0.35 * offset));
    const j = LEGEND_OF.get(i);
    if (j === undefined) return;
    // A square legend on the cap top; wide keys keep it at their left end.
    const size = Math.min(k.w, k.d) - 0.018;
    dummy.position.set(k.x - k.w / 2 + 0.009 + size / 2, k.y + k.h / 2 + 0.0012 - drop, k.z);
    dummy.scale.set(size, 1, size);
    dummy.updateMatrix();
    legends.current.setMatrixAt(j, dummy.matrix);
  };

  useLayoutEffect(() => {
    KEYS.forEach((_, i) => place(i, 0));
    caps.current.instanceMatrix.needsUpdate = true;
    caps.current.instanceColor.needsUpdate = true;
    legends.current.instanceMatrix.needsUpdate = true;
    caps.current.computeBoundingSphere();
    LEGEND_KEYS.forEach((keyIndex, j) => legends.current.setColorAt(j, INK[KEYS[keyIndex].tone]));
    legends.current.instanceColor.needsUpdate = true;
    legends.current.computeBoundingSphere();
    keycapsApi.press = (i) => {
      if (i === undefined || i < 0 || i >= KEYS.length) return;
      // performance.now, not the R3F clock: with frameloop="demand" the clock
      // is stale between frames and the press would be skipped.
      pressedAt.current[i] = performance.now() / 1000;
      invalidate();
    };
    return () => {
      keycapsApi.press = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFrame(() => {
    const now = performance.now() / 1000;
    let moving = false;
    let dirty = false;
    pressedAt.current.forEach((at, i) => {
      if (at < 0) return;
      const t = now - at;
      const done = t >= 0.15;
      place(i, done ? 0 : keyPressOffset(t));
      if (done) pressedAt.current[i] = -1;
      else moving = true;
      dirty = true;
    });
    if (dirty) {
      caps.current.instanceMatrix.needsUpdate = true;
      caps.current.instanceColor.needsUpdate = true;
      legends.current.instanceMatrix.needsUpdate = true;
    }
    if (moving) invalidate();
  });

  return createPortal(
    <>
      <instancedMesh ref={caps} args={[capGeometry, undefined, KEYS.length]} castShadow
        receiveShadow
        name="Keycaps"
        onPointerDown={(event) => {
          if (keycapsApi.onKey?.(event.instanceId)) event.stopPropagation();
        }}
        onPointerOver={() => {
          if (keycapsApi.onKey) gl.domElement.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          gl.domElement.style.cursor = "";
        }}
      >
        <meshStandardMaterial roughness={0.63} />
      </instancedMesh>
      <instancedMesh
        ref={legends}
        args={[legendGeometry, undefined, LEGEND_KEYS.length]}
        raycast={() => null}
        name="Keycap legends"
      >
        <meshBasicMaterial
          map={atlas}
          transparent
          depthWrite={false}
          toneMapped={false}
          onBeforeCompile={patchLegendShader}
        />
      </instancedMesh>
    </>,
    anchor,
  );
}
