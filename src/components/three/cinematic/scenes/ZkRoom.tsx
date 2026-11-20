"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCine } from "../kit/context";
import { S, useDisposables } from "../kit/parts";
import {
  homeWallTexture,
  nightCityTexture,
  radialTexture,
  rugTexture,
  serverCeilingTexture,
  serverFloorTexture,
  serverRackTexture,
  serverWallTexture,
  woodFloorTexture,
} from "../kit/textures";

/*
 * The real-world setting for the zero-knowledge illustration: on the left a
 * home office (desk, laptop, lamp, window onto the night city) where the data
 * is encrypted; on the right a data-centre aisle (racks on a raised floor)
 * where only ciphertext is stored. The front wall has the doorway the
 * Security Center corridor opens into. Everything dissolves with
 * `state.zk.shell` as the camera leaves for the final scene.
 */

export const ZK_FLOOR_Y = -1.65;
const X_MAX = 22;
const Z_BACK = -9;
const Z_FRONT = 9.4;
const DEPTH = Z_FRONT - Z_BACK;
const H = 6.6;
const CEIL_Y = ZK_FLOOR_Y + H;
const DOOR_HALF = 2.4;
const DOOR_H = 4.4;
const RACK_W = 1.7;
const RACK_H = 3.2;
const RACK_D = 1.4;
export const DESK_TOP_Y = -0.49;
export const RACK_TOP_Y = ZK_FLOOR_Y + RACK_H;
const BAR_ROWS = [-6, -1.5, 3, 7.5];
const BAR_XS = [-16, -10, -4, 4, 10, 16];

const dummy = new THREE.Object3D();

function tex(t: THREE.Texture, rx: number, ry: number, ox = 0, oy = 0) {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(rx, ry);
  c.offset.set(ox, oy);
  c.needsUpdate = true;
  return c;
}

