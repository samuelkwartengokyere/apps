"use client";

import { forwardRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { brushedRoughness, canvasTexture, font } from "./cinematic/kit/textures";

/*
 * Vault hardware modelled on real proportions: a bevelled steel door with a
 * combination dial, chrome spoke handle and bolt ring, and a rounded
 * powder-coated safe body with a steel door plate. These replace the stylised
 * primitives (glass prisms, flat discs, glowing capsules) that read as toys.
 *
 * Conventions: doors and safe faces point along +Z; sizes are world units.
 */

/** Door half-thickness as a fraction of its radius. */
export const DOOR_HALF = 0.18;
/** The flat front face sits a little inside the rounded rim. */
const DOOR_FRONT = DOOR_HALF * 0.78;
/** Steel plate thickness on the front of a safe body. */
export const SAFE_PLATE = 0.03;
/** z of a safe's front face, measured from its centre. */
export const safeFaceZ = (depth: number) => depth / 2 + SAFE_PLATE;

const SPOKE_ANGLES = [0, 1, 2].map((k) => Math.PI / 2 + (k * Math.PI * 2) / 3);
const BOLTS = 12;

// ---------------------------------------------------------------------------
// Materials. Created on first use (client only) and shared across instances.
// ---------------------------------------------------------------------------
function createFinishes() {
  const brushed = brushedRoughness();
  return {
    // Brushed satin steel. Partly dielectric so it keeps some diffuse
    // shading; fully metallic steel goes black wherever the studio has no
    // light to reflect.
    satin: new THREE.MeshPhysicalMaterial({
      color: "#c9d2dc",
      metalness: 0.6,
      roughness: 0.4,
      roughnessMap: brushed,
      clearcoat: 0.15,
      clearcoatRoughness: 0.4,
      envMapIntensity: 1.4,
    }),
    // Powder-coated graphite body with a light clearcoat sheen.
    paint: new THREE.MeshPhysicalMaterial({
      color: "#48525f",
      metalness: 0.25,
      roughness: 0.5,
      roughnessMap: brushed,
      clearcoat: 0.4,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.2,
    }),
    chrome: new THREE.MeshPhysicalMaterial({ color: "#e4e9ef", metalness: 1, roughness: 0.12, envMapIntensity: 1.6 }),
    seam: new THREE.MeshStandardMaterial({ color: "#070a0f", metalness: 0.3, roughness: 0.7 }),
    dial: new THREE.MeshStandardMaterial({ map: dialTexture(), metalness: 0.3, roughness: 0.34 }),
    glow: new THREE.MeshBasicMaterial({ color: new THREE.Color("#5bb8cc").multiplyScalar(1.1), toneMapped: false }),
  };
}

type Finishes = ReturnType<typeof createFinishes>;
let finishes: Finishes | null = null;
const getFinishes = (): Finishes => (finishes ??= createFinishes());

/** Silver combination dial: tick marks and numbers every ten units. */
function dialTexture() {
  return canvasTexture("vault-dial", 512, 512, (ctx, w, h) => {
    const c = w / 2;
    const g = ctx.createRadialGradient(c, c, 30, c, c, c);
    g.addColorStop(0, "#f4f7fa");
    g.addColorStop(0.8, "#d3dbe4");
    g.addColorStop(1, "#aab6c3");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "#1c2531";
    ctx.lineCap = "round";
    for (let i = 0; i < 100; i++) {
      const a = (i / 100) * Math.PI * 2 - Math.PI / 2;
      const major = i % 10 === 0;
      const r1 = c * 0.92;
      const r2 = c * (major ? 0.74 : 0.84);
      ctx.lineWidth = major ? 7 : 2.5;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1);
      ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2);
      ctx.stroke();
    }

    ctx.fillStyle = "#1c2531";
    ctx.font = font(44, 700, true);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (let n = 0; n < 100; n += 10) {
      const a = (n / 100) * Math.PI * 2 - Math.PI / 2;
      ctx.fillText(String(n), c + Math.cos(a) * c * 0.58, c + Math.sin(a) * c * 0.58);
    }
  });
}

// ---------------------------------------------------------------------------
// Geometry. Built per instance and disposed on unmount.
// ---------------------------------------------------------------------------
function useOwned<T extends Record<string, THREE.BufferGeometry>>(build: () => T, deps: readonly unknown[]): T {
  const value = useMemo(build, deps);
  useEffect(
    () => () => {
      for (const g of Object.values(value)) g.dispose();
    },
    [value],
  );
  return value;
}

function doorGeometry(R: number) {
  const h = R * DOOR_HALF;
  const f = R * DOOR_FRONT;
  // Lathe profile, bottom to top (outward normals), bevelled both faces.
  const profile = [
    new THREE.Vector2(0, -f),
    new THREE.Vector2(R * 0.86, -f),
    new THREE.Vector2(R * 0.93, -h * 0.86),
    new THREE.Vector2(R * 0.985, -h * 0.94),
    new THREE.Vector2(R, -h * 0.6),
    new THREE.Vector2(R, h * 0.6),
    new THREE.Vector2(R * 0.985, h * 0.94),
    new THREE.Vector2(R * 0.93, h * 0.86),
    new THREE.Vector2(R * 0.86, f),
    new THREE.Vector2(0, f),
  ];
  const body = new THREE.LatheGeometry(profile, 160);
  body.rotateX(Math.PI / 2); // lathe axis Y → Z (door faces +Z)
  return body;
}

