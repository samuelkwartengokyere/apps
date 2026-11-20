"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { FOCUS } from "../kit/focus";
import { backOut, easeInOut, easeOut, hash, lerp, range } from "../kit/math";
import { COLORS, GlowSprite, KeyModel, Label, S, fadeGroup, screenMaterial, useDisposables } from "../kit/parts";
import { UI, canvasTexture, font, panelTexture, roundRect, serverRackTexture } from "../kit/textures";
import { RACK_TOP_Y, ZK_FLOOR_Y, ZkRoom } from "./ZkRoom";

/*
 * Conceptual illustration of client-side encryption. The readable sample only
 * ever exists on the device side; the server side only ever shows ciphertext.
 * It is not a depiction of SecureVault's actual cryptographic implementation.
 */

const DEVICE = new THREE.Vector3(-6, 0, 0);
const SERVER = new THREE.Vector3(6, 0, 0);
const CARD_POS = new THREE.Vector3(-6, 1.95, 0.35);
const PACKET_START = new THREE.Vector3(-6, 1.7, 0.4);
const PACKET_END = new THREE.Vector3(6, 1.0, 0.4);
const PATH = new THREE.QuadraticBezierCurve3(PACKET_START, new THREE.Vector3(0, 3.6, 0.6), PACKET_END);

const dummy = new THREE.Object3D();
const col = new THREE.Color();
const PLAIN = new THREE.Color("#f8fafc");
const CIPHER = COLORS.cyan.clone().multiplyScalar(1.3);

function sampleTexture() {
  return canvasTexture("zk-sample", 512, 300, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    roundRect(ctx, 4, 4, w - 8, h - 8, 24);
    ctx.fillStyle = "rgba(248,250,252,0.96)";
    ctx.fill();
    ctx.fillStyle = "#0d1b2a";
    ctx.font = font(26, 600);
    ctx.fillText("Wi-Fi password", 32, 62);
    ctx.fillStyle = "#475569";
    ctx.font = font(20, 500, true);
    ctx.fillText("SAMPLE · plaintext on this device", 32, 96);
    roundRect(ctx, 32, 128, w - 64, 84, 14);
    ctx.fillStyle = "#e2e8f0";
    ctx.fill();
    ctx.fillStyle = "#0d1b2a";
    ctx.font = font(38, 600, true);
    ctx.fillText("sunflower-42", 56, 184);
    ctx.fillStyle = "#2563eb";
    ctx.font = font(20, 600);
    ctx.fillText("Encrypting before upload…", 32, 256);
  });
}

