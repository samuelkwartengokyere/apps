"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { backOut, easeOut, lerp, range } from "../kit/math";
import { COLORS, GlowSprite, S, useDisposables } from "../kit/parts";
import { CTA_CEIL_Y, CtaRoom } from "./CtaRoom";

const RING_R = 4.2;

/** The SecureVault shield (same path as the SVG LogoMark), in world units. */
function shieldShape(scale = 1) {
  const P = (x: number, y: number) => new THREE.Vector2(((x - 16) / 10) * scale, (-(y - 16) / 10) * scale);
  const path = new THREE.Path();
  const m = P(16, 2.5);
  path.moveTo(m.x, m.y);
  const l1 = P(4.5, 6.8);
  path.lineTo(l1.x, l1.y);
  const l2 = P(4.5, 14.9);
  path.lineTo(l2.x, l2.y);
  const c1 = [P(4.5, 21.9), P(9.3, 27.1), P(16, 29.5)];
  path.bezierCurveTo(c1[0].x, c1[0].y, c1[1].x, c1[1].y, c1[2].x, c1[2].y);
  const c2 = [P(22.7, 27.1), P(27.5, 21.9), P(27.5, 14.9)];
  path.bezierCurveTo(c2[0].x, c2[0].y, c2[1].x, c2[1].y, c2[2].x, c2[2].y);
  const l3 = P(27.5, 6.8);
  path.lineTo(l3.x, l3.y);
  path.closePath();
  return path;
}

function createLogoGeometry() {
  const outer = new THREE.Shape(shieldShape(1).getPoints(24));
  const inner = new THREE.Path(shieldShape(0.82).getPoints(24).map((p) => p.add(new THREE.Vector2(0, -0.04))));
  outer.holes.push(inner);
  const g = new THREE.ExtrudeGeometry(outer, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2, curveSegments: 12 });
  g.center();
  return g;
}

const dummy = new THREE.Object3D();

export default function FinalPortal() {
  const { state, quality } = useCine();
  const { geo, mat } = S();
  const swirlCount = quality.compact ? 350 : 900;

  const res = useDisposables(() => {
    const swirl = new THREE.BufferGeometry();
    const pos = new Float32Array(swirlCount * 3);
    for (let i = 0; i < swirlCount; i++) {
      const r = Math.sqrt(Math.random()) * (RING_R - 0.3);
      const a = r * 1.6 + Math.random() * 0.9 + (i % 3) * ((Math.PI * 2) / 3);
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = -r * 0.35 - Math.random() * 0.4;
    }
    swirl.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const logo = createLogoGeometry();
    return {
      steel: new THREE.MeshPhysicalMaterial({ color: "#a9b1ba", metalness: 1, roughness: 0.3, envMapIntensity: 0.9, clearcoat: 0.2, clearcoatRoughness: 0.2 }),
      enamel: new THREE.MeshPhysicalMaterial({ color: "#2fb4cf", roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08, emissive: new THREE.Color("#2fb4cf"), emissiveIntensity: 0.12 }),
      cableGeo: new THREE.CylinderGeometry(0.012, 0.012, 1, 6),
      clampGeo: new THREE.CylinderGeometry(0.045, 0.045, 0.12, 10),
      cable: new THREE.MeshStandardMaterial({ color: "#9aa3ad", metalness: 0.9, roughness: 0.35 }),
      swirl,
      swirlMat: new THREE.PointsMaterial({
        size: 0.035,
        color: new THREE.Color("#ffe6c2"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
      logo,
      keyRingGeo: new THREE.TorusGeometry(0.3, 0.075, 12, 48),
    };
  });

  const swirl = useRef<THREE.Points>(null);
  const logo = useRef<THREE.Group>(null);
  const core = useRef<THREE.Sprite>(null);
  const halo = useRef<THREE.Sprite>(null);

  useFrame(({ clock }) => {
    const c = state.cta;
    const t = clock.elapsedTime;
    const open = easeOut(c.portal);

    res.swirlMat.opacity = range(c.portal, 0.3, 1) * 0.85;
    if (swirl.current) swirl.current.rotation.z = -t * 0.05 - c.portal * 0.6;
    if (core.current) (core.current.material as THREE.SpriteMaterial).opacity = open * (0.4 + 0.05 * Math.sin(t * 1.4));
    if (halo.current) {
      (halo.current.material as THREE.SpriteMaterial).opacity = open * 0.22;
      halo.current.scale.setScalar(lerp(6, 16, open));
    }

    // Logo: spins in, locks facing the visitor, then breathes gently.
    if (logo.current) {
      const l = c.logo;
      logo.current.visible = l > 0.001;
      logo.current.scale.setScalar(backOut(l) * 1.35);
      logo.current.rotation.y = (1 - easeOut(l)) * Math.PI * 1.5 + Math.sin(t * 0.5) * 0.08 * c.settle;
      logo.current.position.y = 0.95 + Math.sin(t * 0.8) * 0.05 * c.settle;
    }
  });

  // Hung from the ceiling on two steel cables (logo-local units; the group is scaled 1.35).
  const cableLen = (CTA_CEIL_Y - 0.95) / 1.35 - 0.9;
  return (
    <group>
      <CtaRoom />
      <GlowSprite ref={halo} color="#ffc98f" position={[0, 0, -3]} scale={6} opacity={0} />
      <group>
        <points ref={swirl} geometry={res.swirl} material={res.swirlMat} />
        <GlowSprite ref={core} color="#ffe0b0" position={[0, 0, -0.5]} scale={7} opacity={0} />
      </group>

      <group ref={logo} position={[0, 0.95, 0.6]} visible={false}>
        <mesh geometry={res.logo} material={res.steel} />
        {[-0.95, 0.95].map((x) => (
          <group key={x} position={[x, 0.9, -0.05]}>
            <mesh geometry={res.clampGeo} material={res.cable} position={[0, 0.04, 0]} />
            <mesh geometry={res.cableGeo} material={res.cable} position={[0, cableLen / 2, 0]} scale={[1, cableLen, 1]} />
          </group>
        ))}
        <group position={[0, 0.25, 0.16]}>
          <mesh geometry={res.keyRingGeo} material={res.enamel} />
          <mesh geometry={geo.box} material={res.enamel} position={[0, -0.5, 0]} scale={[0.15, 0.5, 0.1]} />
        </group>
      </group>
    </group>
  );
}
