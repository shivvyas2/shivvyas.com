import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace } from "three";
import { springStep } from "./lib/deskMath.mjs";
import { DESK_LIFT, deskHeightCm, liftProgress } from "./lib/standingDesk.mjs";

const FLOOR_Y = -3.4;
const LEG_X = [-2.77, 2.77];
const OUTER_TOP = -1.55;
const INNER_TOP = -0.46; // under the frame brackets

function heightDisplay() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 112;
  const g = canvas.getContext("2d");
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  const draw = (cm) => {
    g.fillStyle = "#07090a";
    g.fillRect(0, 0, 256, 112);
    g.fillStyle = "#ff6a1a";
    g.font = '700 72px "SF Mono", Menlo, Consolas, monospace';
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(cm.toFixed(1), 128, 60);
    texture.needsUpdate = true;
  };
  return { texture, draw };
}

// The desk is a dual-motor standing desk: scrolling the hero raises the
// worktop (and everything on it, wrapped in `lift`) on telescoping legs, and
// the controller reads out the height. Returns the display for LiftingParts.
export function useStandingDesk(lift, enabled) {
  const invalidate = useThree((s) => s.invalidate);
  const display = useMemo(() => heightDisplay(), []);
  const state = useRef({ target: 0, spring: { value: 0, velocity: 0 }, shown: -1 });

  useEffect(() => () => display.texture.dispose(), [display]);

  useEffect(() => {
    const onScroll = () => {
      state.current.target = enabled ? liftProgress(window.scrollY, window.innerHeight) : 0;
      invalidate();
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [enabled, invalidate]);

  useFrame((_, delta) => {
    const s = state.current;
    s.spring = springStep(s.spring, s.target, Math.min(delta, 0.05), { stiffness: 70, damping: 16 });
    if (lift.current) lift.current.position.y = s.spring.value * DESK_LIFT;
    const cm = deskHeightCm(s.spring.value);
    if (Math.abs(cm - s.shown) >= 0.1) {
      s.shown = cm;
      display.draw(cm);
    }
    if (Math.abs(s.spring.value - s.target) > 1e-4 || Math.abs(s.spring.velocity) > 1e-4) invalidate();
  });

  return display;
}

// Feet and outer columns: they stand on the floor and never move.
export function FixedLegs() {
  const outer = OUTER_TOP - FLOOR_Y;
  return LEG_X.map((x) => (
    <group key={x}>
      <mesh position={[x, FLOOR_Y + 0.05, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.1, 2.3]} />
        <meshStandardMaterial color="#1d1f22" roughness={0.55} metalness={0.3} />
      </mesh>
      <mesh position={[x, FLOOR_Y + outer / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, outer, 0.15]} />
        <meshStandardMaterial color="#26292d" roughness={0.45} metalness={0.4} />
      </mesh>
    </group>
  ));
}

// Parts that ride up with the worktop: the inner leg stages (long enough to
// stay sleeved in the outer columns at full lift) and the height display.
export function LiftingParts({ display }) {
  const length = INNER_TOP - (OUTER_TOP - DESK_LIFT - 0.25);
  return (
    <>
      {LEG_X.map((x) => (
        <mesh key={x} position={[x, INNER_TOP - length / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, length, 0.12]} />
          <meshStandardMaterial color="#3a3e43" roughness={0.35} metalness={0.55} />
        </mesh>
      ))}
      <mesh position={[2.545, -0.2, 1.4355]}>
        <planeGeometry args={[0.13, 0.057]} />
        <meshBasicMaterial map={display.texture} toneMapped={false} />
      </mesh>
    </>
  );
}
