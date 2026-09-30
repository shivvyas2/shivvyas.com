import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Box3, MathUtils, Vector3 } from "three";
import {
  Environment,
  Lightformer,
  OrbitControls,
  Preload,
  useGLTF,
  useProgress,
} from "@react-three/drei";

const DESK_CENTER = new Vector3(0, 0.12, 0.2);
const DESK_MIN = new Vector3(-3.25, 0, -1.35);
const DESK_MAX = new Vector3(3.2, 0, 1.5);

function SceneReady({ onReady }) {
  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);
  return null;
}

function getCameraTarget(camera, bounds, size, deskView, isMobile) {
  const center = deskView
    ? DESK_CENTER.clone()
    : bounds.getCenter(new Vector3());
  const direction = deskView
    ? new Vector3(0.08, 1, 0.11).normalize()
    : new Vector3(0.34, 0.3, 1).normalize();

  camera.position.copy(center).addScaledVector(direction, 10);
  camera.lookAt(center);
  camera.updateMatrixWorld();

  const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
  const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
  const tanY = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const tanX = tanY * (Math.max(size.width, 1) / Math.max(size.height, 1));
  let distance = 0;

  const corners = deskView
    ? [
        [DESK_MIN.x, -0.04, DESK_MIN.z],
        [DESK_MIN.x, 0.48, DESK_MIN.z],
        [DESK_MIN.x, -0.04, DESK_MAX.z],
        [DESK_MIN.x, 0.48, DESK_MAX.z],
        [DESK_MAX.x, -0.04, DESK_MIN.z],
        [DESK_MAX.x, 0.48, DESK_MIN.z],
        [DESK_MAX.x, -0.04, DESK_MAX.z],
        [DESK_MAX.x, 0.48, DESK_MAX.z],
      ]
    : [
        [bounds.min.x, bounds.min.y, bounds.min.z],
        [bounds.min.x, bounds.min.y, bounds.max.z],
        [bounds.min.x, bounds.max.y, bounds.min.z],
        [bounds.min.x, bounds.max.y, bounds.max.z],
        [bounds.max.x, bounds.min.y, bounds.min.z],
        [bounds.max.x, bounds.min.y, bounds.max.z],
        [bounds.max.x, bounds.max.y, bounds.min.z],
        [bounds.max.x, bounds.max.y, bounds.max.z],
      ];

  for (const [x, y, z] of corners) {
    const point = new Vector3(x, y, z).sub(center);
    distance = Math.max(
      distance,
      point.dot(direction) + Math.abs(point.dot(right)) / tanX,
      point.dot(direction) + Math.abs(point.dot(up)) / tanY,
    );
  }

  // The phone presentation crops the empty margins around the desk a little
  // so the workstation reads as an intentional composition on a tall screen.
  const framing = deskView ? (isMobile ? 1.02 : 1.08) : isMobile ? 0.84 : 0.9;
  return {
    center,
    position: center.clone().addScaledVector(direction, distance * framing),
  };
}

function FrameDesk({ scene, deskView, isMobile }) {
  const { camera, controls, size, invalidate } = useThree();
  const bounds = useMemo(() => {
    scene.updateWorldMatrix(true, true);
    return new Box3().setFromObject(scene);
  }, [scene]);
  const destination = useRef({
    position: new Vector3(),
    center: new Vector3(),
  });
  const transitioning = useRef(true);

  useEffect(() => {
    const nextFov = deskView ? (isMobile ? 54 : 48) : 36;
    camera.fov = nextFov;
    const previousPosition = camera.position.clone();
    const previousQuaternion = camera.quaternion.clone();
    destination.current = getCameraTarget(
      camera,
      bounds,
      size,
      deskView,
      isMobile,
    );
    camera.position.copy(previousPosition);
    camera.quaternion.copy(previousQuaternion);
    camera.updateMatrixWorld();
    transitioning.current = true;
    camera.updateProjectionMatrix();
    invalidate();
  }, [bounds, camera, deskView, invalidate, isMobile, size]);

  useFrame((_, delta) => {
    if (!transitioning.current) return;
    const ease = 1 - Math.exp(-delta * 5.5);
    camera.position.lerp(destination.current.position, ease);
    camera.lookAt(destination.current.center);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.lerp(destination.current.center, ease);
      controls.update();
    }
    if (
      camera.position.distanceTo(destination.current.position) < 0.01 &&
      (!controls ||
        controls.target.distanceTo(destination.current.center) < 0.01)
    ) {
      transitioning.current = false;
    }
    invalidate();
  });

  return null;
}

