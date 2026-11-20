"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useCine } from "./kit/context";

/**
 * Background, fog and the shared light rig. The light count never changes
 * (so shaders never recompile mid-scroll); the timeline moves and dims them
 * instead. The key light rides with the camera; the accent light is placed
 * at each scene's focal point.
 */
export function Atmosphere() {
  const { state } = useCine();
  const scene = useThree((s) => s.scene);
  const bg = useMemo(() => new THREE.Color(), []);
  const fog = useMemo(() => new THREE.Fog("#050c18", 14, 46), []);
  const cool = useMemo(() => new THREE.Color("#5bb8cc"), []);
  const warmWhite = useMemo(() => new THREE.Color("#ffe6c4"), []);
  const ambient = useRef<THREE.AmbientLight>(null);
  const key = useRef<THREE.PointLight>(null);
  const accent = useRef<THREE.PointLight>(null);

  useEffect(() => {
    scene.background = bg;
    scene.fog = fog;
    return () => {
      scene.background = null;
      scene.fog = null;
    };
  }, [scene, bg, fog]);

  useFrame(({ camera }) => {
    const e = state.env;
    bg.setRGB(e.bgR, e.bgG, e.bgB, THREE.SRGBColorSpace);
    fog.color.copy(bg);
    fog.near = e.fogNear;
    fog.far = e.fogFar;
    if (ambient.current) ambient.current.intensity = e.ambient;

    const l = state.lights;
    if (key.current) {
      key.current.position.set(camera.position.x + 3, camera.position.y + 3, camera.position.z + 1);
      key.current.intensity = l.key;
    }
    if (accent.current) {
      accent.current.position.set(l.accentX, l.accentY, l.accentZ);
      accent.current.intensity = l.accent;
      accent.current.color.copy(cool).lerp(warmWhite, l.warm);
    }
  });

  return (
    <>
      <ambientLight ref={ambient} color="#b8c6d6" />
      <directionalLight position={[4, 8, 6]} intensity={0.6} color="#dfe8f2" />
      <pointLight ref={key} color="#d2e2f0" distance={40} decay={1.6} />
      <pointLight ref={accent} color="#5bb8cc" distance={30} decay={1.6} />
    </>
  );
}
