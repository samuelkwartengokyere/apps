"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Scene3D from "./Scene3D";
import { VaultDoor } from "./vaultModels";

// Colours > 1.0 so only these elements cross the bloom threshold.
const GLOW = new THREE.Color("#22d3ee").multiplyScalar(2.4);
const GLOW_BLUE = new THREE.Color("#3b82f6").multiplyScalar(2);

/** The hero vault door: the same steel door as the product rooms, with a slow dial idle. */
function HeroDoor() {
  const dial = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (dial.current) dial.current.rotation.z += dt * 0.12; // slow mechanical idle
  });
  return <VaultDoor radius={1.6} spinRef={dial} />;
}

function OrbitRing({
  radius,
  tilt,
  speed,
  nodes,
}: {
  radius: number;
  tilt: [number, number, number];
  speed: number;
  nodes: number;
}) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.z += dt * speed;
  });
  return (
    <group rotation={tilt}>
      <group ref={spin}>
        <mesh>
          <torusGeometry args={[radius, 0.006, 8, 160]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} />
        </mesh>
        {Array.from({ length: nodes }, (_, i) => {
          const a = (i / nodes) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * radius, Math.sin(a) * radius, 0]}>
              <octahedronGeometry args={[0.055, 0]} />
              <meshBasicMaterial color={i % 2 ? GLOW : GLOW_BLUE} toneMapped={false} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/** Particles converging on the core: a decorative "data stream", not real encryption. */
function DataStream({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null);

  const { seeds, positions, colors } = useMemo(() => {
    const seeds = Array.from({ length: count }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi: Math.acos(2 * Math.random() - 1),
      t: Math.random(),
      speed: 0.07 + Math.random() * 0.1,
    }));
    return { seeds, positions: new Float32Array(count * 3), colors: new Float32Array(count * 3) };
  }, [count]);

  useFrame((_, dt) => {
    const pts = ref.current;
    if (!pts) return;
    const pos = pts.geometry.attributes.position as THREE.BufferAttribute;
    const col = pts.geometry.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      s.t += dt * s.speed;
      if (s.t >= 1) {
        s.t = 0;
        s.theta = Math.random() * Math.PI * 2;
        s.phi = Math.acos(2 * Math.random() - 1);
      }
      const e = s.t * s.t * (3 - 2 * s.t);
      const r = 6.5 - e * 4.7;
      const th = s.theta + e * 1.4; // gentle spiral
      const x = r * Math.sin(s.phi) * Math.cos(th);
      const y = r * Math.sin(s.phi) * Math.sin(th);
      const z = r * Math.cos(s.phi) * 0.6;
      pos.setXYZ(i, x, y, z);
      const fade = Math.sin(Math.PI * Math.min(1, s.t * 1.05)) ** 0.7;
      col.setXYZ(i, 0.13 * fade * 1.4, 0.83 * fade * 1.4, 0.93 * fade * 1.4);
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
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

function Rig({
  children,
  parallax,
  compact,
}: {
  children: React.ReactNode;
  parallax: boolean;
  compact: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const light = useRef<THREE.PointLight>(null);
  const t0 = useRef(0);

  useFrame((state, dt) => {
    t0.current += dt;
    const g = group.current;
    if (!g) return;

    // One-time entrance: fade/scale into place (~0.9 s) — blueprint §10.2
    const enter = Math.min(1, t0.current / 0.9);
    const eased = 1 - Math.pow(1 - enter, 3);
    const base = compact ? 0.78 : 1;
    g.scale.setScalar(base * (0.82 + 0.18 * eased));

    const px = parallax ? state.pointer.x : 0;
    const py = parallax ? state.pointer.y : 0;
    const idleY = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
    const idleX = Math.cos(state.clock.elapsedTime * 0.27) * 0.06;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, px * 0.35 + idleY, 3, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -py * 0.22 + idleX, 3, dt);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.05;

    // light sweep once on entrance
    if (light.current) {
      const s = Math.min(1, t0.current / 1.6);
      light.current.position.x = THREE.MathUtils.lerp(-4, 4, s);
      light.current.intensity = 14 * Math.sin(Math.PI * s);
    }
  });

  return (
    <>
      <pointLight ref={light} position={[-4, 1, 3]} color="#67e8f9" distance={14} />
      <group ref={group}>{children}</group>
    </>
  );
}

export default function HeroScene({
  parallax,
  compact,
  onReady,
}: {
  parallax: boolean;
  compact: boolean;
  onReady?: () => void;
}) {
  return (
    <Scene3D fade className="absolute inset-0" camera={{ position: [0, 0, 10.5], fov: 38 }} onReady={onReady}>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={1.1} color="#a5d8ff" />
      <Rig parallax={parallax} compact={compact}>
        <HeroDoor />
        <OrbitRing radius={2.15} tilt={[1.2, 0.3, 0]} speed={0.22} nodes={5} />
        <OrbitRing radius={2.6} tilt={[0.5, -0.6, 0.4]} speed={-0.16} nodes={7} />
        <OrbitRing radius={3.1} tilt={[1.45, 0.9, 0]} speed={0.1} nodes={4} />
        <DataStream count={compact ? 220 : 520} />
      </Rig>
    </Scene3D>
  );
}