function useMechanicalKeySound() {
  const audioContext = useRef(null);

  return useCallback(() => {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioContext.current) audioContext.current = new AudioContext();
    const context = audioContext.current;
    if (context.state === "suspended") context.resume();

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(190 + Math.random() * 35, now);
    oscillator.frequency.exponentialRampToValueAtTime(82, now + 0.055);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.08);
  }, []);
}

function InteractiveMouse({ position, onStart }) {
  return (
    <group position={position} onPointerDown={onStart}>
      <mesh castShadow scale={[1, 0.62, 1.25]}>
        <sphereGeometry args={[0.24, 24, 16]} />
        <meshStandardMaterial
          color="#f3f1ea"
          roughness={0.32}
          metalness={0.04}
        />
      </mesh>
      <mesh position={[0, 0.13, -0.015]} rotation={[Math.PI / 2, 0, 0]}>
        <boxGeometry args={[0.035, 0.16, 0.012]} />
        <meshStandardMaterial color="#34383d" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.035, -0.24]}>
        <boxGeometry args={[0.09, 0.018, 0.05]} />
        <meshStandardMaterial
          color="#f47734"
          emissive="#f47734"
          emissiveIntensity={1.4}
        />
      </mesh>
    </group>
  );
}

function InteractiveBoom({ position, onStart }) {
  return (
    <group position={position} onPointerDown={onStart}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.055, 1.05, 12]} />
        <meshStandardMaterial
          color="#161b21"
          metalness={0.7}
          roughness={0.24}
        />
      </mesh>
      <mesh
        position={[0.52, 0.93, 0]}
        rotation={[0, 0, Math.PI / 2]}
        castShadow
      >
        <cylinderGeometry args={[0.045, 0.045, 1.1, 12]} />
        <meshStandardMaterial
          color="#22272c"
          metalness={0.65}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[1.05, 0.63, 0]} rotation={[0, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.04, 0.04, 0.75, 12]} />
        <meshStandardMaterial
          color="#161b21"
          metalness={0.7}
          roughness={0.24}
        />
      </mesh>
      <mesh position={[1.28, 0.32, 0]} castShadow>
        <sphereGeometry args={[0.19, 20, 12]} />
        <meshStandardMaterial
          color="#242a2f"
          metalness={0.4}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[1.28, 0.32, 0.08]}>
        <torusGeometry args={[0.28, 0.018, 8, 32]} />
        <meshStandardMaterial color="#101418" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

