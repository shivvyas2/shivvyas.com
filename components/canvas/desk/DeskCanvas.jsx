import { Suspense, lazy, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Lightformer, OrbitControls, useProgress } from "@react-three/drei";
import DeskModel from "./DeskModel";
import { dispatchDesk, useDesk } from "./useDesk";
import { heroLook } from "./CameraDirector";

const DeskInteractions = lazy(() => import("./interactions"));
const prefetchInteractions = () => import("./interactions");

// Compiles every shader without blocking the main thread (KHR_parallel_shader_compile)
// so the intro can lift as soon as the model is parsed and the hero fades in clean.
function WarmUp({ onWarm }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    const done = () => alive && onWarm?.();
    const task = gl.compileAsync ? gl.compileAsync(scene, camera) : Promise.resolve(gl.compile(scene, camera));
    task.then(done, done);
    return () => {
      alive = false;
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}

function SceneReady({ onReady }) {
  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);
  return null;
}

function Kick({ deps }) {
  const invalidate = useThree((s) => s.invalidate);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => invalidate(), deps);
  return null;
}

export default function DeskCanvas({ onReady, onProgress, onWarm, active }) {
  const [isMobile, setIsMobile] = useState(false);
  const mode = useDesk((s) => s.mode);
  const transitioning = useDesk((s) => s.transitioning);
  const progress = useProgress((s) => s.progress);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    if (mode !== "hero") setInteractive(true);
  }, [mode]);

  useEffect(() => onProgress(progress), [progress, onProgress]);

  // If the canvas goes away (scene error, reduced-motion switch) mid-desk,
  // release the page: never leave scroll locked behind a missing scene.
  useEffect(() => () => dispatchDesk({ type: "reset" }), []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 600px), (pointer: coarse)");
    const update = () => {
      setIsMobile(query.matches);
      dispatchDesk({ type: "setMobile", mobile: query.matches });
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const orbit = !isMobile && mode === "hero" && !transitioning;

  return (
    <Canvas
      frameloop="demand"
      shadows={isMobile ? "basic" : true}
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [3.4, 4, 10], fov: 36, near: 0.1, far: 80 }}
      gl={{ powerPreference: isMobile ? "low-power" : "high-performance", antialias: true }}
      style={{ touchAction: mode === "hero" ? "manipulation" : "none" }}
    >
      <Kick deps={[active, mode]} />
      {orbit && (
        <OrbitControls
          makeDefault
          target={heroLook.current ?? undefined}
          enableZoom={false}
          enablePan={false}
          minAzimuthAngle={-0.35}
          maxAzimuthAngle={0.55}
          minPolarAngle={1.02}
          maxPolarAngle={1.43}
          rotateSpeed={0.45}
        />
      )}
      <hemisphereLight intensity={1.1} color="#e9edf4" groundColor="#38251b" />
      <directionalLight
        position={[-3, 7, 5]}
        intensity={3.2}
        color="#fff1df"
        castShadow={!isMobile}
        shadow-mapSize={isMobile ? 512 : 1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[4, 3, -3]} intensity={2} color="#e0e9f6" />
      <pointLight position={[-3, 1, -2]} intensity={4} color="#f47734" distance={9} />
      <Suspense fallback={null}>
        <Environment resolution={isMobile ? 64 : 128} frames={1}>
          <Lightformer form="rect" intensity={2.5} position={[0, 5, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 5, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-5, 2, 1]} rotation={[0, Math.PI / 2, 0]} scale={[4, 5, 1]} />
        </Environment>
        <DeskModel isMobile={isMobile} active={active} onHoverDesk={prefetchInteractions}>
          {(nodes) =>
            interactive && (
              <Suspense fallback={null}>
                <DeskInteractions nodes={nodes} isMobile={isMobile} />
              </Suspense>
            )
          }
        </DeskModel>
        <WarmUp onWarm={onWarm} />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
