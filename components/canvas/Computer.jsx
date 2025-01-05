import React, { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Preload, useGLTF, Environment } from "@react-three/drei";

const Computers = ({ isMobile, isTablet }) => {
  const { scene } = useGLTF("/desktop_pc/scene.gltf");

  // Adjust scale and position for different devices
  const scale = isMobile ? 0.4 : isTablet ? 0.8 : 0.65; // Reduced scale for mobile
  const position = isMobile
    ? [0, -2.0, -1.5] // Adjusted position for mobile
    : isTablet
    ? [0, -3, -2]
    : [0, -3.25, -1.5];

  return (
    <mesh>
      <hemisphereLight intensity={0.35} groundColor="black" />
      <spotLight
        position={[-20, 50, 10]}
        angle={0.15}
        penumbra={1}
        intensity={1.5}
        castShadow
        shadow-mapSize={1024}
      />
      <pointLight intensity={1.2} position={[10, 10, 10]} />
      <primitive
        object={scene}
        scale={scale}
        position={position}
        rotation={[-0.01, -0.2, -0.1]}
      />
    </mesh>
  );
};

const ComputersCanvas = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const updateDeviceType = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 500);
      setIsTablet(width > 500 && width <= 768);
    };

    // Set initial device type
    updateDeviceType();

    // Add event listener for window resize
    window.addEventListener("resize", updateDeviceType);

    return () => {
      window.removeEventListener("resize", updateDeviceType);
    };
  }, []);

  return (
    <Canvas
      frameloop="demand"
      shadows
      dpr={[1, 2]}
      camera={{
        position: isMobile ? [10, 2, 5] : isTablet ? [18, 3, 6] : [20, 3, 5],
        fov: 25,
      }}
      gl={{ preserveDrawingBuffer: true }}
    >
      <Suspense fallback={null}>
        <OrbitControls
          enableZoom={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
        />
        <Environment preset="city" /> {/* Adds an environment map */}
        <Computers isMobile={isMobile} isTablet={isTablet} />
      </Suspense>
      <Preload all />
    </Canvas>
  );
};

export default ComputersCanvas;

