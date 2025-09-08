import React, { useEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

const AnimatedParticles = () => {
  const ref = useRef();
  const sphere = new Float32Array(5000 * 3);
  
  for (let i = 0; i < 5000; i++) {
    const theta = THREE.MathUtils.randFloatSpread(360);
    const phi = THREE.MathUtils.randFloatSpread(360);
    
    sphere[i * 3] = Math.cos(theta) * Math.cos(phi) * Math.random() * 2;
    sphere[i * 3 + 1] = Math.sin(theta) * Math.random() * 2;
    sphere[i * 3 + 2] = Math.cos(theta) * Math.sin(phi) * Math.random() * 2;
  }

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color="#3b82f6"
          size={0.005}
          sizeAttenuation={true}
          depthWrite={false}
        />
      </Points>
    </group>
  );
};

const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <AnimatedParticles />
      </Canvas>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80" />
    </div>
  );
};

export default AnimatedBackground;