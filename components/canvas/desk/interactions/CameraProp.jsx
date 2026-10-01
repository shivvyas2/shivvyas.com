import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, useThree } from "@react-three/fiber";
import { DoubleSide, Quaternion, Vector3 } from "three";
import { gsap } from "@/libs/gsap";
import { dispatchDesk, useDesk } from "../useDesk";
import {
  CAMERA_BACK,
  CAMERA_BUTTONS,
  CAMERA_FRONT,
  CAMERA_LCD,
  CAMERA_SHUTTER,
  PHOTO_URL,
  heldPose,
} from "../lib/cameraProp.mjs";
import { INITIAL_CAMERA_UI, pressCameraButton, rowAt } from "../lib/cameraUi.mjs";
import { createCameraScreen, drawCameraFront, drawCameraLegends } from "./cameraScreen";
import { deskAudio } from "./deskAudio";
import { useHoverLift } from "./useHoverLift";
import HitProxy from "./HitProxy";

const X_AXIS = new Vector3(1, 0, 0);
const BODY_CENTER = new Vector3(0, 0.2, 0);
const spin = new Quaternion();
const parentQuat = new Quaternion();
const local = new Vector3();
const BACK_Z = CAMERA_BACK.labelZ - 0.002; // hit targets sit just proud of the legends

const openPhotos = () => window.open(PHOTO_URL, "_blank", "noopener,noreferrer");

// Which way a click on the control wheel points: its centre button or one of
// the four presses around the rim.
function wheelDirection(node, point, wheel) {
  node.worldToLocal(local.copy(point));
  // The back faces -Z, so +X in body space is the viewer's left.
  const dx = wheel.x - local.x;
  const dy = local.y - wheel.y;
  if (Math.hypot(dx, dy) < wheel.r * 0.5) return "center";
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? "right" : "left";
  return dy > 0 ? "up" : "down";
}

