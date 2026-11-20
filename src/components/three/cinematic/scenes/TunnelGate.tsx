"use client";

import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { useCine } from "../kit/context";
import { easeInOut, hash, range, smooth } from "../kit/math";
import { COLORS, S, useDisposables } from "../kit/parts";
import { brushedRoughness, canvasTexture, radialTexture } from "../kit/textures";

/*
 * The way out of the tunnel: a bulkhead with a mechanical aperture. Eight
 * steel leaves close the opening; as they retract, light that has been
 * leaking through the seams floods the tunnel (glare, rays, a haze of
 * volumetric light, embers streaming out) and a corridor of light rings
 * leading to a white core is revealed. The camera then flies through it.
 *
 * Driven by `state.tunnel.gate` (0 closed → 1 open); fades out with the
 * Personal Vault handoff.
 */

const APERTURE = 2.35;
const LEAVES = 8;
const LEAF_R = 2.85;
const RINGS = 8;
const CORE_Z = -15;
const DEG = Math.PI / 180;

const tmp = new THREE.Color();
const dummy = new THREE.Object3D();

/** Radiating streaks from a bright centre. */
function burstTexture() {
  return canvasTexture("gate-burst", 512, 512, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    const rays = 46;
    for (let i = 0; i < rays; i++) {
      const a = hash(i + 3) * Math.PI * 2;
      const len = (0.35 + hash(i + 11) * 0.65) * w * 0.5;
      const width = (0.006 + hash(i + 29) * 0.03) * Math.PI;
      const g = ctx.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len);
      g.addColorStop(0, `rgba(255,255,255,${0.35 + hash(i + 7) * 0.5})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a - width) * len, Math.sin(a - width) * len);
      ctx.lineTo(Math.cos(a + width) * len, Math.sin(a + width) * len);
      ctx.closePath();
      ctx.fill();
    }
    const c = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.2);
    c.addColorStop(0, "rgba(255,255,255,0.9)");
    c.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = c;
    ctx.fillRect(-w / 2, -h / 2, w, h);
  });
}

/** Anamorphic horizontal flare. */
function streakTexture() {
  return canvasTexture("gate-streak", 512, 64, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.translate(w / 2, h / 2);
    ctx.scale(w / h, 1);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, h / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(190,230,255,0.35)");
    g.addColorStop(1, "rgba(160,215,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(-w, -h / 2, w * 2, h);
  });
}

/** Alpha ramp for the volumetric haze: clear at the far end (top), strong at the gate (bottom). */
function hazeTexture() {
  return canvasTexture("gate-haze", 8, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.55, "rgba(255,255,255,0.18)");
    g.addColorStop(1, "rgba(255,255,255,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  });
}

function leafGeometry() {
  const half = ((Math.PI * 2) / LEAVES) * 0.965 * 0.5;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(Math.cos(-half) * LEAF_R, Math.sin(-half) * LEAF_R);
  shape.absarc(0, 0, LEAF_R, -half, half, false);
  shape.lineTo(0, 0);
  return new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2, curveSegments: 16 });
}

/** Stepped bulkhead collar, revolved about the tunnel axis (front face at z = 0, body running back). */
function collarGeometry(radius: number) {
  const pts = [
    [radius + 0.1, -0.9],
    [radius + 0.1, -0.06],
    [radius + 0.02, 0],
    [3.15, 0],
    [3.15, -0.14],
    [3.0, -0.14],
    [3.0, -0.04],
    [2.9, 0.02],
    [2.9, -0.22],
    [2.62, -0.22],
    [2.62, 0.06],
    [2.5, 0.1],
    [2.4, 0.05],
    [APERTURE, -0.04],
    [APERTURE, -0.9],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 96);
  g.rotateX(Math.PI / 2);
  return g;
}

export function TunnelGate({ z, radius }: { z: number; radius: number }) {
  const { state, quality } = useCine();
  const { geo } = S();
  const bolts = 28;
  const embers = quality.compact ? 50 : 130;

  const res = useDisposables(() => {
    const steel = (color: string, rough: number) =>
      new THREE.MeshPhysicalMaterial({ color, metalness: 0.9, roughness: rough, roughnessMap: brushedRoughness(), envMapIntensity: 1.15, side: THREE.DoubleSide });
    const additive = (map: THREE.Texture, extra: Partial<THREE.MeshBasicMaterialParameters> = {}) =>
      new THREE.MeshBasicMaterial({ map, color: "#000000", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false, ...extra });
    return {
      collarGeo: collarGeometry(radius),
      leafGeo: leafGeometry(),
      sealGeo: new THREE.TorusGeometry(radius - 0.02, 0.1, 10, 96),
      grooveGeo: new THREE.TorusGeometry(2.76, 0.03, 8, 96),
      ringGeo: new THREE.TorusGeometry(1, 0.03, 8, 72),
      coreGeo: new THREE.CircleGeometry(2.7, 48),
      hazeGeo: new THREE.CylinderGeometry(radius - 0.15, APERTURE, 18, 40, 1, true),
      collar: steel("#3b434e", 0.4),
      leaf: steel("#2a3038", 0.44),
      seal: steel("#4a525e", 0.34),
      groove: new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false, fog: false }),
      rings: Array.from({ length: RINGS }, () => new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false, fog: false, transparent: true })),
      core: new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false, fog: false, transparent: true }),
      halo: additive(radialTexture()),
      burst: additive(burstTexture()),
      streak: additive(streakTexture()),
      haze: additive(hazeTexture(), { side: THREE.BackSide }),
      ember: new THREE.MeshBasicMaterial({ color: "#000000", toneMapped: false, fog: false, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }),
    };
  });

  const root = useRef<THREE.Group>(null);
  const leaves = useRef<(THREE.Mesh | null)[]>([]);
  const hub = useRef<THREE.Mesh>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const burstA = useRef<THREE.Mesh>(null);
  const burstB = useRef<THREE.Mesh>(null);
  const boltsRef = useRef<THREE.InstancedMesh>(null);
  const emberRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const im = boltsRef.current;
    if (!im) return;
    for (let i = 0; i < bolts; i++) {
      const a = (i / bolts) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 3.43, Math.sin(a) * 3.43, 0.01);
      dummy.rotation.set(0, 0, a);
      dummy.scale.set(0.075, 0.075, 0.04);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const tn = state.tunnel;
    const handoff = 1 - smooth(range(state.personal.room, 0, 0.55));
    const g = tn.gate;
    const open = easeInOut(g);
    if (root.current) root.current.visible = tn.enter > 0.4 && handoff > 0.01;
    if (!root.current?.visible) return;

    // Leaves retract radially, twisting slightly: the opening grows from a star into a circle.
    const reach = open * 3.1;
    for (let i = 0; i < LEAVES; i++) {
      const m = leaves.current[i];
      if (!m) continue;
      const a = ((i + 0.5) / LEAVES) * Math.PI * 2;
      m.position.set(Math.cos(a) * reach, Math.sin(a) * reach, m.position.z);
      m.rotation.z = a + open * 0.4 * (i % 2 ? 1 : -1);
    }
    if (hub.current) hub.current.scale.setScalar(Math.max(0.0001, 1 - smooth(range(g, 0, 0.18))));

    // Light behind the gate: always faintly leaking through the seams.
    const leak = 0.35 + 0.9 * smooth(range(g, 0, 0.35));
    const full = smooth(range(g, 0.25, 1));
    tmp.set("#dff4ff").multiplyScalar(leak + 2.4 * full);
    res.core.color.copy(tmp);
    res.core.opacity = handoff;
    res.halo.color.set("#9fd8f5").multiplyScalar((0.25 + 0.9 * full) * handoff);

    // Rings of light chase toward the core.
    for (let k = 0; k < RINGS; k++) {
      const m = rings.current[k];
      if (!m) continue;
      const f = k / (RINGS - 1);
      const pulse = 0.5 + 0.5 * Math.sin(t * 3.4 - k * 0.95);
      const on = smooth(range(g, 0.05 + f * 0.05, 0.5 + f * 0.1));
      m.visible = on > 0.01;
      (m.material as THREE.MeshBasicMaterial).color
        .set(COLORS.cyan)
        .lerp(tmp.set("#ffffff"), f * 0.8)
        .multiplyScalar((0.5 + 1.7 * pulse) * on * handoff * (1 - f * 0.25));
      (m.material as THREE.MeshBasicMaterial).opacity = 1;
    }

    // Glare, rays and flare over the opened gate.
    const glare = full * handoff;
    res.burst.color.set("#bfe6ff").multiplyScalar(0.55 * glare);
    res.streak.color.set("#a8dcff").multiplyScalar(0.8 * glare);
    if (burstA.current) burstA.current.rotation.z = t * 0.05;
    if (burstB.current) burstB.current.rotation.z = -t * 0.035 + 1;

    // Haze of light in the tunnel air.
    res.haze.color.set("#7fc6e6").multiplyScalar((0.015 + 0.075 * full) * handoff);

    // Groove light around the aperture wakes with the gate.
    res.groove.color.copy(COLORS.cyan).multiplyScalar((0.25 + 0.9 * smooth(range(g, 0, 0.3)) + 0.6 * full) * (0.9 + 0.1 * Math.sin(t * 2.2)));

    // Embers stream out of the gate into the tunnel.
    const em = emberRef.current;
    if (em) {
      em.visible = g > 0.25;
      if (em.visible) {
        const speed = 3 + 11 * full;
        for (let i = 0; i < embers; i++) {
          const ph = hash(i * 3.1 + 1);
          const a = hash(i * 5.7 + 2) * Math.PI * 2;
          const r = Math.sqrt(hash(i * 7.3 + 4)) * (APERTURE - 0.2);
          const zz = (((t * speed * (0.5 + hash(i + 9)) + ph * 8) % 8) + 8) % 8;
          dummy.position.set(Math.cos(a) * r * (1 + zz * 0.06), Math.sin(a) * r * (1 + zz * 0.06), 0.3 + zz);
          dummy.rotation.set(0, 0, 0);
          const k = full * (1 - zz / 8) ** 1.5;
          dummy.scale.set(0.014 * k, 0.014 * k, (0.25 + hash(i) * 0.6) * k * (0.5 + full));
          dummy.updateMatrix();
          em.setMatrixAt(i, dummy.matrix);
        }
        em.instanceMatrix.needsUpdate = true;
        res.ember.color.set("#cfefff").multiplyScalar(0.9 * handoff);
      }
    }

  });

  return (
    <group ref={root} position={[0, 0, z]}>
      {/* Bulkhead collar, seal bead against the lining, and fixings */}
      <mesh geometry={res.collarGeo} material={res.collar} />
      <mesh geometry={res.sealGeo} material={res.seal} position={[0, 0, 0.03]} />
      <mesh geometry={res.grooveGeo} material={res.groove} position={[0, 0, -0.2]} />
      <instancedMesh ref={boltsRef} args={[geo.sphere, res.seal, bolts]} />

      {/* Leaves: alternate layers so they overlap cleanly */}
      {Array.from({ length: LEAVES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            leaves.current[i] = m;
          }}
          geometry={res.leafGeo}
          material={res.leaf}
          position={[0, 0, -0.34 - (i % 2) * 0.12]}
        />
      ))}
      <mesh ref={hub} geometry={geo.cyl} material={res.seal} position={[0, 0, -0.2]} rotation={[Math.PI / 2, 0, 0]} scale={[0.55, 0.12, 0.55]} />

      {/* Behind the gate: a corridor of light rings leading to a white core */}
      {Array.from({ length: RINGS }, (_, k) => {
        const f = k / (RINGS - 1);
        const rr = 2.15 - f * 1.0;
        return (
          <mesh
            key={k}
            ref={(m) => {
              rings.current[k] = m;
            }}
            geometry={res.ringGeo}
            material={res.rings[k]}
            position={[0, 0, -1.4 - f * (-CORE_Z - 1.4) * 0.92]}
            scale={[rr, rr, 1]}
          />
        );
      })}
      <mesh geometry={res.coreGeo} material={res.core} position={[0, 0, CORE_Z]} />
      <mesh geometry={geo.plane} material={res.halo} position={[0, 0, CORE_Z + 0.05]} scale={[13, 13, 1]} />

      {/* In front: haze, glare and rays over the opened gate, embers flying out */}
      <mesh geometry={res.hazeGeo} material={res.haze} position={[0, 0, 9.1]} rotation={[Math.PI / 2, 0, 0]} renderOrder={4} />
      <mesh ref={burstA} geometry={geo.plane} material={res.burst} position={[0, 0, 0.45]} scale={[12, 12, 1]} renderOrder={5} />
      <mesh ref={burstB} geometry={geo.plane} material={res.burst} position={[0, 0, 0.5]} scale={[8, 8, 1]} renderOrder={5} />
      <mesh geometry={geo.plane} material={res.streak} position={[0, 0, 0.55]} scale={[22, 1.6, 1]} renderOrder={6} />
      <instancedMesh ref={emberRef} args={[geo.box, res.ember, embers]} frustumCulled={false} renderOrder={6} />
    </group>
  );
}
