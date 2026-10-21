import { createContext, useContext } from "react";
import { Html } from "@react-three/drei";
import { Maximize2 } from "lucide-react";
import { dispatchDesk, useDesk } from "./useDesk";
import styles from "./DeskAffordances.module.scss";

// DOM cues follow their 3D anchors without adding any lights, geometry, or
// perpetual canvas renders. Decorative dots never intercept the real objects.
export const AffordanceContext = createContext(false);

export function DeskEntryCue({ hovered, onPointerEnter, onPointerLeave }) {
  const active = useContext(AffordanceContext);
  const visible = useDesk((s) => s.mode === "hero" && !s.mobile && !s.transitioning);
  if (!active || !visible) return null;

  return (
    <Html center position={[0, 0.26, 1.34]} zIndexRange={[3, 1]}>
      <button
        type="button"
        className={`${styles.entry} ${hovered ? styles.hovered : ""}`}
        aria-label="Explore Shiv's desk"
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.stopPropagation();
          dispatchDesk({ type: "enterDesk" });
        }}
      >
        <Maximize2 size={16} strokeWidth={1.7} aria-hidden="true" />
      </button>
    </Html>
  );
}

export function ObjectCue({ position, delay = 0, hovered = false }) {
  const active = useContext(AffordanceContext);
  const visible = useDesk((s) => s.mode === "desk" && !s.mobile && !s.transitioning);
  if (!active || !visible) return null;

  return (
    <Html center position={position} zIndexRange={[3, 1]} style={{ pointerEvents: "none" }}>
      <span
        className={`${styles.object} ${hovered ? styles.objectHovered : ""}`}
        style={{ "--cue-delay": `${delay}s` }}
        aria-hidden="true"
      />
    </Html>
  );
}
