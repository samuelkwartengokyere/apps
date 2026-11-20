"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCine } from "../kit/context";
import { hash } from "../kit/math";
import { GlowSprite, S, fadeable, useDisposables } from "../kit/parts";
import { beamTexture, brushedRoughness, contactShadowTexture, floorTileTexture, radialTexture, roomCeilingTexture, roomWallTexture } from "../kit/textures";

/*
 * The room around the Personal Vault, built like a real bank deposit room:
 * a curved wall of stainless safe-deposit boxes in graded sizes (large at the
 * bottom, small above), each with two key locks and a brass number plate, set
 * in a dark steel cabinet and lit by a warm cove light along the cornice; a
 * honed stone floor with a brass inlay; and a granite plinth for the safe.
 * Everything uses fadeable materials, so it arrives with the room.
 */

export const ROOM_FLOOR_Y = -1.55;
/** Top of the plinth; the safe stands directly on it. */
export const PLINTH_TOP = -1.12;

const WALL_R = 15;
/** The room is closed: plastered walls and a coffered ceiling around the boxes. */
const SHELL_R = WALL_R + 0.2;
const CEIL_Y = 5.4;
const SHELL_H = CEIL_Y - ROOM_FLOOR_Y;
const PILASTERS = 16;
const WALL_APEX_Z = -7;
const WALL_CZ = WALL_APEX_Z + WALL_R;
const COLS = 26;
const HALF_SPAN = (50 * Math.PI) / 180;
const PITCH_W = (HALF_SPAN * 2 * WALL_R) / COLS;
const BOX_W = PITCH_W * 0.95;
const ROW_H = [1.0, 0.72, 0.52, 0.52, 0.52, 0.52, 0.52];
const ROWS = ROW_H.length;
const GAP = 0.07;
const WALL_BOTTOM = ROOM_FLOOR_Y + 0.5;
const ROW_Y: number[] = [];
{
  let y = WALL_BOTTOM + GAP;
  for (const h of ROW_H) {
    ROW_Y.push(y + h / 2);
    y += h + GAP;
  }
}
const WALL_TOP = WALL_BOTTOM + ROW_H.reduce((a, b) => a + b + GAP, GAP);
const PULLED = [
  [4, 2],
  [9, 4],
  [13, 3],
  [14, 6],
  [18, 2],
  [21, 5],
  [7, 5],
  [23, 3],
];

const dummy = new THREE.Object3D();
const col = new THREE.Color();

/** World placement of column `c`: position on the arc and the yaw that makes the door face the room's centre. */
function column(c: number, radius = WALL_R) {
  const theta = -HALF_SPAN + ((c + 0.5) / COLS) * HALF_SPAN * 2;
  return { theta, x: Math.sin(theta) * radius, z: WALL_CZ - Math.cos(theta) * radius };
}