export function ZkRoom({ ledMat }: { ledMat: THREE.Material }) {
  const { state } = useCine();
  const { geo } = S();
  const shell = useRef<THREE.Group>(null);
  const bars = useRef<THREE.InstancedMesh>(null);

  const res = useDisposables(() => {
    const std = (color: string, rough = 0.5, metal = 0.1, fill = 0.3) =>
      new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, emissive: new THREE.Color(color), emissiveIntensity: fill, envMapIntensity: 0.7 });
    const woodMap = tex(woodFloorTexture(), 9, 8.5);
    const tileMap = tex(serverFloorTexture(), 9, 8.5);
    const homeBack = new THREE.MeshBasicMaterial({ map: tex(homeWallTexture(), 5.4, 1), fog: false });
    const homeSide = new THREE.MeshBasicMaterial({ map: tex(homeWallTexture(), 5.1, 1), fog: false });
    const dcBack = new THREE.MeshBasicMaterial({ map: tex(serverWallTexture(), 5.4, 1), fog: false });
    const dcSide = new THREE.MeshBasicMaterial({ map: tex(serverWallTexture(), 5.1, 1), fog: false });
    const ceil = new THREE.MeshBasicMaterial({ map: tex(serverCeilingTexture(), (X_MAX * 2) / 1.4, DEPTH / 1.4), fog: false });
    const city = new THREE.MeshBasicMaterial({ map: tex(nightCityTexture(), 0.3, 1, 0.12, 0), fog: false, toneMapped: true });
    const bar = new THREE.MeshBasicMaterial({ color: new THREE.Color("#e6f0ff").multiplyScalar(1.6), toneMapped: false, fog: false });
    const warmGlass = new THREE.MeshBasicMaterial({ color: new THREE.Color("#ffd9a0").multiplyScalar(1.6), toneMapped: false, fog: false });

    const racks = [0, 1, 2].map((v) => {
      const map = serverRackTexture(v, false);
      return new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.85, roughness: 0.55, metalness: 0.35, envMapIntensity: 0.5 });
    });
    const rackLeds = [1, 2].map(
      (v) => new THREE.MeshBasicMaterial({ map: serverRackTexture(v, true), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }),
    );
    const mainFront = new THREE.MeshStandardMaterial({
      map: serverRackTexture(0, false),
      emissiveMap: serverRackTexture(0, false),
      emissive: new THREE.Color("#ffffff"),
      emissiveIntensity: 0.85,
      roughness: 0.55,
      metalness: 0.35,
      envMapIntensity: 0.5,
    });
    const rug = new THREE.MeshStandardMaterial({ map: rugTexture(), emissiveMap: rugTexture(), emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.35, roughness: 0.95 });
    const woodFloor = new THREE.MeshStandardMaterial({ map: woodMap, emissiveMap: woodMap, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.4, color: "#d6c3a6", roughness: 0.5, metalness: 0.05, envMapIntensity: 0.5 });
    const tileFloor = new THREE.MeshStandardMaterial({ map: tileMap, emissiveMap: tileMap, emissive: new THREE.Color("#6f8fb5"), emissiveIntensity: 0.7, color: "#b4c6dc", roughness: 0.55, metalness: 0.35, envMapIntensity: 0.4 });
    const oak = std("#8a6240", 0.5, 0.05, 0.42);
    const oakDark = std("#5b3f27", 0.55, 0.05, 0.4);
    const steel = std("#79828d", 0.35, 0.85, 0.12);
    const black = std("#14181d", 0.5, 0.6, 0.35);
    const fabric = std("#2f3946", 0.9, 0, 0.35);
    const mug = std("#e9e4da", 0.35, 0, 0.35);
    const leaf = std("#3c7a4d", 0.7, 0, 0.45);
    const pot = std("#b9754f", 0.8, 0, 0.35);
    const paper = std("#e3dccb", 0.9, 0, 0.45);
    const cableMats = ["#2a62c9", "#d8b52a", "#8b929a"].map((c) => std(c, 0.6, 0.1, 0.3));
    const shadow = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false, fog: false });
    const poolWarm = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const poolCool = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const fadeMats: THREE.Material[] = [
      homeBack, homeSide, dcBack, dcSide, ceil, city, bar, warmGlass, ...racks, mainFront, rug, woodFloor, tileFloor,
      oak, oakDark, steel, black, fabric, mug, leaf, pot, paper, ...cableMats,
    ];
    const rbox = (w: number, h: number, d: number, r = 0.03) => new RoundedBoxGeometry(w, h, d, 3, r);
    return {
      homeBack, homeSide, dcBack, dcSide, ceil, city, bar, warmGlass, racks, rackLeds, mainFront, rug, woodFloor, tileFloor,
      oak, oakDark, steel, black, fabric, mug, leaf, pot, paper, cableMats, shadow, poolWarm, poolCool, fadeMats,
      woodMap, tileMap,
      floorGeo: new THREE.PlaneGeometry(X_MAX, DEPTH),
      backGeo: new THREE.PlaneGeometry(X_MAX, H),
      sideGeo: new THREE.PlaneGeometry(DEPTH, H),
      ceilGeo: new THREE.PlaneGeometry(X_MAX * 2, DEPTH),
      lintelGeo: new THREE.PlaneGeometry(DOOR_HALF * 2, H - DOOR_H),
      frontPartGeo: new THREE.PlaneGeometry(X_MAX - DOOR_HALF, H),
      rugGeo: new THREE.PlaneGeometry(7.4, 5.4),
      thresholdGeo: new THREE.BoxGeometry(0.18, 0.03, DEPTH),
      barGeo: new THREE.BoxGeometry(4.6, 0.05, 0.22),
      // window
      glassGeo: new THREE.PlaneGeometry(6, 3.5),
      frameBarH: new THREE.BoxGeometry(6.3, 0.14, 0.2),
      frameBarV: new THREE.BoxGeometry(0.14, 3.64, 0.2),
      sillGeo: rbox(6.7, 0.1, 0.5, 0.02),
      // desk
      deskTop: rbox(5.4, 0.1, 2.4, 0.03),
      deskLeg: new THREE.BoxGeometry(0.12, 1.06, 0.12),
      deskPanel: new THREE.BoxGeometry(5.0, 0.7, 0.05),
      drawerGeo: rbox(1.3, 0.95, 1.9, 0.04),
      drawerFaceGeo: new THREE.BoxGeometry(1.15, 0.26, 0.02),
      // chair
      seatGeo: rbox(1.15, 0.16, 1.15, 0.06),
      chairBack: rbox(1.1, 1.0, 0.14, 0.06),
      postGeo: new THREE.CylinderGeometry(0.07, 0.09, 0.62, 12),
      spokeGeo: new THREE.BoxGeometry(0.7, 0.06, 0.1),
      wheelGeo: new THREE.SphereGeometry(0.08, 8, 6),
      // props
      lampBase: new THREE.CylinderGeometry(0.28, 0.32, 0.06, 20),
      lampArm: new THREE.CylinderGeometry(0.025, 0.025, 1, 6),
      lampHead: new THREE.ConeGeometry(0.28, 0.4, 20, 1, true),
      mugGeo: new THREE.CylinderGeometry(0.16, 0.14, 0.3, 20),
      bookGeo: rbox(0.9, 0.08, 1.2, 0.015),
      phoneGeo: rbox(0.36, 0.03, 0.72, 0.03),
      potGeo: new THREE.CylinderGeometry(0.55, 0.4, 0.9, 20),
      leafGeo: new THREE.SphereGeometry(0.35, 10, 8),
      // racks
      rackBody: new THREE.BoxGeometry(RACK_W, RACK_H, RACK_D),
      rackFront: new THREE.PlaneGeometry(RACK_W - 0.1, RACK_H - 0.14),
      trayBase: new THREE.BoxGeometry(0.9, 0.05, DEPTH - 1),
      trayRail: new THREE.BoxGeometry(0.05, 0.16, DEPTH - 1),
      cableGeo: new THREE.CylinderGeometry(0.05, 0.05, DEPTH - 1.6, 8).rotateX(Math.PI / 2),
      standGeo: new THREE.BoxGeometry(0.6, 0.18, 0.4),
      neckGeo: new THREE.BoxGeometry(0.12, 0.2, 0.1),
    };
  });

  useLayoutEffect(() => {
    let b = 0;
    for (const z of BAR_ROWS)
      for (const x of BAR_XS) {
        dummy.position.set(x, CEIL_Y - 0.04, z);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        bars.current?.setMatrixAt(b++, dummy.matrix);
      }
    if (bars.current) bars.current.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const z = state.zk;
    const sh = z.room * z.shell;
    const g = shell.current;
    if (!g) return;
    g.visible = sh > 0.003;
    if (!g.visible) return;
    for (const m of res.fadeMats) {
      m.transparent = sh < 0.999;
      m.opacity = sh;
    }
    res.shadow.opacity = 0.55 * sh;
    res.poolWarm.color.set("#ffb36b").multiplyScalar(0.22 * sh);
    res.poolCool.color.set("#6bb8ee").multiplyScalar(0.18 * sh);
    // The rack LED overlay is driven by the scene (blue → cyan on receive).
    for (const m of res.rackLeds) (m as THREE.MeshBasicMaterial).opacity = sh;
    void clock;
  });

  const rackAt = (key: string, x: number, zz: number, v: number, main = false) => (
    <group key={key} position={[x, ZK_FLOOR_Y + RACK_H / 2, zz]}>
      <mesh geometry={res.rackBody} material={res.black} />
      <mesh geometry={res.rackFront} material={main ? res.mainFront : res.racks[v]} position={[0, 0, RACK_D / 2 + 0.005]} />
      <mesh geometry={res.rackFront} material={main ? ledMat : res.rackLeds[v - 1]} position={[0, 0, RACK_D / 2 + 0.012]} renderOrder={3} />
    </group>
  );

  return (
    <group ref={shell}>
      {/* Floors: oak at home, raised access floor in the data hall */}
      <mesh geometry={res.floorGeo} material={res.woodFloor} position={[-X_MAX / 2, ZK_FLOOR_Y, (Z_BACK + Z_FRONT) / 2]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={res.floorGeo} material={res.tileFloor} position={[X_MAX / 2, ZK_FLOOR_Y, (Z_BACK + Z_FRONT) / 2]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={res.thresholdGeo} material={res.steel} position={[0, ZK_FLOOR_Y + 0.015, (Z_BACK + Z_FRONT) / 2]} />

      {/* Walls and ceiling */}
      <mesh geometry={res.backGeo} material={res.homeBack} position={[-X_MAX / 2, ZK_FLOOR_Y + H / 2, Z_BACK]} />
      <mesh geometry={res.backGeo} material={res.dcBack} position={[X_MAX / 2, ZK_FLOOR_Y + H / 2, Z_BACK]} />
      <mesh geometry={res.sideGeo} material={res.homeSide} position={[-X_MAX, ZK_FLOOR_Y + H / 2, (Z_BACK + Z_FRONT) / 2]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={res.sideGeo} material={res.dcSide} position={[X_MAX, ZK_FLOOR_Y + H / 2, (Z_BACK + Z_FRONT) / 2]} rotation={[0, -Math.PI / 2, 0]} />
      <mesh geometry={res.frontPartGeo} material={res.homeBack} position={[-(X_MAX + DOOR_HALF) / 2, ZK_FLOOR_Y + H / 2, Z_FRONT]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={res.frontPartGeo} material={res.dcBack} position={[(X_MAX + DOOR_HALF) / 2, ZK_FLOOR_Y + H / 2, Z_FRONT]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={res.lintelGeo} material={res.dcBack} position={[0, ZK_FLOOR_Y + DOOR_H + (H - DOOR_H) / 2, Z_FRONT]} rotation={[0, Math.PI, 0]} />
      <mesh geometry={res.ceilGeo} material={res.ceil} position={[0, CEIL_Y, (Z_BACK + Z_FRONT) / 2]} rotation={[Math.PI / 2, 0, 0]} />
      <instancedMesh ref={bars} args={[res.barGeo, res.bar, BAR_ROWS.length * BAR_XS.length]} frustumCulled={false} />

      {/* ------------------------------------------------------------------ */}
      {/* Home office                                                        */}
      {/* ------------------------------------------------------------------ */}
      <mesh geometry={res.rugGeo} material={res.rug} position={[-6, ZK_FLOOR_Y + 0.012, 1.2]} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={geo.plane} material={res.shadow} position={[-6, ZK_FLOOR_Y + 0.02, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[7, 3.6, 1]} renderOrder={1} />

      {/* Window onto the night city */}
      <group position={[-6, ZK_FLOOR_Y + 3.9, Z_BACK + 0.02]}>
        <mesh geometry={res.glassGeo} material={res.city} />
        <mesh geometry={res.frameBarH} material={res.oakDark} position={[0, 1.82, 0.05]} />
        <mesh geometry={res.frameBarH} material={res.oakDark} position={[0, -1.82, 0.05]} />
        <mesh geometry={res.frameBarH} material={res.oakDark} position={[0, 0, 0.05]} scale={[1, 0.6, 0.6]} />
        {[-3.08, 0, 3.08].map((x) => (
          <mesh key={x} geometry={res.frameBarV} material={res.oakDark} position={[x, 0, 0.05]} scale={[x === 0 ? 0.7 : 1, 1, 1]} />
        ))}
        <mesh geometry={res.sillGeo} material={res.oak} position={[0, -1.95, 0.22]} />
      </group>

      {/* Desk */}
      <group position={[-6, 0, 0.1]}>
        <mesh geometry={res.deskTop} material={res.oak} position={[0, DESK_TOP_Y - 0.05, 0]} />
        {[-2.5, 2.5].flatMap((x) => [-1.0, 1.0].map((zz) => (
          <mesh key={`${x}${zz}`} geometry={res.deskLeg} material={res.steel} position={[x, ZK_FLOOR_Y + 0.53, zz]} />
        )))}
        <mesh geometry={res.deskPanel} material={res.oakDark} position={[0, DESK_TOP_Y - 0.45, -0.95]} />
        <mesh geometry={res.drawerGeo} material={res.oakDark} position={[1.7, ZK_FLOOR_Y + 0.5, 0.1]} />
        {[0.28, -0.05, -0.38].map((y) => (
          <mesh key={y} geometry={res.drawerFaceGeo} material={res.steel} position={[1.7, ZK_FLOOR_Y + 0.5 + y, 1.07]} />
        ))}

        {/* Things on the desk */}
        <mesh geometry={res.mugGeo} material={res.mug} position={[-1.7, DESK_TOP_Y + 0.15, 0.55]} />
        <mesh geometry={res.bookGeo} material={res.paper} position={[1.5, DESK_TOP_Y + 0.04, 0.2]} rotation={[0, -0.25, 0]} />
        <mesh geometry={res.bookGeo} material={res.fabric} position={[1.52, DESK_TOP_Y + 0.12, 0.22]} rotation={[0, -0.18, 0]} scale={[0.9, 1, 0.9]} />
        <mesh geometry={res.phoneGeo} material={res.black} position={[1.9, DESK_TOP_Y + 0.17, 0.6]} rotation={[0, 0.4, 0]} />
        {/* Desk lamp */}
        <group position={[-2.3, DESK_TOP_Y, -0.65]}>
          <mesh geometry={res.lampBase} material={res.black} position={[0, 0.03, 0]} />
          <mesh geometry={res.lampArm} material={res.steel} position={[0.1, 0.55, 0]} rotation={[0, 0, -0.22]} scale={[1, 1.1, 1]} />
          <mesh geometry={res.lampArm} material={res.steel} position={[0.45, 1.05, 0]} rotation={[0, 0, 1.0]} scale={[1, 0.8, 1]} />
          <mesh geometry={res.lampHead} material={res.black} position={[0.75, 1.15, 0]} rotation={[0, 0, 0.6]} />
          <mesh geometry={geo.sphere} material={res.warmGlass} position={[0.82, 1.03, 0]} scale={0.1} />
        </group>
        <mesh geometry={geo.plane} material={res.poolWarm} position={[-1.2, DESK_TOP_Y + 0.006, 0.1]} rotation={[-Math.PI / 2, 0, 0]} scale={[4.6, 3, 1]} renderOrder={2} />
      </group>

      {/* Chair (faces the desk) */}
      <group position={[-6.2, 0, 2.55]} rotation={[0, 0.12, 0]}>
        <mesh geometry={res.seatGeo} material={res.fabric} position={[0, ZK_FLOOR_Y + 0.85, 0]} />
        <mesh geometry={res.chairBack} material={res.fabric} position={[0, ZK_FLOOR_Y + 1.5, 0.52]} rotation={[-0.08, 0, 0]} />
        <mesh geometry={res.postGeo} material={res.steel} position={[0, ZK_FLOOR_Y + 0.5, 0]} />
        {[0, 1, 2, 3, 4].map((k) => (
          <group key={k} rotation={[0, (k / 5) * Math.PI * 2, 0]}>
            <mesh geometry={res.spokeGeo} material={res.steel} position={[0.35, ZK_FLOOR_Y + 0.14, 0]} />
            <mesh geometry={res.wheelGeo} material={res.black} position={[0.7, ZK_FLOOR_Y + 0.08, 0]} />
          </group>
        ))}
      </group>

      {/* Plant */}
      <group position={[-12.2, ZK_FLOOR_Y, -2.6]}>
        <mesh geometry={res.potGeo} material={res.pot} position={[0, 0.45, 0]} />
        {[[0, 1.4, 0, 1.2], [0.4, 1.9, 0.1, 0.9], [-0.4, 1.8, -0.2, 1.0], [0.1, 2.35, -0.1, 0.8], [-0.35, 1.3, 0.35, 0.7]].map(([x, y, zz, s], i) => (
          <mesh key={i} geometry={res.leafGeo} material={res.leaf} position={[x, y, zz]} scale={[s, s * 1.1, s]} />
        ))}
      </group>

      {/* ------------------------------------------------------------------ */}
      {/* Data hall                                                          */}
      {/* ------------------------------------------------------------------ */}
      {rackAt("main", 6, -0.3, 0, true)}
      {rackAt("a1", 3.9, -0.3, 1)}
      {rackAt("a2", 8.1, -0.3, 2)}
      {rackAt("a3", 10.2, -0.3, 1)}
      {rackAt("b1", 3.9, -5, 2)}
      {rackAt("b2", 6, -5, 1)}
      {rackAt("b3", 8.1, -5, 2)}
      {rackAt("b4", 10.2, -5, 1)}
      <mesh geometry={geo.plane} material={res.shadow} position={[7, ZK_FLOOR_Y + 0.02, -0.2]} rotation={[-Math.PI / 2, 0, 0]} scale={[9.6, 2.6, 1]} renderOrder={1} />
      <mesh geometry={geo.plane} material={res.poolCool} position={[7, ZK_FLOOR_Y + 0.025, 2.4]} rotation={[-Math.PI / 2, 0, 0]} scale={[10, 5, 1]} renderOrder={2} />
      {/* Rack-top status monitor stand */}
      <mesh geometry={res.neckGeo} material={res.black} position={[6, RACK_TOP_Y + 0.09, -0.2]} />
      <mesh geometry={res.standGeo} material={res.black} position={[6, RACK_TOP_Y + 0.02, -0.2]} />

      {/* Cable ladder overhead, fibre and copper in the tray */}
      <group position={[6, CEIL_Y - 0.7, (Z_BACK + Z_FRONT) / 2]}>
        <mesh geometry={res.trayBase} material={res.steel} />
        {[-0.45, 0.45].map((x) => (
          <mesh key={x} geometry={res.trayRail} material={res.steel} position={[x, 0.08, 0]} />
        ))}
        {[-0.25, 0, 0.25].map((x, i) => (
          <mesh key={x} geometry={res.cableGeo} material={res.cableMats[i]} position={[x, 0.08, 0]} />
        ))}
      </group>
    </group>
  );
}
