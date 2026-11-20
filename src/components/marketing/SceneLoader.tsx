"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { useCapabilities } from "@/lib/useCapabilities";
import { VaultPoster } from "@/components/three/VaultPoster";

// 3D code is split from the marketing HTML and loaded only when needed.
const HeroScene = dynamic(() => import("@/components/three/HeroScene"), { ssr: false });
const TunnelScene = dynamic(() => import("@/components/three/TunnelScene"), { ssr: false });

export function HeroVisual() {
  const caps = useCapabilities();
  const [ready, setReady] = useState(false);
  const live = caps.ready && caps.webgl && !caps.reducedMotion;

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[540px] lg:max-w-none">
      <VaultPoster
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${live && ready ? "opacity-0" : "opacity-100"}`}
      />
      {live && (
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <HeroScene parallax={caps.finePointer} compact={caps.compact} onReady={() => setReady(true)} />
        </div>
      )}
    </div>
  );
}

export function TunnelVisual() {
  const caps = useCapabilities();
  const live = caps.ready && caps.webgl && !caps.reducedMotion;

  if (!live) {
    return (
      <svg viewBox="0 0 800 260" className="h-full w-full" fill="none" aria-hidden="true">
        {[150, 250, 350, 450, 550].map((x, i) => (
          <ellipse key={x} cx={x} cy="130" rx="16" ry={80 - i * 4} stroke={i < 2 ? "#60A5FA" : "#22D3EE"} strokeOpacity="0.7" />
        ))}
        <path d="M20 130h640" stroke="#22D3EE" strokeOpacity="0.5" strokeDasharray="6 8" className="anim-flow" />
        <circle cx="700" cy="130" r="58" fill="#0F2236" stroke="#2C5A85" strokeWidth="5" />
        <circle cx="700" cy="130" r="38" stroke="#22D3EE" />
      </svg>
    );
  }
  return <TunnelScene compact={caps.compact} />;
}
