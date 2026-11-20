"use client";

import { useFrame } from "@react-three/fiber";
import { forwardRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCine } from "./context";
import { createDustMaterial, createGridMaterial } from "./shaders";
import { VaultDoor } from "../../vaultModels";
import { brushedRoughness, labelTexture, radialTexture } from "./textures";

// ---------------------------------------------------------------------------
// Palette. Restrained and desaturated: one cool accent, muted status colours.
// Multiplying by k > 1 only matters for emissive parts (LEDs, light strips).
// ---------------------------------------------------------------------------
export const COLORS = {
  cyan: new THREE.Color("#5bb8cc"),
  blue: new THREE.Color("#4a78ad"),
  sky: new THREE.Color("#94c9e4"),
  violet: new THREE.Color("#8a80c0"),
  green: new THREE.Color("#5fb88f"),
  amber: new THREE.Color("#dba357"),
  red: new THREE.Color("#d9695f"),
  white: new THREE.Color("#eef2f6"),
};
export const glow = (c: THREE.Color, k: number) => c.clone().multiplyScalar(k);

// ---------------------------------------------------------------------------
// Shared geometry + material singletons (reused across every scene).
// ---------------------------------------------------------------------------
function createShared() {
  return {
    geo: {
      box: new THREE.BoxGeometry(1, 1, 1),
      plane: new THREE.PlaneGeometry(1, 1),
      octa: new THREE.OctahedronGeometry(1, 0),
      ico: new THREE.IcosahedronGeometry(1, 1),
      sphere: new THREE.SphereGeometry(1, 20, 14),
      cyl: new THREE.CylinderGeometry(1, 1, 1, 32),
      cylLow: new THREE.CylinderGeometry(1, 1, 1, 12),
    },
    mat: {
      // Brushed graphite / steel: neutral albedo, metal reflects the studio, not the palette.
      metal: new THREE.MeshPhysicalMaterial({ color: "#7d8793", metalness: 1, roughness: 0.4, roughnessMap: brushedRoughness(), envMapIntensity: 1.1 }),
      metalDark: new THREE.MeshPhysicalMaterial({ color: "#2a313b", metalness: 1, roughness: 0.5, roughnessMap: brushedRoughness(), envMapIntensity: 0.9 }),
      metalLight: new THREE.MeshPhysicalMaterial({ color: "#c3cbd4", metalness: 1, roughness: 0.3, roughnessMap: brushedRoughness(), envMapIntensity: 1.3 }),
      wall: new THREE.MeshStandardMaterial({ color: "#11171f", metalness: 0.3, roughness: 0.78, envMapIntensity: 0.5 }),
      // Emissive LED / light-strip material. Kept near the bloom threshold so only the core glows.
      glowCyan: new THREE.MeshBasicMaterial({ color: glow(COLORS.cyan, 1.05), toneMapped: false }),
      glowBlue: new THREE.MeshBasicMaterial({ color: glow(COLORS.blue, 0.9), toneMapped: false }),
      dimBlue: new THREE.MeshStandardMaterial({ color: "#26313e", metalness: 0.6, roughness: 0.5 }),
    },
  };
}
let shared: ReturnType<typeof createShared> | null = null;
export const S = () => (shared ??= createShared());

export function disposeShared() {
  if (!shared) return;
  Object.values(shared.geo).forEach((g) => g.dispose());
  Object.values(shared.mat).forEach((m) => m.dispose());
  shared = null;
}

// ---------------------------------------------------------------------------
// Fading: only materials created through `fadeable()` respond to fadeGroup,
// so shared materials are never modified by one scene's animation.
// ---------------------------------------------------------------------------
export function fadeable<M extends THREE.Material>(m: M, base = (m as { opacity?: number }).opacity ?? 1): M {
  m.transparent = true;
  m.userData.fade = true;
  m.userData.base = base;
  return m;
}

/**
 * A UI panel as a physical glass screen rather than a flat sticker. The
 * texture is both albedo and emission so it stays readable in any light,
 * and a clearcoat layer catches soft studio reflections like real glass.
 */
export function screenMaterial(map: THREE.Texture, side: THREE.Side = THREE.FrontSide) {
  return fadeable(
    new THREE.MeshPhysicalMaterial({
      map,
      color: "#d4dbe3",
      emissiveMap: map,
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.8,
      roughness: 0.32,
      metalness: 0,
      clearcoat: 0.7,
      clearcoatRoughness: 0.14,
      transparent: true,
      depthWrite: false,
      side,
    }),
  );
}

let fadeValue = 1;
function applyFade(o: THREE.Object3D) {
  const m = (o as THREE.Mesh).material as THREE.Material | undefined;
  if (!m || !m.userData.fade) return;
  const sm = m as THREE.ShaderMaterial;
  if (sm.uniforms?.uOpacity) sm.uniforms.uOpacity.value = fadeValue * m.userData.base;
  else m.opacity = fadeValue * m.userData.base;
}
/** Fade every fadeable material under `g`; hides the group entirely at 0. */
export function fadeGroup(g: THREE.Object3D | null, v: number) {
  if (!g) return;
  g.visible = v > 0.003;
  if (!g.visible) return;
  fadeValue = v;
  g.traverse(applyFade);
}

