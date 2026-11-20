"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { easeOut, hash, range } from "../kit/math";
import { S, useDisposables } from "../kit/parts";
import {
  beamTexture,
  contactShadowTexture,
  glowLineTexture,
  haloTexture,
  shaftTexture,
  serverSignTexture,
  radialTexture,
  serverCeilingTexture,
  serverFloorTexture,
  serverRackTexture,
  serverWallTexture,
} from "../kit/textures";

/*
 * The Developer Vault's setting: a secure server hall. A raised access floor,
 * rows of 42U server racks (perforated servers, drive bays, switches and
 * patch panels with blinking status LEDs) down both sides and across the back,
 * a ceiling with cool linear light fixtures and cable trays, and the steel
 * vault safe standing on the floor. Walls, racks and ceiling dissolve with
 * `state.developer.shell` when the camera leaves; the floor stays.
 */

export const DEV_FLOOR_Y = -0.32;

const RACK_W = 0.8;
const RACK_H = 2.4;
const RACK_D = 1;
const PITCH = 0.82;
const SIDE_X = 11.5;
const BACK_Z = -14;
const SIDE_N = 24;
const SIDE_Z0 = 6;
const BACK_N = 27;
const CEIL_Y = 6;
const WALL_X = SIDE_X + RACK_D + 0.05;
const WALL_BACK = BACK_Z - RACK_D - 0.05;
const FRONT_Z = 17;
const ROOM_W = WALL_X * 2;
const ROOM_H = CEIL_Y - DEV_FLOOR_Y;
const ROOM_D = FRONT_Z - WALL_BACK;
const VARIANTS = 3;
const SAFE_Z = -2.2;

type Rack = { fx: number; fz: number; rot: number; variant: number };
const RACKS: Rack[] = [];
for (let i = 0; i < SIDE_N; i++) {
  RACKS.push({ fx: -SIDE_X, fz: SIDE_Z0 - i * PITCH, rot: Math.PI / 2, variant: 0 });
  RACKS.push({ fx: SIDE_X, fz: SIDE_Z0 - i * PITCH, rot: -Math.PI / 2, variant: 0 });
}
for (let j = 0; j < BACK_N; j++) RACKS.push({ fx: (j - (BACK_N - 1) / 2) * PITCH, fz: BACK_Z, rot: 0, variant: 0 });
RACKS.forEach((r, i) => (r.variant = Math.floor(hash(i * 1.7 + 3) * VARIANTS) % VARIANTS));

const LIGHT_ROWS = [10, 5, 0, -5, -10, -13];
const LIGHT_XS = [-8, 0, 8];
const SHAFT_ROWS = [8, 0, -8];
const MOTES = 150;
const TRAY_Y = CEIL_Y - 0.9;
type Lane = { x: number; y: number; z0: number; z1: number };
const LANES: Lane[] = [
  { x: -6.4, y: DEV_FLOOR_Y + 0.035, z0: 14.3, z1: -12.7 },
  { x: 6.4, y: DEV_FLOOR_Y + 0.035, z0: -12.7, z1: 14.3 },
  { x: -5.5, y: TRAY_Y + 0.14, z0: 16, z1: -14 },
  { x: 5.5, y: TRAY_Y + 0.14, z0: -14, z1: 16 },
];
const PULSES_PER_LANE = 6;
const dummy = new THREE.Object3D();

