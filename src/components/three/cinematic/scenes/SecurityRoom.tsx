"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { S, useDisposables } from "../kit/parts";
import { corridorCeilTexture, corridorFloorTexture, corridorWallTexture, doorSignTexture, floorTileTexture, radialTexture, serverCeilingTexture, shaftTexture, socScreenTexture, socWallTexture } from "../kit/textures";

/*
 * The Security Center's setting: a security operations room. A curved video
 * wall of dashboards faces the central platform, operator consoles with dual
 * monitors and chairs stand along the sides, slatted acoustic walls and a
 * ceiling with linear lights close the room, and the floor is polished stone.
 * Everything except the floor dissolves with `state.security.shell`.
 */

export const SEC_FLOOR_Y = -1.65;
const WALL_R = 22;
const CEIL_Y = 8.6;
const WALL_H = CEIL_Y - SEC_FLOOR_Y;
const WALL_SCREENS = 7;
const SCREEN_R = 11;
const SCREEN_W = 5.2;
const SCREEN_H = 2.925;
const SCREEN_Y = 3.1;
const BAR_ROWS = [9, 4, -1, -6, -10];
const BAR_XS = [-9, -3, 3, 9];
const CONSOLES: [number, number][] = [
  [-6.1, 4.2],
  [-9.3, 4.2],
  [-7.7, 7.8],
  [6.1, 4.2],
  [9.3, 4.2],
  [7.7, 7.8],
];
const PILASTERS = 24;
const DOOR_G = 0.1; // half-angle of the doorway cut in the wall (rad)
const DOOR_HALF = 2.2;
const DOOR_H = 4.4;
const CORR_LEN = 6.6;
const DOWNLIGHTS = 8;
const RING_Y = CEIL_Y - 0.6;
const dummy = new THREE.Object3D();

