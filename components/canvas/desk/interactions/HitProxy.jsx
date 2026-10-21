import { useEffect, useMemo, useState } from "react";
import { createPortal } from "@react-three/fiber";
import { Box3, Vector3 } from "three";
import { ObjectCue } from "../DeskAffordances";
import { useDesk } from "../useDesk";

const CUE_DELAY = { Interactive_Diary: 0.2, Interactive_Camera: 0.9, Interactive_Mouse: 1.6, Interactive_Mic_Head: 2.3 };

// Pointer target for a GLTF node: an invisible box (three raycasts invisible
// meshes; nothing is drawn) sized to the node's own merged meshes.
export default function HitProxy({ node, padding = 0.04, ...handlers }) {
  const [hovered, setHovered] = useState(false);
  const enabled = useDesk((s) => s.mode === "desk" && !s.mobile && !s.transitioning);
  useEffect(() => {
    if (!enabled) setHovered(false);
  }, [enabled]);
  const { center, size } = useMemo(() => {
    const box = new Box3();
    for (const child of node.children) {
      if (!child.isMesh) continue;
      child.geometry.computeBoundingBox();
      box.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrix));
    }
    return {
      center: box.getCenter(new Vector3()),
      size: box.getSize(new Vector3()).addScalar(padding * 2),
    };
  }, [node, padding]);

  return createPortal(
    <group>
      {enabled && (
        <mesh
          position={center}
          visible={false}
          {...handlers}
          onPointerOver={(event) => {
            setHovered(true);
            handlers.onPointerOver?.(event);
          }}
          onPointerOut={(event) => {
            setHovered(false);
            handlers.onPointerOut?.(event);
          }}
        >
          <boxGeometry args={size.toArray()} />
        </mesh>
      )}
      <ObjectCue
        position={[center.x, center.y + size.y / 2 - padding, center.z]}
        delay={CUE_DELAY[node.name] ?? 0}
        hovered={enabled && hovered}
      />
    </group>,
    node,
  );
}