function InteractiveDesk({
  deskView,
  setDeskView,
  onOpenDiary,
  onInteraction,
}) {
  const [mousePosition, setMousePosition] = useState([1.38, 0.24, 1.02]);
  const [boomPosition, setBoomPosition] = useState([2.45, 0.16, 0.35]);
  const [dragTarget, setDragTarget] = useState(null);
  const playKeySound = useMechanicalKeySound();

  const updateDrag = useCallback(
    (event) => {
      if (!dragTarget) return;
      event.stopPropagation();
      const x = MathUtils.clamp(event.point.x, -2.25, 2.65);
      const z = MathUtils.clamp(event.point.z, -0.15, 1.38);
      if (dragTarget === "mouse") setMousePosition([x, 0.24, z]);
      if (dragTarget === "boom")
        setBoomPosition([MathUtils.clamp(x, 1.8, 2.75), 0.16, z]);
    },
    [dragTarget],
  );

  const finishDrag = useCallback(
    (event) => {
      if (!dragTarget) return;
      event.stopPropagation();
      setDragTarget(null);
      onInteraction?.(
        dragTarget === "mouse" ? "Mouse moved" : "Boom arm moved",
      );
    },
    [dragTarget, onInteraction],
  );

  return (
    <>
      <mesh
        position={[0, 0.02, 0.18]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(event) => {
          event.stopPropagation();
          if (!deskView) {
            setDeskView(true);
            onInteraction?.("Desk view opened");
          }
        }}
        onPointerMove={updateDrag}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
      >
        <planeGeometry args={[6.9, 2.8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh
        position={[0.04, 0.19, 1.01]}
        onPointerDown={(event) => {
          event.stopPropagation();
          playKeySound();
          onInteraction?.("Mechanical key click");
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <boxGeometry args={[1.9, 0.2, 0.75]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <InteractiveMouse
        position={mousePosition}
        onStart={(event) => {
          event.stopPropagation();
          event.nativeEvent.target?.setPointerCapture?.(event.pointerId);
          setDragTarget("mouse");
          onInteraction?.("Drag the mouse across the desk");
        }}
      />

      <InteractiveBoom
        position={boomPosition}
        onStart={(event) => {
          event.stopPropagation();
          event.nativeEvent.target?.setPointerCapture?.(event.pointerId);
          setDragTarget("boom");
          onInteraction?.("Drag the boom arm");
        }}
      />

      <mesh
        position={[-2.72, 0.18, 0.87]}
        onClick={(event) => {
          event.stopPropagation();
          onOpenDiary?.();
          onInteraction?.("Diary opened");
        }}
      >
        <boxGeometry args={[0.92, 0.24, 0.72]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </>
  );
}

function Computers({
  deskView,
  isMobile,
  setDeskView,
  onOpenDiary,
  onInteraction,
}) {
  const { scene } = useGLTF("/desktop_pc/scene.gltf?v=shiv-studio-1");

  useEffect(() => {
    scene.traverse((part) => {
      if (part.isMesh) {
        part.castShadow = true;
        part.receiveShadow = true;
      }
    });
  }, [scene]);

  return (
    <>
      <FrameDesk scene={scene} deskView={deskView} isMobile={isMobile} />
      <primitive object={scene} />
      <InteractiveDesk
        deskView={deskView}
        setDeskView={setDeskView}
        onOpenDiary={onOpenDiary}
        onInteraction={onInteraction}
      />
    </>
  );
}

export default function ComputersCanvas({
  onReady,
  onProgress,
  onDeskViewChange,
  onOpenDiary,
  onInteraction,
}) {
  const [isMobile, setIsMobile] = useState(false);
  const [deskView, setDeskView] = useState(false);
  const progress = useProgress((state) => state.progress);

  useEffect(() => {
    onProgress(progress);
  }, [progress, onProgress]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(max-width: 600px), (pointer: coarse)",
    );
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    onDeskViewChange?.(deskView);
  }, [deskView, onDeskViewChange]);

  return (
    <Canvas
      frameloop="demand"
      shadows={isMobile ? "basic" : true}
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [3.4, 4, 10], fov: 36, near: 0.1, far: 80 }}
      gl={{
        powerPreference: isMobile ? "low-power" : "high-performance",
        antialias: true,
      }}
    >
      <OrbitControls
        makeDefault
        enabled={!isMobile && !deskView}
        enableZoom={false}
        enablePan={false}
        minAzimuthAngle={-0.35}
        maxAzimuthAngle={0.55}
        minPolarAngle={1.02}
        maxPolarAngle={1.43}
        rotateSpeed={0.45}
      />
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
      <pointLight
        position={[-3, 1, -2]}
        intensity={4}
        color="#f47734"
        distance={9}
      />
      <Suspense fallback={null}>
        <Environment resolution={isMobile ? 64 : 128} frames={1}>
          <Lightformer
            form="rect"
            intensity={2.5}
            position={[0, 5, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[8, 5, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.5}
            position={[-5, 2, 1]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[4, 5, 1]}
          />
        </Environment>
        <Computers
          deskView={deskView}
          isMobile={isMobile}
          setDeskView={setDeskView}
          onOpenDiary={onOpenDiary}
          onInteraction={onInteraction}
        />
        <Preload all />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
