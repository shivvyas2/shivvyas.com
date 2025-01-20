import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload } from "@react-three/drei";
import * as THREE from "three";

const Scene = () => {
  return (
    <mesh>
      <hemisphereLight intensity={0.15} groundColor="black" />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.12}
        penumbra={1}
        intensity={1}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={1} position={[0, 0, 0]} />
      
      {/* Add a simple geometric shape instead of the model */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#5CB8E4" metalness={0.7} roughness={0.2} />
      </mesh>
    </mesh>
  );
};

const Contact3DCanvas = () => {
  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      camera={{ position: [5, 5, 5], fov: 45 }}
      gl={{ preserveDrawingBuffer: true }}
      className="w-full h-full"
    >
      <Suspense fallback={null}>
        <OrbitControls
          autoRotate
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Scene />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

export default Contact3DCanvas;
