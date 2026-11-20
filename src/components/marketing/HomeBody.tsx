"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { SIMPLE_PAGE_KEY, landOnTop, rememberPosition, takeSavedPosition } from "@/components/cinematic/landing";
import { finishBoot } from "@/components/cinematic/navTransition";
import { useCapabilities } from "@/lib/useCapabilities";
import { Features } from "./Features";
import { Hero } from "./Hero";
import { HowItWorks } from "./HowItWorks";
import { TrustStrip } from "./TrustStrip";
import { ZeroKnowledge } from "./ZeroKnowledge";
import { Cta } from "./CtaFooter";

const CinematicJourney = dynamic(() => import("@/components/cinematic/CinematicJourney"), { ssr: false });

const OPT_OUT_KEY = SIMPLE_PAGE_KEY;

type NavigatorHints = Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };

/** Hardware that would struggle with the full-screen 3D film gets the simple page. */
function isLowEnd() {
  const n = navigator as NavigatorHints;
  return (n.deviceMemory !== undefined && n.deviceMemory <= 2) || n.hardwareConcurrency <= 2 || n.connection?.saveData === true;
}

/** The ordinary, fully static sections: SSR output, reduced-motion and no-WebGL presentation. */
function StaticSections() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <Features />
      <ZeroKnowledge />
      <HowItWorks />
      <Cta />
    </>
  );
}

/**
 * Chooses the presentation. The server (and first client render) always emit
 * the static sections so the page is complete without JavaScript or WebGL;
 * capable, motion-OK visitors are then upgraded to the scroll-driven journey.
 */
export function HomeBody() {
  const caps = useCapabilities();
  const [optedOut, setOptedOut] = useState(false);
  const [lowEnd, setLowEnd] = useState(false);

  useEffect(() => {
    landOnTop();
    setOptedOut(localStorage.getItem(OPT_OUT_KEY) === "1");
    setLowEnd(isLowEnd());
  }, []);

  const exit = useCallback(() => {
    localStorage.setItem(OPT_OUT_KEY, "1");
    setOptedOut(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  }, []);

  const cinematic = caps.ready && caps.webgl && !caps.reducedMotion && !optedOut && !lowEnd;

  useEffect(() => {
    if (!caps.ready) return;
    // The plain page has nothing more to wait for; the journey reports when its first frame is drawn.
    if (cinematic) return;
    // A refresh puts the visitor back where they were.
    const saved = takeSavedPosition("static");
    if (saved) window.scrollTo({ top: saved.y, behavior: "instant" });
    finishBoot();
    return rememberPosition(() => ({ mode: "static", y: window.scrollY }));
  }, [caps.ready, cinematic]);

  if (!cinematic) {
    return (
      <>
        <StaticSections />
        {caps.ready && caps.webgl && !caps.reducedMotion && optedOut && (
          <div className="mx-auto max-w-7xl px-5 pb-10 text-center sm:px-8">
            <button
              type="button"
              className="rounded-lg border border-line px-4 py-2 text-sm text-muted transition hover:text-ink"
              onClick={() => {
                localStorage.removeItem(OPT_OUT_KEY);
                setOptedOut(false);
                window.scrollTo({ top: 0, behavior: "instant" });
              }}
            >
              Switch back to the animated journey
            </button>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <CinematicJourney key={`${caps.compact}-${caps.stacked}`} compact={caps.compact} stacked={caps.stacked} finePointer={caps.finePointer} onExit={exit} />
      <div id="after-journey" />
    </>
  );
}
