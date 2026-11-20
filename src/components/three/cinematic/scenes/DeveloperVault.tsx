"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { backOut, easeInOut, easeOut, lerp, range, stagger } from "../kit/math";
import { COLORS, KeyModel, Label, S, fadeGroup, fadeable, screenMaterial, useDisposables } from "../kit/parts";
import { UI, brushedRoughness, canvasTexture, codeTexture, font, roundRect } from "../kit/textures";
import { SteelSafe, safeFaceZ } from "../../vaultModels";
import { DeveloperRoom } from "./DeveloperRoom";
import { SafeHardware } from "./PersonalRoom";

const RACK = { x: 0, y: -0.3, z: -2.2, width: 4.1, height: 2.4, depth: 0.9 };

const V = UI.violet;
const G = UI.green;
const B = UI.blue;
const M = UI.muted;
const W = UI.ink;

// Fictional project files; every secret value is masked or a demo placeholder.
const CODE: { file: string; lines: [string, string][] }[] = [
  {
    file: "api/client.ts",
    lines: [
      ['import { createClient } from "./sdk";', V],
      ["const client = createClient({", W],
      ["  baseUrl: env.API_URL,", B],
      ['  apiKey: vault.get("PAYMENTS_API_KEY"),', G],
      ["});", W],
      ["// resolved at runtime, never committed", M],
    ],
  },
  {
    file: ".env.production",
    lines: [
      ["API_URL=https://api.example.com", B],
      ["PAYMENTS_API_KEY=••••••••••••", G],
      ["DATABASE_URL=••••••••••••••", G],
      ["FEATURE_FLAGS=checkout,v2", W],
      ["# sample values only", M],
    ],
  },
  {
    file: "deploy.yml",
    lines: [
      ["deploy:", V],
      ["  environment: production", W],
      ["  secrets:", V],
      ["    - DATABASE_URL", G],
      ["    - SSH_DEPLOY_KEY", G],
    ],
  },
  {
    file: "db/connect.ts",
    lines: [
      ["const pool = new Pool({", W],
      ["  connectionString:", B],
      ["    secrets.DATABASE_URL,", G],
      ["  ssl: true,", W],
      ["});", W],
    ],
  },
  {
    file: "~/.ssh/config",
    lines: [
      ["Host deploy.example.com", V],
      ["  User deploy", W],
      ["  IdentityFile ~/.ssh/id_demo", G],
      ["  IdentitiesOnly yes", W],
    ],
  },
  {
    file: "vault.json",
    lines: [
      ['{ "project": "my-project",', W],
      ['  "environments": [', B],
      ['    "development",', G],
      ['    "staging", "production"', G],
      ["  ] }", W],
    ],
  },
];

const KEYS = ["PAYMENTS_API_KEY", "MAPS_API_KEY", "EMAIL_API_KEY", "SEARCH_API_KEY"];

const ENV_ROWS: [string, string, string][] = [
  ["API_URL", "https://api.example.com", B],
  ["DATABASE_URL", "••••••••••••••", G],
  ["PAYMENTS_API_KEY", "demo_••••7f3a", G],
  ["LOG_LEVEL", "info", W],
];

function envHeaderTexture() {
  return canvasTexture("env-header", 640, 120, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 4, 4, w - 8, h - 8, 18);
    ctx.fillStyle = "rgba(18,38,58,0.94)";
    ctx.fill();
    ctx.fillStyle = W;
    ctx.font = font(24, 600);
    ctx.fillText("Environment variables · my-project", 24, 44);
    const tabs: [string, string][] = [
      ["Development", UI.green],
      ["Staging", UI.amber],
      ["Production", UI.red],
    ];
    let x = 24;
    ctx.font = font(18, 600, true);
    for (const [name, c] of tabs) {
      const tw = ctx.measureText(name).width + 22;
      roundRect(ctx, x, 64, tw, 34, 8);
      ctx.fillStyle = name === "Production" ? `${c}33` : "rgba(148,163,184,0.08)";
      ctx.fill();
      ctx.strokeStyle = `${c}aa`;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = c;
      ctx.fillText(name, x + 11, 87);
      x += tw + 10;
    }
  });
}

function envRowTexture(i: number) {
  const [k, v, c] = ENV_ROWS[i];
  return canvasTexture(`env-row-${i}`, 640, 72, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 4, 4, w - 8, h - 8, 12);
    ctx.fillStyle = "rgba(13,27,42,0.94)";
    ctx.fill();
    ctx.strokeStyle = "rgba(148,163,184,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = font(21, 600, true);
    ctx.fillStyle = M;
    ctx.fillText(k, 20, 44);
    ctx.fillStyle = c;
    ctx.textAlign = "right";
    ctx.fillText(v, w - 20, 44);
    ctx.textAlign = "left";
  });
}

const ENV_X = -2.7;
const CODE_W = 2.6;
const CODE_H = CODE_W * (400 / 640);
// Key tokens dock on the safe's front face (just in front of the steel plate).
const FACE_Z = RACK.z + safeFaceZ(RACK.depth) + 0.22;
const SLOTS = [-1.3, 0, 1.3].flatMap((x) => [new THREE.Vector3(x, 1.45, FACE_Z), new THREE.Vector3(x, 0.35, FACE_Z)]);