// Shiv's camera: click it on the desk and it flips up to face you. Its
// buttons work: MENU, the control wheel, playback (Shiv's photos), Fn, DISP,
// trash, the shutter, and the touch screen; OK on "Open Photos" or in
// playback opens the photography site.
export default function CameraProp({ node }) {
  const mode = useDesk((s) => s.mode);
  const held = mode === "camera";
  const viewer = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  // Tint only: this component owns the node's position while it moves.
  const hover = useHoverLift(node, { enabled: mode === "desk", cursor: "pointer", lift: 0 });
  const screen = useMemo(() => createCameraScreen(), []);
  const legends = useMemo(() => drawCameraLegends(), []);
  const front = useMemo(() => drawCameraFront(), []);
  const [ui, setUi] = useState(INITIAL_CAMERA_UI);
  const rest = useMemo(
    () => ({ position: node.position.clone(), quaternion: node.quaternion.clone() }),
    [node],
  );
  const anim = useRef({ t: 0 });
  const light = useRef(null);

  useEffect(
    () => () => {
      screen.dispose();
      legends.dispose();
      front.dispose();
    },
    [screen, legends, front],
  );

  useEffect(() => {
    if (held) screen.loadPhotos(invalidate);
    else setUi(INITIAL_CAMERA_UI);
  }, [held, screen, invalidate]);

  // Redraw the LCD for every UI change; a new shot also fades a white flash.
  const lastShots = useRef(0);
  useEffect(() => {
    if (ui.shots !== lastShots.current) {
      lastShots.current = ui.shots;
      const flash = { v: 1 };
      const tween = gsap.to(flash, {
        v: 0,
        duration: 0.35,
        ease: "power2.out",
        onUpdate: () => {
          screen.render(ui, flash.v);
          invalidate();
        },
      });
      return () => tween.kill();
    }
    screen.render(ui);
    invalidate();
    if (!ui.toast) return undefined;
    const timer = window.setTimeout(() => setUi((current) => (current === ui ? { ...ui, toast: null } : current)), 1400);
    return () => window.clearTimeout(timer);
  }, [ui, screen, invalidate]);

  const press = (button) => {
    deskAudio[button === "shutter" ? "shutter" : "button"]();
    const next = pressCameraButton(ui, button);
    if (next.open) openPhotos();
    const { open, ...state } = next;
    setUi(state);
  };

  useEffect(() => {
    const a = anim.current;
    const sync = () => {
      const t = a.t;
      const world = heldPose(viewer, { width: 0.72, screenShare: 0.42, pivot: BODY_CENTER });
      const target = node.parent.worldToLocal(world.position.clone());
      node.parent.getWorldQuaternion(parentQuat);
      const localQuat = parentQuat.clone().invert().multiply(world.quaternion);
      node.position.lerpVectors(rest.position, target, t);
      node.position.y += Math.sin(Math.PI * t) * 0.5;
      node.quaternion.slerpQuaternions(rest.quaternion, localQuat, t);
      // One full roll on the way up/down: the "flip".
      node.quaternion.multiply(spin.setFromAxisAngle(X_AXIS, Math.PI * 2 * t));
      // The desk lights come from above; light the back while it is held so
      // the buttons and dials read.
      if (light.current) light.current.intensity = t * 0.95;
      invalidate();
    };
    const tween = gsap.to(a, { t: held ? 1 : 0, duration: 0.9, ease: "power3.inOut", onUpdate: sync });
    return () => tween.kill();
  }, [held, node, rest, viewer, invalidate]);

  const pointer = {
    onPointerOver: (event) => {
      if (!held) return;
      event.stopPropagation();
      gl.domElement.style.cursor = "pointer";
    },
    onPointerOut: () => {
      gl.domElement.style.cursor = "";
    },
  };

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
      {/* One portal for everything parented to the camera: two portals into
          the same node get their children mixed up by the reconciler. */}
      {createPortal(
        <>
          <pointLight ref={light} position={[0.05, 0.32, -0.9]} intensity={0} distance={2.4} color="#fff4ea" />
          <mesh
            position={[0, CAMERA_BACK.height / 2, CAMERA_BACK.labelZ]}
            rotation={[0, Math.PI, 0]}
            raycast={() => null}
            renderOrder={2}
          >
            <planeGeometry args={[CAMERA_BACK.width, CAMERA_BACK.height]} />
            <meshBasicMaterial map={legends} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh position={[CAMERA_FRONT.x, CAMERA_FRONT.y, CAMERA_FRONT.z]} raycast={() => null}>
            <planeGeometry args={[CAMERA_FRONT.width, CAMERA_FRONT.height]} />
            <meshBasicMaterial map={front} transparent depthWrite={false} toneMapped={false} />
          </mesh>
          <mesh
            position={[CAMERA_LCD.x, CAMERA_LCD.y, CAMERA_LCD.z]}
            rotation={[0, Math.PI, 0]}
            onClick={(event) => {
              if (!held) return;
              event.stopPropagation();
              if (ui.screen === "menu") {
                const row = rowAt(1 - event.uv.y);
                if (row < 0) return;
                deskAudio.button();
                const selected = { ...ui, row, toast: null };
                if (row === ui.row && pressCameraButton(selected, "center").open) openPhotos();
                setUi(selected);
              } else if (ui.screen === "playback") {
                press(event.uv.x < 0.25 ? "left" : event.uv.x > 0.75 ? "right" : "center");
              }
            }}
            {...pointer}
          >
            <planeGeometry args={[CAMERA_LCD.width, CAMERA_LCD.height]} />
            <meshBasicMaterial map={screen.texture} toneMapped={false} side={DoubleSide} />
          </mesh>
          {CAMERA_BUTTONS.map((button) => (
            <mesh
              key={button.id}
              position={[button.x, button.y, BACK_Z]}
              rotation={[Math.PI / 2, 0, 0]}
              visible={false}
              onClick={(event) => {
                if (!held) return;
                event.stopPropagation();
                press(button.id === "wheel" ? wheelDirection(node, event.point, button) : button.id);
              }}
              {...pointer}
            >
              <cylinderGeometry args={[button.r, button.r, 0.01, 20]} />
            </mesh>
          ))}
          <mesh
            position={[CAMERA_SHUTTER.x, CAMERA_SHUTTER.y, CAMERA_SHUTTER.z]}
            visible={false}
            onClick={(event) => {
              if (!held) return;
              event.stopPropagation();
              press("shutter");
            }}
            {...pointer}
          >
            <cylinderGeometry args={[CAMERA_SHUTTER.r, CAMERA_SHUTTER.r, 0.05, 20]} />
          </mesh>
        </>,
        node,
      )}
    </>
  );
}
