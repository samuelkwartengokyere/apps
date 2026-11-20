"use client";

import { MeshReflectorMaterial } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLayoutEffect, useRef } from "react";
import * as THREE from "three";
import { STATIONS } from "@/components/cinematic/config";
import { useCine } from "../kit/context";
import { range } from "../kit/math";
import { COLORS, S, useDisposables } from "../kit/parts";
import { brushedRoughness, radialTexture, tunnelLiningTextures } from "../kit/textures";
import { TunnelCards } from "./TunnelCards";
import { TunnelGate } from "./TunnelGate";

/*
 * The passage behind the vault door: a bored service tunnel lined with
 * precast concrete segments and braced by steel ribs, with cable trays and
 * pipes along the walls, strip lights overhead and guide lights set into a
 * wet floor. The "encrypted data" is carried by light pulses running down the
 * fibre cables, not by floating glyphs.
 *
 * Local z spans +32 (vault side) → -32 (exit). The camera flies down the axis.
 */

const LENGTH = 64;
// The built tunnel runs half a unit past the nominal start so it meets the vault's door sleeve with no visible end.
const BODY = LENGTH + 0.5;
const BODY_Z = 0.25;
const R = 3.7; // lining radius
const FLOOR_Y = -2.3;
const FLOOR_HALF = Math.sqrt(R * R - FLOOR_Y * FLOOR_Y); // where the floor meets the wall
const SEG_LEN = 2.5; // length of one lining ring
const SEGMENTS = 8; // precast pieces per ring
const RIBS = 7;
const FIX = 13; // strip lights per side, every 5 units
const GUIDES = 25; // floor guide lights per side, every 2.5 units
const FIX_ANGLES = [55, 125].map((d) => (d * Math.PI) / 180);
const TRAY_ANGLES = [10, 170];
const PIPE_ANGLES = [-22, -158, 90];
const CABLES_PER_TRAY = 3;
const STREAMS = TRAY_ANGLES.length * CABLES_PER_TRAY;
const TUNNEL_Z = STATIONS.tunnel[2];
const DEG = Math.PI / 180;

const dummy = new THREE.Object3D();
const col = new THREE.Color();
const base = new THREE.Color();
const FIXTURE = COLORS.sky.clone().lerp(COLORS.white, 0.25);

function createFlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uFlow: { value: 0 }, uOpacity: { value: 0 }, uSize: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uFlow;
      uniform float uSize;
      attribute float aSpeed;
      varying float vFade;
      void main() {
        vec3 p = position;
        p.z = mod(p.z + uFlow * aSpeed + 32.0, 64.0) - 32.0;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = -mv.z;
        vFade = smoothstep(0.2, 2.0, d) * (1.0 - smoothstep(14.0, 26.0, d)) * (0.35 + 0.65 * aSpeed);
        gl_PointSize = uSize * (0.5 + aSpeed * 0.7) * (15.0 / max(d, 0.1));
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      varying float vFade;
      void main() {
        float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vFade * uOpacity;
        if (a < 0.01) discard;
        gl_FragColor = vec4(vec3(0.62, 0.78, 0.9) * a, a);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}

/** Places an instance on the lining at `angle`/`radius`, facing the tunnel axis (local x runs along the tunnel). */
function placeOnWall(im: THREE.InstancedMesh, i: number, angle: number, radius: number, z: number, sx: number, sy: number, sz: number) {
  dummy.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  dummy.lookAt(0, 0, z);
  dummy.scale.set(sx, sy, sz);
  dummy.updateMatrix();
  im.setMatrixAt(i, dummy.matrix);
}

export default function DigitalTunnel() {
  const { state, quality } = useCine();
  const { geo } = S();
  const particleCount = quality.compact ? 350 : 900;
  const perStream = quality.compact ? 10 : 18;
  const reflective = !quality.compact && !quality.low;

  const res = useDisposables(() => {
    const flowGeo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const speed = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 0.4 + Math.sqrt(Math.random()) * 2.6;
      pos[i * 3] = Math.cos(a) * r;
      pos[i * 3 + 1] = Math.sin(a) * r;
      pos[i * 3 + 2] = (Math.random() - 0.5) * LENGTH;
      speed[i] = Math.random();
    }
    flowGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    flowGeo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));

    const { normal, color } = tunnelLiningTextures(quality.compact ? 512 : 1024, quality.compact ? 112 : 224, SEGMENTS, BODY / (SEG_LEN * 2));
    const brushed = brushedRoughness();

    return {
      flowGeo,
      flowMat: createFlowMaterial(),

      liningGeo: new THREE.CylinderGeometry(R, R, BODY, quality.compact ? 48 : 96, 1, true),
      liningMat: new THREE.MeshStandardMaterial({
        color: "#a7adb4",
        map: color,
        normalMap: normal,
        normalScale: quality.compact ? new THREE.Vector2(0.7, 0.7) : new THREE.Vector2(1.4, 1.4),
        roughness: 0.92,
        metalness: 0.05,
        envMapIntensity: 0.35,
        side: THREE.BackSide,
      }),
      ribGeo: new THREE.TorusGeometry(R - 0.06, 0.14, 12, quality.compact ? 48 : 96),
      floorGeo: new THREE.PlaneGeometry(FLOOR_HALF * 2 + 0.2, BODY),
      floorFallbackMat: new THREE.MeshStandardMaterial({ color: "#07090c", roughness: 0.4, metalness: 0.5, envMapIntensity: 0.1 }),
      poolGeo: new THREE.PlaneGeometry(1, 1),

      steel: new THREE.MeshPhysicalMaterial({ color: "#555c66", metalness: 0.45, roughness: 0.42, roughnessMap: brushed, envMapIntensity: 1.0 }),
      steelLight: new THREE.MeshPhysicalMaterial({ color: "#9aa2ad", metalness: 0.5, roughness: 0.35, roughnessMap: brushed, envMapIntensity: 1.1 }),
      steelDark: new THREE.MeshPhysicalMaterial({ color: "#23272d", metalness: 0.7, roughness: 0.5, roughnessMap: brushed, envMapIntensity: 0.9 }),
      pipe: new THREE.MeshPhysicalMaterial({ color: "#7b848f", metalness: 0.85, roughness: 0.3, envMapIntensity: 1.2 }),
      cable: new THREE.MeshStandardMaterial({ color: "#1b2027", roughness: 0.45, metalness: 0.3 }),
      fixtureMat: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      guideMat: new THREE.MeshBasicMaterial({ color: "#ffffff", toneMapped: false }),
      poolMat: new THREE.MeshBasicMaterial({ map: radialTexture(), color: "#ffffff", transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }),
      pulseMat: new THREE.MeshBasicMaterial({ color: COLORS.cyan.clone().multiplyScalar(1.6), toneMapped: false, transparent: true }),
    };
  });

  const housings = useRef<THREE.InstancedMesh>(null);
  const diffusers = useRef<THREE.InstancedMesh>(null);
  const pools = useRef<THREE.InstancedMesh>(null);
  const guides = useRef<THREE.InstancedMesh>(null);
  const ribs = useRef<THREE.InstancedMesh>(null);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const flow = useRef(0);

  useLayoutEffect(() => {
    for (let side = 0; side < FIX_ANGLES.length; side++) {
      for (let i = 0; i < FIX; i++) {
        const z = -LENGTH / 2 + 2 + i * 5;
        const idx = side * FIX + i;
        const a = FIX_ANGLES[side];
        if (housings.current) placeOnWall(housings.current, idx, a, R - 0.1, z, 2.7, 0.36, 0.2);
        if (diffusers.current) placeOnWall(diffusers.current, idx, a, R - 0.2, z, 2.45, 0.15, 0.05);
        if (pools.current) {
          placeOnWall(pools.current, idx, a, R - 0.02, z, 6, 3.4, 1);
          pools.current.setColorAt(idx, col.setRGB(0, 0, 0));
        }
        diffusers.current?.setColorAt(idx, col.setRGB(0, 0, 0));
      }
    }
    for (const im of [housings, diffusers, pools]) if (im.current) im.current.instanceMatrix.needsUpdate = true;

    if (guides.current) {
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < GUIDES; i++) {
          dummy.position.set((side ? 1 : -1) * 1.15, FLOOR_Y + 0.02, -LENGTH / 2 + 1.25 + i * SEG_LEN);
          dummy.rotation.set(0, 0, 0);
          dummy.scale.set(0.1, 0.035, 0.8);
          dummy.updateMatrix();
          guides.current.setMatrixAt(side * GUIDES + i, dummy.matrix);
          guides.current.setColorAt(side * GUIDES + i, col.setRGB(0, 0, 0));
        }
      }
      guides.current.instanceMatrix.needsUpdate = true;
    }

    if (ribs.current) {
      for (let i = 0; i < RIBS; i++) {
        dummy.position.set(0, 0, -LENGTH / 2 + i * SEG_LEN * 4);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, 1, i === 0 ? 1.8 : 1);
        dummy.updateMatrix();
        ribs.current.setMatrixAt(i, dummy.matrix);
      }
      ribs.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useFrame(({ camera, clock, gl }, dt) => {
    const tn = state.tunnel;
    const t = clock.elapsedTime;
    const speed = Math.min(Math.abs(state.velocity) * 0.006, 18);
    flow.current += dt * (2.2 + speed) * (0.3 + tn.enter);
    const camLocal = camera.position.z - TUNNEL_Z;

    // Strip lights switch on in sequence from the vault outward, warm slightly
    // as the journey progresses, and swell as the camera passes beneath them.
    const warm = Math.min(1, tn.light * 1.2);
    for (let side = 0; side < FIX_ANGLES.length; side++) {
      for (let i = 0; i < FIX; i++) {
        const z = -LENGTH / 2 + 2 + i * 5;
        const order = (FIX - 1 - i) / FIX; // vault side first
        const on = range(tn.enter * 1.35, order, order + 0.3);
        const d = camLocal - z;
        const prox = Math.exp(-(d * d) / 18);
        const idx = side * FIX + i;
        base.copy(FIXTURE).lerp(COLORS.cyan, warm * 0.5);
        diffusers.current?.setColorAt(idx, col.copy(base).multiplyScalar(on * (1.5 + tn.light * 0.6 + prox * 0.9)));
        pools.current?.setColorAt(idx, col.copy(base).multiplyScalar(on * (0.3 + tn.light * 0.12 + prox * 0.3)));
      }
    }
    if (diffusers.current?.instanceColor) diffusers.current.instanceColor.needsUpdate = true;
    if (pools.current?.instanceColor) pools.current.instanceColor.needsUpdate = true;

    // Floor guide lights chase down the tunnel.
    if (guides.current) {
      for (let side = 0; side < 2; side++) {
        for (let i = 0; i < GUIDES; i++) {
          const order = (GUIDES - 1 - i) / GUIDES;
          const on = range(tn.enter * 1.35, order, order + 0.25);
          const chase = 0.55 + 0.45 * Math.sin(-t * 3.2 + i * 0.7);
          guides.current.setColorAt(side * GUIDES + i, col.copy(COLORS.cyan).multiplyScalar(on * (0.5 + chase * 0.9 + tn.light * 0.4)));
        }
      }
      if (guides.current.instanceColor) guides.current.instanceColor.needsUpdate = true;
    }

    // Light pulses travel down the fibre cables toward the camera.
    const pm = pulses.current;
    if (pm) {
      pm.visible = tn.streams > 0.01;
      if (pm.visible) {
        let n = 0;
        for (let s = 0; s < STREAMS; s++) {
          const tray = Math.floor(s / CABLES_PER_TRAY);
          const A = TRAY_ANGLES[tray] * DEG;
          const off = ((s % CABLES_PER_TRAY) - 1) * 0.2;
          const px = Math.cos(A) * (R - 0.2) + Math.sin(A) * off;
          const py = Math.sin(A) * (R - 0.2) - Math.cos(A) * off;
          for (let j = 0; j < perStream; j++) {
            const z = ((((LENGTH / 2 - (j / perStream) * LENGTH + flow.current * (1.5 + (s % 3) * 0.45) + s * 2.3) % LENGTH) + LENGTH) % LENGTH) - LENGTH / 2;
            dummy.position.set(px, py, z);
            dummy.rotation.set(0, 0, 0);
            const sc = tn.streams * (j % 4 === 0 ? 1.3 : 1);
            dummy.scale.set(0.07 * sc, 0.07 * sc, (0.35 + (j % 3) * 0.25) * sc);
            dummy.updateMatrix();
            pm.setMatrixAt(n++, dummy.matrix);
          }
        }
        pm.instanceMatrix.needsUpdate = true;
        res.pulseMat.opacity = Math.min(1, tn.streams * 1.2);
      }
    }

    const fu = res.flowMat.uniforms;
    fu.uFlow.value = flow.current;
    fu.uOpacity.value = Math.min(1, 0.2 + tn.enter * 0.8);
    fu.uSize.value = gl.getPixelRatio();
  });

  return (
    <group>
      {/* Concrete lining and steel ribs */}
      <mesh geometry={res.liningGeo} material={res.liningMat} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, BODY_Z]} />
      <instancedMesh ref={ribs} args={[res.ribGeo, res.steel, RIBS]} />

      {/* Wet floor walkway with kerbs and guide lights */}
      <mesh geometry={res.floorGeo} rotation={[-Math.PI / 2, 0, 0]} position={[0, FLOOR_Y, BODY_Z]}>
        {reflective ? (
          <MeshReflectorMaterial
            resolution={512}
            blur={[160, 40]}
            mixBlur={0.7}
            mixStrength={11}
            mirror={1}
            roughness={0.7}
            depthScale={0.6}
            minDepthThreshold={0.3}
            maxDepthThreshold={1.6}
            color="#0d1117"
            metalness={0.5}
            envMapIntensity={0.1}
          />
        ) : (
          <primitive object={res.floorFallbackMat} attach="material" />
        )}
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={geo.box} material={res.steelDark} position={[s * (FLOOR_HALF - 0.12), FLOOR_Y + 0.12, BODY_Z]} scale={[0.26, 0.26, BODY]} />
      ))}
      <instancedMesh ref={guides} args={[geo.box, res.guideMat, GUIDES * 2]} frustumCulled={false} />

      {/* Cable trays with fibre runs */}
      {TRAY_ANGLES.map((deg) => (
        <group key={deg} rotation={[0, 0, (deg - 90) * DEG]}>
          <mesh geometry={geo.box} material={res.steel} position={[0, R - 0.08, BODY_Z]} scale={[0.7, 0.05, BODY]} />
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={geo.box} material={res.steelLight} position={[s * 0.34, R - 0.15, BODY_Z]} scale={[0.04, 0.12, BODY]} />
          ))}
          {[-0.2, 0, 0.2].map((x) => (
            <mesh key={x} geometry={geo.cyl} material={res.cable} position={[x, R - 0.16, BODY_Z]} rotation={[Math.PI / 2, 0, 0]} scale={[0.045, BODY, 0.045]} />
          ))}
        </group>
      ))}

      {/* Pipes */}
      {PIPE_ANGLES.map((deg) => (
        <group key={deg} rotation={[0, 0, (deg - 90) * DEG]}>
          <mesh geometry={geo.cyl} material={res.pipe} position={[0, R - 0.22, BODY_Z]} rotation={[Math.PI / 2, 0, 0]} scale={[0.12, BODY, 0.12]} />
        </group>
      ))}

      {/* Strip lights: housing, diffuser and the light they throw on the lining */}
      <instancedMesh ref={housings} args={[geo.box, res.steelDark, FIX * 2]} />
      <instancedMesh ref={diffusers} args={[geo.box, res.fixtureMat, FIX * 2]} />
      <instancedMesh ref={pools} args={[res.poolGeo, res.poolMat, FIX * 2]} frustumCulled={false} renderOrder={3} />

      <instancedMesh ref={pulses} args={[geo.box, res.pulseMat, STREAMS * perStream]} frustumCulled={false} />
      <points geometry={res.flowGeo} material={res.flowMat} frustumCulled={false} />

      {/* The four message cards */}
      <TunnelCards />

      {/* The gate at the far end */}
      <TunnelGate z={-LENGTH / 2} radius={R} />
    </group>
  );
}
