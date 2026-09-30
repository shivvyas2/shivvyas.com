import React, { Suspense, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Box3, Vector3, MathUtils } from "three";
import {
  OrbitControls,
  Preload,
  useGLTF,
  Environment,
  Lightformer,
  useProgress,
} from "@react-three/drei";

function SceneReady({ onReady }) {
  useEffect(() => {
    const frame = requestAnimationFrame(onReady);
    return () => cancelAnimationFrame(frame);
  }, [onReady]);
  return null;
}

function FrameDesk({ scene }) {
  const { camera, controls, size, invalidate } = useThree();

  useEffect(() => {
    const bounds = new Box3().setFromObject(scene);
    const center = bounds.getCenter(new Vector3());
    const direction = new Vector3(0.34, 0.3, 1).normalize();
    camera.position.copy(center).addScaledVector(direction, 10);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
    const up = new Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
    const tanY = Math.tan(MathUtils.degToRad(camera.fov / 2));
    const tanX = tanY * (size.width / size.height);
    let distance = 0;
    for (const x of [bounds.min.x, bounds.max.x]) {
      for (const y of [bounds.min.y, bounds.max.y]) {
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new Vector3(x, y, z).sub(center);
          distance = Math.max(
            distance,
            point.dot(direction) + Math.abs(point.dot(right)) / tanX,
            point.dot(direction) + Math.abs(point.dot(up)) / tanY,
          );
        }
      }
    }
    camera.position.copy(center).addScaledVector(direction, distance * 1.08);
    camera.lookAt(center);
    camera.updateProjectionMatrix();
    if (controls) {
      controls.target.copy(center);
      controls.update();
    }
    invalidate();
  }, [camera, controls, invalidate, scene, size.width, size.height]);
  return null;
}

function Computers() {
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
      <FrameDesk scene={scene} />
      <primitive object={scene} />
    </>
  );
}

export default function ComputersCanvas({ onReady, onProgress }) {
  const [isMobile, setIsMobile] = useState(false);
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

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={isMobile ? 1 : [1, 1.5]}
      camera={{ position: [3.4, 4, 10], fov: 36, near: 0.1, far: 80 }}
      gl={{
        powerPreference: isMobile ? "low-power" : "high-performance",
        antialias: true,
      }}
    >
      <OrbitControls
        makeDefault
        enabled={!isMobile}
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
        castShadow
        shadow-mapSize={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-3}
        shadow-normalBias={0.035}
      />
      <directionalLight position={[4, 3, -3]} intensity={2.0} color="#e0e9f6" />
      <pointLight
        position={[-3, 1, -2]}
        intensity={4}
        color="#f47734"
        distance={9}
      />
      <Suspense fallback={null}>
        <Environment resolution={128} frames={1}>
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
        <Computers />
        <Preload all />
        <SceneReady onReady={onReady} />
      </Suspense>
    </Canvas>
  );
}
