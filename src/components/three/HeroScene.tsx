"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import Scene3D from "./Scene3D";

// Colours > 1.0 so only these elements cross the bloom threshold.
const GLOW = new THREE.Color("#22d3ee").multiplyScalar(2.4);
const GLOW_BLUE = new THREE.Color("#3b82f6").multiplyScalar(2);

const metal = {
  color: "#1a3a5a",
  metalness: 1,
  roughness: 0.3,
  envMapIntensity: 1.8,
} as const;

function Bolts({ count = 12, radius = 1.38 }: { count?: number; radius?: number }) {
  const bolts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2;
        return { x: Math.cos(a) * radius, y: Math.sin(a) * radius, a };
      }),
    [count, radius],
  );
  return (
    <group position={[0, 0, 0.26]}>
      {bolts.map((b, i) => (
        <mesh key={i} position={[b.x, b.y, 0]} rotation={[0, 0, b.a]}>
          <boxGeometry args={[0.22, 0.09, 0.06]} />
          <meshStandardMaterial color="#1b3a57" metalness={1} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function Wheel() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.z += dt * 0.12; // slow mechanical idle
  });
  return (
    <group ref={ref} position={[0, 0, 0.46]}>
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.82, Math.sin(a) * 0.82, 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.62, 0.07, 0.06]} />
            <meshStandardMaterial {...metal} color="#2a5a86" roughness={0.22} />
          </mesh>
        );
      })}
      <mesh>
        <torusGeometry args={[0.55, 0.02, 12, 96]} />
        <meshBasicMaterial color={GLOW_BLUE} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Door() {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* main slab */}
      <mesh>
        <cylinderGeometry args={[1.6, 1.6, 0.5, 96]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      {/* recessed face plate */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[1.25, 1.3, 0.04, 96]} />
        <meshStandardMaterial {...metal} color="#0a1829" roughness={0.4} />
      </mesh>
      {/* bevel */}
      <mesh position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.1, 24, 128]} />
        <meshStandardMaterial {...metal} color="#1c3b59" roughness={0.2} />
      </mesh>
      {/* glowing seam */}
      <mesh position={[0, 0.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.12, 0.018, 12, 128]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
      {/* hub */}
      <mesh position={[0, 0.32, 0]}>
        <cylinderGeometry args={[0.42, 0.46, 0.14, 64]} />
        <meshStandardMaterial {...metal} color="#12304c" roughness={0.18} />
      </mesh>
    </group>
  );
}

function Keyhole() {
  return (
    <group position={[0, 0, 0.5]}>
      <mesh>
        <circleGeometry args={[0.1, 32]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.12, 0]}>
        <planeGeometry args={[0.075, 0.2]} />
        <meshBasicMaterial color={GLOW} toneMapped={false} />
      </mesh>
    </group>
  );
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
        <Door />
        <Bolts />
        <Wheel />
        <Keyhole />
        <OrbitRing radius={2.15} tilt={[1.2, 0.3, 0]} speed={0.22} nodes={5} />
        <OrbitRing radius={2.6} tilt={[0.5, -0.6, 0.4]} speed={-0.16} nodes={7} />
        <OrbitRing radius={3.1} tilt={[1.45, 0.9, 0]} speed={0.1} nodes={4} />
        <DataStream count={compact ? 220 : 520} />
      </Rig>
    </Scene3D>
  );
}
