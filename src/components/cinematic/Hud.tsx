"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SCENES } from "./config";

/**
 * Persistent journey controls: scene index (jump to any scene), scroll
 * progress, and escape hatches for people who don't want the animated
 * version. Only `active` is React state; progress is written straight to the
 * DOM by the scroll controller.
 */
export function Hud({
  active,
  progressRef,
  onJump,
  onExit,
}: {
  active: number;
  progressRef: React.RefObject<HTMLDivElement | null>;
  onJump: (label: string) => void;
  onExit: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <a
        href="#after-journey"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("after-journey")?.scrollIntoView({ behavior: "instant" });
        }}
        className="pointer-events-auto absolute left-4 top-20 z-50 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white sr-only focus:not-sr-only"
      >
        Skip the animated journey
      </a>

      <nav
        aria-label="Journey scenes"
        className="absolute right-3 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-1 md:flex lg:right-5"
      >
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onJump(s.id)}
            aria-label={`Jump to ${s.title}`}
            aria-current={i === active ? "step" : undefined}
            className="group pointer-events-auto flex items-center gap-3 py-1.5 pl-3"
          >
            <span
              className={`font-mono text-[11px] uppercase tracking-widest transition-all duration-300 ${
                i === active ? "translate-x-0 text-cyan opacity-0 min-[1760px]:opacity-100" : "translate-x-1 text-muted opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              {s.title}
            </span>
            <span
              className={`block rounded-full transition-all duration-300 ${
                i === active ? "h-2.5 w-2.5 bg-cyan shadow-[0_0_12px_#22d3ee]" : "h-1.5 w-1.5 bg-muted/60 group-hover:bg-ink"
              }`}
            />
          </button>
        ))}
      </nav>

      <div className="absolute inset-y-24 left-0 hidden w-px bg-line md:block lg:left-1" aria-hidden="true">
        <div ref={progressRef} className="h-full w-px origin-top bg-cyan shadow-[0_0_10px_#22d3ee]" style={{ transform: "scaleY(0)" }} />
      </div>

      <div className="absolute right-3 top-[4.5rem] md:hidden">
        <AnimatePresence mode="wait">
          <motion.span
            key={active}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="block rounded-full border border-line bg-midnight/70 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan backdrop-blur"
          >
            {active + 1}/{SCENES.length} · {SCENES[active]?.title}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={onExit}
        className="pointer-events-auto absolute bottom-4 right-4 hidden rounded-full border border-line bg-midnight/60 px-4 py-2 text-xs text-muted shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md transition hover:border-cyan/40 hover:text-ink md:block lg:right-6"
      >
        Switch to simple page
      </button>
    </div>
  );
}
