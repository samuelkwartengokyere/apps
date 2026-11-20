"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useCine } from "../kit/context";
import { easeInOut, lerp, range, stagger } from "../kit/math";
import { COLORS, GlowSprite, S, useDisposables } from "../kit/parts";
import { createBeamMaterial } from "../kit/shaders";
import { WaterFloor } from "../kit/WaterFloor";
import {
  brushedRoughness,
  dialRingTexture,
  emblemTexture,
  font,
  radialTexture,
  rimLightTexture,
  rockColorTexture,
  rockNormalTexture,
  roundRect,
} from "../kit/textures";

/*
 * The vault entrance: a heavy black-steel round door set into a cracked rock
 * wall. Locked, it is lit only by a red glow leaking from the gap around it.
 * Unlocking dials in the code on the keypad, turns the combination rings and
 * the spoke wheel, withdraws the lock bolts, and shifts the light to the
 * product cyan before the door swings open on its hinges.
 *
 * Coordinates: the door faces +Z, wall at z = 0, camera looks down -Z.
 * Door-local origin is the door's centre; its front face is at z ≈ 0.3.
 */

const DOOR_R = 3.05;
const HOLE_R = 3.35;
const HINGE_X = -3.7;
const OPEN_ANGLE = 1.78; // ~102°, swinging toward the camera
const FLOOR_Y = -3.62; // floor meets the underside of the frame
const GAP_R = 3.2; // the glowing ring in the gap between door and frame
const WALL_R = 34;
const ROCK_TILE = 6.8; // world units per repeat of the rock texture
const RIM_HALF = 8; // half-size of the glow plane on the wall
const DEG = Math.PI / 180;

/** Lock bolts sit on the latch side (right) and clear the hinge plate and the floor. */
const BOLT_ANGLES = [110, 80, 50, 20, -20, -50].map((d) => d * DEG);
const BOLTS = BOLT_ANGLES.length;
const SPOKES = 8;

const RED = new THREE.Color("#ff1a10");
const LOCKED = RED.clone().multiplyScalar(1.4);
const RELEASED = COLORS.cyan.clone().multiplyScalar(1.3);

/** Rivets along the door's outer band, skipping the hinge plate and the bolt clamps. */
const RIVETS = (() => {
  const out: [number, number][] = [];
  const n = 40;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    const x = Math.cos(a) * 2.88;
    const y = Math.sin(a) * 2.88;
    const underPlate = x < -2.3 || (x < -0.4 && Math.abs(y) > 1.55);
    const nearClamp = BOLT_ANGLES.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.15);
    if (!underPlate && !nearClamp) out.push([x, y]);
  }
  return out;
})();

/** Rivets on the frame ring, away from the bolt receivers. */
const FRAME_RIVETS = (() => {
  const out: [number, number][] = [];
  const n = 36;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    if (BOLT_ANGLES.some((b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b))) < 0.16)) continue;
    out.push([Math.cos(a) * 3.43, Math.sin(a) * 3.43]);
  }
  return out;
})();

/** Three notched steps: the dial rotates, pauses, rotates — like a combination lock. */
const notched = (s: number, steps = 3) => {
  const x = s * steps;
  const i = Math.min(Math.floor(x), steps - 1);
  return (i + easeInOut(Math.min(1, (x - i) * 1.25))) / steps;
};

const dummy = new THREE.Object3D();
const tmpColor = new THREE.Color();
const accent = new THREE.Color();

/** Door body: a stepped, bevelled disc — raised rim band, recessed channel, raised centre. */
function doorBodyGeometry(segs: number) {
  const profile: [number, number][] = [
    [0, -0.35],
    [3.0, -0.35],
    [3.05, -0.3],
    [3.05, 0.2],
    [2.99, 0.3],
    [2.64, 0.3],
    [2.6, 0.26],
    [2.58, 0.14],
    [1.97, 0.14],
    [1.93, 0.18],
    [1.93, 0.24],
    [0, 0.24],
  ];
  const g = new THREE.LatheGeometry(
    profile.map(([r, z]) => new THREE.Vector2(r, z)),
    segs,
  );
  g.rotateX(Math.PI / 2); // lathe axis Y → Z, so the door faces +Z
  return g;
}

