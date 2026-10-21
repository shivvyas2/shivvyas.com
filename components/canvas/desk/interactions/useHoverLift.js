import { useCallback, useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { springStep } from "../lib/deskMath.mjs";
import { useDesk } from "../useDesk";

const WARM = [0.96, 0.47, 0.2];

export function useHoverLift(object, { lift = 0.03, enabled = true, cursor = "grab" } = {}) {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const ready = useDesk((s) => s.mode === "desk" && !s.transitioning && !s.mobile);
  const canHover = enabled && ready;
  const hovered = useRef(false);
  const state = useRef({ spring: { value: 0, velocity: 0 }, baseY: 0, materials: [] });
  const releaseHover = useCallback(() => {
    if (hovered.current && gl.domElement.style.cursor === cursor) gl.domElement.style.cursor = "";
    hovered.current = false;
    invalidate();
  }, [cursor, gl, invalidate]);

  useEffect(() => {
    if (!object) return;
    const materials = [];
    // GLTFLoader shares one material per glTF material across nodes; clone so
    // tinting this object never tints the static desk parts.
    object.traverse((child) => {
      if (!child.isMesh) return;
      child.material = child.material.clone();
      materials.push(child.material);
    });
    state.current.materials = materials;
    state.current.baseY = object.position.y;
  }, [object]);

  useFrame((_, delta) => {
    if (!object) return;
    const s = state.current;
    const target = hovered.current && canHover ? 1 : 0;
    s.spring = springStep(s.spring, target, delta, { stiffness: 220, damping: 2 * Math.sqrt(220) });
    if (lift) object.position.y = s.baseY + s.spring.value * lift;
    for (const material of s.materials)
      material.emissive?.setRGB(...WARM).multiplyScalar(0.18 * s.spring.value);
    if (Math.abs(s.spring.value - target) > 1e-3) invalidate();
  });

  useEffect(() => {
    if (!canHover) releaseHover();
    invalidate();
  }, [canHover, invalidate, releaseHover]);
  useEffect(() => releaseHover, [releaseHover]);

  return {
    hovered,
    onPointerOver: (event) => {
      if (!canHover || gl.domElement.style.cursor === "grabbing") return;
      event.stopPropagation();
      hovered.current = true;
      gl.domElement.style.cursor = cursor;
      invalidate();
    },
    onPointerOut: releaseHover,
  };
}
