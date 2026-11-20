"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { backOut, easeOut, range, stagger } from "../kit/math";
import { COLORS, GlowSprite, Label, S, VaultCore, fadeGroup, fadeable, useDisposables } from "../kit/parts";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { UI, brushedRoughness, keycardTexture } from "../kit/textures";
import { SH_FLOOR_Y, SharedRoom, TABLE_TOP } from "./SharedRoom";

type Node = { role: string; perm: string; color: string; pos: [number, number, number]; allowed: boolean; below?: boolean; ground?: boolean };

const NODES: Node[] = [
  { role: "Owner", perm: "Full access", color: UI.cyan, pos: [-2.68, 0.25, 1.55], allowed: true },
  { role: "Administrator", perm: "Manage members", color: UI.violet, pos: [-2.54, 0.25, -1.78], allowed: true },
  { role: "Editor", perm: "Can edit", color: UI.green, pos: [1.06, 0.25, -2.91], allowed: true },
  { role: "Viewer", perm: "View only", color: UI.blue, pos: [2.99, 0.25, -0.80], allowed: true },
  { role: "Viewer", perm: "Expires in 7 days", color: UI.blue, pos: [2.37, 0.25, 1.99], allowed: true },
  { role: "Not a member", perm: "No access", color: UI.red, pos: [5.12, 0.5, -0.90], allowed: false, ground: true },
];
const CORE = new THREE.Vector3(0, 1.1, 0);
const TUBE_SEG = 40;
const TUBE_RAD = 5;
/** Order the shared resource visits authorised members. */
const ROUTE = [2, 4, 0];

const arc = (a: THREE.Vector3, b: THREE.Vector3, lift: number) =>
  new THREE.QuadraticBezierCurve3(a.clone(), a.clone().add(b).multiplyScalar(0.5).add(new THREE.Vector3(0, lift, 0)), b.clone());

