import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useAnimations, useGLTF } from "@react-three/drei";
import { PMREMGenerator, Vector3 } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

const MODEL_URL = "/models/shiv-desk.glb";

/**
 * Framing. The desk sits centered below the hero headline, viewed from just
 * above eye level. Dragging spins the scene around the vertical axis through
 * CAMERA_TARGET; the elevation stays fixed at POLAR_ANGLE.
 */
const CAMERA_TARGET = new Vector3(0, 1.9, 0);
const VIEW_DIRECTION = new Vector3(0.927, 0.087, -0.367).normalize();
const CAMERA_DISTANCE = 4.9;
const POLAR_ANGLE = Math.acos(VIEW_DIRECTION.y);
/** Portrait canvases pull the camera back so the whole desk stays in frame. */
const WIDE_ASPECT = 1.2;
const NARROW_DISTANCE_FACTOR = 1.7;

function cameraPosition(aspect: number) {
  const distance = CAMERA_DISTANCE * (aspect < WIDE_ASPECT ? NARROW_DISTANCE_FACTOR : 1);
  return CAMERA_TARGET.clone().addScaledVector(VIEW_DIRECTION, distance);
}

/** Loads the animated desk scene and plays its eight-second typing loop. */
function DeskModel() {
  const { scene, animations } = useGLTF(MODEL_URL);
  const { actions } = useAnimations(animations, scene);

  useEffect(() => {
    const clipName = animations[0]?.name;
    const action = clipName ? actions[clipName] : undefined;
    action?.reset().play();
    return () => {
      action?.stop();
    };
  }, [actions, animations]);

  return <primitive object={scene} />;
}

/** Re-frames the camera when the canvas switches between wide and portrait. */
function CameraRig() {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.viewport.aspect);
  const wide = aspect >= WIDE_ASPECT;

  useEffect(() => {
    camera.position.copy(cameraPosition(wide ? WIDE_ASPECT : 0));
    camera.lookAt(CAMERA_TARGET);
  }, [camera, wide]);

  return null;
}

/** Soft studio reflections generated locally, so no HDR download is needed. */
function StudioEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const room = new RoomEnvironment();
    const environment = pmrem.fromScene(room, 0.07);
    room.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.35;
    pmrem.dispose();
    return () => {
      scene.environment = null;
      environment.dispose();
    };
  }, [gl, scene]);

  return null;
}

export default function ShivDesk({ className }: { className?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "150px" },
    );
    observer.observe(container);

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => setReducedMotion(motionQuery.matches);
    onMotionChange();
    motionQuery.addEventListener("change", onMotionChange);

    const onVisibilityChange = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const animate = inView && pageVisible && !reducedMotion;

  return (
    <div
      ref={host}
      className={className}
      role="img"
      aria-label="Shiv in glasses and a fitted graphite polo, typing at his dual-monitor walnut desk with a mint cat bottle. Drag to rotate."
      style={{ width: "100%", height: "100%" }}
    >
      <Canvas
        frameloop={animate ? "always" : "demand"}
        dpr={[1, 1.5]}
        camera={{ fov: 34, near: 0.01, far: 40, position: cameraPosition(WIDE_ASPECT).toArray() }}
        gl={{ alpha: true, antialias: true, toneMappingExposure: 1.1 }}
      >
        <hemisphereLight args={["#9cb4c6", "#121416", 0.75]} />
        <directionalLight color="#dfe9ef" intensity={2.7} position={[2, 6, 4]} />
        <directionalLight color="#76bdcc" intensity={1.8} position={[-4, 3, -3]} />
        <directionalLight color="#e65f2b" intensity={1.6} position={[-2, 3, 4]} />
        <CameraRig />
        <StudioEnvironment />
        <OrbitControls
          target={CAMERA_TARGET}
          enableZoom={false}
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minPolarAngle={POLAR_ANGLE}
          maxPolarAngle={POLAR_ANGLE}
        />
        <Suspense fallback={null}>
          <DeskModel />
        </Suspense>
      </Canvas>
    </div>
  );
}
