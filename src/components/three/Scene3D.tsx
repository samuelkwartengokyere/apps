"use client";

import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { useEffect, useRef, useState } from "react";

type Props = {
  children: React.ReactNode;
  camera?: { position: [number, number, number]; fov?: number };
  /** Called once the first frame has been created, so the poster can fade out. */
  onReady?: () => void;
  bloom?: boolean;
  /** Soft circular edge fade (hero) or none (contained scenes). */
  fade?: boolean;
  className?: string;
};

/**
 * Shared canvas wrapper for every SecureVault scene.
 * - Renders only while on screen (frameloop "never" otherwise).
 * - Adapts resolution and drops post-processing when frame rate is poor
 *   (blueprint §10.2 / §13.4).
 * - Uses a procedural environment (no external HDR requests) which keeps the
 *   CSP simple and the third-party surface small (blueprint §12.1).
 * - Scenes receive only decorative state — never secrets (blueprint §11.4).
 */
export default function Scene3D({ children, camera, onReady, bloom = true, fade = false, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [dpr, setDpr] = useState(1.5);
  const [lowPower, setLowPower] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "120px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      aria-hidden="true"
      style={
        fade
          ? {
              maskImage: "radial-gradient(closest-side, #000 68%, transparent 100%)",
              WebkitMaskImage: "radial-gradient(closest-side, #000 68%, transparent 100%)",
            }
          : undefined
      }
    >
      <Canvas
        frameloop={visible ? "always" : "never"}
        dpr={dpr}
        camera={{ position: camera?.position ?? [0, 0, 8], fov: camera?.fov ?? 40 }}
        gl={{ antialias: !lowPower, alpha: true, powerPreference: "high-performance" }}
        onCreated={() => onReady?.()}
      >
        <PerformanceMonitor
          onDecline={() => {
            setDpr(1);
            setLowPower(true);
          }}
          onIncline={() => setDpr(1.5)}
        />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={2.2} color="#22d3ee" position={[-5, 2, 3]} scale={[6, 3, 1]} />
          <Lightformer form="rect" intensity={1.6} color="#2563eb" position={[5, -1, 2]} scale={[5, 5, 1]} />
          <Lightformer form="ring" intensity={1.2} color="#8b5cf6" position={[0, 4, -4]} scale={4} />
          <Lightformer form="rect" intensity={0.6} color="#f8fafc" position={[0, 5, 5]} scale={[8, 1, 1]} />
        </Environment>
        {children}
        {bloom && !lowPower && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur radius={0.55} intensity={0.55} luminanceThreshold={1} luminanceSmoothing={0.15} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