function screenTexture() {
  return canvasTexture("zk-screen", 512, 320, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0d2238");
    g.addColorStop(1, "#07111f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(108,196,214,0.6)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(w / 2, 130, 46, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#6cc4d6";
    ctx.beginPath();
    ctx.arc(w / 2, 122, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(w / 2 - 5, 126, 10, 26);
    ctx.textAlign = "center";
    ctx.fillStyle = "#f8fafc";
    ctx.font = font(28, 600);
    ctx.fillText("Vault unlocked", w / 2, 222);
    ctx.fillStyle = "#94a3b8";
    ctx.font = font(20, 500);
    ctx.fillText("key material stays on this device", w / 2, 258);
  });
}

export default function ZeroKnowledge() {
  const { state, quality } = useCine();
  const { geo, mat } = S();
  const cols = quality.compact ? 6 : 8;
  const rows = quality.compact ? 4 : 5;
  const count = cols * rows;

  const cubes = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const c = i % cols;
        const r = Math.floor(i / cols);
        const grid = new THREE.Vector3(CARD_POS.x + (c - (cols - 1) / 2) * 0.24, CARD_POS.y + ((rows - 1) / 2 - r) * 0.22, CARD_POS.z + 0.02);
        const scatter = grid
          .clone()
          .add(new THREE.Vector3((hash(i) - 0.5) * 1.6, (hash(i + 9) - 0.5) * 1.2, (hash(i + 17) - 0.3) * 1.4));
        const pack = new THREE.Vector3((i % 4) - 1.5, (Math.floor(i / 4) % 4) - 1.5, Math.floor(i / 16) - 1).multiplyScalar(0.11);
        return { grid, scatter, pack, spin: new THREE.Euler(hash(i + 3) * 6, hash(i + 5) * 6, hash(i + 7) * 6) };
      }),
    [count, cols, rows],
  );

  const res = useDisposables(() => {
    const zone = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-9.2, -1.63, -2.4),
      new THREE.Vector3(-2.8, -1.63, -2.4),
      new THREE.Vector3(-2.8, -1.63, 2.6),
      new THREE.Vector3(-9.2, -1.63, 2.6),
      new THREE.Vector3(-9.2, -1.63, -2.4),
    ]);
    return {
      zone,
      zoneMat: new THREE.LineDashedMaterial({ color: "#5bb8cc", dashSize: 0.25, gapSize: 0.18, transparent: true, opacity: 0 }),
      baseGeo: new THREE.BoxGeometry(2.4, 0.08, 1.6),
      screenGeo: new THREE.BoxGeometry(2.4, 1.5, 0.05),
      screenMat: screenMaterial(screenTexture()),
      sampleMat: screenMaterial(sampleTexture()),
      cubeMat: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      tube: new THREE.TubeGeometry(PATH, 64, 0.03, 6, false),
      tubeMat: new THREE.MeshBasicMaterial({ toneMapped: false }),
      pulseMat: new THREE.MeshBasicMaterial({ color: COLORS.sky.clone().multiplyScalar(1.5), toneMapped: false }),
      ledMat: new THREE.MeshBasicMaterial({ map: serverRackTexture(0, true), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }),
      displayMat: screenMaterial(
        panelTexture("zk-server", {
          title: "Stored record",
          badge: ["CIPHERTEXT", UI.cyan],
          mono: true,
          rows: [
            ["id", "rec_7f2c"],
            ["data", "9f3a1c…e04b"],
            ["key", "not stored", UI.amber],
            ["plaintext", "not available", UI.amber],
          ],
        }),
      ),
    };
  });

  const zoneLine = useMemo(() => new THREE.Line(res.zone, res.zoneMat), [res]);
  const device = useRef<THREE.Group>(null);
  const screen = useRef<THREE.Group>(null);
  const key = useRef<THREE.Group>(null);
  const sample = useRef<THREE.Mesh>(null);
  const instanced = useRef<THREE.InstancedMesh>(null);
  const tube = useRef<THREE.Mesh>(null);
  const pulses = useRef<(THREE.Mesh | null)[]>([]);
  const display = useRef<THREE.Mesh>(null);
  const cipherLabel = useRef<THREE.Mesh>(null);
  const labels = useRef<(THREE.Mesh | null)[]>([]);
  const steps = useRef<(THREE.Mesh | null)[]>([]);
  const packetGlow = useRef<THREE.Sprite>(null);
  const center = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);

  useLayoutEffect(() => {
    zoneLine.computeLineDistances();
    const im = instanced.current;
    if (!im) return;
    for (let i = 0; i < count; i++) im.setColorAt(i, PLAIN);
  }, [count, zoneLine]);

  useFrame(({ clock }) => {
    const z = state.zk;
    const t = clock.elapsedTime;

    // 1. Device materialises; the laptop lid opens.
    const dv = easeOut(z.device);
    if (device.current) {
      device.current.visible = dv > 0.001;
      device.current.scale.setScalar(backOut(dv));
    }
    if (screen.current) screen.current.rotation.x = lerp(Math.PI / 2, -0.22, easeInOut(range(z.device, 0.3, 1)));
    if (key.current) {
      const k = range(z.device, 0.5, 1);
      key.current.visible = k > 0.001;
      key.current.scale.setScalar(backOut(k) * 1.2);
      key.current.rotation.y = t * 0.8;
    }
    res.zoneMat.opacity = range(z.device, 0.4, 1) * 0.7;
    fadeGroup(labels.current[0], range(z.device, 0.6, 1));

    // 2. Readable sample appears (device side only) …
    // 3. … dissolves into blocks that scramble and pack into ciphertext.
    const e = z.encrypt;
    if (sample.current) {
      const v = easeOut(z.data) * (1 - range(e, 0.05, 0.4));
      sample.current.scale.set(1.95 * Math.max(easeOut(z.data), 0.001), 1.14, 1);
      fadeGroup(sample.current, v);
    }

    const travel = easeInOut(z.travel);
    PATH.getPoint(travel, center);
    const absorb = range(z.receive, 0, 0.6);
    const im = instanced.current;
    if (im) {
      const showCubes = e > 0.05 && absorb < 1;
      im.visible = showCubes;
      if (showCubes) {
        const scramble = easeInOut(range(e, 0.2, 0.6));
        const pack = easeInOut(range(e, 0.55, 1));
        const tint = range(e, 0.15, 0.5);
        for (let i = 0; i < count; i++) {
          const c = cubes[i];
          p.copy(c.grid).lerp(c.scatter, scramble);
          // packed cluster rides along the connection
          dummy.position.copy(c.pack).applyAxisAngle(THREE.Object3D.DEFAULT_UP, t * 1.4 * pack).add(center);
          p.lerp(dummy.position, pack);
          dummy.position.copy(p);
          dummy.rotation.set(c.spin.x * scramble, c.spin.y * scramble, c.spin.z * scramble);
          const s = range(e, 0.02 + (i / count) * 0.15, 0.2 + (i / count) * 0.15) * (1 - absorb) * lerp(0.2, 0.1, pack);
          dummy.scale.setScalar(s);
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
          col.copy(PLAIN).lerp(CIPHER, Math.min(1, tint + hash(i) * 0.3));
          im.setColorAt(i, col);
        }
        im.instanceMatrix.needsUpdate = true;
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
      }
    }
    if (packetGlow.current) {
      packetGlow.current.position.copy(center);
      const g = range(e, 0.6, 1) * (1 - absorb);
      (packetGlow.current.material as THREE.SpriteMaterial).opacity = g * 0.9;
      packetGlow.current.visible = g > 0.01;
    }

    // 4. Ciphertext travels the connection.
    res.tubeMat.color.copy(COLORS.blue).lerp(COLORS.cyan, z.travel).multiplyScalar(0.4 + z.travel * (1 - z.receive) * 0.9 + z.reveal * 0.4);
    if (tube.current) tube.current.visible = z.device > 0.2;
    pulses.current.forEach((m, i) => {
      if (!m) return;
      m.visible = z.reveal > 0.05;
      PATH.getPoint((t * 0.25 + i / 3) % 1, m.position);
    });
    if (cipherLabel.current) {
      const v = range(z.travel, 0.05, 0.25) * (1 - range(z.travel, 0.85, 1));
      cipherLabel.current.position.set(center.x, center.y + 0.6, center.z);
      fadeGroup(cipherLabel.current, v);
    }
    fadeGroup(labels.current[1], range(z.travel, 0.2, 0.6));

    // 5. Server receives the ciphertext — and only ever displays ciphertext.
    const blink = z.receive > 0 && z.receive < 1 ? 0.6 + 0.4 * Math.sin(t * 18) : 1;
    res.ledMat.color.copy(COLORS.blue).lerp(COLORS.cyan, z.receive).multiplyScalar((0.5 + z.receive * 0.9) * blink);
    if (display.current) {
      const v = easeOut(range(z.receive, 0.35, 1));
      display.current.scale.set(2.3 * Math.max(v, 0.001), 1.51 * lerp(0.15, 1, v), 1);
      fadeGroup(display.current, v);
    }
    fadeGroup(labels.current[2], range(z.device, 0.6, 1));

    // 6. Pull back: the three stages are labelled.
    steps.current.forEach((s, i) => fadeGroup(s, range(z.reveal, i * 0.2, 0.5 + i * 0.2)));
  });

  return (
    <group>
      <ZkRoom ledMat={res.ledMat} />

      {/* Trusted device boundary */}
      <primitive object={zoneLine} />

      <group ref={device} position={DEVICE.toArray()} visible={false}>
        <mesh geometry={res.baseGeo} material={mat.metal} position={[0, -0.45, 0.2]} />
        <group ref={screen} position={[0, -0.41, -0.6]}>
          <mesh geometry={res.screenGeo} material={mat.metalDark} position={[0, 0.75, 0]} />
          <mesh geometry={geo.plane} material={res.screenMat} position={[0, 0.75, 0.03]} scale={[2.25, 1.38, 1]} {...FOCUS} />
        </group>
        <GlowSprite color="#3b6fa8" position={[0, 0.4, -0.4]} scale={4} opacity={0.25} />
      </group>
      <group ref={key} position={[-8.1, 0.7, 0.8]} visible={false}>
        <KeyModel />
      </group>
      <mesh ref={sample} geometry={geo.plane} material={res.sampleMat} position={CARD_POS.toArray()} visible={false} {...FOCUS} />

      <instancedMesh ref={instanced} args={[geo.box, res.cubeMat, count]} frustumCulled={false} visible={false} />
      <GlowSprite ref={packetGlow} color="#5bb8cc" scale={1.8} opacity={0} />
      <Label ref={cipherLabel} text="a9f3 … c2e1" sub="ciphertext in transit" width={1.6} visible={false} />

      <mesh ref={tube} geometry={res.tube} material={res.tubeMat} visible={false} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => void (pulses.current[i] = el)} geometry={geo.sphere} material={res.pulseMat} scale={0.06} visible={false} />
      ))}

      <mesh ref={display} geometry={geo.plane} material={res.displayMat} position={[6, RACK_TOP_Y + 0.9, -0.2]} visible={false} {...FOCUS} />

      <Label ref={(el) => void (labels.current[0] = el)} text="Your device" sub="key derived locally" width={1.7} position={[-6, ZK_FLOOR_Y + 0.5, 4.4]} visible={false} />
      <Label ref={(el) => void (labels.current[1] = el)} text="Encrypted connection" sub="only ciphertext travels" width={1.9} position={[0, 0.4, 0.6]} visible={false} />
      <Label ref={(el) => void (labels.current[2] = el)} text="SecureVault service" sub="stores ciphertext only" width={1.9} position={[6, ZK_FLOOR_Y + 0.5, 2.2]} visible={false} />

      {["1 · Encrypt on your device", "2 · Send ciphertext", "3 · Store ciphertext only"].map((s, i) => (
        <Label key={s} ref={(el) => void (steps.current[i] = el)} text={s} color={UI.cyan} width={2.4} position={[-6 + i * 6, 3.2, 0]} visible={false} />
      ))}
    </group>
  );
}
