"use client";

import { useEffect, useState } from "react";

export type Capabilities = {
  ready: boolean;
  webgl: boolean;
  reducedMotion: boolean;
  /** Narrow viewport: render a simplified, cheaper scene. */
  compact: boolean;
  /** Below the `lg` breakpoint: copy sits in a bottom sheet instead of a side column. */
  stacked: boolean;
  finePointer: boolean;
};

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/**
 * Progressive-enhancement probe (blueprint §2, §13). Until `ready` is true the
 * caller should render the static fallback so SSR and first paint are stable.
 */
export function useCapabilities(): Capabilities {
  const [caps, setCaps] = useState<Capabilities>({
    ready: false,
    webgl: false,
    reducedMotion: true,
    compact: false,
    stacked: false,
    finePointer: false,
  });

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const stackedQuery = window.matchMedia("(max-width: 1023px)");
    const pointer = window.matchMedia("(pointer: fine)");
    const webgl = hasWebGL();

    const update = () =>
      setCaps({
        ready: true,
        webgl,
        reducedMotion: motion.matches,
        compact: narrow.matches,
        stacked: stackedQuery.matches,
        finePointer: pointer.matches,
      });

    update();
    motion.addEventListener("change", update);
    narrow.addEventListener("change", update);
    stackedQuery.addEventListener("change", update);
    pointer.addEventListener("change", update);
    return () => {
      motion.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
      stackedQuery.removeEventListener("change", update);
      pointer.removeEventListener("change", update);
    };
  }, []);

  return caps;
}