function Console({ x, z, seed, res }: { x: number; z: number; seed: number; res: ReturnType<typeof useResources> }) {
  const deskY = SEC_FLOOR_Y + 0.78;
  return (
    <group position={[x, 0, z]} rotation={[0, x > 0 ? 0.12 : -0.12, 0]}>
      <mesh geometry={res.deskGeo} material={res.desk} position={[0, deskY, 0]} />
      {[-1.33, 1.33].map((sx) => (
        <mesh key={sx} geometry={res.sideGeo} material={res.frame} position={[sx, SEC_FLOOR_Y + 0.39, 0]} />
      ))}
      <mesh geometry={res.modestyGeo} material={res.frame} position={[0, SEC_FLOOR_Y + 0.55, -0.44]} />
      {[-0.46, 0.46].map((mx, i) => (
        <group key={mx} position={[mx, deskY + 0.03, -0.18]} rotation={[0, -mx * 0.45, 0]}>
          <mesh geometry={res.standGeo} material={res.frame} position={[0, 0.12, -0.03]} />
          <mesh geometry={res.bezelGeo} material={res.frame} position={[0, 0.4, 0]} />
          <mesh geometry={res.screenGeo} material={res.consoleScreens[(seed + i) % res.consoleScreens.length]} position={[0, 0.4, 0.019]} />
        </group>
      ))}
      <mesh geometry={res.keyboardGeo} material={res.frame} position={[0, deskY + 0.035, 0.22]} />
      <mesh geometry={res.mouseGeo} material={res.frame} position={[0.5, deskY + 0.045, 0.24]} />
      <mesh geometry={res.mugGeo} material={res.steel} position={[-0.72, deskY + 0.075, 0.2]} />
      <mesh geometry={res.ledGeo} material={res.led} position={[0, deskY - 0.02, 0.5]} />
      {/* Operator chair */}
      <group position={[0.1, 0, 1.15]}>
        <mesh geometry={res.seatGeo} material={res.leather} position={[0, SEC_FLOOR_Y + 0.5, 0]} />
        <mesh geometry={res.chairBackGeo} material={res.leather} position={[0, SEC_FLOOR_Y + 0.88, 0.27]} rotation={[0.1, 0, 0]} />
        <mesh geometry={res.postGeo} material={res.steel} position={[0, SEC_FLOOR_Y + 0.27, 0]} />
        {[0, 1, 2, 3, 4].map((k) => (
          <group key={k} rotation={[0, (k / 5) * Math.PI * 2, 0]}>
            <mesh geometry={res.spokeGeo} material={res.steel} position={[0.16, SEC_FLOOR_Y + 0.06, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
}

function useResources() {
  const { quality } = useCine();
  void quality;
  return useDisposables(() => {
    const steel = (c: string, r: number, m = 0.85) => new THREE.MeshPhysicalMaterial({ color: c, metalness: m, roughness: r, envMapIntensity: 0.8 });
    const screenMat = (kind: number, i = 0.95) => {
      const map = socScreenTexture(kind);
      return new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color("#ffffff"), emissiveIntensity: i, roughness: 0.4, metalness: 0 });
    };
    return {
      wallScreens: [0, 1, 2, 3].map((k) => screenMat(k, 1.0)),
      consoleScreens: [0, 1, 2, 3].map((k) => screenMat(k, 0.85)),
      desk: steel("#2a2f36", 0.35, 0.3),
      frame: steel("#171b21", 0.5, 0.7),
      steel: steel("#7a828c", 0.35),
      leather: new THREE.MeshStandardMaterial({ color: "#14171c", roughness: 0.6, metalness: 0.05 }),
      deskGeo: new RoundedBoxGeometry(2.8, 0.06, 1, 2, 0.02),
      sideGeo: new THREE.BoxGeometry(0.06, 0.78, 0.9),
      modestyGeo: new THREE.BoxGeometry(2.7, 0.5, 0.04),
      standGeo: new THREE.BoxGeometry(0.04, 0.22, 0.04),
      bezelGeo: new RoundedBoxGeometry(0.88, 0.52, 0.035, 2, 0.01),
      screenGeo: new THREE.PlaneGeometry(0.82, 0.46),
      keyboardGeo: new THREE.BoxGeometry(0.5, 0.012, 0.17),
      seatGeo: new RoundedBoxGeometry(0.56, 0.09, 0.56, 3, 0.04),
      chairBackGeo: new RoundedBoxGeometry(0.54, 0.6, 0.07, 3, 0.03),
      postGeo: new THREE.CylinderGeometry(0.035, 0.045, 0.42, 10),
      spokeGeo: new THREE.BoxGeometry(0.32, 0.03, 0.05),
      mouseGeo: new RoundedBoxGeometry(0.07, 0.03, 0.11, 2, 0.015),
      mugGeo: new THREE.CylinderGeometry(0.04, 0.035, 0.1, 14),
      ledGeo: new THREE.BoxGeometry(2.7, 0.012, 0.012),
      led: new THREE.MeshBasicMaterial({ color: new THREE.Color("#5fe3ff").multiplyScalar(1.4), toneMapped: false, fog: false }),
    };
  });
}

export function SecurityRoom() {
  const { state, quality } = useCine();
  const { geo } = S();
  const reflective = !quality.compact && !quality.low;
  const res = useResources();

  const core = useDisposables(() => {
    const floorMap = floorTileTexture();
    floorMap.repeat.set(10, 10);
    const wallMap = socWallTexture();
    wallMap.repeat.set(13, 1);
    const ceilMap = serverCeilingTexture();
    ceilMap.repeat.set(WALL_R * 2 / 1.4, WALL_R * 2 / 1.4);
    const wall = new THREE.MeshBasicMaterial({ map: wallMap, side: THREE.BackSide, fog: false });
    const ceil = new THREE.MeshBasicMaterial({ map: ceilMap, fog: false });
    const bar = new THREE.MeshBasicMaterial({ color: new THREE.Color("#cfe6ff").multiplyScalar(1.8), toneMapped: false, fog: false });
    const cabinet = new THREE.MeshStandardMaterial({ color: "#12161c", metalness: 0.7, roughness: 0.45, side: THREE.DoubleSide });
    const glowStrip = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5fe3ff").multiplyScalar(1.5), toneMapped: false, fog: false });
    const pool = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const cove = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5fe3ff").multiplyScalar(1.1), toneMapped: false, fog: false, side: THREE.BackSide });
    const coveTop = new THREE.MeshBasicMaterial({ color: new THREE.Color("#a9cdf5").multiplyScalar(1.3), toneMapped: false, fog: false, side: THREE.BackSide });
    const inlay = new THREE.MeshBasicMaterial({ color: new THREE.Color("#4fb8e0").multiplyScalar(0.55), toneMapped: false, fog: false });
    const corrWall = new THREE.MeshBasicMaterial({ map: corridorWallTexture(), side: THREE.DoubleSide, fog: false });
    const corrFloor = new THREE.MeshBasicMaterial({ map: corridorFloorTexture(), fog: false, toneMapped: false });
    const corrCeil = new THREE.MeshBasicMaterial({ map: corridorCeilTexture(), fog: false });
    const doorSign = new THREE.MeshBasicMaterial({ map: doorSignTexture(), toneMapped: false, fog: false, transparent: true });
    const doorGlow = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5fe3ff").multiplyScalar(0.7), toneMapped: false, fog: false });
    const rig = new THREE.MeshStandardMaterial({ color: "#2b3037", metalness: 0.85, roughness: 0.4 });
    const shaft = new THREE.MeshBasicMaterial({ map: shaftTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide });
    const fadeMats: THREE.Material[] = [corrWall, corrFloor, corrCeil, doorSign, doorGlow, wall, ceil, bar, cabinet, glowStrip, cove, coveTop, inlay, rig, res.led, ...res.wallScreens, ...res.consoleScreens, res.desk, res.frame, res.steel, res.leather];
    const half = (82 * Math.PI) / 180;
    return {
      floorMap,
      wall,
      ceil,
      bar,
      cabinet,
      glowStrip,
      pool,
      fadeMats,
      corrWall,
      corrFloor,
      corrCeil,
      doorSign,
      doorGlow,
      cove,
      coveTop,
      inlay,
      rig,
      shaft,
      coveGeo: new THREE.CylinderGeometry(WALL_R - 0.1, WALL_R - 0.1, 0.1, 128, 1, true),
      pilasterGeo: new THREE.BoxGeometry(0.55, WALL_H, 0.35),
      inlayGeos: [6.3, 14.6].map((r) => new THREE.RingGeometry(r - 0.035, r + 0.035, 160)),
      truss: new THREE.TorusGeometry(7, 0.1, 10, 96),
      rodGeo: new THREE.CylinderGeometry(0.025, 0.025, CEIL_Y - RING_Y, 6),
      lampGeo: new THREE.CylinderGeometry(0.26, 0.3, 0.12, 20),
      shaftGeo: new THREE.PlaneGeometry(2.2, RING_Y - SEC_FLOOR_Y),
      floorGeo: new THREE.CircleGeometry(WALL_R + 0.1, 128),
      wallGeo: new THREE.CylinderGeometry(WALL_R, WALL_R, WALL_H, 128, 1, true, Math.PI + DOOR_G, Math.PI * 2 - DOOR_G * 2),
      ceilGeo: new THREE.CircleGeometry(WALL_R + 0.1, 96),
      barGeo: new THREE.BoxGeometry(5, 0.05, 0.25),
      screenGeo: new THREE.PlaneGeometry(SCREEN_W, SCREEN_H),
      frameGeo: new THREE.BoxGeometry(SCREEN_W + 0.16, SCREEN_H + 0.16, 0.16),
      stripGeo: new THREE.BoxGeometry(SCREEN_W + 0.1, 0.03, 0.03),
      cabinetGeos: [-1, 1].map((sgn) => {
        const gap = 0.2;
        const start = sgn < 0 ? Math.PI - half : Math.PI + gap;
        return new THREE.CylinderGeometry(SCREEN_R + 0.35, SCREEN_R + 0.35, 1.9, 48, 1, true, start, half - gap);
      }),
      cabinetCapGeos: [-1, 1].map((sgn) => {
        const gap = 0.2;
        const start = sgn < 0 ? Math.PI - half : Math.PI + gap;
        return new THREE.CylinderGeometry(SCREEN_R + 0.3, SCREEN_R + 0.3, 0.1, 48, 1, true, start, half - gap);
      }),
      corrFloorGeo: new THREE.PlaneGeometry(DOOR_HALF * 2, CORR_LEN),
      corrWallGeo: new THREE.PlaneGeometry(CORR_LEN, DOOR_H),
      signGeo: new THREE.PlaneGeometry(4.2, 0.656),
      archPostGeo: new THREE.BoxGeometry(0.16, DOOR_H - 0.7, 0.34),
      archHeadGeo: new THREE.BoxGeometry(DOOR_HALF * 2, 0.16, 0.34),
      archGlowGeo: new THREE.BoxGeometry(0.03, DOOR_H - 0.8, 0.03),
      lintelGeo: new THREE.PlaneGeometry(DOOR_HALF * 2 + 0.6, CEIL_Y - (SEC_FLOOR_Y + DOOR_H)),
      postGeo: new THREE.BoxGeometry(0.22, DOOR_H, 0.32),
      headerGeo: new THREE.BoxGeometry(DOOR_HALF * 2 + 0.66, 0.22, 0.32),
      postGlowGeo: new THREE.BoxGeometry(0.035, DOOR_H, 0.035),
      headGlowGeo: new THREE.BoxGeometry(DOOR_HALF * 2, 0.035, 0.035),
    };
  });

  const bars = useRef<THREE.InstancedMesh>(null);
  const pilasters = useRef<THREE.InstancedMesh>(null);
  const lamps = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.Group>(null);
  const floorMat = useRef<THREE.MeshStandardMaterial & { opacity: number }>(null);

  useLayoutEffect(() => {
    let b = 0;
    for (const z of BAR_ROWS)
      for (const x of BAR_XS) {
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(x, CEIL_Y - 0.05, z);
        dummy.scale.setScalar(1);
        dummy.updateMatrix();
        bars.current?.setMatrixAt(b++, dummy.matrix);
      }
    if (bars.current) bars.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < PILASTERS; i++) {
      const a = ((i + 0.5) / PILASTERS) * Math.PI * 2;
      dummy.position.set(Math.sin(a) * (WALL_R - 0.2), SEC_FLOOR_Y + WALL_H / 2, -Math.cos(a) * (WALL_R - 0.2));
      dummy.rotation.set(0, -a, 0);
      dummy.updateMatrix();
      pilasters.current?.setMatrixAt(i, dummy.matrix);
    }
    if (pilasters.current) pilasters.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < DOWNLIGHTS; i++) {
      const a = ((i + 0.5) / DOWNLIGHTS) * Math.PI * 2;
      dummy.position.set(Math.sin(a) * 7, RING_Y - 0.1, -Math.cos(a) * 7);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      lamps.current?.setMatrixAt(i, dummy.matrix);
    }
    if (lamps.current) lamps.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const s = state.security;
    const t = clock.elapsedTime;
    const room = s.room;
    const sh = room * s.shell;
    if (shell.current) {
      shell.current.visible = sh > 0.003;
      for (const m of core.fadeMats) {
        m.transparent = sh < 0.999;
        m.opacity = sh;
      }
      res.wallScreens.forEach((m, i) => (m.emissiveIntensity = 0.95 + 0.08 * Math.sin(t * 1.7 + i * 1.9)));
    }
    if (floorMat.current) {
      floorMat.current.opacity = sh;
      floorMat.current.transparent = true;
    }
    core.pool.color.set("#6bb8ee").multiplyScalar(0.14 * sh);
    core.shaft.color.set("#a9d2ff").multiplyScalar(0.075 * sh);
  });

  return (
    <group>
      {/* Polished stone floor */}
      <mesh geometry={core.floorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, SEC_FLOOR_Y, 0]}>
        {reflective ? (
          <MeshReflectorMaterial
            ref={floorMat as never}
            map={core.floorMap}
            resolution={512}
            blur={[200, 60]}
            mixBlur={1}
            mixStrength={8}
            mirror={1}
            roughness={0.55}
            depthScale={0.4}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            color="#b4c6dc"
            metalness={0.45}
            envMapIntensity={0.4}
            transparent
          />
        ) : (
          <meshStandardMaterial ref={floorMat} map={core.floorMap} emissiveMap={core.floorMap} emissive="#6f8fb5" emissiveIntensity={0.9} color="#b4c6dc" roughness={0.55} metalness={0.35} envMapIntensity={0.45} transparent />
        )}
      </mesh>
      <mesh geometry={geo.plane} material={core.pool} position={[0, SEC_FLOOR_Y + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[26, 26, 1]} renderOrder={2} />
      {Array.from({ length: WALL_SCREENS }, (_, i) => {
        const th = ((i - (WALL_SCREENS - 1) / 2) * 24 * Math.PI) / 180;
        return (
          <mesh key={i} geometry={geo.plane} material={core.pool} position={[Math.sin(th) * 8.6, SEC_FLOOR_Y + 0.014, -Math.cos(th) * 8.6]} rotation={[-Math.PI / 2, 0, -th]} scale={[7, 5, 1]} renderOrder={2} />
        );
      })}

      <group ref={shell}>
        {/* Room envelope */}
        <mesh geometry={core.wallGeo} material={core.wall} position={[0, SEC_FLOOR_Y + WALL_H / 2, 0]} renderOrder={-2} />
        <mesh geometry={core.ceilGeo} material={core.ceil} position={[0, CEIL_Y, 0]} rotation={[Math.PI / 2, 0, 0]} />
        <instancedMesh ref={bars} args={[core.barGeo, core.bar, BAR_ROWS.length * BAR_XS.length]} frustumCulled={false} />
        <instancedMesh ref={pilasters} args={[core.pilasterGeo, res.frame, PILASTERS]} frustumCulled={false} />

        {/* Cove lighting at floor and ceiling */}
        <mesh geometry={core.coveGeo} material={core.cove} position={[0, SEC_FLOOR_Y + 0.14, 0]} />
        <mesh geometry={core.coveGeo} material={core.coveTop} position={[0, CEIL_Y - 0.45, 0]} />

        {/* Floor inlay lines */}
        {core.inlayGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={core.inlay} position={[0, SEC_FLOOR_Y + 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} />
        ))}

        {/* Lighting rig: hung ring truss with downlights */}
        <mesh geometry={core.truss} material={core.rig} position={[0, RING_Y, 0]} rotation={[Math.PI / 2, 0, 0]} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return <mesh key={i} geometry={core.rodGeo} material={core.rig} position={[Math.sin(a) * 7, (CEIL_Y + RING_Y) / 2, -Math.cos(a) * 7]} />;
        })}
        <instancedMesh ref={lamps} args={[core.lampGeo, core.bar, DOWNLIGHTS]} frustumCulled={false} />
        {Array.from({ length: DOWNLIGHTS }, (_, i) => {
          const a = ((i + 0.5) / DOWNLIGHTS) * Math.PI * 2;
          const x = Math.sin(a) * 7;
          const z = -Math.cos(a) * 7;
          const y = (RING_Y + SEC_FLOOR_Y) / 2 - 0.15;
          return (
            <group key={i} position={[x, y, z]} renderOrder={3}>
              <mesh geometry={core.shaftGeo} material={core.shaft} />
              <mesh geometry={core.shaftGeo} material={core.shaft} rotation={[0, Math.PI / 2, 0]} />
            </group>
          );
        })}

        {/* Curved video wall */}
        {core.cabinetGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={core.cabinet} position={[0, SEC_FLOOR_Y + 0.95, 0]} />
        ))}
        {core.cabinetCapGeos.map((g, i) => (
          <mesh key={i} geometry={g} material={core.cabinet} position={[0, SEC_FLOOR_Y + 1.95, 0]} />
        ))}

        {/* Doorway behind the video wall, leading out through a short corridor */}
        <mesh geometry={core.lintelGeo} material={core.cabinet} position={[0, (CEIL_Y + SEC_FLOOR_Y + DOOR_H) / 2, -WALL_R + 0.12]} />
        {[-1, 1].map((sx) => (
          <group key={sx}>
            <mesh geometry={core.postGeo} material={res.frame} position={[sx * (DOOR_HALF + 0.11), SEC_FLOOR_Y + DOOR_H / 2, -WALL_R + 0.05]} />
            <mesh geometry={core.postGlowGeo} material={core.doorGlow} position={[sx * (DOOR_HALF - 0.02), SEC_FLOOR_Y + DOOR_H / 2, -WALL_R + 0.24]} />
            <mesh geometry={core.corrWallGeo} material={core.corrWall} position={[sx * DOOR_HALF, SEC_FLOOR_Y + DOOR_H / 2, -WALL_R - CORR_LEN / 2 + 0.1]} rotation={[0, (-sx * Math.PI) / 2, 0]} />
          </group>
        ))}
        <mesh geometry={core.headerGeo} material={res.frame} position={[0, SEC_FLOOR_Y + DOOR_H + 0.05, -WALL_R + 0.05]} />
        <mesh geometry={core.headGlowGeo} material={core.doorGlow} position={[0, SEC_FLOOR_Y + DOOR_H - 0.12, -WALL_R + 0.24]} />
        <mesh geometry={core.corrFloorGeo} material={core.corrFloor} position={[0, SEC_FLOOR_Y + 0.005, -WALL_R - CORR_LEN / 2 + 0.1]} rotation={[-Math.PI / 2, 0, 0]} />
        <mesh geometry={core.corrFloorGeo} material={core.corrCeil} position={[0, SEC_FLOOR_Y + DOOR_H, -WALL_R - CORR_LEN / 2 + 0.1]} rotation={[Math.PI / 2, 0, 0]} />
        <mesh geometry={core.signGeo} material={core.doorSign} position={[0, SEC_FLOOR_Y + DOOR_H + 0.75, -WALL_R + 0.14]} />
        {/* Access portal halfway down the corridor */}
        <group position={[0, SEC_FLOOR_Y, -WALL_R - CORR_LEN / 2 + 0.1]}>
          {[-1, 1].map((sx) => (
            <group key={sx}>
              <mesh geometry={core.archPostGeo} material={res.frame} position={[sx * (DOOR_HALF - 0.09), (DOOR_H - 0.7) / 2, 0]} />
              <mesh geometry={core.archGlowGeo} material={core.doorGlow} position={[sx * (DOOR_HALF - 0.19), (DOOR_H - 0.7) / 2 + 0.05, 0.17]} />
            </group>
          ))}
          <mesh geometry={core.archHeadGeo} material={res.frame} position={[0, DOOR_H - 0.7 + 0.08, 0]} />
        </group>
        {Array.from({ length: WALL_SCREENS }, (_, i) => {
          const th = ((i - (WALL_SCREENS - 1) / 2) * 24 * Math.PI) / 180;
          const x = Math.sin(th) * SCREEN_R;
          const z = -Math.cos(th) * SCREEN_R;
          if (i === (WALL_SCREENS - 1) / 2) return null;
          const kind = [3, 2, 0, 0, 0, 1, 3][i];
          return (
            <group key={i} position={[x, SCREEN_Y, z]} rotation={[0, -th, 0]}>
              <mesh geometry={core.frameGeo} material={res.frame} position={[0, 0, -0.09]} />
              <mesh geometry={core.screenGeo} material={res.wallScreens[kind]} {...FOCUS} />
              <mesh geometry={core.stripGeo} material={core.glowStrip} position={[0, -SCREEN_H / 2 - 0.13, 0]} />
            </group>
          );
        })}

        {/* Operator consoles */}
        {CONSOLES.map(([x, z], i) => (
          <Console key={i} x={x} z={z} seed={i} res={res} />
        ))}
      </group>
    </group>
  );
}
