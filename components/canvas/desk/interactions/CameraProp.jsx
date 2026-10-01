import { useEffect, useMemo, useRef } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { gsap } from "@/libs/gsap";
import { dispatchDesk, useDesk } from "../useDesk";
import { PHOTO_URL, heldPose } from "../lib/cameraProp.mjs";
import { drawCameraScreen } from "./cameraScreen";
import { useHoverLift } from "./useHoverLift";
import HitProxy from "./HitProxy";

const X_AXIS = new Vector3(1, 0, 0);
const BODY_CENTER = new Vector3(0, 0.2, 0);
const spin = new Quaternion();
const parentQuat = new Quaternion();

// Shiv's camera: click it on the desk and it flips up to face you, showing a
// Sony-style menu; its "Open Photos" row opens the photography site.
export default function CameraProp({ node }) {
  const mode = useDesk((s) => s.mode);
  const held = mode === "camera";
  const viewer = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  // Tint only: this component owns the node's position while it moves.
  const hover = useHoverLift(node, { enabled: mode === "desk", cursor: "pointer", lift: 0 });
  const screen = useMemo(() => drawCameraScreen(), []);
  const rest = useMemo(
    () => ({ position: node.position.clone(), quaternion: node.quaternion.clone() }),
    [node],
  );
  const anim = useRef({ t: 0 });

  useEffect(() => () => screen.dispose(), [screen]);

  useEffect(() => {
    const a = anim.current;
    const sync = () => {
      const t = a.t;
      const world = heldPose(viewer, { width: 0.72, screenShare: 0.42, pivot: BODY_CENTER });
      const local = node.parent.worldToLocal(world.position.clone());
      node.parent.getWorldQuaternion(parentQuat);
      const localQuat = parentQuat.clone().invert().multiply(world.quaternion);
      node.position.lerpVectors(rest.position, local, t);
      node.position.y += Math.sin(Math.PI * t) * 0.5;
      node.quaternion.slerpQuaternions(rest.quaternion, localQuat, t);
      // One full roll on the way up/down: the "flip".
      node.quaternion.multiply(spin.setFromAxisAngle(X_AXIS, Math.PI * 2 * t));
      invalidate();
    };
    const tween = gsap.to(a, { t: held ? 1 : 0, duration: 0.9, ease: "power3.inOut", onUpdate: sync });
    return () => tween.kill();
  }, [held, node, rest, viewer, invalidate]);

  return (
    <>
      {mode === "desk" && (
        <HitProxy
          node={node}
          {...hover}
          hovered={undefined}
          onClick={(event) => {
            event.stopPropagation();
            dispatchDesk({ type: "openCamera" });
          }}
        />
      )}
      {createPortal(
        <mesh
          position={[0.05, 0.19, -0.1215]}
          rotation={[0, Math.PI, 0]}
          onClick={(event) => {
            if (!held) return;
            event.stopPropagation();
            window.open(PHOTO_URL, "_blank", "noopener,noreferrer");
          }}
          onPointerOver={() => {
            if (held) gl.domElement.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            gl.domElement.style.cursor = "";
          }}
        >
          <planeGeometry args={[0.46, 0.2875]} />
          <meshBasicMaterial map={screen} toneMapped={false} side={DoubleSide} />
        </mesh>,
        node,
      )}
    </>
  );
}
