"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { backOut, easeOut, lerp, range, stagger } from "../kit/math";
import { COLORS, GlowSprite, Label, S, fadeGroup, screenMaterial, useDisposables } from "../kit/parts";
import { createArcMaterial, createShieldMaterial } from "../kit/shaders";
import { UI, panelTexture } from "../kit/textures";
import HealthChart from "./HealthChart";
import { SecurityRoom } from "./SecurityRoom";

const INDICATORS = 28;
const WARN = new Set([5, 14, 22]);
const RINGS = [
  { r: 2.4, tilt: [1.2, 0.2, 0] as const, speed: 0.6 },
  { r: 3.0, tilt: [0.5, -0.5, 0.3] as const, speed: -0.45 },
  { r: 3.6, tilt: [1.5, 0.8, 0] as const, speed: 0.3 },
];
// Demonstration values (not connected to any real account).
const SCORE = 0.82;
const SHIELD_R = 6.6;

const dummy = new THREE.Object3D();
const col = new THREE.Color();

export default function SecurityCenter() {
  const { state, quality } = useCine();
  const { geo, mat } = S();

  const res = useDisposables(() => {
    const dome = new THREE.IcosahedronGeometry(SHIELD_R, quality.compact ? 2 : 3);
    return {
      platformGeo: new THREE.CylinderGeometry(5.5, 5.7, 0.25, 64),
      stepGeo: new THREE.CylinderGeometry(6.0, 6.05, 0.11, 64),
      etchGeos: [1.6, 2.6, 4.5].map((r) => new THREE.TorusGeometry(r, 0.01, 4, 128)),
      steel: new THREE.MeshPhysicalMaterial({ color: "#6d7681", metalness: 0.92, roughness: 0.3, envMapIntensity: 1.1 }),
      pedGeo: new THREE.CylinderGeometry(0.28, 0.42, 1.4, 32),
      collarGeo: new THREE.CylinderGeometry(0.5, 0.55, 0.1, 40),
      dishGeo: new THREE.CylinderGeometry(0.62, 0.5, 0.12, 40),
      emitGeo: new THREE.CylinderGeometry(0.025, 0.025, 0.42, 8),
      emitRing: new THREE.TorusGeometry(0.5, 0.018, 6, 64),
      edgeGeo: new THREE.TorusGeometry(5.55, 0.035, 6, 128),
      edgeMat: new THREE.MeshBasicMaterial({ color: COLORS.cyan.clone().multiplyScalar(0.7), toneMapped: false }),
      innerGeo: new THREE.TorusGeometry(3.6, 0.015, 6, 96),
      ringGeos: RINGS.map((r) => new THREE.TorusGeometry(r.r, 0.045, 12, 160)),
      ringMats: RINGS.map(() => new THREE.MeshPhysicalMaterial({ color: "#8d98a6", metalness: 0.92, roughness: 0.26, envMapIntensity: 1.2, emissive: COLORS.cyan.clone(), emissiveIntensity: 0.1, transparent: true })),
      coreGeo: new THREE.IcosahedronGeometry(0.9, 1),
      coreMat: new THREE.MeshPhysicalMaterial({ color: "#a3afbd", metalness: 1, roughness: 0.22, flatShading: true, envMapIntensity: 1.4, emissive: COLORS.cyan.clone(), emissiveIntensity: 0.18, transparent: true }),
      sweepGeo: new THREE.CircleGeometry(5.3, 32, 0, 0.7),
      sweepMat: new THREE.MeshBasicMaterial({ color: "#5bb8cc", transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }),
      indicatorMat: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      deviceMat: screenMaterial(
        panelTexture("devices", {
          title: "Devices & sessions",
          badge: ["DEMO DATA", UI.amber],
          rows: [
            ["Laptop · this device", "Active now", UI.green],
            ["Phone · Lisbon", "2 h ago"],
            ["Tablet · Home", "3 days ago"],
            ["Unknown · Linux", "Review", UI.amber],
          ],
        }),
      ),
      gaugeBgGeo: new THREE.TorusGeometry(0.95, 0.05, 8, 96),
      gaugeGeo: new THREE.TorusGeometry(0.95, 0.075, 8, 128),
      gaugeMat: createArcMaterial(COLORS.cyan.clone().multiplyScalar(1.1)),
      domeFill: createShieldMaterial("#5bb8cc", false, SHIELD_R),
      domeLines: createShieldMaterial("#7fa6c4", true, SHIELD_R),
      dome,
      domeEdges: new THREE.EdgesGeometry(dome, 1),
    };
  });

  const platform = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Group | null)[]>([]);
  const core = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.Mesh>(null);
  const indicators = useRef<THREE.InstancedMesh>(null);
  const devices = useRef<THREE.Mesh>(null);
  const gauge = useRef<THREE.Group>(null);
  const labels = useRef<(THREE.Mesh | null)[]>([]);
  const shield = useRef<THREE.Group>(null);

  useLayoutEffect(() => {
    const im = indicators.current;
    if (!im) return;
    for (let i = 0; i < INDICATORS; i++) {
      const a = (i / INDICATORS) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 4.95, -1.33, Math.sin(a) * 4.95);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.set(0.08, 0.06, 0.32);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
      im.setColorAt(i, col.setRGB(0.05, 0.1, 0.18));
    }
    im.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const s = state.security;
    const t = clock.elapsedTime;

    // Platform assembles outward from the centre.
    if (platform.current) {
      const v = easeOut(s.env);
      platform.current.scale.set(lerp(0.2, 1, v), 1, lerp(0.2, 1, v));
      platform.current.visible = v > 0.001;
    }
    res.sweepMat.opacity = s.env * 0.07 + s.rings * 0.05;
    if (sweep.current) sweep.current.rotation.z = -t * 1.1;

    // Monitoring rings spin up one by one.
    RINGS.forEach((r, i) => {
      const g = rings.current[i];
      const v = easeOut(stagger(s.rings, i, RINGS.length, 0.4));
      if (g) {
        g.visible = v > 0.001;
        g.scale.setScalar(lerp(0.3, 1, v));
        g.rotation.z = (s.rings * 2 + t * 0.15) * r.speed;
      }
      res.ringMats[i].emissiveIntensity = 0.1 + v * 0.5;
      res.ringMats[i].opacity = v;
    });
    if (core.current) {
      core.current.scale.setScalar(backOut(range(s.env, 0.3, 1)));
      core.current.rotation.y = t * 0.25;
    }
    res.coreMat.opacity = 0.4 + s.rings * 0.6;

    // Indicators illuminate in a sweep; a few are warnings (demo).
    const im = indicators.current;
    if (im) {
      for (let i = 0; i < INDICATORS; i++) {
        const on = range(s.indicators, i / INDICATORS - 0.02, i / INDICATORS + 0.06);
        if (WARN.has(i)) col.copy(COLORS.amber).multiplyScalar(0.08 + on * 1.1 * (0.8 + 0.2 * Math.sin(t * 3)));
        else col.copy(COLORS.cyan).multiplyScalar(0.06 + on * 0.55);
        im.setColorAt(i, col);
      }
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }

    // Device monitor unfolds; gauge and health bars fill.
    if (devices.current) {
      const v = easeOut(s.devices);
      devices.current.scale.set(3 * Math.max(v, 0.001), 1.97 * lerp(0.15, 1, v), 1);
      fadeGroup(devices.current, Math.min(1, s.devices * 1.5));
    }
    if (gauge.current) {
      const v = easeOut(range(s.score, 0, 0.4));
      gauge.current.visible = v > 0.001;
      gauge.current.scale.setScalar(v);
    }
    res.gaugeMat.uniforms.uProgress.value = easeOut(range(s.score, 0.2, 1)) * SCORE;
    fadeGroup(labels.current[0], range(s.score, 0.3, 0.8));

    // Shield assembles from the ground up, then settles.
    const sh = s.shield;
    if (shield.current) shield.current.visible = sh > 0.001;
    res.domeFill.uniforms.uReveal.value = sh;
    res.domeLines.uniforms.uReveal.value = sh;
    res.domeLines.uniforms.uTime.value = t;
    res.domeFill.uniforms.uTime.value = t;
  });

  return (
    <group>
      <SecurityRoom />

      <group ref={platform} visible={false}>
        <mesh geometry={res.stepGeo} material={res.steel} position={[0, -1.6, 0]} />
        <mesh geometry={res.platformGeo} material={mat.metalDark} position={[0, -1.55, 0]} />
        {res.etchGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={res.steel} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.423, 0]} />
        ))}
        {/* Display pedestal under the core */}
        <mesh geometry={res.collarGeo} material={res.steel} position={[0, -1.37, 0]} />
        <mesh geometry={res.pedGeo} material={res.steel} position={[0, -0.7, 0]} />
        <mesh geometry={res.collarGeo} material={res.steel} position={[0, -0.05, 0]} />
        <mesh geometry={res.dishGeo} material={res.steel} position={[0, 0.02, 0]} />
        <mesh geometry={res.emitRing} material={mat.glowCyan} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.085, 0]} />
        <mesh geometry={res.emitGeo} material={mat.glowCyan} position={[0, 0.3, 0]} />
        <mesh geometry={res.edgeGeo} material={res.edgeMat} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.42, 0]} />
        <mesh geometry={res.innerGeo} material={mat.glowBlue} rotation={[Math.PI / 2, 0, 0]} position={[0, -1.41, 0]} />
        <mesh ref={sweep} geometry={res.sweepGeo} material={res.sweepMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.39, 0]} />
        <instancedMesh ref={indicators} args={[geo.box, res.indicatorMat, INDICATORS]} />
      </group>

      <group position={[0, 1.2, 0]}>
        <group ref={core}>
          <mesh geometry={res.coreGeo} material={res.coreMat} />
          <mesh geometry={geo.sphere} material={mat.glowCyan} scale={0.22} />
        </group>
        <GlowSprite color="#5bb8cc" scale={5} opacity={0.18} />
        {RINGS.map((r, i) => (
          <group key={r.r} rotation={[...r.tilt]}>
            <group ref={(el) => void (rings.current[i] = el)} visible={false}>
              <mesh geometry={res.ringGeos[i]} material={res.ringMats[i]} />
              {[0, 1, 2].map((k) => {
                const a = (k / 3) * Math.PI * 2;
                return <mesh key={k} geometry={geo.octa} material={mat.glowCyan} position={[Math.cos(a) * r.r, Math.sin(a) * r.r, 0]} scale={0.07} />;
              })}
            </group>
          </group>
        ))}
      </group>

      <mesh ref={devices} geometry={geo.plane} material={res.deviceMat} position={[-3.3, 2.5, 1.2]} rotation={[0, 0.3, 0]} visible={false} {...FOCUS} />

      {/* Security score gauge (demo) */}
      <group ref={gauge} position={[2.1, 3.15, 1.4]} rotation={[0, -0.25, 0]} visible={false} {...FOCUS}>
        <mesh geometry={res.gaugeBgGeo} material={mat.dimBlue} />
        <mesh geometry={res.gaugeGeo} material={res.gaugeMat} rotation={[0, Math.PI, Math.PI / 2]} />
      </group>
      <Label ref={(el) => void (labels.current[0] = el)} text="Security score" sub="demonstration data" width={1.7} position={[2.1, 1.85, 1.5]} rotation={[0, -0.25, 0]} visible={false} />

      {/* Password health chart (demo) */}
      <HealthChart position={[2.0, -1.42, 3.0]} rotation={[0, -0.3, 0]} scale={1.5} />

      {/* Protective shield (geodesic dome) */}
      <group ref={shield} position={[0, -1.42, 0]} visible={false}>
        <mesh geometry={res.dome} material={res.domeFill} />
        <lineSegments geometry={res.domeEdges} material={res.domeLines} />
      </group>
    </group>
  );
}
