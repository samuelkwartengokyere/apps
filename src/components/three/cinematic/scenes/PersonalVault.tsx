"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { backOut, easeInOut, easeOut, hash, lerp, range, stagger } from "../kit/math";
import { COLORS, Label, S, VaultCore, fadeGroup, screenMaterial, useDisposables } from "../kit/parts";
import { type CardSpec, UI, cardTexture, panelTexture } from "../kit/textures";
import { DOOR_HALF, SteelSafe, safeFaceZ } from "../../vaultModels";
import { PersonalRoom, SafeHardware } from "./PersonalRoom";

const SAFE = { width: 2.4, height: 2.2, depth: 1.8 };
/** Combination dial (VaultCore) at 0.55 scale sits on the safe's front face. */
const DIAL_SCALE = 0.55;

type Category = { name: string; color: string; x: number };
const CATS: Category[] = [
  { name: "Logins", color: UI.cyan, x: -3.9 },
  { name: "Wi-Fi", color: UI.blue, x: -2.2 },
  { name: "Identity", color: UI.violet, x: 2.2 },
  { name: "Payments", color: UI.amber, x: 3.9 },
];

// Fictional sample records only.
const CARDS: (Omit<CardSpec, "accent" | "category"> & { cat: number })[] = [
  { title: "Mail", user: "alex@example.com", field: "••••••••••••", cat: 0 },
  { title: "Bank (demo)", user: "alex.rivera", field: "••••••••••", cat: 0 },
  { title: "Cloud drive", user: "alex@example.com", field: "•••••••••••••", cat: 0 },
  { title: "Streaming", user: "family@example.com", field: "•••••••••", cat: 0 },
  { title: "Home Wi-Fi", user: "SSID · Sunflower-5G", field: "••••••••••••", cat: 1 },
  { title: "Studio Wi-Fi", user: "SSID · Studio-Guest", field: "••••••••", cat: 1 },
  { title: "Passport", user: "Sample record", field: "No. X0000000", cat: 2 },
  { title: "Driver licence", user: "Sample record", field: "•••• •••• 00", cat: 2 },
  { title: "Travel card", user: "Alex Rivera", field: "•••• •••• •••• 0000", cat: 3 },
  { title: "Shop account", user: "alex@example.com", field: "••••••••••", cat: 3 },
];

const CARD_W = 1.5;
const CARD_H = CARD_W * (320 / 512);

