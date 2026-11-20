"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { easeOut, stagger } from "../kit/math";
import { useDisposables } from "../kit/parts";
import { HEALTH_CHART, healthBackTexture, healthFrontTexture, radialTexture } from "../kit/textures";

/*
 * Password-health chart as a physical object: a brushed-steel base with a
 * printed legend, a glass back panel with etched gridlines, and four glossy
 * enamel columns with polished caps. Demonstration values only (24 logins).
 */

const COUNTS = [11, 4, 3, 6];
const TINTS = ["#3fb59d", "#d9a441", "#cf5b57", "#6f95c4"];
const BASE_H = 0.14;

export default function HealthChart({ position, rotation, scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { state } = useCine();
  const root = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const caps = useRef<(THREE.Mesh | null)[]>([]);

  const res = useDisposables(() => {
    const barMats = TINTS.map(
      (c) =>
        new THREE.MeshPhysicalMaterial({
          color: c,
          roughness: 0.22,
          metalness: 0.05,
          clearcoat: 1,
          clearcoatRoughness: 0.08,
          emissive: c,
          emissiveIntensity: 0.14,
          transparent: true,
        }),
    );
    const capMats = TINTS.map(
      (c) =>
        new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(c).lerp(new THREE.Color("#ffffff"), 0.55),
          roughness: 0.12,
          metalness: 0.2,
          clearcoat: 1,
          emissive: c,
          emissiveIntensity: 0.55,
          transparent: true,
        }),
    );
    const steel = new THREE.MeshPhysicalMaterial({ color: "#59616b", metalness: 0.9, roughness: 0.34, envMapIntensity: 1.1, transparent: true });
    const back = new THREE.MeshStandardMaterial({
      map: healthBackTexture(),
      emissiveMap: healthBackTexture(),
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const legend = new THREE.MeshStandardMaterial({
      map: healthFrontTexture(),
      emissiveMap: healthFrontTexture(),
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.7,
      roughness: 0.4,
      transparent: true,
    });
    const shadow = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false });
    const mats = [...barMats, ...capMats, steel, back, legend, shadow];
    return {
      barMats,
      capMats,
      steel,
      back,
      legend,
      shadow,
      mats,
      baseGeo: new RoundedBoxGeometry(HEALTH_CHART.w + 0.1, BASE_H, 1.15, 3, 0.04),
      barGeo: new RoundedBoxGeometry(1, 1, 1, 3, 0.07),
      capGeo: new RoundedBoxGeometry(0.37, 0.03, 0.37, 2, 0.012),
      backGeo: new THREE.PlaneGeometry(HEALTH_CHART.w, HEALTH_CHART.h),
      legendGeo: new THREE.PlaneGeometry(HEALTH_CHART.w, 0.34),
      postGeo: new THREE.BoxGeometry(0.045, HEALTH_CHART.h + 0.05, 0.05),
      railGeo: new THREE.BoxGeometry(HEALTH_CHART.w + 0.1, 0.045, 0.05),
      shadowGeo: new THREE.PlaneGeometry(1, 1),
    };
  });

  useFrame(() => {
    const hv = state.security.health;
    const g = root.current;
    if (!g) return;
    g.visible = hv > 0.001;
    if (!g.visible) return;
    const appear = Math.min(1, hv * 4);
    for (const m of res.mats) if (m !== res.shadow) m.opacity = appear;
    res.shadow.opacity = 0.6 * appear;
    COUNTS.forEach((n, i) => {
      const v = easeOut(stagger(hv, i, COUNTS.length, 0.5));
      const h = Math.max(n * HEALTH_CHART.unit * v, 0.0001);
      const b = bars.current[i];
      const c = caps.current[i];
      if (b) {
        b.visible = v > 0.01;
        b.scale.set(0.34, h, 0.34);
        b.position.y = BASE_H + h / 2;
      }
      if (c) {
        c.visible = v > 0.01;
        c.position.y = BASE_H + h + 0.015;
      }
      res.barMats[i].opacity = appear;
      res.capMats[i].opacity = appear;
    });
  });

  return (
    <group ref={root} position={position} rotation={rotation} scale={scale} visible={false} {...FOCUS}>
      <mesh geometry={res.shadowGeo} material={res.shadow} position={[0, 0.004, 0.05]} rotation={[-Math.PI / 2, 0, 0]} scale={[3.4, 2.1, 1]} renderOrder={1} />
      <mesh geometry={res.baseGeo} material={res.steel} position={[0, BASE_H / 2, 0]} />
      <mesh geometry={res.legendGeo} material={res.legend} position={[0, BASE_H + 0.002, 0.38]} rotation={[-Math.PI / 2, 0, 0]} />

      {/* Glass back panel in a slim steel frame */}
      <group position={[0, BASE_H, -0.42]}>
        <mesh geometry={res.backGeo} material={res.back} position={[0, HEALTH_CHART.h / 2, 0]} renderOrder={2} />
        {[-1, 1].map((sx) => (
          <mesh key={sx} geometry={res.postGeo} material={res.steel} position={[sx * (HEALTH_CHART.w / 2 + 0.02), HEALTH_CHART.h / 2, 0]} />
        ))}
        <mesh geometry={res.railGeo} material={res.steel} position={[0, HEALTH_CHART.h + 0.02, 0]} />
      </group>

      {HEALTH_CHART.xs.map((x, i) => (
        <group key={x} position={[x, 0, 0]}>
          <mesh ref={(el) => void (bars.current[i] = el)} geometry={res.barGeo} material={res.barMats[i]} visible={false} />
          <mesh ref={(el) => void (caps.current[i] = el)} geometry={res.capGeo} material={res.capMats[i]} visible={false} />
        </group>
      ))}
    </group>
  );
}
