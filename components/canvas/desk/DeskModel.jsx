import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { Box3 } from "three";
import CameraDirector from "./CameraDirector";
import Keycaps from "./Keycaps";
import { FixedLegs, LiftingParts, useStandingDesk } from "./StandingDesk";
import { applyMonitorScreens } from "./interactions/monitorScreens";
import { dispatchDesk, useDesk } from "./useDesk";
import { springStep } from "./lib/deskMath.mjs";

import { MODEL_URL } from "./modelUrl";
const DRIFT = 0.0105; // ±0.6°
const DRIFT_PERIOD = 8;

export default function DeskModel({ isMobile, active, onHoverDesk, children }) {
  const { scene, nodes } = useGLTF(MODEL_URL);
  const drift = useRef(null);
  const rim = useRef(null);
  const hover = useRef({ on: false, spring: { value: 0, velocity: 0 } });
  const mode = useDesk((s) => s.mode);
  const drifting = active && mode === "hero";
  const invalidate = useThree((s) => s.invalidate);
  const lift = useRef(null);
  const deskDisplay = useStandingDesk(lift, active && mode === "hero");

  useEffect(() => {
    scene.traverse((part) => {
      if (part.isMesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
  }, [scene]);

  // Left monitor: Cursor with the desk's own source. Right: Xcode split with
  // the iOS Simulator running Life OS. Laptop: Cursor running the build.
  const screens = useRef(null);
  useEffect(() => {
    screens.current = applyMonitorScreens(scene, invalidate);
    invalidate();
    return () => screens.current?.dispose();
  }, [scene, invalidate]);

  // The laptop terminal replays the site build while the desk is on screen.
  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      if (screens.current?.tick()) invalidate();
    }, 110);
    return () => window.clearInterval(timer);
  }, [active, invalidate]);

  const bounds = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    return new Box3().setFromObject(scene);
  }, [scene]);
  const diaryAnchor = nodes.Interactive_Diary;

  useFrame((state, delta) => {
    let busy = false;
    if (drift.current) {
      const target = drifting
        ? Math.sin((state.clock.elapsedTime / DRIFT_PERIOD) * Math.PI * 2) *
          DRIFT
        : 0;
      drift.current.rotation.y +=
        (target - drift.current.rotation.y) * Math.min(1, delta * 4);
      busy = drifting || Math.abs(drift.current.rotation.y) > 1e-4;
    }
    const h = hover.current;
    h.spring = springStep(h.spring, h.on && mode === "hero" ? 1 : 0, delta, {
      stiffness: 60,
      damping: 15.5,
    });
    if (rim.current) rim.current.intensity = h.spring.value * 2.5;
    if (busy || Math.abs(h.spring.velocity) > 1e-3) state.invalidate();
  });

  return (
    <>
      <CameraDirector
        bounds={bounds}
        isMobile={isMobile}
        diaryAnchor={diaryAnchor}
      />
      <pointLight
        ref={rim}
        position={[0, 1.2, 2.2]}
        color="#f47734"
        distance={7}
        intensity={0}
      />
      <group ref={drift}>
        <FixedLegs />
        {/* Everything on and under the worktop rises with the standing desk. */}
        <group ref={lift}>
          <primitive object={scene} />
          <mesh
            position={[0, 0.02, 0.18]}
            rotation={[-Math.PI / 2, 0, 0]}
            onPointerOver={() => {
              hover.current.on = true;
              onHoverDesk?.();
            }}
            onPointerOut={() => {
              hover.current.on = false;
            }}
            onClick={(event) => {
              if (mode === "hero") {
                event.stopPropagation();
                dispatchDesk({ type: "enterDesk" });
              } else if (mode === "diary") {
                event.stopPropagation();
                dispatchDesk({ type: "closeDiary" });
              } else if (mode === "camera") {
                event.stopPropagation();
                dispatchDesk({ type: "closeCamera" });
              }
            }}
          >
            <planeGeometry args={[6.9, 2.8]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          {nodes.Interactive_Keyboard && (
            <Keycaps anchor={nodes.Interactive_Keyboard} />
          )}
          {children?.(nodes)}
          <LiftingParts display={deskDisplay} />
        </group>
      </group>
    </>
  );
}
