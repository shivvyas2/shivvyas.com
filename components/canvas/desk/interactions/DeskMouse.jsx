import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { useDesk } from "../useDesk";
import { clampToRect, springStep } from "../lib/deskMath.mjs";
import { tiltTarget } from "../lib/drag.mjs";
import { useHoverLift } from "./useHoverLift";
import { useDeskDrag } from "./useDeskDrag";
import HitProxy from "./HitProxy";
import { deskAudio } from "./deskAudio";

const BOUNDS = { minX: -2.25, maxX: 2.65, minZ: -0.15, maxZ: 1.38 };
const FOLLOW = { stiffness: 300, damping: 2 * Math.sqrt(300) };
const WOBBLE = { stiffness: 180, damping: 9 };

export default function DeskMouse({ node }) {
  const enabled = useDesk((s) => s.mode === "desk");
  const invalidate = useThree((s) => s.invalidate);
  const hover = useHoverLift(node, { enabled, cursor: "grab" });
  const hit = useMemo(() => new Vector3(), []);
  const plane = useMemo(() => {
    const world = node.getWorldPosition(new Vector3());
    return new Plane(new Vector3(0, 1, 0), -world.y);
  }, [node]);
  const sim = useRef({
    x: { value: node.position.x, velocity: 0 },
    z: { value: node.position.z, velocity: 0 },
    tx: { value: 0, velocity: 0 },
    tz: { value: 0, velocity: 0 },
    target: { x: node.position.x, z: node.position.z },
    base: node.rotation.clone(),
    dragging: false,
  });

  const { onPointerDown } = useDeskDrag({
    enabled,
    onStart: () => {
      sim.current.dragging = true;
    },
    onMove: (ray) => {
      if (!ray.intersectPlane(plane, hit)) return;
      const local = node.parent.worldToLocal(hit.clone());
      sim.current.target = clampToRect({ x: local.x, z: local.z }, BOUNDS);
      invalidate();
    },
    onEnd: () => {
      sim.current.dragging = false;
      deskAudio.stopFriction();
      invalidate();
    },
  });

  useFrame((_, delta) => {
    const s = sim.current;
    s.x = springStep(s.x, s.target.x, delta, FOLLOW);
    s.z = springStep(s.z, s.target.z, delta, FOLLOW);
    const tilt = s.dragging ? tiltTarget(s.x.velocity, s.z.velocity) : { x: 0, z: 0 };
    s.tx = springStep(s.tx, tilt.x, delta, WOBBLE);
    s.tz = springStep(s.tz, tilt.z, delta, WOBBLE);
    node.position.x = s.x.value;
    node.position.z = s.z.value;
    node.rotation.x = s.base.x + s.tx.value;
    node.rotation.z = s.base.z + s.tz.value;
    const speed = Math.hypot(s.x.velocity, s.z.velocity);
    if (s.dragging) deskAudio.friction(speed / 3);
    const settling =
      speed > 1e-3 ||
      Math.abs(s.tx.value) + Math.abs(s.tz.value) > 1e-4 ||
      Math.abs(s.x.value - s.target.x) + Math.abs(s.z.value - s.target.z) > 1e-4;
    if (settling) invalidate();
  });

  return <HitProxy node={node} {...hover} hovered={undefined} onPointerDown={onPointerDown} />;
}
