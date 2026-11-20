"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCine } from "../kit/context";
import { S, useDisposables } from "../kit/parts";
import { beamTexture, boardTableTexture, brushedRoughness, floorTileTexture, nightCityTexture, radialTexture } from "../kit/textures";

/*
 * The Shared Vault's setting: a boardroom at the top of a tower at night. A
 * ring-shaped walnut table with a central well holds the vault; chairs stand
 * around it. A halo light hangs overhead, the floor is polished stone with a
 * cyan inlay, and floor-to-ceiling windows look out over a night city. The
 * windows and light dissolve with `state.shared.shell` when the camera leaves.
 */

export const SH_FLOOR_Y = -1.55;
export const TABLE_TOP = -0.8;
const T_INNER = 1.75;
const T_OUTER = 4.35;
const WALL_R = 15.1;
const CEIL_Y = 7;
const RING_Y = 6.4;
const MULLIONS = 40;
const CHAIRS = 8;
const CHAIR_R = 4.95;
const dummy = new THREE.Object3D();

function tableEdge() {
  const t = TABLE_TOP;
  const pts = [
    [T_OUTER - 0.01, t],
    [T_OUTER, t - 0.05],
    [T_OUTER - 0.07, t - 0.15],
    [T_INNER + 0.07, t - 0.15],
    [T_INNER, t - 0.05],
    [T_INNER + 0.01, t],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 128);
}

