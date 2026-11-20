"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { focusStore } from "@/components/cinematic/focus";
import { useCine } from "./kit/context";
import { BACKDROP_ORDER, bringToFront, framePose, isShown } from "./kit/focus";
import { useDisposable } from "./kit/parts";

const REF_ASPECT = 1.5;
const BACKDROP_OPACITY = 0.82;
/** Distance behind the focused card's back face. */
const BACKDROP_GAP = 0.08;
const MAX_FOV = 70;
const DEG = Math.PI / 180;

/**
 * The single camera controller. Position, target, FOV and roll come from the
 * director state (scrubbed by the master timeline); this rig only adds
 * purposeful secondary motion:
 * - helical sway inside the tunnel (`cam.sway`),
 * - a slow "breathing" drift while a scene is held (`cam.drift`),
 * - a small pointer parallax on desktop,
 * - portrait framing: widen FOV / dolly back so scenes still fit (`cam.fit`),
 * - a close-up of a card the visitor clicked (see kit/focus.ts).
 */
export function CameraRig() {
  const { state, quality } = useCine();
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const target = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const parallax = useRef({ x: 0, y: 0 });
  const focusPos = useMemo(() => new THREE.Vector3(), []);
  const focusTarget = useMemo(() => new THREE.Vector3(), []);
  const focusBlend = useRef(0);
  const focusDepth = useRef(0);
  const facing = useMemo(() => new THREE.Vector3(), []);
  const backdrop = useRef<THREE.Mesh>(null);
  const backdropMat = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: "#050b14", transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false, toneMapped: false }),
  );
  const backdropGeo = useDisposable(() => new THREE.PlaneGeometry(400, 400));
  const lifted = useRef<{ obj: THREE.Object3D; restore: () => void } | null>(null);

  useFrame(({ clock, pointer, size }, dt) => {
    const c = state.cam;
    const t = clock.elapsedTime;

    // Portrait fit: keep roughly the horizontal coverage of a 3:2 frame.
    const aspect = size.width / Math.max(size.height, 1);
    let fov = c.fov;
    let dolly = 1;
    if (aspect < REF_ASPECT && c.fit > 0) {
      const halfW = Math.tan((c.fov * DEG) / 2) * REF_ASPECT;
      const needed = 2 * Math.atan(halfW / aspect);
      const capped = Math.min(needed, MAX_FOV * DEG);
      const extra = Math.tan(needed / 2) / Math.tan(capped / 2);
      fov = THREE.MathUtils.lerp(c.fov, capped / DEG, c.fit);
      dolly = THREE.MathUtils.lerp(1, extra ** 0.7, c.fit);
    }

    const swayX = Math.sin(c.z * 0.11) * 0.55 * c.sway;
    const swayY = Math.cos(c.z * 0.085) * 0.35 * c.sway;
    const driftX = Math.sin(t * 0.31) * 0.09 * c.drift;
    const driftY = Math.sin(t * 0.23 + 1.3) * 0.06 * c.drift;

    const p = parallax.current;
    const k = 1 - Math.exp(-2.5 * dt);
    p.x += ((quality.finePointer ? pointer.x : 0) - p.x) * k;
    p.y += ((quality.finePointer ? pointer.y : 0) - p.y) * k;

    target.set(c.tx + swayX * 0.4, c.ty + swayY * 0.4, c.tz);
    pos.set(c.x + swayX + driftX + p.x * 0.3, c.y + swayY + driftY + p.y * 0.18, c.z);
    if (dolly !== 1) pos.sub(target).multiplyScalar(dolly).add(target);

    // Clicked card: ease from the directed shot to a straight-on close-up and back.
    const f = focusStore.get();
    if (f && !isShown(f)) focusStore.clear();
    const on = focusStore.get();
    if (on !== (lifted.current?.obj ?? null)) {
      lifted.current?.restore();
      lifted.current = on ? { obj: on, restore: bringToFront(on) } : null;
    }
    if (on) focusDepth.current = framePose(on, fov, aspect, pos, focusPos, focusTarget);
    focusBlend.current += ((on ? 1 : 0) - focusBlend.current) * (1 - Math.exp(-3 * dt));
    const e = THREE.MathUtils.smoothstep(focusBlend.current, 0, 1);
    if (e > 0.0005) {
      pos.lerp(focusPos, e);
      target.lerp(focusTarget, e);
    }

    // Lightbox: dim everything but the focused card (drawn after the backdrop) so glass cards stay legible.
    const bd = backdrop.current;
    if (bd) {
      bd.visible = e > 0.01;
      if (bd.visible) {
        facing.copy(focusPos).sub(focusTarget).normalize();
        bd.position.copy(focusTarget).addScaledVector(facing, -(focusDepth.current + BACKDROP_GAP));
        bd.lookAt(focusPos);
        backdropMat.opacity = BACKDROP_OPACITY * e;
      }
    }

    camera.position.copy(pos);
    camera.lookAt(target);
    const roll = (c.roll + Math.sin(c.z * 0.11 + 0.6) * 0.06 * c.sway) * (1 - e);
    if (roll) camera.rotateZ(roll);

    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return <mesh ref={backdrop} geometry={backdropGeo} material={backdropMat} renderOrder={BACKDROP_ORDER} visible={false} frustumCulled={false} />;
}