/** The hinge-side plate: a "C" that wraps the dial area and reaches out to the hinge barrels. */
function hingePlateGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-3.75, 2.45);
  s.lineTo(-0.4, 2.45);
  s.lineTo(-0.4, 1.6);
  s.lineTo(-2.35, 1.6);
  s.lineTo(-2.35, -1.6);
  s.lineTo(-0.4, -1.6);
  s.lineTo(-0.4, -2.45);
  s.lineTo(-3.75, -2.45);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.03, bevelSegments: 2, curveSegments: 1 });
}

/** Keypad screen contents for the current stage of the unlock. */
function drawKeypad(ctx: CanvasRenderingContext2D, w: number, h: number, digits: number, granted: boolean) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "#060304";
  ctx.fillRect(0, 0, w, h);
  const col = granted ? "#5ee6ff" : "#ff3b2e";

  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  roundRect(ctx, 8, 8, w - 16, h - 16, 16);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.shadowColor = col;
  ctx.shadowBlur = 14;
  ctx.fillStyle = col;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.font = font(36, 700, true);
  const entry = Array.from({ length: 6 }, (_, i) => (granted || i < digits ? "•" : "-")).join(" ");
  ctx.fillText(entry, w / 2, h * 0.13);

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(28, h * 0.22, w - 56, 2);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 14;

  const lines = granted ? ["ACCESS", "GRANTED"] : digits > 0 ? ["VERIFYING", "ACCESS", "CODE"] : ["EARLY", "ACCESS", "CODE", "REQUIRED"];
  ctx.font = font(36, 700, true);
  lines.forEach((line, i) => ctx.fillText(line, w / 2, h * 0.34 + i * 58));
}