export default function PersonalVault() {
  const { state } = useCine();
  const { geo } = S();

  const layout = useMemo(() => {
    const perCat = CATS.map(() => 0);
    return CARDS.map((c, i) => {
      const slot = perCat[c.cat]++;
      const ang = (i / CARDS.length) * Math.PI * 2 + 0.3;
      const sa = hash(i) * Math.PI * 2;
      const sr = 9 + hash(i + 11) * 4;
      return {
        scatter: new THREE.Vector3(Math.cos(sa) * sr, -1 + hash(i + 3) * 5, -5 - hash(i + 7) * 8),
        scatterRot: new THREE.Euler(hash(i + 1) * 2 - 1, hash(i + 2) * 3 - 1.5, hash(i + 4) - 0.5),
        cloudAngle: ang,
        cloudY: 0.3 + Math.sin(i * 1.3) * 0.95,
        slot: new THREE.Vector3(CATS[c.cat].x, 1.35 - slot * 0.6, 0.3 + slot * 0.32),
      };
    });
  }, []);

  const res = useDisposables(() => {
    return {
    scanGeo: new THREE.TorusGeometry(1.3, 0.015, 6, 6),
    scanMat: new THREE.MeshBasicMaterial({ color: COLORS.cyan.clone().multiplyScalar(1.4), toneMapped: false, transparent: true }),
    cardMats: CARDS.map((c) => screenMaterial(cardTexture({ ...c, category: CATS[c.cat].name, accent: CATS[c.cat].color }), THREE.DoubleSide)),
    notesMat: screenMaterial(panelTexture("notes", {
          title: "Secure note",
          badge: ["ENCRYPTED", UI.cyan],
          rows: [
            ["Title", "Spare key location"],
            ["Note", "•••••••••••••••••"],
            ["Tags", "home, family"],
            ["Edited", "2 days ago · sample"],
          ],
        })),
    recoveryMat: screenMaterial(panelTexture("recovery", {
          title: "Recovery codes",
          badge: ["SAMPLE", UI.amber],
          accent: UI.amber,
          mono: true,
          rows: [
            ["01", "4F7K-••••-••••"],
            ["02", "9QW2-••••-••••"],
            ["03", "M8DX-••••-••••"],
            ["Kit", "Store offline", UI.amber],
          ],
        })),
    identityMat: screenMaterial(panelTexture("identity", {
          title: "Personal information",
          badge: ["MASKED", UI.violet],
          accent: UI.violet,
          rows: [
            ["Name", "Alex Rivera (sample)"],
            ["Address", "••••••••••••"],
            ["Phone", "•••• ••• 0199"],
          ],
        })),
    };
  });

  const vault = useRef<THREE.Group>(null);
  const shell = useRef<THREE.Group>(null);
  const scan = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Group>(null);
  const coreSpin = useRef<THREE.Group>(null);
  const room = useRef<THREE.Group>(null);
  const cards = useRef<(THREE.Mesh | null)[]>([]);
  const catLabels = useRef<(THREE.Mesh | null)[]>([]);
  const notes = useRef<THREE.Mesh>(null);
  const recovery = useRef<THREE.Mesh>(null);
  const identity = useRef<THREE.Mesh>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmp2 = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const p = state.personal;
    const t = clock.elapsedTime;

    fadeGroup(room.current, p.room);

    // Steel safe: the body rises out of the pedestal while a scan ring sweeps
    // upward; the combination dial switches on last.
    const g = p.glass;
    if (vault.current) vault.current.visible = g > 0.001;
    if (shell.current) shell.current.scale.set(1, lerp(0.02, 1, easeOut(range(g, 0, 0.55))), 1);
    if (scan.current) {
      const s = range(g, 0.05, 0.85);
      scan.current.visible = s > 0 && s < 1;
      scan.current.position.y = lerp(-1.1, 1.1, s);
    }
    if (core.current) core.current.scale.setScalar(DIAL_SCALE * backOut(range(g, 0.55, 1)));
    if (coreSpin.current) coreSpin.current.rotation.z = t * 0.4 + p.organize * Math.PI;

    // Cards: darkness → orbit → filed by category.
    for (let i = 0; i < CARDS.length; i++) {
      const m = cards.current[i];
      if (!m) continue;
      const L = layout[i];
      const arrive = easeOut(stagger(p.cards, i, CARDS.length, 0.45));
      const file = easeInOut(stagger(p.organize, i, CARDS.length, 0.35));
      const ang = L.cloudAngle + t * 0.06 * (1 - file);
      tmp.set(Math.cos(ang) * 3.6, L.cloudY + Math.sin(t * 0.8 + i) * 0.06, Math.sin(ang) * 1.7 + 0.2);
      tmp2.copy(L.scatter).lerp(tmp, arrive);
      tmp2.lerp(L.slot, file);
      m.position.copy(tmp2);
      m.rotation.set(L.scatterRot.x * (1 - arrive), L.scatterRot.y * (1 - arrive) - tmp2.x * 0.05 * (1 - file), L.scatterRot.z * (1 - arrive));
      const s = lerp(0.6, 1, arrive);
      m.scale.set(CARD_W * s, CARD_H * s, 1);
      fadeGroup(m, arrive);
    }
    catLabels.current.forEach((l, k) => {
      if (!l) return;
      const v = easeOut(range(p.organize, 0.4 + k * 0.1, 0.8 + k * 0.05));
      l.position.y = 2.15 + (1 - v) * 0.3;
      fadeGroup(l, v);
    });

    // Interfaces unfold horizontally (like a panel being opened).
    const unfold = (m: THREE.Mesh | null, v: number, w: number, h: number) => {
      if (!m) return;
      const e = easeOut(v);
      m.scale.set(w * Math.max(e, 0.001), h * lerp(0.2, 1, e), 1);
      fadeGroup(m, Math.min(1, v * 1.6));
    };
    unfold(notes.current, p.notes, 2.5, 1.64);
    unfold(identity.current, range(p.panels, 0, 0.7), 2.3, 1.1);
    unfold(recovery.current, range(p.panels, 0.3, 1), 2.5, 1.64);
  });

  return (
    <group>
      <group ref={room} position={[0, 0, 0]}>
        <PersonalRoom />
      </group>

      {/* Central steel safe */}
      <group ref={vault} position={[0, 0, 0]}>
        {/* Pivot at the base so the safe grows up out of the pedestal */}
        <group ref={shell} position={[0, -1.1, 0]}>
          <SteelSafe width={SAFE.width} height={SAFE.height} depth={SAFE.depth} position={[0, 1.1, 0]} />
          <group position={[0, 1.1, 0]}>
            <SafeHardware width={SAFE.width} height={SAFE.height} faceZ={safeFaceZ(SAFE.depth)} />
          </group>
        </group>
        <mesh ref={scan} geometry={res.scanGeo} material={res.scanMat} rotation={[Math.PI / 2, 0, Math.PI / 6]} />
        {/* Dial sits on the front face: its back edge touches the plate */}
        <VaultCore ref={core} spinRef={coreSpin} position={[0, 0.05, safeFaceZ(SAFE.depth) + DOOR_HALF * DIAL_SCALE]} scale={0.001} />
      </group>

      {CARDS.map((c, i) => (
        <mesh
          key={c.title}
          ref={(el) => void (cards.current[i] = el)}
          geometry={geo.plane}
          material={res.cardMats[i]}
          scale={[CARD_W, CARD_H, 1]}
          visible={false}
          {...FOCUS}
        />
      ))}
      {CATS.map((c, k) => (
        <Label key={c.name} ref={(el) => void (catLabels.current[k] = el)} text={c.name} color={c.color} width={1.25} position={[c.x, 2.15, 0.3]} visible={false} />
      ))}

      <mesh ref={notes} geometry={geo.plane} material={res.notesMat} position={[-3.05, 3.5, -1.4]} rotation={[0, 0.22, 0]} visible={false} {...FOCUS} />
      <mesh ref={identity} geometry={geo.plane} material={res.identityMat} position={[0, 3.05, -2.3]} visible={false} {...FOCUS} />
      <mesh ref={recovery} geometry={geo.plane} material={res.recoveryMat} position={[3.05, 3.5, -1.4]} rotation={[0, -0.22, 0]} visible={false} {...FOCUS} />
    </group>
  );
}