export function DeveloperRoom() {
  const { state, quality } = useCine();
  const { geo } = S();
  const reflective = !quality.compact && !quality.low;

  const res = useDisposables(() => {
    const floorMap = serverFloorTexture();
    floorMap.repeat.set(37.5, 37.5);
    const wallMap = serverWallTexture();
    wallMap.repeat.set(9, 1);
    const ceilMap = serverCeilingTexture();
    ceilMap.repeat.set(ROOM_W / 1.2, ROOM_D / 1.2);
    const wall = new THREE.MeshBasicMaterial({ map: wallMap, side: THREE.BackSide, fog: false });
    const ceil = new THREE.MeshBasicMaterial({ map: ceilMap, side: THREE.BackSide, fog: false });
    const none = new THREE.MeshBasicMaterial({ visible: false });
    const front = Array.from({ length: VARIANTS }, (_, v) => {
      const map = serverRackTexture(v, false);
      return new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.95, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.6 });
    });
    const led = Array.from({ length: VARIANTS }, (_, v) =>
      new THREE.MeshBasicMaterial({
        map: serverRackTexture(v, true),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
      }),
    );
    const body = new THREE.MeshStandardMaterial({ color: "#12161b", metalness: 0.8, roughness: 0.5, envMapIntensity: 0.5 });
    const steel = new THREE.MeshStandardMaterial({ color: "#6a727c", metalness: 0.85, roughness: 0.4, envMapIntensity: 0.9 });
    const bar = new THREE.MeshBasicMaterial({ color: new THREE.Color("#d6ecff").multiplyScalar(1.7), toneMapped: false, fog: false });
    const cables = ["#2a62c9", "#d8b52a", "#8b929a"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.1 }));
    const aoMat = new THREE.MeshBasicMaterial({ map: beamTexture(), color: "#000000", transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false, fog: false });
    const strip = new THREE.MeshBasicMaterial({ color: new THREE.Color("#5fe3ff").multiplyScalar(1.7), toneMapped: false, fog: false });
    const sign = new THREE.MeshBasicMaterial({ map: serverSignTexture(), transparent: true, toneMapped: false, fog: false, color: new THREE.Color("#ffffff").multiplyScalar(1.15) });
    const glowAdd = (hex: string) => new THREE.MeshBasicMaterial({ map: glowLineTexture(), color: new THREE.Color(hex), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const glowFloor = glowAdd("#2fb6e0");
    const poolWhite = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const pulseCore = new THREE.MeshBasicMaterial({ color: new THREE.Color("#c8f6ff").multiplyScalar(3), toneMapped: false, fog: false });
    const pulseGlow = new THREE.MeshBasicMaterial({ map: radialTexture(), color: new THREE.Color("#3cc8f0").multiplyScalar(0.9), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide });
    const shaft = new THREE.MeshBasicMaterial({ map: shaftTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.DoubleSide });
    const halo = new THREE.MeshBasicMaterial({ map: haloTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(MOTES * 3), 3));
    const moteMat = new THREE.PointsMaterial({ map: radialTexture(), size: 0.16, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, color: "#000000" });
    const fadeMats: THREE.Material[] = [wall, ceil, ...front, body, steel, bar, ...cables, aoMat, strip];
    return {
      floorMap,
      wallMap,
      ceilMap,
      shellGeo: new THREE.BoxGeometry(ROOM_W, ROOM_H, ROOM_D),
      shellMats: [wall, wall, ceil, none, wall, wall],
      wall,
      ceil,
      none,
      front,
      led,
      body,
      steel,
      bar,
      cables,
      aoMat,
      fadeMats,
      pulseCore,
      pulseGlow,
      shaft,
      halo,
      moteGeo,
      moteMat,
      strip,
      sign,
      glowFloor,
      poolWhite,
      stripGeo: new THREE.BoxGeometry(1, 1, 1),
      floorGeo: new THREE.PlaneGeometry(90, 90),
      floorFallback: new THREE.MeshStandardMaterial({ map: floorMap, color: "#a7b6c8", roughness: 0.55, metalness: 0.3, envMapIntensity: 0.4, transparent: true }),
      bodyGeo: new THREE.BoxGeometry(RACK_W, RACK_H, RACK_D),
      frontGeo: new THREE.PlaneGeometry(RACK_W - 0.04, RACK_H - 0.1),
      barGeo: new THREE.BoxGeometry(4.6, 0.05, 0.22),
      trayBase: new THREE.BoxGeometry(0.8, 0.04, ROOM_D - 1),
      trayRail: new THREE.BoxGeometry(0.04, 0.14, ROOM_D - 1),
      cableGeo: new THREE.CylinderGeometry(0.05, 0.05, ROOM_D - 1.4, 10).rotateX(Math.PI / 2),
      shadow: new THREE.MeshBasicMaterial({ map: contactShadowTexture(0.7, 0.5), color: "#000000", transparent: true, depthWrite: false, toneMapped: false, fog: false }),
      pool: new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }),
    };
  });

  const bodies = useRef<THREE.InstancedMesh>(null);
  const fronts = useRef<(THREE.InstancedMesh | null)[]>([]);
  const leds = useRef<(THREE.InstancedMesh | null)[]>([]);
  const bars = useRef<THREE.InstancedMesh>(null);
  const shell = useRef<THREE.Group>(null);
  const pulseCores = useRef<THREE.InstancedMesh>(null);
  const pulseGlows = useRef<THREE.InstancedMesh>(null);
  const haloSpin = useRef<THREE.Group>(null);
  const seeds = useRef<Float32Array | null>(null);
  if (!seeds.current) {
    const a = new Float32Array(MOTES * 4);
    for (let i = 0; i < MOTES; i++) {
      const ang = hash(i * 1.3) * Math.PI * 2;
      const r = 1.2 + hash(i * 2.7 + 1) * 6.5;
      a[i * 4] = Math.cos(ang) * r;
      a[i * 4 + 1] = hash(i * 4.1 + 2);
      a[i * 4 + 2] = SAFE_Z + Math.sin(ang) * r * 0.8;
      a[i * 4 + 3] = 0.12 + hash(i * 5.9 + 3) * 0.35;
    }
    seeds.current = a;
  }
  const floorMat = useRef<THREE.MeshStandardMaterial & { opacity: number }>(null);

  const counts = Array.from({ length: VARIANTS }, (_, v) => RACKS.filter((r) => r.variant === v).length);

  useLayoutEffect(() => {
    const cursor = Array(VARIANTS).fill(0);
    const cy = DEV_FLOOR_Y + RACK_H / 2;
    RACKS.forEach((r, i) => {
      const nx = Math.sin(r.rot);
      const nz = Math.cos(r.rot);
      dummy.rotation.set(0, r.rot, 0);
      dummy.scale.setScalar(1);
      dummy.position.set(r.fx - nx * (RACK_D / 2), cy, r.fz - nz * (RACK_D / 2));
      dummy.updateMatrix();
      bodies.current?.setMatrixAt(i, dummy.matrix);

      const k = cursor[r.variant]++;
      dummy.position.set(r.fx + nx * 0.004, cy, r.fz + nz * 0.004);
      dummy.updateMatrix();
      fronts.current[r.variant]?.setMatrixAt(k, dummy.matrix);
      dummy.position.set(r.fx + nx * 0.009, cy, r.fz + nz * 0.009);
      dummy.updateMatrix();
      leds.current[r.variant]?.setMatrixAt(k, dummy.matrix);
    });
    for (const im of [bodies.current, ...fronts.current, ...leds.current]) if (im) im.instanceMatrix.needsUpdate = true;

    let b = 0;
    for (const z of LIGHT_ROWS)
      for (const x of LIGHT_XS) {
        dummy.rotation.set(0, 0, 0);
        dummy.position.set(x, CEIL_Y - 0.04, z);
        dummy.updateMatrix();
        bars.current?.setMatrixAt(b++, dummy.matrix);
      }
    if (bars.current) bars.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const d = state.developer;
    const t = clock.elapsedTime;
    const room = d.room;
    const sh = room * d.shell;
    if (shell.current) {
      shell.current.visible = sh > 0.003;
      for (const m of res.fadeMats) {
        m.transparent = sh < 0.999;
        m.opacity = sh;
      }
      res.aoMat.opacity = 0.8 * sh;
      res.sign.opacity = sh;
      res.glowFloor.color.set("#2fb6e0").multiplyScalar(0.55 * sh);
      res.poolWhite.color.set("#b8dcff").multiplyScalar(0.085 * sh);
      res.led.forEach((m, v) => {
        m.opacity = sh * (0.62 + 0.38 * Math.sin(t * (1.3 + v * 1.1) + v * 2));
      });
    }
    if (floorMat.current) {
      floorMat.current.opacity = sh;
      floorMat.current.transparent = true;
    }
    res.floorFallback.opacity = sh;

    // Data pulses racing along the floor lines and the cable trays
    const cores = pulseCores.current;
    const glows = pulseGlows.current;
    if (cores && glows) {
      LANES.forEach((L, li) => {
        const len = Math.abs(L.z1 - L.z0);
        for (let k = 0; k < PULSES_PER_LANE; k++) {
          const sp = 4 + li * 0.7 + (k % 3) * 1.6;
          const u = (((t * sp) / len + k / PULSES_PER_LANE + li * 0.17) % 1 + 1) % 1;
          const z = L.z0 + (L.z1 - L.z0) * u;
          const fade = Math.sin(Math.PI * u) ** 0.6 * sh;
          const i = li * PULSES_PER_LANE + k;
          dummy.rotation.set(0, 0, 0);
          dummy.position.set(L.x, L.y, z);
          dummy.scale.set(0.07 * fade, 0.04 * fade, 0.9 * fade);
          dummy.updateMatrix();
          cores.setMatrixAt(i, dummy.matrix);
          dummy.rotation.set(-Math.PI / 2, 0, 0);
          dummy.position.set(L.x, L.y - 0.02, z);
          dummy.scale.set(0.9 * fade, 3 * fade, 1);
          dummy.updateMatrix();
          glows.setMatrixAt(i, dummy.matrix);
        }
      });
      cores.instanceMatrix.needsUpdate = true;
      glows.instanceMatrix.needsUpdate = true;
    }
    res.shaft.color.set("#9ccfff").multiplyScalar(0.075 * sh);
    res.halo.color.set("#ffffff").multiplyScalar(0.9 * sh * easeOut(range(d.keys, 0, 1)));
    if (haloSpin.current) haloSpin.current.rotation.y = -t * 0.35;
    res.sign.color.set("#ffffff").multiplyScalar((1.1 + 0.12 * Math.sin(t * 1.6)) * 1);

    // Data motes drifting up around the safe
    const pos = res.moteGeo.getAttribute("position") as THREE.BufferAttribute;
    const sd = seeds.current!;
    for (let i = 0; i < MOTES; i++) {
      const y01 = (sd[i * 4 + 1] + t * sd[i * 4 + 3] * 0.2) % 1;
      pos.setXYZ(i, sd[i * 4] + Math.sin(t * 0.5 + i) * 0.15, DEV_FLOOR_Y + 0.1 + y01 * (CEIL_Y - DEV_FLOOR_Y - 0.6), sd[i * 4 + 2] + Math.cos(t * 0.4 + i * 1.7) * 0.15);
    }
    pos.needsUpdate = true;
    res.moteMat.color.set("#7fe3ff").multiplyScalar(1.4 * sh);
    res.moteMat.opacity = 1;
    res.shadow.opacity = 0.85 * room * easeOut(range(d.keys, 0, 1));
    res.pool.color.set("#9fd0ff").multiplyScalar(0.1 * room);
  });

  const trayY = TRAY_Y;
  const midZ = (FRONT_Z + WALL_BACK) / 2;

  return (
    <group>
      {/* Raised access floor */}
      <mesh geometry={res.floorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, DEV_FLOOR_Y, 0]}>
        {reflective ? (
          <MeshReflectorMaterial
            ref={floorMat as never}
            map={res.floorMap}
            resolution={512}
            blur={[200, 60]}
            mixBlur={1}
            mixStrength={7}
            mirror={1}
            roughness={0.6}
            depthScale={0.4}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            color="#a7b6c8"
            metalness={0.4}
            envMapIntensity={0.4}
            transparent
          />
        ) : (
          <primitive object={res.floorFallback} attach="material" />
        )}
      </mesh>
      <mesh geometry={geo.plane} material={res.pool} position={[0, DEV_FLOOR_Y + 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[16, 16, 1]} renderOrder={2} />
      <mesh geometry={geo.plane} material={res.shadow} position={[0, DEV_FLOOR_Y + 0.006, SAFE_Z]} rotation={[-Math.PI / 2, 0, 0]} scale={[6, 2.8, 1]} renderOrder={3} />

      <group ref={shell}>
        {/* Walls and ceiling */}
        <mesh geometry={res.shellGeo} material={res.shellMats} position={[0, DEV_FLOOR_Y + ROOM_H / 2, midZ]} renderOrder={-2} />

        {/* Racks: body, front panel and pulsing status LEDs */}
        <instancedMesh ref={bodies} args={[res.bodyGeo, res.body, RACKS.length]} frustumCulled={false} />
        {counts.map((n, v) => (
          <instancedMesh key={`f${v}`} ref={(el) => void (fronts.current[v] = el)} args={[res.frontGeo, res.front[v], n]} frustumCulled={false} />
        ))}
        {counts.map((n, v) => (
          <instancedMesh key={`l${v}`} ref={(el) => void (leds.current[v] = el)} args={[res.frontGeo, res.led[v], n]} frustumCulled={false} renderOrder={5} />
        ))}

        {/* Contact darkening where racks meet the floor */}
        <mesh geometry={geo.plane} material={res.aoMat} position={[0, DEV_FLOOR_Y + 0.005, BACK_Z + 0.55]} rotation={[-Math.PI / 2, 0, 0]} scale={[BACK_N * PITCH + 1, 1.1, 1]} renderOrder={1} />
        <group position={[-SIDE_X + 0.55, DEV_FLOOR_Y + 0.005, SIDE_Z0 - (SIDE_N * PITCH) / 2 + 0.4]} rotation={[0, Math.PI / 2, 0]}>
          <mesh geometry={geo.plane} material={res.aoMat} rotation={[-Math.PI / 2, 0, 0]} scale={[SIDE_N * PITCH + 1, 1.1, 1]} renderOrder={1} />
        </group>
        <group position={[SIDE_X - 0.55, DEV_FLOOR_Y + 0.005, SIDE_Z0 - (SIDE_N * PITCH) / 2 + 0.4]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh geometry={geo.plane} material={res.aoMat} rotation={[-Math.PI / 2, 0, 0]} scale={[SIDE_N * PITCH + 1, 1.1, 1]} renderOrder={1} />
        </group>

        {/* Cyan LED guide lines in the floor, with a soft glow either side */}
        {[-6.4, 6.4].map((x) => (
          <group key={x} position={[x, DEV_FLOOR_Y, 0.8]}>
            <mesh geometry={res.stripGeo} material={res.strip} position={[0, 0.012, 0]} scale={[0.05, 0.01, 27]} />
            <mesh geometry={geo.plane} material={res.glowFloor} position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.6, 27, 1]} renderOrder={2} />
          </group>
        ))}
        {/* LED trim along the rack bases and tops */}
        {[
          [-SIDE_X + 0.03, SIDE_Z0 - (SIDE_N * PITCH) / 2 + 0.4, 0.04, SIDE_N * PITCH, 0],
          [SIDE_X - 0.03, SIDE_Z0 - (SIDE_N * PITCH) / 2 + 0.4, 0.04, SIDE_N * PITCH, 0],
        ].flatMap(([x, z, w, l]) => [
          <mesh key={`b${x}`} geometry={res.stripGeo} material={res.strip} position={[x, DEV_FLOOR_Y + 0.05, z]} scale={[w, 0.025, l]} />,
          <mesh key={`t${x}`} geometry={res.stripGeo} material={res.strip} position={[x, DEV_FLOOR_Y + RACK_H + 0.01, z]} scale={[0.06, 0.02, l]} />,
        ])}
        <mesh geometry={res.stripGeo} material={res.strip} position={[0, DEV_FLOOR_Y + 0.05, BACK_Z + 0.03]} scale={[BACK_N * PITCH, 0.025, 0.04]} />
        <mesh geometry={res.stripGeo} material={res.strip} position={[0, DEV_FLOOR_Y + RACK_H + 0.01, BACK_Z + 0.03]} scale={[BACK_N * PITCH, 0.02, 0.06]} />

        {/* Backlit sign above the back row */}
        <mesh geometry={geo.plane} material={res.sign} position={[0, 4.5, WALL_BACK + 0.02]} scale={[6.4, 6.4 * (320 / 1024), 1]} />

        {/* Pools of light on the floor under each fixture */}
        {LIGHT_ROWS.flatMap((z) =>
          LIGHT_XS.map((x) => (
            <mesh key={`p${x}${z}`} geometry={geo.plane} material={res.poolWhite} position={[x, DEV_FLOOR_Y + 0.014, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[7, 3.4, 1]} renderOrder={2} />
          )),
        )}

        {/* Data pulses along the floor lines and trays */}
        <instancedMesh ref={pulseCores} args={[res.stripGeo, res.pulseCore, LANES.length * PULSES_PER_LANE]} frustumCulled={false} />
        <instancedMesh ref={pulseGlows} args={[geo.plane, res.pulseGlow, LANES.length * PULSES_PER_LANE]} frustumCulled={false} renderOrder={3} />

        {/* Volumetric light shafts from the fixtures */}
        {SHAFT_ROWS.flatMap((z) =>
          LIGHT_XS.flatMap((x) =>
            [0, Math.PI / 2].map((r) => (
              <mesh key={`s${x}${z}${r}`} geometry={geo.plane} material={res.shaft} position={[x, DEV_FLOOR_Y + ROOM_H / 2 - 0.1, z]} rotation={[0, r, 0]} scale={[2.8, ROOM_H - 0.2, 1]} renderOrder={4} />
            )),
          ),
        )}

        {/* Holographic halo around the safe */}
        <group position={[0, DEV_FLOOR_Y + 0.025, SAFE_Z]}>
          <group ref={haloSpin}>
            <mesh geometry={geo.plane} material={res.halo} rotation={[-Math.PI / 2, 0, 0]} scale={[16, 16, 1]} renderOrder={4} />
          </group>
        </group>

        {/* Data motes */}
        <points geometry={res.moteGeo} material={res.moteMat} frustumCulled={false} renderOrder={6} />

        {/* Linear light fixtures */}
        <instancedMesh ref={bars} args={[res.barGeo, res.bar, LIGHT_ROWS.length * LIGHT_XS.length]} frustumCulled={false} />

        {/* Overhead cable trays with bundled cabling */}
        {[-5.5, 5.5].map((x) => (
          <group key={x} position={[x, trayY, midZ]}>
            <mesh geometry={res.trayBase} material={res.steel} />
            <mesh geometry={res.trayRail} material={res.steel} position={[-0.38, 0.07, 0]} />
            <mesh geometry={res.trayRail} material={res.steel} position={[0.38, 0.07, 0]} />
            {res.cables.map((m, i) => (
              <mesh key={i} geometry={res.cableGeo} material={m} position={[(i - 1) * 0.2, 0.08, 0]} />
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}
