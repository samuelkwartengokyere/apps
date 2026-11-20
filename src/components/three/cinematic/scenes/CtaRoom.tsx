"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { easeOut } from "../kit/math";
import { S, useDisposables } from "../kit/parts";
import { dawnTexture, floorTileTexture, leafTexture, lengthFadeTexture, radialTexture, roomWallTexture, serverCeilingTexture } from "../kit/textures";

/*
 * The finale's setting: a long stone hall that ends in a round steel vault
 * doorway. The door stands open and daybreak comes through it: warm light
 * falls across the floor and a soft shaft fills the hall with drifting dust.
 */

export const CTA_FLOOR_Y = -4.4;
export const RING_R = 4.2;
export const CTA_CEIL_Y = 7.6;
const CEIL_Y = CTA_CEIL_Y;
const X_MAX = 15;
const LEN = 34;
const H = CEIL_Y - CTA_FLOOR_Y;
const BOLTS = 24;
const PILASTERS = 6;
const MOTES = 260;
const BAR_ZS = [4, 12, 20, 28];
const BAR_XS = [-9, 0, 9];

// Open vault door: hinged on the right of the frame, swung wide into the hall.
const HINGE_X = RING_R + 1.15;
const HINGE_Z = 0.95;
const DOOR_OPEN = 2.1;
const DOOR_R = RING_R + 0.85;
const PLUG_R = RING_R - 0.06;
const PLATE_Z = -0.17;
const PLUG_Z = -1.1;
const DOOR_BOLTS = 16;
const TREES: [number, number, number][] = [
  [-10.6, 6, 1],
  [11.6, 15, 2],
];
const LEAVES_PER_TREE = 900;

const dummy = new THREE.Object3D();
const tint = new THREE.Color();

function clone(t: THREE.Texture, rx: number, ry: number, ox = 0, oy = 0) {
  const c = t.clone();
  c.wrapS = c.wrapT = THREE.RepeatWrapping;
  c.repeat.set(rx, ry);
  c.offset.set(ox, oy);
  c.needsUpdate = true;
  return c;
}

