"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { useCine } from "./context";

/**
 * A tileable water normal map, built once from a sum of sine waves with
 * integer frequencies (so it repeats seamlessly). Long swells carry most of
 * the energy; short ripples add the fine, glittering detail.
 */
function waterNormalTexture(size = 256) {
  let seed = 7;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  const waves: { fx: number; fy: number; amp: number; phase: number }[] = [];
  for (let i = 0; i < 22; i++) {
    const mag = 1 + Math.pow(rand(), 1.6) * 15;
    const angle = rand() * Math.PI * 2;
    const fx = Math.round(Math.cos(angle) * mag);
    const fy = Math.round(Math.sin(angle) * mag);
    if (fx === 0 && fy === 0) continue;
    waves.push({ fx, fy, amp: 1 / Math.pow(1 + Math.hypot(fx, fy), 0.9), phase: rand() * Math.PI * 2 });
  }

  const dx = new Float32Array(size * size);
  const dy = new Float32Array(size * size);
  let sum = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let gx = 0;
      let gy = 0;
      for (const w of waves) {
        const arg = ((w.fx * x + w.fy * y) / size) * Math.PI * 2 + w.phase;
        const c = Math.cos(arg) * w.amp;
        gx += c * w.fx;
        gy += c * w.fy;
      }
      dx[y * size + x] = gx;
      dy[y * size + x] = gy;
      sum += gx * gx + gy * gy;
    }
  }

  // Normalise so the surface has a gentle, believable slope.
  const k = 0.2 / Math.sqrt(sum / (size * size));
  const data = new Uint8Array(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const nx = -dx[i] * k;
    const ny = -dy[i] * k;
    const inv = 1 / Math.sqrt(nx * nx + ny * ny + 1);
    data[i * 4] = Math.round((nx * inv * 0.5 + 0.5) * 255);
    data[i * 4 + 1] = Math.round((ny * inv * 0.5 + 0.5) * 255);
    data[i * 4 + 2] = Math.round((inv * 0.5 + 0.5) * 255);
    data[i * 4 + 3] = 255;
  }

  const tex = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * A large still pool: a real planar reflection of the scene (door, rock wall
 * and the light spilling from the gap), broken up by drifting ripples, with a
 * Fresnel falloff (mirror-like at grazing angles, dark water underfoot) and
 * fog that melts the far edge into the background.
 */
export function WaterFloor({
  position,
  width = 90,
  depth = 70,
  renderOrder = 2,
}: {
  position: [number, number, number];
  width?: number;
  depth?: number;
  renderOrder?: number;
}) {
  const { quality } = useCine();
  const res = quality.compact || quality.low ? 384 : 768;

  const { water, normals } = useMemo(() => {
    const normals = waterNormalTexture(256);
    const water = new Water(new THREE.PlaneGeometry(width, depth), {
      textureWidth: res,
      textureHeight: res,
      waterNormals: normals,
      sunDirection: new THREE.Vector3(-0.45, 0.25, 0.85).normalize(),
      sunColor: 0x4d6f94,
      waterColor: 0x02060c,
      distortionScale: 1.6,
      alpha: 1,
      fog: true,
      clipBias: 0.0005,
    });
    water.material.uniforms.size.value = 11;
    water.rotation.x = -Math.PI / 2;
    return { water, normals };
  }, [width, depth, res]);

  useEffect(
    () => () => {
      normals.dispose();
      water.geometry.dispose();
      water.material.uniforms.mirrorSampler.value?.dispose?.();
      water.material.dispose();
    },
    [water, normals],
  );

  useFrame(({ clock }) => {
    water.material.uniforms.time.value = clock.elapsedTime * 0.5;
  });

  return <primitive object={water} position={position} renderOrder={renderOrder} />;
}