function useDoorGeometry(radius: number) {
  return useOwned(
    () => {
      const R = radius;
      const rim = new THREE.TorusGeometry(R * 0.965, R * 0.022, 16, 160);
      const bezel = new THREE.TorusGeometry(R * 0.56, R * 0.05, 20, 120);
      const seam = new THREE.TorusGeometry(R * 0.84, R * 0.008, 8, 160);
      const face = new THREE.CircleGeometry(R * 0.5, 96);
      const spoke = new THREE.CapsuleGeometry(R * 0.035, R * 0.42, 6, 14);
      const knob = new THREE.SphereGeometry(R * 0.05, 20, 14);
      const hub = new THREE.CylinderGeometry(R * 0.085, R * 0.1, R * 0.08, 40);
      hub.rotateX(Math.PI / 2);
      const bolt = new THREE.CylinderGeometry(R * 0.04, R * 0.04, R * 0.03, 18);
      bolt.rotateX(Math.PI / 2);
      return { body: doorGeometry(R), rim, bezel, seam, face, spoke, knob, hub, bolt };
    },
    [radius],
  );
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
export type VaultDoorProps = React.ComponentProps<"group"> & {
  /** Door radius in world units. */
  radius?: number;
  /** Attached to the combination dial and handle, so they can be rotated. */
  spinRef?: React.RefObject<THREE.Group | null>;
  /** Thin glowing seam around the door (the product accent). */
  seam?: boolean;
};

/** Round bevelled vault door with a chrome bezel, combination dial, spoke handle and bolt ring. Faces +Z. */
export const VaultDoor = forwardRef<THREE.Group, VaultDoorProps>(function VaultDoor({ radius = 1, spinRef, seam = true, ...props }, ref) {
  const g = useDoorGeometry(radius);
  const f = getFinishes();
  const R = radius;
  const front = R * DOOR_FRONT;

  return (
    <group ref={ref} {...props}>
      <mesh geometry={g.body} material={f.satin} />
      <mesh geometry={g.rim} material={f.chrome} position={[0, 0, R * DOOR_HALF * 0.9]} />
      {seam && <mesh geometry={g.seam} material={f.glow} position={[0, 0, front + R * 0.002]} />}
      <mesh geometry={g.bezel} material={f.chrome} position={[0, 0, front + R * 0.02]} />
      {Array.from({ length: BOLTS }, (_, i) => {
        const a = (i / BOLTS) * Math.PI * 2;
        return <mesh key={i} geometry={g.bolt} material={f.chrome} position={[Math.cos(a) * R * 0.7, Math.sin(a) * R * 0.7, front + R * 0.012]} />;
      })}

      {/* Dial and handle: rotate together about the door's axis. */}
      <group ref={spinRef} position={[0, 0, front + R * 0.01]}>
        <mesh geometry={g.face} material={f.dial} />
        {SPOKE_ANGLES.map((a) => (
          <group key={a}>
            <mesh geometry={g.spoke} material={f.chrome} position={[Math.cos(a) * R * 0.36, Math.sin(a) * R * 0.36, R * 0.05]} rotation={[0, 0, a - Math.PI / 2]} />
            <mesh geometry={g.knob} material={f.chrome} position={[Math.cos(a) * R * 0.6, Math.sin(a) * R * 0.6, R * 0.05]} />
          </group>
        ))}
        <mesh geometry={g.hub} material={f.chrome} position={[0, 0, R * 0.05]} />
      </group>
    </group>
  );
});

export type SteelSafeProps = React.ComponentProps<"group"> & {
  width: number;
  height: number;
  depth: number;
  /** Small cyan status light on the door plate. */
  led?: boolean;
};

/**
 * Rounded, powder-coated steel safe body with an inset steel door plate. The
 * front face is at `safeFaceZ(depth)`; place doors or dials there.
 */
export const SteelSafe = forwardRef<THREE.Group, SteelSafeProps>(function SteelSafe({ width, height, depth, led = true, ...props }, ref) {
  const g = useOwned(
    () => ({
      body: new RoundedBoxGeometry(width, height, depth, 5, Math.min(width, height, depth) * 0.06),
      frame: new RoundedBoxGeometry(width * 0.92, height * 0.92, 0.02, 3, 0.008),
      plate: new RoundedBoxGeometry(width * 0.86, height * 0.86, SAFE_PLATE, 4, 0.012),
      led: new THREE.CircleGeometry(Math.min(width, height) * 0.012, 20),
    }),
    [width, height, depth],
  );
  const f = getFinishes();
  const z = depth / 2;

  return (
    <group ref={ref} {...props}>
      <mesh geometry={g.body} material={f.paint} />
      <mesh geometry={g.frame} material={f.seam} position={[0, 0, z + 0.001]} />
      <mesh geometry={g.plate} material={f.satin} position={[0, 0, z + SAFE_PLATE / 2]} />
      {led && <mesh geometry={g.led} material={f.glow} position={[width * 0.36, -height * 0.36, safeFaceZ(depth) + 0.002]} />}
    </group>
  );
});
