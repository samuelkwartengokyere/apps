"use client";

import { useEffect } from "react";
import { SCENES } from "./config";
import { useNavState } from "./navTransition";

/** Slices stacked in depth to give each ring real thickness. */
const SLICES = 5;
const SLICE_GAP = 2.6;

/** Dust drifting through the overhead light; fixed values so server and client agree. */
const MOTES = Array.from({ length: 16 }, (_, i) => ({
  left: 8 + ((i * 53) % 84),
  size: 1 + (i % 3),
  delay: -((i * 1.7) % 9),
  dur: 7 + ((i * 3) % 6),
}));

/** Packets of light running along a strip; staggered so there is always one on the way. */
function Pulses({ side }: { side?: "l" | "r" }) {
  const n = side === "r" ? 1 : 0;
  return (
    <>
      {[0, 1, 2].map((i) => (
        <i key={i} className="nt-pulse" style={{ animationDelay: `${(-(i * 1.07 + n * 0.5)).toFixed(2)}s` }} />
      ))}
    </>
  );
}

/** One steel ring with an extruded body: a stack of identical discs along its axis. */
function Ring({ name }: { name: "a" | "b" | "c" }) {
  return (
    <>
      {Array.from({ length: SLICES }, (_, i) => {
        const mid = (SLICES - 1) / 2;
        const edge = Math.abs(i - mid) / mid; // 0 in the middle, 1 on the faces
        return (
          <span
            key={i}
            className={`nt-slice nt-slice-${name}`}
            style={{ "--z": `${((i - mid) * SLICE_GAP).toFixed(2)}px`, "--dark": (0.3 * (1 - edge)).toFixed(2) } as React.CSSProperties}
          />
        );
      })}
    </>
  );
}

/**
 * The site's loading screens. Both are driven by navStore and share its phases.
 *
 * First load (`boot`): three nested steel rings turning on different axes around
 * a glowing core, hovering in a long glowing hall in real perspective (light
 * strips racing to a distant doorway, a ceiling lamp, a wet polished floor holding
 * their reflection, and a haze in the air). When the page is ready the camera
 * pushes into the core and the room dissolves into the page. Server-rendered in
 * its covering state, so it is in the very first paint; lifted by finishBoot
 * (HomeBody / CinematicJourney).
 *
 * Nav jumps (see useCinematicScroll) and refreshes: just a circular spinner over
 * the page, which blurs while the camera jumps behind it (or the page loads) and
 * sharpens again once the destination is on screen. A refresh is marked on <html>
 * before the first paint (see LANDING_SCRIPT), and CSS then swaps the hall for
 * this screen.
 *
 * No text; the destination is announced to screen readers through the
 * aria-label. Everything that moves is a transform, an opacity or a filter, so
 * it keeps running on the compositor even while the main thread is busy.
 */
export function SectionTransition() {
  const { phase, to, boot } = useNavState();
  const active = phase !== "idle";

  // Hold the page still while the camera jumps behind the screen.
  useEffect(() => {
    if (!active) return;
    const stop = (e: Event) => e.preventDefault();
    const stopKeys = (e: KeyboardEvent) => ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(e.key) && e.preventDefault();
    addEventListener("wheel", stop, { passive: false });
    addEventListener("touchmove", stop, { passive: false });
    addEventListener("keydown", stopKeys);
    return () => {
      removeEventListener("wheel", stop);
      removeEventListener("touchmove", stop);
      removeEventListener("keydown", stopKeys);
    };
  }, [active]);

  const hallPhase = boot ? phase : "idle";

  return (
    <>
    <div id="loading-screen" className="nt" data-phase={hallPhase} role="status" aria-live="polite" aria-hidden={hallPhase === "idle"} aria-label="Loading SecureVault">
      <div className="nt-world" aria-hidden="true">
        {/* The hall: glass-and-steel walls, a ceiling lamp, a wet floor, and a lit doorway at the far end */}
        <div className="nt-haze" />
        <div className="nt-hall">
          <div className="nt-plane nt-floor">
            {(["l", "r"] as const).map((side) => (
              <span key={side} className={`nt-strip nt-strip-floor ${side}`}>
                <Pulses side={side} />
              </span>
            ))}
          </div>
          <div className="nt-plane nt-ceil">
            <span className="nt-lamp" />
            <Pulses />
          </div>
          {(["l", "r"] as const).map((side) => (
            <div key={side} className={`nt-plane nt-wall nt-wall-${side}`}>
              <span className="nt-strip nt-strip-wall">
                <Pulses side={side} />
              </span>
              <span className="nt-strip nt-strip-wall nt-strip-amber" />
            </div>
          ))}
          <div className="nt-portal" />
        </div>
        <div className="nt-air">
          {MOTES.map((m, i) => (
            <span key={i} className="nt-mote" style={{ left: `${m.left}%`, width: m.size, height: m.size, animationDelay: `${m.delay}s`, animationDuration: `${m.dur}s` }} />
          ))}
        </div>

        {/* The object, hovering above its own pool of light on the floor */}
        <div className="nt-pool" />
        <div className="nt-stage">
          <div className="nt-halo" />
          <div className="nt-obj">
            <div className="nt-gimbal nt-gimbal-a">
              <Ring name="a" />
              <div className="nt-gimbal nt-gimbal-b">
                <Ring name="b" />
                <div className="nt-gimbal nt-gimbal-c">
                  <Ring name="c" />
                  <span className="nt-eye" />
                </div>
              </div>
            </div>
            <span className="nt-core" />
          </div>
          <div className="nt-shadow" />
        </div>
      </div>

      <div className="nt-fog" aria-hidden="true" />
      <div className="nt-flash" aria-hidden="true" />
    </div>

    <div
      className="nv"
      data-phase={phase}
      data-boot={boot ? "" : undefined}
      role="status"
      aria-live="polite"
      aria-hidden={phase === "idle"}
      aria-label={boot ? "Loading SecureVault" : `Going to ${SCENES[to].title}`}
    >
      <div className="nv-loader" aria-hidden="true">
        <span className="nv-halo" />
        <span className="nv-track" />
        <span className="nv-spin">
          <span className="nv-arc" />
          <span className="nv-dot" />
        </span>
      </div>
    </div>
    </>
  );
}
