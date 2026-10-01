import { useCallback, useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Raycaster, Vector2 } from "three";
import { createDrag } from "../lib/drag.mjs";

export function useDeskDrag({ enabled, onStart, onMove, onEnd }) {
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const raycaster = useMemo(() => new Raycaster(), []);
  const drag = useMemo(createDrag, []);
  const callbacks = useRef({ onStart, onMove, onEnd });
  callbacks.current = { onStart, onMove, onEnd };
  const cleanup = useRef(null);

  const end = useCallback(
    (pointerId) => {
      if (!drag.end(pointerId)) return;
      cleanup.current?.();
      cleanup.current = null;
      gl.domElement.style.cursor = "";
      callbacks.current.onEnd?.();
    },
    [drag, gl],
  );

  const onPointerDown = useCallback(
    (event) => {
      if (!enabled) return;
      event.stopPropagation();
      if (!drag.begin(event.pointerId)) return;
      const element = gl.domElement;
      const pointerId = event.pointerId;
      const ndc = new Vector2();
      const move = (e) => {
        if (!drag.owns(e.pointerId)) return;
        const rect = element.getBoundingClientRect();
        ndc.set(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        raycaster.setFromCamera(ndc, camera);
        callbacks.current.onMove(raycaster.ray);
      };
      const up = (e) => end(e.pointerId);
      const blur = () => end();
      element.addEventListener("pointermove", move);
      element.addEventListener("pointerup", up);
      element.addEventListener("pointercancel", up);
      element.addEventListener("lostpointercapture", up);
      window.addEventListener("blur", blur);
      try {
        element.setPointerCapture(pointerId);
      } catch {
        // Synthetic pointers cannot be captured; window listeners still end the drag.
      }
      cleanup.current = () => {
        element.removeEventListener("pointermove", move);
        element.removeEventListener("pointerup", up);
        element.removeEventListener("pointercancel", up);
        element.removeEventListener("lostpointercapture", up);
        window.removeEventListener("blur", blur);
        try {
          element.releasePointerCapture(pointerId);
        } catch {
          // already released
        }
      };
      element.style.cursor = "grabbing";
      callbacks.current.onStart?.();
      callbacks.current.onMove(event.ray);
    },
    [enabled, drag, gl, camera, raycaster, end],
  );

  useEffect(() => {
    if (!enabled) end();
  }, [enabled, end]);
  useEffect(() => () => end(), [end]);

  return { onPointerDown, drag };
}
