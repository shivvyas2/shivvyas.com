import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { CanvasTexture, SRGBColorSpace, Shape, ShapeGeometry } from "three";
import { springStep } from "./lib/deskMath.mjs";
import { DESK_LIFT, deskHeightCm, deskTarget, hold, liftProgress, nudge } from "./lib/standingDesk.mjs";

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
  const state = useRef({
    scroll: 0,
    manual: 0,
    holding: 0,
    heldFor: 0,
    target: 0,
    spring: { value: 0, velocity: 0 },
    shown: -1,
  });
  const retarget = () => {
    const s = state.current;
    s.target = deskTarget({ scroll: s.scroll, manual: s.manual });
    invalidate();
  };

  useEffect(() => () => display.texture.dispose(), [display]);

  useEffect(() => {
    const onScroll = () => {
      state.current.scroll = enabled ? liftProgress(window.scrollY, window.innerHeight) : 0;
      retarget();
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
    // Holding a button keeps the desk moving after the first step.
    if (s.holding) {
      s.heldFor += delta;
      if (s.heldFor > 0.3) {
        s.manual = hold(s.manual, s.holding, Math.min(delta, 0.05));
        s.target = deskTarget({ scroll: s.scroll, manual: s.manual });
      }
    }
    s.spring = springStep(s.spring, s.target, Math.min(delta, 0.05), { stiffness: 70, damping: 16 });
    if (lift.current) lift.current.position.y = s.spring.value * DESK_LIFT;
    const cm = deskHeightCm(s.spring.value);
    if (Math.abs(cm - s.shown) >= 0.1) {
      s.shown = cm;
      display.draw(cm);
    }
    if (s.holding || Math.abs(s.spring.value - s.target) > 1e-4 || Math.abs(s.spring.velocity) > 1e-4)
      invalidate();
  });

  // Up (+1) / down (-1) on the controller: a click is one step, holding
  // keeps going; both stop at the safe limits in standingDesk.mjs.
  const controls = useMemo(
    () => ({
      press(direction) {
        const s = state.current;
        s.manual = nudge(s.manual, direction);
        s.holding = direction;
        s.heldFor = 0;
        retarget();
      },
      release() {
        state.current.holding = 0;
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { display, controls };
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
const arrow = (() => {
  const shape = new Shape();
  shape.moveTo(0, 0.022);
  shape.lineTo(0.02, -0.012);
  shape.lineTo(-0.02, -0.012);
  shape.closePath();
  return new ShapeGeometry(shape);
})();

// The keypad hangs just past the worktop's front edge, tilted up toward the
// viewer like a real standing-desk controller: raise, lower, and the height.
const KEYPAD = { position: [2.25, -0.16, 1.56], tilt: -0.55 };
const KEYS = [
  { x: -0.28, direction: 1, label: "Raise the desk" },
  { x: -0.12, direction: -1, label: "Lower the desk" },
];

function Keypad({ display, controls, enabled }) {
  const gl = useThree((s) => s.gl);
  return (
    <group position={KEYPAD.position} rotation={[KEYPAD.tilt, 0, 0]}>
      <mesh castShadow>
        <boxGeometry args={[0.8, 0.15, 0.1]} />
        <meshStandardMaterial color="#121416" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0.2, 0, 0.051]}>
        <planeGeometry args={[0.26, 0.1]} />
        <meshBasicMaterial map={display.texture} toneMapped={false} />
      </mesh>
      {KEYS.map(({ x, direction }) => (
        <group key={x} position={[x, 0, 0.05]}>
          <mesh position={[0, 0, 0.008]}>
            <boxGeometry args={[0.12, 0.095, 0.016]} />
            <meshStandardMaterial color="#2a2d31" roughness={0.6} />
          </mesh>
          <mesh geometry={arrow} position={[0, 0, 0.0165]} rotation={[0, 0, direction > 0 ? 0 : Math.PI]}>
            <meshBasicMaterial color="#e8e6e1" toneMapped={false} />
          </mesh>
          {enabled && (
            <mesh
              visible={false}
              position={[0, 0, 0.02]}
              onPointerDown={(event) => {
                event.stopPropagation();
                event.target?.setPointerCapture?.(event.pointerId);
                controls.press(direction);
              }}
              onPointerUp={(event) => {
                event.stopPropagation();
                controls.release();
              }}
              onPointerLeave={() => controls.release()}
              onPointerCancel={() => controls.release()}
              onClick={(event) => event.stopPropagation()}
              onPointerOver={() => {
                gl.domElement.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                gl.domElement.style.cursor = "";
              }}
            >
              <boxGeometry args={[0.15, 0.13, 0.06]} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

export function LiftingParts({ display, controls, buttonsEnabled }) {
  const length = INNER_TOP - (OUTER_TOP - DESK_LIFT - 0.25);
  return (
    <>
      {LEG_X.map((x) => (
        <mesh key={x} position={[x, INNER_TOP - length / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.18, length, 0.12]} />
          <meshStandardMaterial color="#3a3e43" roughness={0.35} metalness={0.55} />
        </mesh>
      ))}
      <Keypad display={display} controls={controls} enabled={buttonsEnabled} />
    </>
  );
}