export function SharedRoom() {
  const { state, quality } = useCine();
  const { geo } = S();
  const reflective = !quality.compact && !quality.low;

  const res = useDisposables(() => {
    const floorMap = floorTileTexture();
    floorMap.repeat.set(8, 8);
    const city = new THREE.MeshBasicMaterial({ map: nightCityTexture(), side: THREE.BackSide, fog: false });
    const steel = (c: string, r: number, env = 0.9) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 0.9, roughness: r, roughnessMap: brushedRoughness(), envMapIntensity: env });
    const tableTop = new THREE.MeshPhysicalMaterial({ map: boardTableTexture(T_INNER / T_OUTER), roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.1 });
    const tableTopGeo = new THREE.RingGeometry(T_INNER, T_OUTER, 128, 1);
    tableTopGeo.rotateX(-Math.PI / 2);
    tableTopGeo.translate(0, TABLE_TOP, 0);
    const leather = new THREE.MeshPhysicalMaterial({ color: "#1a1c21", roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4, envMapIntensity: 0.8, side: THREE.DoubleSide });
    const warmLight = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe9c9").multiplyScalar(2.4), toneMapped: false, fog: false });
    const cyanLine = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5fe3ff").multiplyScalar(1.7), toneMapped: false, fog: false });
    const column = new THREE.MeshBasicMaterial({ map: beamTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide });
    const glowPool = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const shadow = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, depthWrite: false, toneMapped: false, fog: false });
    const solids = {
      tableTop,
      edge: steel("#2b2f35", 0.35),
      leg: steel("#555d68", 0.4),
      leather,
      chairSteel: steel("#8a929c", 0.3),
      mullion: steel("#1d2229", 0.45, 0.7),
      rail: steel("#6c747e", 0.32),
      warmLight,
      cyanLine,
    };
    const glass = new THREE.MeshPhysicalMaterial({ color: "#bcd4ee", metalness: 0.2, roughness: 0.06, transparent: true, opacity: 0, depthWrite: false, envMapIntensity: 1.6, side: THREE.DoubleSide });
    const water = new THREE.MeshPhysicalMaterial({ color: "#d8ecff", metalness: 0, roughness: 0.04, clearcoat: 1, transparent: true, opacity: 0, depthWrite: false, envMapIntensity: 1.5 });
    const ceil = new THREE.MeshStandardMaterial({ color: "#10151c", roughness: 0.9, metalness: 0.2 });
    const fadeMats: THREE.Material[] = [city, ceil, ...Object.values(solids)];
    return {
      floorMap,
      city,
      ...solids,
      ceil,
      glass,
      water,
      column,
      glowPool,
      shadow,
      fadeMats,
      floorGeo: new THREE.CircleGeometry(WALL_R + 0.1, 128),
      cityGeo: new THREE.CylinderGeometry(26, 26, 18, 96, 1, true),
      tableTopGeo,
      edgeGeo: tableEdge(),
      legGeo: new THREE.BoxGeometry(0.5, TABLE_TOP - 0.15 - SH_FLOOR_Y, 0.22),
      footGeo: new THREE.BoxGeometry(0.9, 0.04, 0.4),
      colGeo: new THREE.CylinderGeometry(0.55, 0.7, 2.7, 40),
      baseGeo: new THREE.CylinderGeometry(1.3, 1.4, 0.14, 64),
      frameGeo: new THREE.TorusGeometry(1.22, 0.09, 16, 96),
      seatGeo: new RoundedBoxGeometry(0.62, 0.1, 0.6, 3, 0.04),
      backGeo: new THREE.CylinderGeometry(0.38, 0.38, 0.8, 28, 1, true, Math.PI - 1.15, 2.3),
      postGeo: new THREE.CylinderGeometry(0.04, 0.05, 0.4, 12),
      discGeo: new THREE.CylinderGeometry(0.3, 0.32, 0.04, 28),
      mullionGeo: new THREE.BoxGeometry(0.16, CEIL_Y - SH_FLOOR_Y, 0.3),
      railGeo: new THREE.TorusGeometry(WALL_R, 0.06, 8, 160),
      ringGeo: new THREE.TorusGeometry(1, 0.0028, 8, 192),
      lightRingGeo: new THREE.TorusGeometry(3.2, 0.07, 12, 128),
      lightRingGeo2: new THREE.TorusGeometry(1.9, 0.045, 12, 96),
      glassGeo: new THREE.CylinderGeometry(WALL_R - 0.05, WALL_R - 0.05, CEIL_Y - SH_FLOOR_Y, 128, 1, true),
      armPostGeo: new THREE.BoxGeometry(0.035, 0.2, 0.035),
      armPadGeo: new RoundedBoxGeometry(0.075, 0.04, 0.34, 2, 0.015),
      spokeGeo: new THREE.BoxGeometry(0.32, 0.03, 0.055),
      casterGeo: new THREE.SphereGeometry(0.035, 12, 10),
      collarGeo: new THREE.LatheGeometry(
        [
          [1.1, -0.12],
          [1.16, -0.16],
          [1.5, -0.16],
          [1.56, -0.1],
          [1.56, 0.1],
          [1.5, 0.16],
          [1.16, 0.16],
          [1.1, 0.12],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        96,
      ).rotateX(Math.PI / 2),
      boltGeo: new THREE.CylinderGeometry(0.05, 0.05, 0.05, 6).rotateX(Math.PI / 2),
      wireGeo: new THREE.CylinderGeometry(0.01, 0.01, CEIL_Y - RING_Y, 6),
      ceilGeo: new THREE.CircleGeometry(WALL_R + 0.1, 96),
      noteGeo: new RoundedBoxGeometry(0.36, 0.022, 0.27, 2, 0.008),
      cupGeo: new THREE.CylinderGeometry(0.036, 0.028, 0.11, 20),
      columnGeo: new THREE.CylinderGeometry(3.2, 3.2, RING_Y - TABLE_TOP, 64, 1, true),
    };
  });

  const mullions = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.Group>(null);
  const floorMat = useRef<THREE.MeshStandardMaterial & { opacity: number }>(null);

  useLayoutEffect(() => {
    for (let i = 0; i < MULLIONS; i++) {
      const a = (i / MULLIONS) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * (WALL_R + 0.05), SH_FLOOR_Y + (CEIL_Y - SH_FLOOR_Y) / 2, Math.sin(a) * (WALL_R + 0.05));
      dummy.rotation.set(0, -a + Math.PI / 2, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      mullions.current?.setMatrixAt(i, dummy.matrix);
    }
    if (mullions.current) mullions.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const s = state.shared;
    const t = clock.elapsedTime;
    const room = s.room;
    const sh = room * s.shell;
    if (shell.current) {
      shell.current.visible = sh > 0.003;
      for (const m of res.fadeMats) {
        m.transparent = sh < 0.999;
        m.opacity = sh;
      }
      res.glass.opacity = 0.14 * sh;
      res.water.opacity = 0.4 * sh;
      res.column.color.set("#cfe2ff").multiplyScalar(0.035 * sh);
      res.glowPool.color.set("#4fc4ee").multiplyScalar(0.24 * sh);
    }
    res.shadow.opacity = 0.8 * room;
    if (floorMat.current) {
      floorMat.current.opacity = room;
      floorMat.current.transparent = true;
    }
    res.warmLight.color.set("#ffe9c9").multiplyScalar(2.2 + 0.15 * Math.sin(t * 0.8));
  });

  const legAngles = [0, 1, 2, 3].map((k) => Math.PI / 4 + (k * Math.PI) / 2);

  return (
    <group>
      {/* Polished stone floor */}
      <mesh geometry={res.floorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, SH_FLOOR_Y, 0]}>
        {reflective ? (
          <MeshReflectorMaterial
            ref={floorMat as never}
            map={res.floorMap}
            resolution={512}
            blur={[200, 60]}
            mixBlur={1}
            mixStrength={8}
            mirror={1}
            roughness={0.55}
            depthScale={0.4}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            color="#e2ecf8"
            metalness={0.45}
            envMapIntensity={0.4}
            transparent
          />
        ) : (
          <meshStandardMaterial ref={floorMat} map={res.floorMap} emissiveMap={res.floorMap} emissive="#6f8fb5" emissiveIntensity={1.0} color="#e2ecf8" roughness={0.55} metalness={0.35} envMapIntensity={0.45} transparent />
        )}
      </mesh>

      <group ref={shell}>
        {/* Night city beyond the glass */}
        <mesh geometry={res.cityGeo} material={res.city} position={[0, 4.2, 0]} renderOrder={-3} />

        <mesh geometry={res.glassGeo} material={res.glass} position={[0, SH_FLOOR_Y + (CEIL_Y - SH_FLOOR_Y) / 2, 0]} renderOrder={3} />

        {/* Window mullions and rails */}
        <instancedMesh ref={mullions} args={[res.mullionGeo, res.mullion, MULLIONS]} frustumCulled={false} />
        {[-0.4, 3.2, CEIL_Y - 0.1].map((y) => (
          <mesh key={y} geometry={res.railGeo} material={res.rail} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />
        ))}

        {/* Halo light overhead with a soft column of light down to the table */}
        <mesh geometry={res.lightRingGeo} material={res.warmLight} position={[0, RING_Y, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={res.lightRingGeo2} material={res.warmLight} position={[0, RING_Y + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={res.columnGeo} material={res.column} position={[0, (RING_Y + TABLE_TOP) / 2, 0]} renderOrder={4} />
        <mesh geometry={res.ceilGeo} material={res.ceil} position={[0, CEIL_Y, 0]} rotation={[Math.PI / 2, 0, 0]} />
        {[0, 1, 2, 3].map((k) => {
          const a = (k * Math.PI) / 2 + Math.PI / 4;
          return <mesh key={k} geometry={res.wireGeo} material={res.rail} position={[Math.cos(a) * 3.2, (CEIL_Y + RING_Y) / 2, Math.sin(a) * 3.2]} />;
        })}

      {/* Cyan floor inlay and a glow pool under the table */}
      <group>
        {[5.9, 7.6, 10.4].map((r) => (
          <mesh key={r} geometry={res.ringGeo} material={res.cyanLine} position={[0, SH_FLOOR_Y + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[r, r, r]} />
        ))}
        <mesh geometry={geo.plane} material={res.shadow} position={[0, SH_FLOOR_Y + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[13, 13, 1]} renderOrder={1} />
        <mesh geometry={geo.plane} material={res.glowPool} position={[0, SH_FLOOR_Y + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[15, 15, 1]} renderOrder={2} />
      </group>

      {/* Ring table */}
      <mesh geometry={res.tableTopGeo} material={res.tableTop} />
      <mesh geometry={res.edgeGeo} material={res.edge} />
      <mesh geometry={res.ringGeo} material={res.cyanLine} position={[0, TABLE_TOP - 0.15, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[T_OUTER - 0.25, T_OUTER - 0.25, T_OUTER - 0.25]} />
      {legAngles.map((a) => (
        <group key={a} position={[Math.cos(a) * 3.55, SH_FLOOR_Y + (TABLE_TOP - 0.15 - SH_FLOOR_Y) / 2, Math.sin(a) * 3.55]} rotation={[0, -a, 0]}>
          <mesh geometry={res.legGeo} material={res.leg} />
          <mesh geometry={res.footGeo} material={res.leg} position={[0, -(TABLE_TOP - 0.15 - SH_FLOOR_Y) / 2 + 0.02, 0]} />
        </group>
      ))}

      {/* Vault mount in the table's well: column, base and a steel frame ring */}
      <mesh geometry={res.baseGeo} material={res.edge} position={[0, SH_FLOOR_Y + 0.07, -0.1]} />
      <mesh geometry={res.colGeo} material={res.leg} position={[0, SH_FLOOR_Y + 1.35, -0.45]} />
      <mesh geometry={res.collarGeo} material={res.leg} position={[0, 1.1, -0.1]} />
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        return <mesh key={i} geometry={res.boltGeo} material={res.chairSteel} position={[Math.cos(a) * 1.33, 1.1 + Math.sin(a) * 1.33, 0.07]} rotation={[0, 0, a]} />;
      })}

      {/* Chairs */}
      {Array.from({ length: CHAIRS }, (_, i) => {
        const a = (i / CHAIRS) * Math.PI * 2 + Math.PI / 8;
        const yaw = Math.atan2(-Math.cos(a), -Math.sin(a));
        return (
          <group key={i}>
          <mesh geometry={res.noteGeo} material={res.leather} position={[Math.cos(a) * 3.85, TABLE_TOP + 0.011, Math.sin(a) * 3.85]} rotation={[0, yaw, 0]} />
          <mesh geometry={res.cupGeo} material={res.water} position={[Math.cos(a) * 3.55 - Math.sin(a) * 0.3, TABLE_TOP + 0.055, Math.sin(a) * 3.55 + Math.cos(a) * 0.3]} />
          <group position={[Math.cos(a) * CHAIR_R, 0, Math.sin(a) * CHAIR_R]} rotation={[0, yaw, 0]} scale={1.2}>
            <mesh geometry={res.seatGeo} material={res.leather} position={[0, -1.02, 0]} />
            <mesh geometry={res.backGeo} material={res.leather} position={[0, -0.58, -0.03]} />
            <mesh geometry={res.postGeo} material={res.chairSteel} position={[0, -1.27, 0]} />
            {[-1, 1].map((sx) => (
              <group key={sx}>
                <mesh geometry={res.armPostGeo} material={res.chairSteel} position={[sx * 0.31, -0.9, -0.05]} />
                <mesh geometry={res.armPadGeo} material={res.leather} position={[sx * 0.31, -0.79, 0.02]} />
              </group>
            ))}
            {[0, 1, 2, 3, 4].map((k) => {
              const a = (k / 5) * Math.PI * 2;
              return (
                <group key={k} rotation={[0, a, 0]}>
                  <mesh geometry={res.spokeGeo} material={res.chairSteel} position={[0.16, -1.5, 0]} />
                  <mesh geometry={res.casterGeo} material={res.edge} position={[0.31, -1.52, 0]} />
                </group>
              );
            })}
          </group>
          </group>
        );
      })}
      </group>
    </group>
  );
}
