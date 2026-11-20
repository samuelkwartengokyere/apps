"use client";

import { createContext, useContext } from "react";
import type { CinematicState } from "@/components/cinematic/state";

export type Quality = {
  /** Phone-sized viewport: fewer particles, simpler geometry, no post-processing. */
  compact: boolean;
  /** Frame rate dropped: post-processing and some extras are disabled. */
  low: boolean;
  finePointer: boolean;
};

type Cine = { state: CinematicState; quality: Quality };

export const CineContext = createContext<Cine | null>(null);

export function useCine(): Cine {
  const v = useContext(CineContext);
  if (!v) throw new Error("useCine must be used inside the cinematic Experience");
  return v;
}

/** Particle/instance count scaled for the device tier. */
export function useCount(desktop: number, compactRatio = 0.4) {
  const { quality } = useCine();
  return quality.compact ? Math.round(desktop * compactRatio) : desktop;
}