/** useMemo + dispose on unmount, for per-scene materials/geometries. */
export function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: React.DependencyList = []): T {
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

type MaybeDisposable = { dispose?: () => void };

/** Bag of per-scene GPU resources (single values or arrays) disposed together on unmount. */
export function useDisposables<T extends Record<string, unknown>>(factory: () => T): T {
  const value = useMemo(factory, []);
  useEffect(
    () => () => {
      for (const v of Object.values(value)) {
        for (const item of Array.isArray(v) ? v : [v]) (item as MaybeDisposable | null)?.dispose?.();
      }
    },
    [value],
  );
  return value;
}

// ---------------------------------------------------------------------------
// Reusable scene parts
// ---------------------------------------------------------------------------

/** Floating text label (canvas texture). Width in world units; height follows the texture aspect. */
export const Label = forwardRef<
  THREE.Mesh,
  { text: string; sub?: string; color?: string; width?: number } & Omit<React.ComponentProps<"mesh">, "args">
>(function Label({ text, sub, color = "#6cc4d6", width = 1.8, ...props }, ref) {
  const mat = useDisposable(() => screenMaterial(labelTexture(text, sub, color)), [text, sub, color]);
  return <mesh ref={ref} geometry={S().geo.plane} material={mat} scale={[width, width / 4, 1]} {...props} />;
});

/** Additive radial glow (volumetric-style light bloom without post-processing). */
export const GlowSprite = forwardRef<THREE.Sprite, { color?: THREE.ColorRepresentation; opacity?: number } & React.ComponentProps<"sprite">>(
  function GlowSprite({ color = "#5bb8cc", opacity = 1, ...props }, ref) {
    const mat = useDisposable(
      () =>
        fadeable(
          new THREE.SpriteMaterial({
            map: radialTexture(),
            color,
            transparent: true,
            opacity,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
          }),
          opacity,
        ),
      [color, opacity],
    );
    return <sprite ref={ref} material={mat} {...props} />;
  },
);

/** Grid floor that fades in with `opacity()` (read every frame). */
export function FloorGrid({ y = -1.6, size = 40, radius = 14, opacity }: { y?: number; size?: number; radius?: number; opacity: () => number }) {
  const mat = useDisposable(() => {
    const m = createGridMaterial("#6f8fb0", 1);
    m.uniforms.uRadius.value = radius;
    return m;
  });
  const geo = useDisposable(() => new THREE.PlaneGeometry(size, size, 1, 1));
  useFrame(() => {
    mat.uniforms.uOpacity.value = opacity();
  });
  return <mesh geometry={geo} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1} />;
}

/** Realistic steel vault door (bevelled, chrome bezel, combination dial) used as the "core" of the product rooms. */
export const VaultCore = forwardRef<THREE.Group, React.ComponentProps<"group"> & { spinRef?: React.RefObject<THREE.Group | null> }>(
  function VaultCore({ spinRef, ...props }, ref) {
    return <VaultDoor ref={ref} radius={1} spinRef={spinRef} {...props} />;
  },
);

/** Stylised key: the visual stand-in for key material (SSH keys, local keys). */
export function KeyModel({ material, ...props }: React.ComponentProps<"group"> & { material?: THREE.Material }) {
  const { geo, mat } = S();
  const m = material ?? mat.metalLight;
  return (
    <group {...props}>
      <mesh material={m} position={[-0.42, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 10, 32]} />
      </mesh>
      <mesh geometry={geo.box} material={m} position={[0.12, 0, 0]} scale={[0.68, 0.07, 0.07]} />
      <mesh geometry={geo.box} material={m} position={[0.32, -0.09, 0]} scale={[0.06, 0.16, 0.06]} />
      <mesh geometry={geo.box} material={m} position={[0.42, -0.07, 0]} scale={[0.06, 0.12, 0.06]} />
    </group>
  );
}

/** Journey-wide atmospheric dust that wraps around the camera (GPU only). */
export function Dust({ count }: { count: number }) {
  const { state } = useCine();
  const geo = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * 26;
      pos[i * 3 + 1] = Math.random() * 16;
      pos[i * 3 + 2] = Math.random() * 34;
      seed[i] = Math.random();
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, [count]);
  const mat = useDisposable(() => createDustMaterial(0.35));
  const flow = useRef(0);

  useFrame(({ camera, clock, gl }, dt) => {
    const u = mat.uniforms;
    u.uCam.value.copy(camera.position);
    u.uTime.value = clock.elapsedTime;
    // Scroll velocity pushes the dust past the camera for a sense of speed.
    flow.current += dt * Math.min(Math.abs(state.velocity) * 0.004, 14);
    u.uFlow.value = flow.current;
    u.uSize.value = 0.35 * gl.getPixelRatio();
  });

  return <points geometry={geo} material={mat} frustumCulled={false} />;
}