function plinthGeometry() {
  const h = PLINTH_TOP - ROOM_FLOOR_Y;
  const pts = [
    [2.5, 0],
    [2.5, h * 0.3],
    [2.42, h * 0.36],
    [2.42, h * 0.62],
    [2.2, h * 0.7],
    [2.2, h * 0.94],
    [2.14, h],
    [0, h],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  return new THREE.LatheGeometry(pts, 80);
}

export function PersonalRoom() {
  const { state, quality } = useCine();
  const { geo } = S();
  const reflective = !quality.compact && !quality.low;

  const res = useDisposables(() => {
    const floorMap = floorTileTexture();
    floorMap.repeat.set(9, 9);
    const half = HALF_SPAN;
    const wallArc = (radius: number, height: number) => new THREE.CylinderGeometry(radius, radius, height, 72, 1, true, Math.PI - half - 0.02, half * 2 + 0.04);
    const steel = (color: string, rough: number, metal = 0.9, env = 0.6) =>
      fadeable(new THREE.MeshPhysicalMaterial({ color, metalness: metal, roughness: rough, roughnessMap: brushedRoughness(), envMapIntensity: env }));
    const cabinetH = WALL_TOP - WALL_BOTTOM + 0.5;
    const wallMap = roomWallTexture();
    wallMap.wrapS = THREE.RepeatWrapping;
    wallMap.repeat.set(Math.round((2 * Math.PI * SHELL_R) / (SHELL_H * 0.5)), 1);
    const shellMat = <M extends THREE.Material>(m: M) => {
      m.userData.shell = true;
      return m;
    };
    return {
      floorMap,
      wallMap,
      shellWallGeo: new THREE.CylinderGeometry(SHELL_R, SHELL_R, SHELL_H, 96, 1, true),
      shellCeilGeo: new THREE.CircleGeometry(SHELL_R, 96),
      pilasterGeo: new RoundedBoxGeometry(0.9, SHELL_H - 0.5, 0.36, 2, 0.03),
      shellWall: shellMat(new THREE.MeshBasicMaterial({ map: wallMap, side: THREE.BackSide, fog: false, color: "#ffffff" })),
      shellCeil: shellMat(new THREE.MeshBasicMaterial({ map: roomCeilingTexture(SHELL_R * 2, 0.5, 0.5 + WALL_CZ / (SHELL_R * 2)), fog: false })),
      pilaster: shellMat(new THREE.MeshStandardMaterial({ color: "#5a4a30", metalness: 0.85, roughness: 0.42, envMapIntensity: 0.7 })),
      floorGeo: new THREE.PlaneGeometry(80, 80),
      floorFallback: new THREE.MeshStandardMaterial({ map: floorMap, color: "#e4d8c2", roughness: 0.7, metalness: 0.2, envMapIntensity: 0.3, transparent: true }),
      doorGeo: new RoundedBoxGeometry(1, 1, 1, 3, 0.04),
      trayGeo: new THREE.BoxGeometry(BOX_W * 0.88, 1, 0.5),
      lockGeo: new THREE.CylinderGeometry(0.05, 0.05, 0.03, 24).rotateX(Math.PI / 2),
      slitGeo: new THREE.BoxGeometry(0.012, 0.034, 0.01),
      plateGeo: new RoundedBoxGeometry(0.3, 0.1, 0.02, 2, 0.008),
      ledGeo: new THREE.BoxGeometry(0.035, 0.035, 0.012),
      backGeo: wallArc(WALL_R + 0.1, cabinetH),
      capGeo: wallArc(WALL_R - 0.03, 0.34),
      coveGeo: wallArc(WALL_R - 0.06, 0.03),
      washGeo: new THREE.CylinderGeometry(WALL_R - 0.12, WALL_R - 0.12, 2.6, 72, 1, true, Math.PI - half, half * 2),
      plinthGeo: plinthGeometry(),
      ringGeo: new THREE.TorusGeometry(1, 0.012, 8, 128),
      tickGeo: new THREE.BoxGeometry(0.035, 0.01, 0.16),
      edgeGeo: new THREE.TorusGeometry(2.16, 0.022, 10, 96),
      door: steel("#555d68", 0.4, 0.86, 0.5),
      tray: steel("#232930", 0.55, 0.7),
      brass: steel("#b09a5e", 0.32, 0.95, 0.9),
      lock: steel("#b5bdc7", 0.22, 1, 0.9),
      slit: fadeable(new THREE.MeshBasicMaterial({ color: "#030405" })),
      back: fadeable(new THREE.MeshStandardMaterial({ color: "#0e1217", roughness: 0.85, metalness: 0.3, side: THREE.BackSide })),
      cap: steel("#2a3038", 0.4, 0.85, 0.5),
      plinth: fadeable(new THREE.MeshPhysicalMaterial({ color: "#15181c", metalness: 0.15, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 0.9 })),
      led: fadeable(new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false, fog: false })),
      cove: fadeable(new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffe0b0").multiplyScalar(1.6), toneMapped: false, side: THREE.DoubleSide })),
      inlay: fadeable(new THREE.MeshBasicMaterial({ color: new THREE.Color("#9c8650"), toneMapped: false })),
      edge: steel("#c2a96a", 0.28, 1, 1),
      wash: new THREE.MeshBasicMaterial({
        map: beamTexture(),
        color: "#000000",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        fog: false,
      }),
      plinthShadow: new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, depthWrite: false, toneMapped: false, fog: false }),
      safeShadow: new THREE.MeshBasicMaterial({ map: contactShadowTexture(0.62, 0.52), color: "#000000", transparent: true, depthWrite: false, toneMapped: false, fog: false }),
      pool: new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }),
    };
  });

  const doors = useRef<THREE.InstancedMesh>(null);
  const trays = useRef<THREE.InstancedMesh>(null);
  const locks = useRef<THREE.InstancedMesh>(null);
  const slits = useRef<THREE.InstancedMesh>(null);
  const plates = useRef<THREE.InstancedMesh>(null);
  const leds = useRef<THREE.InstancedMesh>(null);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.Group>(null);
  const floorMat = useRef<THREE.MeshStandardMaterial & { opacity: number }>(null);
  const TICKS = 36;
  const N = COLS * ROWS;

  useLayoutEffect(() => {
    const pulled = new Set(PULLED.map(([c, r]) => `${c}:${r}`));
    let tray = 0;
    // Put `im[idx]` at a door-local offset (lx, ly, lz); the door faces the room's centre.
    const place = (im: THREE.InstancedMesh | null, idx: number, theta: number, bx: number, by: number, bz: number, lx: number, ly: number, lz: number, sx = 1, sy = 1, sz = 1) => {
      if (!im) return;
      const phi = -theta;
      dummy.position.set(bx + lx * Math.cos(phi) + lz * Math.sin(phi), by + ly, bz - lx * Math.sin(phi) + lz * Math.cos(phi));
      dummy.rotation.set(0, phi, 0);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      im.setMatrixAt(idx, dummy.matrix);
    };

    for (let c = 0; c < COLS; c++) {
      const { theta, x, z } = column(c);
      for (let r = 0; r < ROWS; r++) {
        const i = c * ROWS + r;
        const h = ROW_H[r];
        const y = ROW_Y[r];
        const open = pulled.has(`${c}:${r}`);
        const out = open ? 0.46 : 0;
        // Direction toward the room's centre: (-sinθ, cosθ)
        const bx = x - Math.sin(theta) * out;
        const bz = z + Math.cos(theta) * out;

        place(doors.current, i, theta, bx, y, bz, 0, 0, 0, BOX_W, h, 0.12);
        // Two key locks side by side, a brass number plate above them
        for (let k = 0; k < 2; k++) {
          const lx = (k ? 1 : -1) * BOX_W * 0.21;
          place(locks.current, i * 2 + k, theta, bx, y, bz, lx, -h * 0.06, 0.075);
          place(slits.current, i * 2 + k, theta, bx, y, bz, lx, -h * 0.06, 0.092);
        }
        place(plates.current, i, theta, bx, y, bz, 0, h * 0.27, 0.07);
        place(leds.current, i, theta, bx, y, bz, BOX_W * 0.38, h * 0.3, 0.064);

        // Door tint varies a little, so the wall reads as individual boxes.
        doors.current?.setColorAt(i, col.setScalar(0.88 + hash(i * 2.3 + 1) * 0.16));
        const k = hash(i * 3.7 + 5);
        leds.current?.setColorAt(i, k < 0.1 ? col.set("#5fd08f").multiplyScalar(1.4) : col.set("#000000"));

        if (open && trays.current) {
          place(trays.current, tray++, theta, x + (bx - x) * 0.5, y, z + (bz - z) * 0.5, 0, 0, 0, 1, h * 0.72, 1);
        }
      }
    }
    for (; tray < PULLED.length; tray++) {
      dummy.position.set(0, -50, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      trays.current?.setMatrixAt(tray, dummy.matrix);
    }
    for (const im of [doors, trays, locks, slits, plates, leds]) if (im.current) im.current.instanceMatrix.needsUpdate = true;
    for (const im of [doors, leds]) if (im.current?.instanceColor) im.current.instanceColor.needsUpdate = true;

    // Brass ticks around the inlay ring
    for (let i = 0; i < TICKS; i++) {
      const a = (i / TICKS) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 3.85, ROOM_FLOOR_Y + 0.008, Math.sin(a) * 3.85);
      dummy.rotation.set(0, -a + Math.PI / 2, 0);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      ticks.current?.setMatrixAt(i, dummy.matrix);
    }
    if (ticks.current) ticks.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(() => {
    const room = state.personal.room;
    if (floorMat.current) {
      floorMat.current.opacity = room;
      floorMat.current.transparent = true;
    }
    res.floorFallback.opacity = room;
    // Walls and ceiling: opaque while the camera is inside, dissolving as it lifts out
    const sh = room * state.personal.shell;
    if (shell.current) {
      shell.current.visible = sh > 0.003;
      for (const m of [res.shellWall, res.shellCeil, res.pilaster]) {
        m.transparent = sh < 0.999;
        m.opacity = sh;
      }
    }
    const glass = state.personal.glass;
    // Cove light spilling down the wall, and a soft pool under the safe
    res.wash.color.set("#ffe4c8").multiplyScalar(0.17 * room);
    res.plinthShadow.opacity = 0.85 * room;
    res.safeShadow.opacity = 0.85 * room * glass;
    res.pool.color.set("#ffdcb2").multiplyScalar(0.2 * room * (0.4 + 0.6 * glass));
  });

  const cabinetH = WALL_TOP - WALL_BOTTOM + 0.5;
  return (
    <group>
      {/* The room itself: plastered walls, bronze pilasters and a coffered ceiling */}
      <group ref={shell}>
        <mesh geometry={res.shellWallGeo} material={res.shellWall} position={[0, ROOM_FLOOR_Y + SHELL_H / 2, WALL_CZ]} renderOrder={-2} />
        <mesh geometry={res.shellCeilGeo} material={res.shellCeil} position={[0, CEIL_Y, WALL_CZ]} rotation={[Math.PI / 2, 0, 0]} renderOrder={-2} />
        {Array.from({ length: PILASTERS }, (_, i) => {
          const deg = 52 + (i / (PILASTERS - 1)) * 256;
          const t = (deg * Math.PI) / 180;
          const r = SHELL_R - 0.17;
          return (
            <mesh
              key={i}
              geometry={res.pilasterGeo}
              material={res.pilaster}
              position={[Math.sin(t) * r, ROOM_FLOOR_Y + (SHELL_H - 0.5) / 2 + 0.1, WALL_CZ - Math.cos(t) * r]}
              rotation={[0, -t, 0]}
            />
          );
        })}
      </group>

      {/* Honed stone floor */}
      <mesh geometry={res.floorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, ROOM_FLOOR_Y, 0]}>
        {reflective ? (
          <MeshReflectorMaterial
            ref={floorMat as never}
            map={res.floorMap}
            resolution={512}
            blur={[220, 70]}
            mixBlur={1}
            mixStrength={9}
            mirror={1}
            roughness={0.7}
            depthScale={0.5}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            color="#e4d8c2"
            metalness={0.4}
            envMapIntensity={0.3}
            transparent
          />
        ) : (
          <primitive object={res.floorFallback} attach="material" />
        )}
      </mesh>

      {/* Brass inlay in the floor */}
      <mesh geometry={res.ringGeo} material={res.inlay} position={[0, ROOM_FLOOR_Y + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[3.55, 3.55, 3.55]} />
      <mesh geometry={res.ringGeo} material={res.inlay} position={[0, ROOM_FLOOR_Y + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[4.2, 4.2, 4.2]} />
      <mesh geometry={res.ringGeo} material={res.inlay} position={[0, ROOM_FLOOR_Y + 0.008, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[7.2, 7.2, 7.2]} />
      <instancedMesh ref={ticks} args={[res.tickGeo, res.inlay, TICKS]} frustumCulled={false} />

      {/* Granite plinth with a brass edge */}
      <mesh geometry={res.plinthGeo} material={res.plinth} position={[0, ROOM_FLOOR_Y, 0]} />
      <mesh geometry={res.edgeGeo} material={res.edge} position={[0, PLINTH_TOP - 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} />

      {/* Curved wall of safe-deposit boxes in a steel cabinet */}
      <group>
        <mesh geometry={res.backGeo} material={res.back} position={[0, WALL_BOTTOM + cabinetH / 2 - 0.05, WALL_CZ]} />
        <mesh geometry={res.capGeo} material={res.cap} position={[0, WALL_TOP + 0.14, WALL_CZ]} />
        <mesh geometry={res.coveGeo} material={res.cove} position={[0, WALL_TOP - 0.02, WALL_CZ]} />
        <mesh geometry={res.capGeo} material={res.cap} position={[0, ROOM_FLOOR_Y + 0.22, WALL_CZ]} scale={[1, 1.3, 1]} />
        <instancedMesh ref={doors} args={[res.doorGeo, res.door, N]} frustumCulled={false} />
        <instancedMesh ref={trays} args={[res.trayGeo, res.tray, PULLED.length]} frustumCulled={false} />
        <instancedMesh ref={locks} args={[res.lockGeo, res.lock, N * 2]} frustumCulled={false} />
        <instancedMesh ref={slits} args={[res.slitGeo, res.slit, N * 2]} frustumCulled={false} />
        <instancedMesh ref={plates} args={[res.plateGeo, res.brass, N]} frustumCulled={false} />
        <instancedMesh ref={leds} args={[res.ledGeo, res.led, N]} frustumCulled={false} />
        {/* Cove light washing down the upper boxes */}
        <mesh geometry={res.washGeo} material={res.wash} position={[0, WALL_TOP - 1.3, WALL_CZ]} renderOrder={3} />
      </group>

      {/* Contact shadows: the plinth on the floor, the safe on the plinth */}
      <mesh geometry={geo.plane} material={res.plinthShadow} position={[0, ROOM_FLOOR_Y + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[12, 12, 1]} renderOrder={1} />
      <mesh geometry={geo.plane} material={res.safeShadow} position={[0, PLINTH_TOP + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[4, 3.4, 1]} renderOrder={4} />

      <mesh geometry={geo.plane} material={res.pool} position={[0, ROOM_FLOOR_Y + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 10, 1]} renderOrder={2} />
      <GlowSprite color="#ffcf99" position={[0, 0.8, -4]} scale={16} opacity={0.1} />
    </group>
  );
}

/**
 * Hardware that makes the central safe read as a real one: barrel hinges down
 * the left edge, a bolt-throw lever, a brass maker's plate and corner bolts.
 * Goes inside the safe's shell group, so it rises with the body.
 */
export function SafeHardware({ width, height, faceZ }: { width: number; height: number; faceZ: number }) {
  const { mat, geo } = S();
  const hx = width / 2;
  return (
    <group>
      {/* Hinges */}
      {[-0.62, 0, 0.62].map((k) => (
        <group key={k} position={[-hx + 0.015, k * height * 0.7, faceZ - 0.02]}>
          <mesh geometry={geo.cyl} material={mat.metalLight} scale={[0.06, 0.34, 0.06]} />
          <mesh geometry={geo.box} material={mat.metalDark} position={[0.07, 0, -0.01]} scale={[0.14, 0.34, 0.03]} />
        </group>
      ))}
      {/* Lever handle on the right */}
      <group position={[hx * 0.64, 0, faceZ + 0.02]}>
        <mesh geometry={geo.cyl} material={mat.metalLight} rotation={[Math.PI / 2, 0, 0]} scale={[0.085, 0.08, 0.085]} />
        <mesh geometry={geo.cyl} material={mat.metalLight} position={[0, -0.12, 0.06]} scale={[0.04, 0.3, 0.04]} />
        <mesh geometry={geo.sphere} material={mat.metalLight} position={[0, -0.29, 0.06]} scale={[0.075, 0.075, 0.075]} />
      </group>
      {/* Maker's plate */}
      <mesh geometry={geo.box} material={mat.metalLight} position={[0, height * 0.37, faceZ + 0.006]} scale={[0.5, 0.09, 0.012]} />
      {/* Corner bolts on the door plate */}
      {[-1, 1].flatMap((ix) =>
        [-1, 1].map((iy) => (
          <mesh key={`${ix}${iy}`} geometry={geo.sphere} material={mat.metalLight} position={[ix * hx * 0.84, iy * height * 0.4, faceZ + 0.004]} scale={[0.035, 0.035, 0.02]} />
        )),
      )}
    </group>
  );
}