export function CtaRoom() {
  const { state, quality } = useCine();
  const { geo } = S();
  const reflective = !quality.compact && !quality.low;

  const res = useDisposables(() => {
    const wallMap = clone(roomWallTexture(), 1 / 6, 1 / H, 0.3, -CTA_FLOOR_Y / H);
    const sideMap = clone(roomWallTexture(), LEN / 6, 1);
    const floorMap = clone(floorTileTexture(), 7, 8);
    const ceilMap = clone(serverCeilingTexture(), (X_MAX * 2) / 1.4, LEN / 1.4);
    const wall = new THREE.MeshBasicMaterial({ map: wallMap, fog: false });
    const side = new THREE.MeshBasicMaterial({ map: sideMap, fog: false });
    const ceil = new THREE.MeshBasicMaterial({ map: ceilMap, color: "#e8d8c0", fog: false });
    const bar = new THREE.MeshBasicMaterial({ color: new THREE.Color("#fff0dc").multiplyScalar(1.6), toneMapped: false, fog: false });
    const stone = new THREE.MeshStandardMaterial({ color: "#8f8068", roughness: 0.75, metalness: 0.05, emissive: new THREE.Color("#8f8068"), emissiveIntensity: 0.35 });
    const steelDark = new THREE.MeshStandardMaterial({ color: "#5b636d", roughness: 0.45, metalness: 0.9, envMapIntensity: 1 });
    const frameMat = new THREE.MeshPhysicalMaterial({ color: "#c3cbd4", metalness: 1, roughness: 0.32, envMapIntensity: 1.3 });
    const bolt = new THREE.MeshStandardMaterial({ color: "#aeb6bf", roughness: 0.3, metalness: 1, envMapIntensity: 1.2 });
    const dawn = new THREE.MeshBasicMaterial({ map: dawnTexture(), color: "#000000", fog: false });
    const beam = new THREE.MeshBasicMaterial({ map: lengthFadeTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, side: THREE.BackSide });
    const spill = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const bleed = new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false });
    const moteMat = new THREE.PointsMaterial({ map: radialTexture(), size: 0.12, sizeAttenuation: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, color: "#000000" });
    const floorFallback = new THREE.MeshStandardMaterial({ map: floorMap, emissiveMap: floorMap, emissive: new THREE.Color("#a08c70"), emissiveIntensity: 0.65, color: "#d0c4b0", roughness: 0.5, metalness: 0.25, envMapIntensity: 0.5, transparent: true });

    // Wall with a round opening
    const shape = new THREE.Shape();
    shape.moveTo(-X_MAX, CTA_FLOOR_Y);
    shape.lineTo(X_MAX, CTA_FLOOR_Y);
    shape.lineTo(X_MAX, CEIL_Y);
    shape.lineTo(-X_MAX, CEIL_Y);
    shape.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, RING_R, 0, Math.PI * 2, true);
    shape.holes.push(hole);

    // Thick steel frame around the opening
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, RING_R + 0.95, 0, Math.PI * 2, false);
    const ringHole = new THREE.Path();
    ringHole.absarc(0, 0, RING_R, 0, Math.PI * 2, true);
    ringShape.holes.push(ringHole);
    const frame = new THREE.ExtrudeGeometry(ringShape, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3, curveSegments: 96 });

    const motePos = new Float32Array(MOTES * 3);
    const moteSeed = new Float32Array(MOTES * 4);
    for (let i = 0; i < MOTES; i++) {
      const z = 0.5 + Math.random() * 15;
      const r = (RING_R * (0.9 + (z / 16) * 0.7)) * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      moteSeed[i * 4] = Math.cos(a) * r;
      moteSeed[i * 4 + 1] = Math.sin(a) * r;
      moteSeed[i * 4 + 2] = z;
      moteSeed[i * 4 + 3] = Math.random() * 6;
    }
    const moteGeo = new THREE.BufferGeometry();
    moteGeo.setAttribute("position", new THREE.BufferAttribute(motePos, 3));

    const doorSteel = new THREE.MeshPhysicalMaterial({ color: "#9aa3ad", metalness: 1, roughness: 0.34, envMapIntensity: 1.2, clearcoat: 0.15 });
    const mech = new THREE.MeshStandardMaterial({ color: "#3a4048", metalness: 0.85, roughness: 0.45, envMapIntensity: 0.9 });
    const brass = new THREE.MeshPhysicalMaterial({ color: "#b8955a", metalness: 1, roughness: 0.3, envMapIntensity: 1.1 });
    const leafMap = leafTexture();
    const leaves = new THREE.MeshStandardMaterial({ map: leafMap, emissiveMap: leafMap, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.28, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.7 });
    const bark = new THREE.MeshStandardMaterial({ color: "#5a4636", roughness: 0.9, emissive: new THREE.Color("#5a4636"), emissiveIntensity: 0.3 });
    const soil = new THREE.MeshStandardMaterial({ color: "#2a2018", roughness: 1 });
    const skirting = new THREE.MeshStandardMaterial({ color: "#3a3127", roughness: 0.6, emissive: new THREE.Color("#3a3127"), emissiveIntensity: 0.4 });
    const fadeMats: THREE.Material[] = [wall, side, ceil, bar, stone, steelDark, bolt, frameMat, doorSteel, mech, brass, leaves, bark, soil, skirting];
    return {
      wall, side, ceil, bar, stone, steelDark, bolt, frameMat, doorSteel, mech, brass, leaves, bark, soil, skirting, dawn, beam, spill, bleed, moteMat, floorFallback, fadeMats, floorMap, moteGeo, moteSeed, frame,
      wallGeo: new THREE.ShapeGeometry(shape, 96),
      sideGeo: new THREE.PlaneGeometry(LEN, H),
      ceilGeo: new THREE.PlaneGeometry(X_MAX * 2, LEN),
      floorGeo: new THREE.PlaneGeometry(X_MAX * 2, LEN),
      lipGeo: new THREE.TorusGeometry(RING_R, 0.16, 16, 128),
      sleeveGeo: new THREE.CylinderGeometry(RING_R, RING_R, 1.4, 96, 1, true).rotateX(Math.PI / 2),
      boltGeo: new THREE.CylinderGeometry(0.11, 0.11, 0.1, 12).rotateX(Math.PI / 2),
      pilasterGeo: new THREE.BoxGeometry(0.9, H, 0.7),
      barGeo: new THREE.BoxGeometry(4.6, 0.05, 0.22),
      coveGeo: new THREE.BoxGeometry(0.1, 0.05, LEN),
      dawnGeo: new THREE.PlaneGeometry(44, 33),
      plateGeo: new THREE.CylinderGeometry(DOOR_R, DOOR_R, 0.35, 96).rotateX(Math.PI / 2),
      plateRimGeo: new THREE.TorusGeometry(DOOR_R - 0.02, 0.06, 8, 96),
      plugGeo: new THREE.CylinderGeometry(PLUG_R, PLUG_R, 1.5, 96).rotateX(Math.PI / 2),
      doorBoltGeo: new THREE.CylinderGeometry(0.15, 0.15, 0.7, 14),
      mechDiscGeo: new THREE.CylinderGeometry(3.3, 3.3, 0.06, 64).rotateX(Math.PI / 2),
      linkGeo: new THREE.BoxGeometry(2.7, 0.14, 0.07),
      gearGeo: new THREE.CylinderGeometry(0.7, 0.7, 0.22, 24).rotateX(Math.PI / 2),
      wheelGeo: new THREE.TorusGeometry(1.15, 0.08, 12, 64),
      spokeGeo: new THREE.BoxGeometry(2.3, 0.1, 0.1),
      hubGeo: new THREE.CylinderGeometry(0.26, 0.3, 0.3, 20).rotateX(Math.PI / 2),
      pinGeo: new THREE.CylinderGeometry(0.22, 0.22, 3.8, 20),
      armGeo: new THREE.BoxGeometry(0.75, 0.5, 0.3),
      planterGeo: new THREE.BoxGeometry(2, 1.2, 2),
      soilGeo: new THREE.BoxGeometry(1.8, 0.04, 1.8),
      trunkGeo: new THREE.CylinderGeometry(0.11, 0.2, 1, 10),
      leafGeo: new THREE.PlaneGeometry(0.2, 0.5),
      skirtSideGeo: new THREE.BoxGeometry(0.06, 0.32, LEN),
      beamGeo: new THREE.CylinderGeometry(RING_R * 0.97, RING_R * 1.8, 17, 64, 1, true).rotateX(-Math.PI / 2),
    };
  });

  const bolts = useRef<THREE.InstancedMesh>(null);
  const doorBolts = useRef<THREE.InstancedMesh>(null);
  const links = useRef<THREE.InstancedMesh>(null);
  const leafMesh = useRef<THREE.InstancedMesh>(null);
  const pilasters = useRef<THREE.InstancedMesh>(null);
  const bars = useRef<THREE.InstancedMesh>(null);
  const root = useRef<THREE.Group>(null);
  const floorMat = useRef<THREE.MeshStandardMaterial & { opacity: number }>(null);

  useLayoutEffect(() => {
    for (let i = 0; i < BOLTS; i++) {
      const a = (i / BOLTS) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * (RING_R + 0.58), Math.sin(a) * (RING_R + 0.58), 0.62);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      bolts.current?.setMatrixAt(i, dummy.matrix);
    }
    if (bolts.current) bolts.current.instanceMatrix.needsUpdate = true;
    let p = 0;
    for (let i = 0; i < PILASTERS; i++)
      for (const sx of [-1, 1]) {
        dummy.position.set(sx * (X_MAX - 0.4), CTA_FLOOR_Y + H / 2, 5.5 + i * 5.8);
        dummy.updateMatrix();
        pilasters.current?.setMatrixAt(p++, dummy.matrix);
      }
    if (pilasters.current) pilasters.current.instanceMatrix.needsUpdate = true;
    let b = 0;
    for (const z of BAR_ZS)
      for (const x of BAR_XS) {
        dummy.position.set(x, CEIL_Y - 0.04, z);
        dummy.updateMatrix();
        bars.current?.setMatrixAt(b++, dummy.matrix);
      }
    if (bars.current) bars.current.instanceMatrix.needsUpdate = true;
    for (let i = 0; i < DOOR_BOLTS; i++) {
      const a = (i / DOOR_BOLTS) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * (PLUG_R + 0.2), Math.sin(a) * (PLUG_R + 0.2), PLUG_Z - 0.2);
      dummy.rotation.set(0, 0, a - Math.PI / 2);
      dummy.updateMatrix();
      doorBolts.current?.setMatrixAt(i, dummy.matrix);
      dummy.position.set(Math.cos(a) * 1.85, Math.sin(a) * 1.85, PLUG_Z - 0.82);
      dummy.rotation.set(0, 0, a);
      dummy.updateMatrix();
      links.current?.setMatrixAt(i, dummy.matrix);
    }
    if (doorBolts.current) doorBolts.current.instanceMatrix.needsUpdate = true;
    if (links.current) links.current.instanceMatrix.needsUpdate = true;
    // Foliage: leaf cards scattered through a few overlapping clumps per tree.
    let rnd = 7;
    const r = () => ((rnd = (rnd * 16807) % 2147483647) - 1) / 2147483646;
    let k = 0;
    for (const [tx, tz, seed] of TREES) {
      rnd = 97 * seed;
      const clumps = Array.from({ length: 6 }, () => [(r() - 0.5) * 2.2, 3.9 + r() * 1.6, (r() - 0.5) * 2.2, 0.8 + r() * 0.5]);
      for (let i = 0; i < LEAVES_PER_TREE; i++) {
        const c = clumps[i % clumps.length];
        const u = r() * Math.PI * 2;
        const v = Math.acos(2 * r() - 1);
        const rad = c[3] * Math.cbrt(r());
        dummy.position.set(tx + c[0] + Math.sin(v) * Math.cos(u) * rad, CTA_FLOOR_Y + c[1] + Math.cos(v) * rad * 0.75, tz + c[2] + Math.sin(v) * Math.sin(u) * rad);
        dummy.rotation.set(r() * Math.PI * 2, r() * Math.PI * 2, r() * Math.PI * 2);
        dummy.scale.setScalar(0.8 + r() * 0.5);
        dummy.updateMatrix();
        leafMesh.current?.setMatrixAt(k, dummy.matrix);
        tint.setHSL(0.24 + r() * 0.06, 0.25 + r() * 0.2, 0.42 + r() * 0.25);
        leafMesh.current?.setColorAt(k, tint);
        k++;
      }
    }
    dummy.scale.setScalar(1);
    if (leafMesh.current) {
      leafMesh.current.instanceMatrix.needsUpdate = true;
      if (leafMesh.current.instanceColor) leafMesh.current.instanceColor.needsUpdate = true;
    }
  }, []);

  useFrame(({ clock }) => {
    const c = state.cta;
    const room = c.room;
    const open = easeOut(c.portal);
    const t = clock.elapsedTime;
    const g = root.current;
    if (!g) return;
    g.visible = room > 0.003;
    if (!g.visible) return;
    for (const m of res.fadeMats) {
      m.transparent = room < 0.999;
      m.opacity = room;
    }
    if (floorMat.current) {
      floorMat.current.opacity = room;
      floorMat.current.transparent = true;
    }
    const day = 0.22 + open * 0.72;
    res.dawn.color.setScalar(day * room);
    res.beam.color.set("#ffd9a8").multiplyScalar(0.05 * open * room);
    res.spill.color.set("#ffcf99").multiplyScalar(0.5 * open * room);
    res.bleed.color.set("#ffd8a8").multiplyScalar(0.35 * (0.3 + open * 0.7) * room);
    res.moteMat.color.set("#ffe6c2").multiplyScalar(0.9 * open * room);
    const pos = res.moteGeo.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < MOTES; i++) {
      const s = res.moteSeed;
      const ph = s[i * 4 + 3];
      pos.setXYZ(i, s[i * 4] + Math.sin(t * 0.15 + ph) * 0.3, s[i * 4 + 1] + Math.sin(t * 0.21 + ph * 1.7) * 0.25 - ((t * 0.06 + ph) % 1) * 0.3, s[i * 4 + 2] + Math.cos(t * 0.12 + ph) * 0.3);
    }
    pos.needsUpdate = true;
  });

  return (
    <group ref={root} visible={false}>
      {/* Hall */}
      <mesh geometry={res.wallGeo} material={res.wall} position={[0, 0, -0.02]} />
      <mesh geometry={res.sideGeo} material={res.side} position={[-X_MAX, CTA_FLOOR_Y + H / 2, LEN / 2]} rotation={[0, Math.PI / 2, 0]} />
      <mesh geometry={res.sideGeo} material={res.side} position={[X_MAX, CTA_FLOOR_Y + H / 2, LEN / 2]} rotation={[0, -Math.PI / 2, 0]} />
      <mesh geometry={res.ceilGeo} material={res.ceil} position={[0, CEIL_Y, LEN / 2]} rotation={[Math.PI / 2, 0, 0]} />
      <instancedMesh ref={bars} args={[res.barGeo, res.bar, BAR_ZS.length * BAR_XS.length]} frustumCulled={false} />
      <instancedMesh ref={pilasters} args={[res.pilasterGeo, res.stone, PILASTERS * 2]} frustumCulled={false} />
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={res.coveGeo} material={res.bar} position={[sx * (X_MAX - 0.9), CEIL_Y - 0.25, LEN / 2]} />
      ))}

      {/* Polished stone floor */}
      <mesh geometry={res.floorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, CTA_FLOOR_Y, LEN / 2]}>
        {reflective ? (
          <MeshReflectorMaterial
            ref={floorMat as never}
            map={res.floorMap}
            resolution={512}
            blur={[200, 60]}
            mixBlur={1}
            mixStrength={9}
            mirror={1}
            roughness={0.5}
            depthScale={0.4}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            color="#d0c4b0"
            metalness={0.4}
            envMapIntensity={0.4}
            transparent
          />
        ) : (
          <primitive object={res.floorFallback} ref={floorMat} attach="material" />
        )}
      </mesh>
      <mesh geometry={geo.plane} material={res.spill} position={[0, CTA_FLOOR_Y + 0.02, 7.5]} rotation={[-Math.PI / 2, 0, 0]} scale={[11, 17, 1]} renderOrder={2} />

      {/* Daybreak beyond the doorway */}
      <mesh geometry={res.dawnGeo} material={res.dawn} position={[0, 2.76, -13]} />
      <mesh geometry={geo.plane} material={res.bleed} position={[0, 0, 0.02]} scale={[16, 16, 1]} renderOrder={2} />
      <mesh geometry={res.beamGeo} material={res.beam} position={[0, 0, 8.5]} renderOrder={3} />
      <points geometry={res.moteGeo} material={res.moteMat} frustumCulled={false} renderOrder={4} />

      {/* Round steel doorway */}
      <mesh geometry={res.sleeveGeo} material={res.steelDark} position={[0, 0, -0.7]} />
      <mesh geometry={res.frame} material={res.frameMat} position={[0, 0, 0.0]} />
      <mesh geometry={res.lipGeo} material={res.frameMat} position={[0, 0, 0.6]} />
      <instancedMesh ref={bolts} args={[res.boltGeo, res.bolt, BOLTS]} frustumCulled={false} />

      {/* The door itself, swung open on its hinge */}
      <mesh geometry={res.pinGeo} material={res.doorSteel} position={[HINGE_X, 0, HINGE_Z]} />
      {[-1.5, 1.5].map((y) => (
        <mesh key={y} geometry={res.armGeo} material={res.mech} position={[HINGE_X - 0.05, y, HINGE_Z - 0.35]} />
      ))}
      <group position={[HINGE_X, 0, HINGE_Z]} rotation={[0, DOOR_OPEN, 0]}>
        <group position={[-HINGE_X, 0, 0]}>
          <mesh geometry={res.plateGeo} material={res.doorSteel} position={[0, 0, PLATE_Z]} />
          <mesh geometry={res.plateRimGeo} material={res.doorSteel} position={[0, 0, PLATE_Z + 0.16]} />
          <mesh geometry={res.plugGeo} material={res.doorSteel} position={[0, 0, PLUG_Z]} />
          <instancedMesh ref={doorBolts} args={[res.doorBoltGeo, res.bolt, DOOR_BOLTS]} frustumCulled={false} />
          {/* Boltwork on the inside face */}
          <mesh geometry={res.mechDiscGeo} material={res.mech} position={[0, 0, PLUG_Z - 0.78]} />
          <instancedMesh ref={links} args={[res.linkGeo, res.doorSteel, DOOR_BOLTS]} frustumCulled={false} />
          <mesh geometry={res.gearGeo} material={res.brass} position={[0, 0, PLUG_Z - 0.9]} />
          {/* Handwheel on the outside face */}
          <group position={[0, 0, PLATE_Z + 0.3]}>
            <mesh geometry={res.wheelGeo} material={res.doorSteel} />
            {[0, 1, 2].map((k) => (
              <mesh key={k} geometry={res.spokeGeo} material={res.doorSteel} rotation={[0, 0, (k * Math.PI) / 3]} />
            ))}
            <mesh geometry={res.hubGeo} material={res.brass} />
          </group>
          {[-1.5, 1.5].map((y) => (
            <mesh key={y} geometry={res.armGeo} material={res.mech} position={[DOOR_R - 0.05, y, PLATE_Z]} />
          ))}
        </group>
      </group>

      {/* Skirting */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} geometry={res.skirtSideGeo} material={res.skirting} position={[sx * (X_MAX - 0.03), CTA_FLOOR_Y + 0.16, LEN / 2]} />
      ))}

      {/* Potted trees */}
      {TREES.map(([x, z]) => (
        <group key={x} position={[x, CTA_FLOOR_Y, z]}>
          <mesh geometry={res.planterGeo} material={res.stone} position={[0, 0.6, 0]} />
          <mesh geometry={res.soilGeo} material={res.soil} position={[0, 1.19, 0]} />
          <mesh geometry={res.trunkGeo} material={res.bark} position={[0.05, 2.4, 0]} scale={[1, 2.6, 1]} rotation={[0, 0, -0.05]} />
          {[[0.7, 0.4], [-0.6, -0.5], [0.3, -0.9], [-0.4, 0.8]].map(([dx, dz], i) => (
            <mesh key={i} geometry={res.trunkGeo} material={res.bark} position={[dx * 0.5, 3.9, dz * 0.5]} scale={[0.45, 1.3, 0.45]} rotation={[dz * 0.6, 0, -dx * 0.6]} />
          ))}
        </group>
      ))}
      <instancedMesh ref={leafMesh} args={[res.leafGeo, res.leaves, TREES.length * LEAVES_PER_TREE]} frustumCulled={false} />
    </group>
  );
}