export default function VaultEntrance() {
  const { state, quality } = useCine();
  const { geo } = S();
  const segs = quality.compact ? 64 : 128;
  const fieldSize = quality.compact ? 256 : 1024;
  const rimSize = quality.compact ? 512 : 1024;

  const res = useDisposables(() => {
    const brushed = brushedRoughness();
    const rock = rockColorTexture(fieldSize, WALL_R * 2 / ROCK_TILE);
    const rockNormal = rockNormalTexture(fieldSize, (WALL_R * 2) / ROCK_TILE, quality.compact ? 9 : 22);
    const rim = rimLightTexture(rimSize, RIM_HALF, HOLE_R - 0.05, ROCK_TILE, fieldSize);

    const keypadCanvas = document.createElement("canvas");
    keypadCanvas.width = 288;
    keypadCanvas.height = 544;
    const keypadCtx = keypadCanvas.getContext("2d")!;
    drawKeypad(keypadCtx, 288, 544, 0, false);
    const keypadTex = new THREE.CanvasTexture(keypadCanvas);
    keypadTex.colorSpace = THREE.SRGBColorSpace;
    keypadTex.anisotropy = 4;

    const rodGeo = new THREE.CylinderGeometry(1, 1, 1, 18);
    rodGeo.rotateZ(Math.PI / 2); // unit-length rod along +X
    const headGeo = new THREE.CylinderGeometry(1, 1, 1, 14);
    headGeo.rotateX(Math.PI / 2);

    return {
      keypadCtx,
      keypadTex,

      // Rock wall, floor and light spill.
      wallGeo: new THREE.RingGeometry(HOLE_R, WALL_R, segs, 1),
      rimGeo: new THREE.PlaneGeometry(RIM_HALF * 2, RIM_HALF * 2),
      floorWashGeo: new THREE.PlaneGeometry(14, 10),
      // Soft contact shadow where the rock wall meets the floor, so the horizon isn't a hard line.
      contactGeo: new THREE.PlaneGeometry(60, 3.2),
      contactMat: new THREE.MeshBasicMaterial({
        map: (() => {
          const c = document.createElement("canvas");
          c.width = 4;
          c.height = 128;
          const g = c.getContext("2d")!;
          const grad = g.createLinearGradient(0, 0, 0, 128);
          grad.addColorStop(0, "rgba(3,6,12,0)");
          grad.addColorStop(0.6, "rgba(3,6,12,0.45)");
          grad.addColorStop(1, "rgba(3,6,12,0.85)");
          g.fillStyle = grad;
          g.fillRect(0, 0, 4, 128);
          const t = new THREE.CanvasTexture(c);
          t.colorSpace = THREE.SRGBColorSpace;
          return t;
        })(),
        toneMapped: false,
        transparent: true,
        depthWrite: false,
        fog: false,
      }),
      wallMat: new THREE.MeshStandardMaterial({
        color: "#5d5f64",
        map: rock,
        normalMap: rockNormal,
        normalScale: new THREE.Vector2(1.5, 1.5),
        roughness: 0.92,
        metalness: 0.05,
        envMapIntensity: 0.45,
      }),
      rimMat: new THREE.MeshBasicMaterial({ map: rim, toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),
      washMat: new THREE.MeshBasicMaterial({ map: radialTexture(), toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }),

      // Frame and jamb.
      jambGeo: new THREE.CylinderGeometry(HOLE_R, HOLE_R, 1.6, segs, 1, true),
      frameGeo: new THREE.TorusGeometry(HOLE_R + 0.08, 0.17, 16, segs),
      gapGeo: new THREE.TorusGeometry(GAP_R, 0.03, 8, segs),
      backGeo: new THREE.CircleGeometry(HOLE_R + 0.05, segs),
      beamGeo: new THREE.CylinderGeometry(6.2, HOLE_R - 0.1, 16, 48, 1, true),
      receiverGeo: new RoundedBoxGeometry(1, 1, 1, 2, 0.12),
      gapMat: new THREE.MeshBasicMaterial({ toneMapped: false }),
      backMat: new THREE.MeshBasicMaterial({ toneMapped: false, transparent: true, depthWrite: false }),
      indicatorMat: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      beamMat: createBeamMaterial("#7fb8d8"),
      jambMat: new THREE.MeshStandardMaterial({ color: "#14171c", metalness: 0.9, roughness: 0.45, side: THREE.DoubleSide, envMapIntensity: 0.8 }),

      // Door.
      bodyGeo: doorBodyGeometry(segs),
      edgeGeo: new THREE.TorusGeometry(DOOR_R + 0.015, 0.035, 8, segs),
      lipOuterGeo: new THREE.TorusGeometry(2.62, 0.032, 10, segs),
      lipMidGeo: new THREE.TorusGeometry(1.95, 0.03, 10, segs),
      lipInnerGeo: new THREE.TorusGeometry(1.03, 0.032, 10, segs),
      dialAGeo: new THREE.RingGeometry(1.02, 1.9, segs, 1),
      dialBGeo: new THREE.RingGeometry(1.97, 2.55, segs, 1),
      bossGeo: new THREE.CylinderGeometry(0.95, 1.0, 0.48, 56),
      bossRingGeo: new THREE.TorusGeometry(0.88, 0.045, 12, 64),
      bossLipGeo: new THREE.TorusGeometry(1.0, 0.04, 12, 64),
      emblemGeo: new THREE.CircleGeometry(0.8, 64),
      plateGeo: hingePlateGeometry(),
      barrelGeo: new THREE.CylinderGeometry(0.2, 0.2, 0.92, 28),
      barrelCapGeo: new THREE.TorusGeometry(0.2, 0.035, 8, 28),
      pinGeo: new THREE.CylinderGeometry(0.075, 0.075, 6.4, 14),
      leafGeo: new RoundedBoxGeometry(0.62, 1.0, 0.16, 2, 0.04),
      rodGeo,
      headGeo,
      rivetGeo: new THREE.SphereGeometry(1, 12, 8),

      // Black steel. Partly dielectric so flat faces keep some diffuse shading;
      // fully metallic surfaces go black wherever the studio has nothing to reflect.
      steel: new THREE.MeshPhysicalMaterial({ color: "#3b4048", metalness: 0.6, roughness: 0.44, roughnessMap: brushed, envMapIntensity: 1.1 }),
      steelDark: new THREE.MeshPhysicalMaterial({ color: "#262a30", metalness: 0.55, roughness: 0.5, roughnessMap: brushed, envMapIntensity: 1.0 }),
      steelMid: new THREE.MeshPhysicalMaterial({ color: "#5c636e", metalness: 0.7, roughness: 0.34, roughnessMap: brushed, envMapIntensity: 1.2 }),
      rod: new THREE.MeshPhysicalMaterial({ color: "#b3bbc5", metalness: 0.85, roughness: 0.26, envMapIntensity: 1.4 }),
      emblemMat: new THREE.MeshStandardMaterial({ map: emblemTexture(), metalness: 0.7, roughness: 0.4, envMapIntensity: 1.0 }),
      dialAMat: new THREE.MeshStandardMaterial({ map: dialRingTexture("inner", 1.02 / 1.9, 100, 10), metalness: 0.8, roughness: 0.4, envMapIntensity: 1.0 }),
      dialBMat: new THREE.MeshStandardMaterial({ map: dialRingTexture("outer", 1.97 / 2.55, 72, 6), metalness: 0.8, roughness: 0.4, envMapIntensity: 1.0 }),
      doorGlowMat: new THREE.MeshBasicMaterial({ toneMapped: false }),

      // Keypad.
      padGeo: new RoundedBoxGeometry(1.16, 2.0, 0.26, 4, 0.07),
      padInsetGeo: new RoundedBoxGeometry(1.0, 1.82, 0.05, 3, 0.03),
      padScreenGeo: new THREE.PlaneGeometry(0.9, 1.7),
      padScreenMat: new THREE.MeshBasicMaterial({ map: keypadTex, toneMapped: false }),
      padBlack: new THREE.MeshStandardMaterial({ color: "#050505", metalness: 0.4, roughness: 0.3 }),
    };
  });

  const pivot = useRef<THREE.Group>(null);
  const dialA = useRef<THREE.Mesh>(null);
  const dialB = useRef<THREE.Mesh>(null);
  const wheel = useRef<THREE.Group>(null);
  const bolts = useRef<THREE.InstancedMesh>(null);
  const lights = useRef<THREE.InstancedMesh>(null);
  const backGlow = useRef<THREE.Sprite>(null);
  const beam = useRef<THREE.Mesh>(null);
  const last = useRef(-1);
  const padKey = useRef(-1);

  // Static instance layouts.
  const rods = useRef<THREE.InstancedMesh>(null);
  const collars = useRef<THREE.InstancedMesh>(null);
  const clamps = useRef<THREE.InstancedMesh>(null);
  const receivers = useRef<THREE.InstancedMesh>(null);
  const rivets = useRef<THREE.InstancedMesh>(null);
  const frameRivets = useRef<THREE.InstancedMesh>(null);
  const plateHeads = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const put = (im: THREE.InstancedMesh | null, i: number, x: number, y: number, z: number, rz: number, sx: number, sy: number, sz: number) => {
      if (!im) return;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, rz);
      dummy.scale.set(sx, sy, sz);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    };

    // Spoke wheel: eight rods, each with two clamp collars and an end bracket.
    for (let k = 0; k < SPOKES; k++) {
      const a = (k / SPOKES) * Math.PI * 2;
      const c = Math.cos(a);
      const s = Math.sin(a);
      put(rods.current, k, c * 1.45, s * 1.45, 0.5, a, 1.5, 0.095, 0.095);
      put(collars.current, k * 3, c * 1.15, s * 1.15, 0.5, a, 0.26, 0.3, 0.3);
      put(collars.current, k * 3 + 1, c * 1.7, s * 1.7, 0.5, a, 0.2, 0.26, 0.26);
      put(collars.current, k * 3 + 2, c * 2.2, s * 2.2, 0.5, a, 0.24, 0.42, 0.28);
    }

    BOLT_ANGLES.forEach((a, i) => {
      put(clamps.current, i, Math.cos(a) * 2.8, Math.sin(a) * 2.8, 0.43, a, 0.42, 0.4, 0.3);
      put(receivers.current, i, Math.cos(a) * 3.8, Math.sin(a) * 3.8, 0.44, a, 0.55, 0.42, 0.4);
      // Seed instance colours before the first compile so the shader is built with them.
      lights.current?.setColorAt(i, LOCKED);
    });

    RIVETS.forEach(([x, y], i) => put(rivets.current, i, x, y, 0.3, 0, 0.065, 0.065, 0.04));
    FRAME_RIVETS.forEach(([x, y], i) => put(frameRivets.current, i, x, y, 0.17, 0, 0.06, 0.06, 0.04));
    [
      [-3.1, 2.05],
      [-3.1, -2.05],
      [-3.1, 1.0],
      [-3.1, -1.0],
      [-0.85, 2.05],
      [-0.85, -2.05],
    ].forEach(([x, y], i) => put(plateHeads.current, i, x, y, 0.335, 0, 0.1, 0.1, 0.06));

    for (const im of [rods, collars, clamps, receivers, rivets, frameRivets, plateHeads]) {
      if (im.current) im.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(({ clock }) => {
    const v = state.vault;
    const t = clock.elapsedTime;

    // Dials: notched combination-lock rotation, then the spoke wheel turns.
    if (dialA.current) dialA.current.rotation.z = notched(range(v.spin, 0, 0.7)) * -1.1 * Math.PI * 2;
    if (dialB.current) dialB.current.rotation.z = notched(range(v.spin, 0.1, 0.8)) * 0.75 * Math.PI * 2;
    if (wheel.current) wheel.current.rotation.z = easeInOut(range(v.spin, 0.45, 1)) * Math.PI * 2.25;

    // Bolts retract one after another.
    const key = Math.round(v.bolts * 1000);
    if (key !== last.current && bolts.current && lights.current) {
      last.current = key;
      for (let i = 0; i < BOLTS; i++) {
        const a = BOLT_ANGLES[i];
        const p = easeInOut(stagger(v.bolts, i, BOLTS, 0.55));
        const r = lerp(3.2, 2.85, p);
        dummy.position.set(Math.cos(a) * r, Math.sin(a) * r, 0.47);
        dummy.rotation.set(0, 0, a);
        dummy.scale.set(0.9, 0.11, 0.11);
        dummy.updateMatrix();
        bolts.current.setMatrixAt(i, dummy.matrix);
        // Receiver light: red while locked → cyan once released.
        tmpColor.copy(LOCKED).lerp(RELEASED, p);
        dummy.position.set(Math.cos(a) * 3.8, Math.sin(a) * 3.8, 0.66);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(0.06);
        dummy.updateMatrix();
        lights.current.setMatrixAt(i, dummy.matrix);
        lights.current.setColorAt(i, tmpColor);
      }
      bolts.current.instanceMatrix.needsUpdate = true;
      lights.current.instanceMatrix.needsUpdate = true;
      if (lights.current.instanceColor) lights.current.instanceColor.needsUpdate = true;
    }

    // Keypad: counts the code in, then grants access. Redrawn only when the stage changes.
    const granted = v.bolts > 0.02 || v.spin >= 0.98;
    const digits = Math.floor(range(v.spin, 0.04, 0.8) * 6);
    const stage = granted ? 100 : digits;
    if (stage !== padKey.current) {
      padKey.current = stage;
      drawKeypad(res.keypadCtx, 288, 544, digits, granted);
      res.keypadTex.needsUpdate = true;
    }

    // Light: red while locked (a slow breathing pulse), cyan as the bolts release.
    const released = easeInOut(range(v.bolts, 0.05, 0.95));
    accent.copy(RED).lerp(COLORS.cyan, released);
    const pulse = 1 + 0.1 * Math.sin(t * 1.8) * (1 - released);
    const k = (5 - 2 * released + 1.2 * v.glow + 2 * v.open) * pulse;
    res.gapMat.color.copy(accent).multiplyScalar(k);
    res.doorGlowMat.color.copy(accent).multiplyScalar(k * 0.55);
    const spill = (0.62 + 0.8 * v.glow + 0.5 * v.open) * pulse * lerp(1, 1.6, released);
    res.rimMat.color.copy(accent).multiplyScalar(spill);
    res.washMat.color.copy(accent).multiplyScalar(0.16 * spill);
    res.backMat.color.copy(accent).multiplyScalar(0.05 + v.glow * 0.55 + v.open * 0.25);
    res.backMat.opacity = 1 - range(v.open, 0.15, 0.6);
    res.beamMat.uniforms.uIntensity.value = v.beam * (0.75 + 0.25 * Math.sin(t * 1.3));
    if (beam.current) beam.current.visible = v.beam > 0.01;
    if (backGlow.current) {
      const m = backGlow.current.material as THREE.SpriteMaterial;
      m.opacity = 0.06 * v.glow + 0.22 * v.open;
      backGlow.current.scale.setScalar(9 + v.open * 9);
    }

    // The swing: unseal (pull outward) → rotate about the hinge.
    if (pivot.current) {
      pivot.current.position.z = 0.36 + v.unseal * 0.28;
      pivot.current.rotation.y = -easeInOut(v.open) * OPEN_ANGLE;
    }
  });

  return (
    <group>
      {/* Rock wall, with the door's light spilling over it */}
      <mesh geometry={res.wallGeo} material={res.wallMat} />
      <mesh geometry={res.rimGeo} material={res.rimMat} position={[0, 0, 0.04]} renderOrder={4} />
      <mesh geometry={res.contactGeo} material={res.contactMat} position={[0, FLOOR_Y + 1.6, 0.03]} renderOrder={1} />

      {/* Still pool: real reflections of the door and rock, rippled by drifting waves */}
      <WaterFloor position={[0, FLOOR_Y, 35]} renderOrder={2} />
      <mesh geometry={res.floorWashGeo} material={res.washMat} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y + 0.01, 5]} renderOrder={3} />

      {/* Jamb, frame ring and the glowing gap */}
      <mesh geometry={res.jambGeo} material={res.jambMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.7]} />
      <mesh geometry={res.frameGeo} material={res.steelDark} />
      <instancedMesh ref={frameRivets} args={[res.rivetGeo, res.steelMid, FRAME_RIVETS.length]} />
      <mesh geometry={res.gapGeo} material={res.gapMat} position={[0, 0, 0.12]} />
      <mesh geometry={res.backGeo} material={res.backMat} position={[0, 0, -1.45]} />
      <GlowSprite ref={backGlow} color="#5b8fb5" position={[0, 0, -3]} opacity={0} />

      {/* Bolt receivers in the frame, each with a status light */}
      <instancedMesh ref={receivers} args={[res.receiverGeo, res.steel, BOLTS]} />
      <instancedMesh ref={lights} args={[geo.sphere, res.indicatorMat, BOLTS]} />

      {/* Hinge brackets on the wall and the long hinge pin */}
      {[2.05, 0, -2.05].map((y) => (
        <mesh key={y} geometry={res.leafGeo} material={res.steel} position={[HINGE_X - 0.28, y, 0.2]} />
      ))}

      {/* Keypad */}
      <group position={[5.05, 0, 0]}>
        <mesh geometry={res.padGeo} material={res.steel} position={[0, 0, 0.15]} />
        <mesh geometry={res.padInsetGeo} material={res.padBlack} position={[0, 0, 0.285]} />
        <mesh geometry={res.padScreenGeo} material={res.padScreenMat} position={[0, 0, 0.315]} />
      </group>

      {/* The door: the pivot sits on the hinge line, the door hangs off it */}
      <group ref={pivot} position={[HINGE_X, 0, 0.36]}>
        {/* Hinge barrels turn about their own axis, so they stay put as the door swings */}
        {[2.05, 0, -2.05].map((y) => (
          <group key={y} position={[0, y, 0.12]}>
            <mesh geometry={res.barrelGeo} material={res.rod} />
            <mesh geometry={res.barrelCapGeo} material={res.steelMid} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.46, 0]} />
            <mesh geometry={res.barrelCapGeo} material={res.steelMid} rotation={[Math.PI / 2, 0, 0]} position={[0, -0.46, 0]} />
          </group>
        ))}
        <mesh geometry={res.pinGeo} material={res.steelMid} position={[0, 0, 0.12]} />

        <group position={[-HINGE_X, 0, -0.36]}>
          <mesh geometry={res.bodyGeo} material={res.steel} />
          <mesh geometry={res.edgeGeo} material={res.doorGlowMat} position={[0, 0, 0.1]} />

          {/* Machined lips between the steps */}
          <mesh geometry={res.lipOuterGeo} material={res.rod} position={[0, 0, 0.3]} />
          <mesh geometry={res.lipMidGeo} material={res.steelMid} position={[0, 0, 0.2]} />
          <mesh geometry={res.lipInnerGeo} material={res.rod} position={[0, 0, 0.27]} />
          <instancedMesh ref={rivets} args={[res.rivetGeo, res.steelMid, RIVETS.length]} />

          {/* Combination rings */}
          <mesh ref={dialB} geometry={res.dialBGeo} material={res.dialBMat} position={[0, 0, 0.155]} />
          <mesh ref={dialA} geometry={res.dialAGeo} material={res.dialAMat} position={[0, 0, 0.255]} />

          {/* Hinge plate */}
          <mesh geometry={res.plateGeo} material={res.steelDark} position={[0, 0, 0.2]} />
          <instancedMesh ref={plateHeads} args={[res.headGeo, res.steelMid, 6]} />

          {/* Lock bolts slide through fixed clamps on the rim band */}
          <instancedMesh ref={clamps} args={[geo.box, res.steel, BOLTS]} />
          <instancedMesh ref={bolts} args={[res.rodGeo, res.rod, BOLTS]} />

          {/* Central boss with the engraved emblem */}
          <mesh geometry={res.bossGeo} material={res.steel} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.48]} />
          <mesh geometry={res.bossLipGeo} material={res.rod} position={[0, 0, 0.3]} />
          <mesh geometry={res.bossRingGeo} material={res.rod} position={[0, 0, 0.72]} />
          <mesh geometry={res.emblemGeo} material={res.emblemMat} position={[0, 0, 0.726]} />

          {/* Spoke wheel */}
          <group ref={wheel}>
            <instancedMesh ref={rods} args={[res.rodGeo, res.rod, SPOKES]} />
            <instancedMesh ref={collars} args={[geo.box, res.steel, SPOKES * 3]} />
          </group>
        </group>
      </group>

      {/* Volumetric shaft of light pouring out of the opened vault */}
      <mesh ref={beam} geometry={res.beamGeo} material={res.beamMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 8]} visible={false} />
    </group>
  );
}