export default function SharedVault() {
  const { state } = useCine();
  const { geo, mat } = S();

  const nodePos = useMemo(() => NODES.map((n) => new THREE.Vector3(...n.pos)), []);
  const curves = useMemo(() => nodePos.map((p, i) => (NODES[i].allowed ? arc(CORE, p, 1.5) : arc(CORE, CORE.clone().lerp(p, 0.42), 0.6))), [nodePos]);
  const route = useMemo(() => {
    const path = new THREE.CurvePath<THREE.Vector3>();
    path.add(curves[ROUTE[0]]);
    for (let i = 1; i < ROUTE.length; i++) path.add(arc(nodePos[ROUTE[i - 1]], nodePos[ROUTE[i]], 2));
    return path;
  }, [curves, nodePos]);

  const res = useDisposables(() => ({
    tubes: curves.map((c) => new THREE.TubeGeometry(c, TUBE_SEG, 0.022, TUBE_RAD, false)),
    linkMat: fadeable(new THREE.MeshBasicMaterial({ color: COLORS.cyan.clone().multiplyScalar(1.1), toneMapped: false, transparent: true })),
    deniedMat: fadeable(new THREE.MeshBasicMaterial({ color: COLORS.red.clone().multiplyScalar(1.2), toneMapped: false, transparent: true })),
    nodeMat: new THREE.MeshPhysicalMaterial({ color: "#58626f", metalness: 1, roughness: 0.3, roughnessMap: brushedRoughness(), envMapIntensity: 1.3 }),
    ringGeo: new THREE.TorusGeometry(0.46, 0.022, 6, 48),
    cardGeo: new RoundedBoxGeometry(0.52, 0.33, 0.024, 3, 0.012),
    stripGeo: new THREE.BoxGeometry(0.52, 0.04, 0.03),
    cardFace: new THREE.MeshPhysicalMaterial({ map: keycardTexture(), metalness: 0.75, roughness: 0.34, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.1 }),
    cardEdge: new THREE.MeshPhysicalMaterial({ color: "#9aa3ad", metalness: 1, roughness: 0.25, envMapIntensity: 1.2 }),
    ringMats: NODES.map(() => new THREE.MeshBasicMaterial({ toneMapped: false })),
    puckGeo: new THREE.CylinderGeometry(0.24, 0.27, 0.06, 40),
    puckRing: new THREE.TorusGeometry(0.19, 0.012, 8, 48),
    resourceMat: new THREE.MeshBasicMaterial({ color: COLORS.cyan.clone().multiplyScalar(1.6), toneMapped: false }),
    pulseMat: new THREE.MeshBasicMaterial({ color: COLORS.sky.clone().multiplyScalar(1.4), toneMapped: false }),
    blockGeo: new THREE.TorusGeometry(0.16, 0.025, 6, 24),
  }));

  const core = useRef<THREE.Group>(null);
  const coreSpin = useRef<THREE.Group>(null);
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const cardRefs = useRef<(THREE.Group | null)[]>([]);
  const roleLabels = useRef<(THREE.Mesh | null)[]>([]);
  const permLabels = useRef<(THREE.Mesh | null)[]>([]);
  const tubes = useRef<(THREE.Mesh | null)[]>([]);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const resource = useRef<THREE.Group>(null);
  const blocker = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const permCol = useMemo(() => NODES.map((n) => new THREE.Color(n.color)), []);

  useFrame(({ clock }) => {
    const s = state.shared;
    const t = clock.elapsedTime;

    if (core.current) {
      core.current.scale.setScalar(backOut(s.core) * 0.95);
      core.current.visible = s.core > 0.001;
    }
    if (coreSpin.current) coreSpin.current.rotation.z = t * 0.35 + s.transfer * Math.PI * 2;

    // Where is the shared resource? (used for arrival pulses)
    const travel = range(s.transfer, 0.05, 0.95);
    if (resource.current) {
      resource.current.visible = s.transfer > 0.01 && s.transfer < 0.995;
      route.getPointAt(travel, tmp);
      resource.current.position.copy(tmp);
      resource.current.rotation.set(t * 1.2, t * 1.6, 0);
    }

    NODES.forEach((n, i) => {
      const g = nodes.current[i];
      const appear = easeOut(stagger(s.nodes, i, NODES.length, 0.5));
      if (g) {
        g.visible = appear > 0.001;
        const arrive = n.allowed && resource.current?.visible ? Math.max(0, 1 - g.position.distanceTo(tmp) / 0.9) : 0;
        g.position.set(n.pos[0], n.pos[1] - (1 - appear) * 1.5, n.pos[2]);
        g.scale.setScalar(backOut(appear) * (1 + arrive * 0.35));
      }
      const cg = cardRefs.current[i];
      if (cg) {
        cg.rotation.y = Math.sin(t * 0.6 + i * 1.3) * 0.35;
        cg.position.y = Math.sin(t * 0.9 + i) * 0.03;
      }
      // Ring: neutral blue → permission colour once permissions resolve.
      const p = range(s.perms, i * 0.08, 0.5 + i * 0.08);
      col.copy(COLORS.blue).lerp(permCol[i], p).multiplyScalar(0.6 + p * 0.9);
      res.ringMats[i].color.copy(col);

      fadeGroup(roleLabels.current[i], range(appear, 0.6, 1));
      fadeGroup(permLabels.current[i], easeOut(p));

      // Connections draw outward from the core.
      const tube = tubes.current[i];
      if (tube) {
        const l = n.allowed ? stagger(s.links, i, NODES.length, 0.4) : range(s.perms, 0.3, 0.8);
        const tris = Math.floor(TUBE_SEG * l) * TUBE_RAD * 6;
        tube.geometry.setDrawRange(0, tris);
        tube.visible = tris > 0;
      }
      const pulse = pulses.current[i];
      if (pulse && n.allowed) {
        pulse.visible = s.links > 0.98;
        if (pulse.visible) curves[i].getPoint((t * 0.35 + i * 0.21) % 1, pulse.position);
      }
    });

    if (blocker.current) {
      const b = range(s.perms, 0.6, 1);
      blocker.current.visible = b > 0.01;
      curves[NODES.length - 1].getPoint(1, blocker.current.position);
      blocker.current.scale.setScalar(backOut(b) * (1 + Math.sin(t * 4) * 0.08));
    }
  });

  return (
    <group>
      <SharedRoom />

      <group ref={core} position={[0, 0, 0]} visible={false}>
        <VaultCore spinRef={coreSpin} position={[0, 1.1, 0]} />
      </group>

      {NODES.map((n, i) => (
        <group key={`${n.role}-${i}`}>
          {/* Access puck on the table (or floor) with a light stem up to the token */}
          <group position={[n.pos[0], n.ground ? SH_FLOOR_Y : TABLE_TOP, n.pos[2]]}>
            <mesh geometry={res.puckGeo} material={mat.metalDark} position={[0, 0.03, 0]} />
            <mesh geometry={res.puckRing} material={res.ringMats[i]} position={[0, 0.062, 0]} rotation={[Math.PI / 2, 0, 0]} />
            <mesh
              geometry={geo.cyl}
              material={res.ringMats[i]}
              position={[0, (n.pos[1] - (n.ground ? SH_FLOOR_Y : TABLE_TOP)) / 2, 0]}
              scale={[0.008, n.pos[1] - (n.ground ? SH_FLOOR_Y : TABLE_TOP), 0.008]}
            />
          </group>
          <group ref={(el) => void (nodes.current[i] = el)} position={n.pos} visible={false}>
            <group ref={(el) => void (cardRefs.current[i] = el)} rotation={[-0.75, 0, 0]} scale={2.1}>
              <mesh geometry={res.cardGeo} material={res.cardEdge} />
              <mesh geometry={geo.plane} material={res.cardFace} position={[0, 0, 0.0125]} scale={[0.5, 0.31, 1]} {...FOCUS} />
              <mesh geometry={res.stripGeo} material={res.ringMats[i]} position={[0, -0.145, 0.002]} />
            </group>
          </group>
          <Label
            ref={(el) => void (roleLabels.current[i] = el)}
            text={n.role}
            color={n.allowed ? UI.blue : UI.red}
            width={2.2}
            position={[n.pos[0], n.pos[1] + 1.05, n.pos[2]]}
            visible={false}
          />
          <Label
            ref={(el) => void (permLabels.current[i] = el)}
            text={n.perm}
            color={n.color}
            width={2.0}
            position={[n.pos[0], n.pos[1] - 0.68, n.pos[2]]}
            visible={false}
          />
          <mesh
            ref={(el) => void (tubes.current[i] = el)}
            geometry={res.tubes[i]}
            material={n.allowed ? res.linkMat : res.deniedMat}
            visible={false}
          />
          {n.allowed && <mesh ref={(el) => void (pulses.current[i] = el)} geometry={geo.sphere} material={res.pulseMat} scale={0.05} visible={false} />}
        </group>
      ))}

      {/* Access denied: the link to a non-member stops short */}
      <mesh ref={blocker} geometry={res.blockGeo} material={res.deniedMat} visible={false} />

      {/* Shared encrypted resource */}
      <group ref={resource} visible={false}>
        <mesh geometry={geo.octa} material={res.resourceMat} scale={0.2} />
        <mesh geometry={res.ringGeo} material={res.resourceMat} scale={0.6} rotation={[Math.PI / 2, 0, 0]} />
        <GlowSprite color="#5bb8cc" scale={1.6} opacity={0.5} />
      </group>
    </group>
  );
}
