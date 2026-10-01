import { useLayoutEffect, useMemo, useRef } from "react";
import { createPortal, useFrame, useThree } from "@react-three/fiber";
import { BoxGeometry, Color, Object3D } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { KEYS, KEY_TONES, KEY_TRAVEL } from "./lib/keyboardLayout.mjs";
import { keyPressOffset } from "./lib/deskMath.mjs";

// Lets the lazily loaded keyboard input press keys without owning the meshes.
export const keycapsApi = { press: () => {}, onKey: null };

const dummy = new Object3D();
const tint = new Color();
const TONES = Object.fromEntries(Object.entries(KEY_TONES).map(([k, v]) => [k, new Color(v)]));
const LEGEND_KEYS = KEYS.flatMap((k, i) => (k.legend ? [i] : []));
const LEGEND_OF = new Map(LEGEND_KEYS.map((keyIndex, j) => [keyIndex, j]));

export default function Keycaps({ anchor }) {
  const caps = useRef(null);
  const legends = useRef(null);
  const pressedAt = useRef(new Float64Array(KEYS.length).fill(-1));
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const capGeometry = useMemo(() => new RoundedBoxGeometry(1, 1, 1, 2, 0.12), []);
  const legendGeometry = useMemo(() => new BoxGeometry(1, 1, 1), []);

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
    dummy.position.set(k.x - 0.023, 0.163 - drop, k.z - 0.019);
    dummy.scale.set(0.025, 0.002, 0.007);
    dummy.updateMatrix();
    legends.current.setMatrixAt(j, dummy.matrix);
  };

  useLayoutEffect(() => {
    KEYS.forEach((_, i) => place(i, 0));
    caps.current.instanceMatrix.needsUpdate = true;
    caps.current.instanceColor.needsUpdate = true;
    legends.current.instanceMatrix.needsUpdate = true;
    caps.current.computeBoundingSphere();
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
      <instancedMesh ref={legends} args={[legendGeometry, undefined, LEGEND_KEYS.length]}>
        <meshStandardMaterial color="#c7d0ce" roughness={0.75} />
      </instancedMesh>
    </>,
    anchor,
  );
}
