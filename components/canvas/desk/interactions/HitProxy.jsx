import { useMemo } from "react";
import { createPortal } from "@react-three/fiber";
import { Box3, Vector3 } from "three";

// Pointer target for a GLTF node: an invisible box (three raycasts invisible
// meshes; nothing is drawn) sized to the node's own merged meshes.
export default function HitProxy({ node, padding = 0.04, ...handlers }) {
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
    <mesh position={center} visible={false} {...handlers}>
      <boxGeometry args={size.toArray()} />
    </mesh>,
    node,
  );
}
