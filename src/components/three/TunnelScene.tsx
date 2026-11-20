"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Scene3D from "./Scene3D";

const GLOW = new THREE.Color("#22d3ee").multiplyScalar(2.2);
const RING_X = [-4.6, -3.2, -1.8, -0.4, 1.0, 2.4];
const GATE_X = -2.6; // visual boundary where particles change colour
const START_X = -7;
const END_X = 4.4;

function Ring({ x, i }: { x: number; i: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * (i % 2 ? 0.35 : -0.35);
  });
  return (
    <group position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh ref={ref}>
        <torusGeometry args={[1.35 - i * 0.05, 0.02, 8, 96, 4.4]} />
        <meshBasicMaterial color={i < 2 ? "#60a5fa" : GLOW} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Flow({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);
  const { seeds, positions, colors } = useMemo(
    () => ({
      seeds: Array.from({ length: count }, () => ({
        x: START_X + Math.random() * (END_X - START_X),
        a: Math.random() * Math.PI * 2,
        r: Math.sqrt(Math.random()) * 0.95,
        v: 1.2 + Math.random() * 0.9,
      })),
      positions: new Float32Array(count * 3),
      colors: new Float32Array(count * 3),
    }),
    [count],
  );

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    const col = pts.geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.x += dt * s.v;
      s.a += dt * 0.6;
      if (s.x > END_X) s.x = START_X;
      // converge slightly toward the axis as they approach the vault
      const k = THREE.MathUtils.clamp((s.x - GATE_X) / (END_X - GATE_X), 0, 1);
      const r = s.r * (1 - 0.6 * k);
      pos.setXYZ(i, s.x, Math.cos(s.a) * r, Math.sin(s.a) * r);
      if (s.x < GATE_X) col.setXYZ(i, 0.55, 0.62, 0.72); // muted: before the gate
      else col.setXYZ(i, 0.2, 1.4, 1.7); // cyan: after the gate
    }
    pos.needsUpdate = true;
    col.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} vertexColors transparent depthWrite={false} sizeAttenuation />
    </points>
  );
}

function MiniVault() {
  const wheel = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (wheel.current) wheel.current.rotation.x += dt * 0.15;
  });
  return (
    <group position={[5.2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <mesh>
        <cylinderGeometry args={[1.25, 1.25, 0.5, 64]} />
        <meshStandardMaterial color="#0f2236" metalness={1} roughness={0.28} />
      </mesh>
      <mesh position={[0, -0.27, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.85, 0.02, 12, 96]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.25, 0.08, 16, 96]} />
        <meshStandardMaterial color="#1c3b59" metalness={1} roughness={0.2} />
      </mesh>
      <group ref={wheel} position={[0, -0.3, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[0.07, 0.05, 1.1]} />
          <meshStandardMaterial color="#16314b" metalness={1} roughness={0.3} />
        </mesh>
        <mesh>
          <boxGeometry args={[1.1, 0.05, 0.07]} />
          <meshStandardMaterial color="#16314b" metalness={1} roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

function Fit({ children }: { children: React.ReactNode }) {
  const { viewport } = useThree();
  const s = Math.min(1, viewport.width / 13.5);
  return <group scale={s}>{children}</group>;
}

export default function TunnelScene({ compact }: { compact: boolean }) {
  return (
    <Scene3D className="absolute inset-0" camera={{ position: [0.3, 1.4, 9.5], fov: 38 }}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[2, 4, 5]} intensity={0.9} color="#a5d8ff" />
      <Fit>
        {RING_X.map((x, i) => (
          <Ring key={x} x={x} i={i} />
        ))}
        <Flow count={compact ? 260 : 600} />
        <MiniVault />
      </Fit>
    </Scene3D>
  );
}
