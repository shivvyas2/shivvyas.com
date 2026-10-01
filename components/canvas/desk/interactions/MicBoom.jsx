import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Plane, Vector3 } from "three";
import { useDesk } from "../useDesk";
import { springStep } from "../lib/deskMath.mjs";
import { solveMicArm } from "../lib/micIk.mjs";
import { useHoverLift } from "./useHoverLift";
import { useDeskDrag } from "./useDeskDrag";
import HitProxy from "./HitProxy";

// Slightly under-damped so the arm lags the hand and bounces when let go.
const SPRING = { stiffness: 140, damping: 12 };
const JOINTS = ["yaw", "lower", "upper", "head"];

export default function MicBoom({ nodes }) {
  const base = nodes.Interactive_Mic_Base;
  const lower = nodes.Interactive_Mic_Lower;
  const upper = nodes.Interactive_Mic_Upper;
  const head = nodes.Interactive_Mic_Head;
  const enabled = useDesk((s) => s.mode === "desk");
  const invalidate = useThree((s) => s.invalidate);
  const hover = useHoverLift(head, { lift: 0, enabled, cursor: "grab" });
  const hit = useMemo(() => new Vector3(), []);
  const plane = useMemo(() => {
    const world = head.getWorldPosition(new Vector3());
    return new Plane(new Vector3(0, 1, 0), -world.y);
  }, [head]);
  const sim = useRef({
    joints: Object.fromEntries(JOINTS.map((k) => [k, { value: 0, velocity: 0 }])),
    target: { yaw: 0, lower: 0, upper: 0, head: 0 },
  });

  const { onPointerDown } = useDeskDrag({
    enabled,
    onMove: (ray) => {
      if (!ray.intersectPlane(plane, hit)) return;
      const local = base.parent.worldToLocal(hit.clone()).sub(base.position);
      sim.current.target = solveMicArm({ x: local.x, z: local.z });
      invalidate();
    },
  });

  useFrame((_, delta) => {
    const s = sim.current;
    let moving = false;
    for (const k of JOINTS) {
      s.joints[k] = springStep(s.joints[k], s.target[k], delta, SPRING);
      if (Math.abs(s.joints[k].velocity) > 1e-4 || Math.abs(s.joints[k].value - s.target[k]) > 1e-4)
        moving = true;
    }
    base.rotation.y = s.joints.yaw.value;
    lower.rotation.x = -s.joints.lower.value;
    upper.rotation.x = -s.joints.upper.value;
    head.rotation.x = -s.joints.head.value;
    if (moving) invalidate();
  });

  return <HitProxy node={head} padding={0.08} {...hover} hovered={undefined} onPointerDown={onPointerDown} />;
}
