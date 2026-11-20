"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VaultPoster } from "@/components/three/VaultPoster";
import { Hud } from "./Hud";
import { Overlays } from "./Overlays";
import { focusStore, useHasFocus } from "./focus";
import { finishBoot } from "./navTransition";

/** Scroll distance (px) after which a focused card lets the camera go. */
const FOCUS_SCROLL_RELEASE = 40;
import { createCinematicState } from "./state";
import { useCinematicScroll } from "./useCinematicScroll";

// The whole 3D stack (three, R3F, postprocessing and the opening scene) is a
// separate chunk; later scenes are split again inside Experience.
const Experience = dynamic(() => import("@/components/three/cinematic/Experience"), { ssr: false });

/**
 * The scroll-controlled film. Layout:
 *   section (scroll length, created by the ScrollTrigger pin spacer)
 *     └ stage (100svh, pinned)
 *         ├ poster       until the first WebGL frame
 *         ├ Experience   R3F canvas  ← reads `state`
 *         ├ Overlays     HTML copy   ← scrubbed by the same timeline
 *         └ Hud          scene index, progress, escape hatches
 */
export default function CinematicJourney({
  compact,
  stacked,
  finePointer,
  onExit,
}: {
  compact: boolean;
  stacked: boolean;
  finePointer: boolean;
  onExit: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const state = useMemo(createCinematicState, []);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  // The first load's loading screen lifts once the first WebGL frame is drawn.
  useEffect(() => {
    if (ready) finishBoot();
  }, [ready]);

  // A focused card is released by Esc or by scrolling on through the journey.
  const focused = useHasFocus();
  useEffect(() => {
    if (!focused) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && focusStore.clear();
    const onScroll = () => Math.abs(window.scrollY - focusStore.anchorY()) > FOCUS_SCROLL_RELEASE && focusStore.clear();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [focused]);
  useEffect(() => () => focusStore.clear(), []);

  const { goToLabel } = useCinematicScroll(root, stage, {
    enabled: true,
    compact,
    stacked,
    state,
    onActiveChange: setActive,
    progressBar: progress,
  });
  const onReady = useCallback(() => setReady(true), []);

  return (
    <section ref={root} id="journey" aria-label="SecureVault interactive journey" className="relative">
      <div ref={stage} className="relative h-svh w-full overflow-hidden bg-midnight">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-grid opacity-60" />
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
            <VaultPoster className="h-[min(80vw,70vh)] w-[min(80vw,70vh)] lg:translate-x-[18vw]" />
          </div>
        </div>
        <div className={`absolute inset-0 transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}>
          <Experience state={state} compact={compact} finePointer={finePointer} onReady={onReady} />
        </div>
        <div className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${focused ? "opacity-0" : "opacity-100"}`}>
          <Overlays />
        </div>
        <button
          type="button"
          onClick={() => focusStore.clear()}
          tabIndex={focused ? 0 : -1}
          aria-hidden={!focused}
          className={`absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 z-30 -translate-x-1/2 rounded-full border border-line bg-midnight/70 px-4 py-2 text-xs text-soft shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md transition duration-500 hover:border-cyan/40 hover:text-ink ${
            focused ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
          }`}
        >
          Back to the scene · Esc or scroll
        </button>
        <Hud active={active} progressRef={progress} onJump={goToLabel} onExit={onExit} />
      </div>
    </section>
  );
}