export default function DeveloperVault() {
  const { state } = useCine();
  const { geo, mat } = S();

  const panels = useMemo(
    () =>
      CODE.map((_, i) => {
        const a = THREE.MathUtils.degToRad(-62 + i * 24.8);
        return { pos: new THREE.Vector3(Math.sin(a) * 7.6, i % 2 ? 2.7 : 0.9, -Math.cos(a) * 7.6 + 1.5), rotY: -a };
      }),
    [],
  );
  const keyHome = useMemo(() => KEYS.map((_, i) => new THREE.Vector3(-2.25 + i * 1.5, 0.75, 1.6)), []);
  const sshHome = useMemo(() => new THREE.Vector3(2.6, 2.3, 1.6), []);
  const dbHome = useMemo(() => new THREE.Vector3(3.1, 0.3, 1.2), []);

  const res = useDisposables(() => ({
    codeMats: CODE.map((c) => screenMaterial(codeTexture(c.file, c.file, c.lines))),
    // A machined metal key token (not a glowing capsule) with one small status LED.
    capsuleGeo: new THREE.CylinderGeometry(0.2, 0.2, 0.62, 40),
    capsuleMat: fadeable(
      new THREE.MeshPhysicalMaterial({ color: "#c3cbd4", metalness: 1, roughness: 0.26, roughnessMap: brushedRoughness(), envMapIntensity: 1.4, transparent: true, opacity: 1 }),
      1,
    ),
    coreMat: new THREE.MeshBasicMaterial({ color: COLORS.green.clone().multiplyScalar(1), toneMapped: false }),
    headerMat: screenMaterial(envHeaderTexture()),
    rowMats: ENV_ROWS.map((_, i) => screenMaterial(envRowTexture(i))),
    keyMat: new THREE.MeshBasicMaterial({ color: COLORS.cyan.clone().multiplyScalar(1.1), toneMapped: false }),
    dbMat: new THREE.MeshStandardMaterial({ color: "#16314b", metalness: 0.9, roughness: 0.3, envMapIntensity: 1.6 }),
    doorMat: fadeable(new THREE.MeshPhysicalMaterial({ color: "#4b525b", metalness: 0.88, roughness: 0.52, roughnessMap: brushedRoughness(), envMapIntensity: 0.55 }), 1),
    dbRingGeo: new THREE.TorusGeometry(0.42, 0.02, 6, 48),
  }));

  const code = useRef<(THREE.Mesh | null)[]>([]);
  const caps = useRef<(THREE.Group | null)[]>([]);
  const capLabels = useRef<(THREE.Mesh | null)[]>([]);
  const header = useRef<THREE.Mesh>(null);
  const rows = useRef<(THREE.Mesh | null)[]>([]);
  const ssh = useRef<THREE.Group>(null);
  const db = useRef<THREE.Group>(null);
  const sideLabels = useRef<(THREE.Mesh | null)[]>([]);
  const rack = useRef<THREE.Group>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ clock }) => {
    const d = state.developer;
    const t = clock.elapsedTime;
    const collect = d.collect;

    // Code panels rise out of the floor into an arc.
    panels.forEach((p, i) => {
      const m = code.current[i];
      if (!m) return;
      const v = easeOut(stagger(d.code, i, panels.length, 0.5));
      m.position.set(p.pos.x, p.pos.y - (1 - v) * 3, p.pos.z);
      m.scale.set(CODE_W, CODE_H * lerp(0.3, 1, v), 1);
      fadeGroup(m, v * (1 - collect * 0.55));
    });

    // API key capsules materialise, then file into the rack.
    const place = (obj: THREE.Object3D, home: THREE.Vector3, appear: number, slot: number, spin: number) => {
      const c = easeInOut(stagger(collect, slot, SLOTS.length, 0.4));
      tmp.copy(home).lerp(SLOTS[slot], c);
      tmp.y += Math.sin(t * 1.1 + slot) * 0.05 * (1 - c);
      obj.position.copy(tmp);
      obj.scale.setScalar(backOut(appear) * lerp(1, 0.55, c));
      obj.rotation.y = spin * (1 - c);
      obj.visible = appear > 0.001;
      return c;
    };
    KEYS.forEach((_, i) => {
      const g = caps.current[i];
      if (!g) return;
      const a = stagger(d.keys, i, KEYS.length, 0.45);
      const c = place(g, keyHome[i], a, i, t * 0.6 + i);
      const l = capLabels.current[i];
      if (l) {
        l.position.set(keyHome[i].x, keyHome[i].y - 0.95, keyHome[i].z + 0.1);
        fadeGroup(l, range(a, 0.5, 1) * (1 - range(c, 0, 0.4)));
      }
    });
    if (ssh.current) place(ssh.current, sshHome, easeOut(range(d.ssh, 0, 0.7)), 4, t * 0.8);
    if (db.current) place(db.current, dbHome, easeOut(range(d.ssh, 0.25, 1)), 5, t * 0.3);
    sideLabels.current.forEach((l, k) => fadeGroup(l, range(d.ssh, 0.3 + k * 0.2, 0.8 + k * 0.2) * (1 - range(collect, 0, 0.3))));
    res.coreMat.color.copy(COLORS.green).multiplyScalar(0.8 + 0.8 * d.keys + collect * 0.8);

    // Environment panel assembles row by row from the left.
    if (header.current) {
      const v = easeOut(range(d.env, 0, 0.4));
      header.current.position.x = lerp(-5, ENV_X, v);
      fadeGroup(header.current, v * (1 - collect * 0.6));
    }
    ENV_ROWS.forEach((_, i) => {
      const m = rows.current[i];
      if (!m) return;
      const v = easeOut(range(d.env, 0.2 + i * 0.15, 0.55 + i * 0.15));
      m.position.x = lerp(-6, ENV_X, v);
      fadeGroup(m, v * (1 - collect * 0.6));
    });

    // Rack lights up as containers lock in.
    if (rack.current) {
      const v = easeOut(range(d.keys, 0, 1));
      rack.current.scale.set(1, v, 1);
      fadeGroup(rack.current, v);
    }
  });

  return (
    <group>
      <DeveloperRoom />

      {panels.map((p, i) => (
        <mesh
          key={CODE[i].file}
          ref={(el) => void (code.current[i] = el)}
          geometry={geo.plane}
          material={res.codeMats[i]}
          position={p.pos}
          rotation={[0, p.rotY, 0]}
          visible={false}
          {...FOCUS}
        />
      ))}

      {/* Encrypted developer vault: a steel safe, pivot at its base so it grows upward */}
      <group ref={rack} position={[RACK.x, RACK.y, RACK.z]}>
        <group position={[0, 1.2, 0]}>
          <SteelSafe width={RACK.width} height={RACK.height} depth={RACK.depth} />
          <SafeHardware width={RACK.width} height={RACK.height} faceZ={safeFaceZ(RACK.depth)} />
          <mesh geometry={geo.box} material={res.doorMat} position={[0, 0, safeFaceZ(RACK.depth) + 0.004]} scale={[RACK.width * 0.77, RACK.height * 0.74, 0.012]} />
          {/* Raised border rails break the door plate into a real door */}
          {[
            [0, RACK.height * 0.38, RACK.width * 0.8, 0.035],
            [0, -RACK.height * 0.38, RACK.width * 0.8, 0.035],
            [RACK.width * 0.4, 0, 0.035, RACK.height * 0.76],
            [-RACK.width * 0.4, 0, 0.035, RACK.height * 0.76],
          ].map(([x, y, w, h], i) => (
            <mesh key={i} geometry={geo.box} material={mat.metalDark} position={[x, y, safeFaceZ(RACK.depth) + 0.012]} scale={[w, h, 0.025]} />
          ))}
        </group>
      </group>

      {KEYS.map((k, i) => (
        <group key={k} ref={(el) => void (caps.current[i] = el)} visible={false}>
          <mesh geometry={res.capsuleGeo} material={res.capsuleMat} />
          <mesh geometry={geo.sphere} material={res.coreMat} position={[0, 0.33, 0]} scale={0.045} />
        </group>
      ))}
      {KEYS.map((k, i) => (
        <Label key={k} ref={(el) => void (capLabels.current[i] = el)} text={k} sub="demo_••••7f3a" color={UI.green} width={1.4} visible={false} />
      ))}

      <group ref={ssh} visible={false}>
        <KeyModel scale={1.5} />
      </group>
      <group ref={db} visible={false}>
        {[0, 0.36, 0.72].map((y) => (
          <group key={y} position={[0, y - 0.36, 0]}>
            <mesh geometry={geo.cylLow} material={res.dbMat} scale={[0.42, 0.28, 0.42]} />
            <mesh geometry={res.dbRingGeo} material={res.keyMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.15, 0]} />
          </group>
        ))}
      </group>
      <Label ref={(el) => void (sideLabels.current[0] = el)} text="SSH_DEPLOY_KEY" sub="ssh-ed25519 · demo" width={1.6} position={[2.6, 3.15, 1.65]} visible={false} />
      <Label ref={(el) => void (sideLabels.current[1] = el)} text="DATABASE_URL" sub="postgres · masked" color={UI.blue} width={1.6} position={[3.1, -0.45, 1.25]} visible={false} />

      {/* Environment variables panel (rows slide in individually) */}
      <group rotation={[0, 0.32, 0]} position={[0, 0, 2.2]} {...FOCUS}>
        <mesh ref={header} geometry={geo.plane} material={res.headerMat} position={[ENV_X, 2.55, 0]} scale={[2.9, 2.9 * (120 / 640), 1]} visible={false} />
        {ENV_ROWS.map((r, i) => (
          <mesh
            key={r[0]}
            ref={(el) => void (rows.current[i] = el)}
            geometry={geo.plane}
            material={res.rowMats[i]}
            position={[ENV_X, 1.95 - i * 0.4, 0]}
            scale={[2.9, 2.9 * (72 / 640), 1]}
            visible={false}
          />
        ))}
      </group>
    </group>
  );
}
