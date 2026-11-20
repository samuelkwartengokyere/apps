"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCallback, useEffect, useRef } from "react";
import { COMPACT_SCROLL_SCALE, HASH_TO_LABEL, TOTAL_UNITS, sceneIndexAt } from "./config";
import { type CinematicState, resetCinematicState } from "./state";
import { focusStore } from "./focus";
import { NAV_REVEAL_MS, navStore } from "./navTransition";
import { rememberPosition, takeSavedPosition } from "./landing";
import { buildJourneyTimeline } from "./timeline";

gsap.registerPlugin(ScrollTrigger, useGSAP);
// Mobile URL-bar show/hide must not re-measure (and jump) the pinned journey.
ScrollTrigger.config({ ignoreMobileResize: true });

/** A nav jump shorter than this many screens just scrolls; longer ones get the transition screen. */
const HOP_SCREENS = 1.2;
/** Time for the screen to cover the page before the camera jumps (ms). */
const NAV_COVER_MS = 480;
/** The screen stays up at least this long in total, and at most this long if a scene is slow. */
const NAV_MIN_MS = 1000;
const NAV_MAX_MS = 6000;

type Options = {
  enabled: boolean;
  compact: boolean;
  stacked: boolean;
  state: CinematicState;
  onActiveChange: (index: number) => void;
  /** Element whose transform shows overall progress (no React re-render). */
  progressBar: React.RefObject<HTMLElement | null>;
};

/**
 * Owns the one ScrollTrigger that pins the stage and scrubs the master
 * timeline, plus everything that keeps a pinned journey usable: hash links,
 * deep links, scroll restoration and keeping progress stable on resize.
 */
export function useCinematicScroll(
  root: React.RefObject<HTMLElement | null>,
  stage: React.RefObject<HTMLElement | null>,
  { enabled, compact, stacked, state, onActiveChange, progressBar }: Options,
) {
  const api = useRef<{ st: ScrollTrigger; tl: gsap.core.Timeline } | null>(null);
  const activeRef = useRef(-1);
  const onActive = useRef(onActiveChange);
  onActive.current = onActiveChange;

  useGSAP(
    () => {
      if (!enabled || !root.current || !stage.current) return;
      resetCinematicState(state);
      const q = gsap.utils.selector(root.current);
      const tl = buildJourneyTimeline(state, q, { stacked });
      const scale = compact ? COMPACT_SCROLL_SCALE : 1;

      const st = ScrollTrigger.create({
        trigger: stage.current,
        start: "top top",
        end: () => `+=${Math.round(window.innerHeight * TOTAL_UNITS * scale)}`,
        pin: true,
        anticipatePin: 1,
        scrub: compact ? 0.6 : 1,
        animation: tl,
        onUpdate(self) {
          state.velocity = self.getVelocity();
        },
      });

      tl.eventCallback("onUpdate", () => {
        state.time = tl.time();
        const bar = progressBar.current;
        if (bar) bar.style.transform = `scaleY(${tl.progress().toFixed(4)})`;
        const idx = sceneIndexAt(state.time);
        if (idx !== activeRef.current) {
          activeRef.current = idx;
          onActive.current(idx);
        }
      });

      api.current = { st, tl };

      // A refresh puts the visitor back where they were in the journey.
      const place = takeSavedPosition("journey");
      if (place) {
        // The pin's length is only known once ScrollTrigger has measured the page.
        ScrollTrigger.refresh();
        jumpInstant(st, tl, st.start + place.p * (st.end - st.start) + place.extra);
      }

      // Keep the same journey progress when the viewport size changes.
      let saved = -1;
      const onRefreshInit = () => {
        saved = st.progress > 0 && st.progress < 1 ? st.progress : -1;
      };
      const onRefresh = () => {
        if (saved < 0) return;
        window.scrollTo({ top: st.start + saved * (st.end - st.start), behavior: "instant" });
        saved = -1;
      };
      ScrollTrigger.addEventListener("refreshInit", onRefreshInit);
      ScrollTrigger.addEventListener("refresh", onRefresh);

      return () => {
        ScrollTrigger.removeEventListener("refreshInit", onRefreshInit);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        api.current = null;
        activeRef.current = -1;
      };
    },
    { scope: root, dependencies: [enabled, compact, stacked], revertOnUpdate: true },
  );

  const run = useRef(0);

  /**
   * Take the visitor to a timeline label. Short hops scroll smoothly; anything
   * further runs behind the section transition screen: cover, jump, wait for the
   * target scene to load and draw, reveal. Nothing streams past mid-load.
   */
  const goToLabel = useCallback(
    (label: string) => {
      const a = api.current;
      if (!a) return false;
      const y = a.st.labelToScroll(label);
      if (Math.abs(y - window.scrollY) <= window.innerHeight * HOP_SCREENS) {
        window.scrollTo({ top: y, behavior: "smooth" });
        return true;
      }

      const p = gsap.utils.clamp(0, 1, (y - a.st.start) / (a.st.end - a.st.start));
      const to = sceneIndexAt(p * a.tl.duration());
      const id = ++run.current;
      const alive = () => run.current === id && api.current === a;
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

      void (async () => {
        const t0 = performance.now();
        const busy = navStore.get().phase === "cover";
        if (busy) navStore.retarget(to);
        else navStore.begin(Math.max(activeRef.current, 0), to);
        if (!busy) await wait(NAV_COVER_MS);
        if (!alive()) return;

        focusStore.clear();
        navStore.markJump();
        jumpInstant(a.st, a.tl, y);
        // Hold until the scene is really on screen (or give up), and never flash by.
        while (alive() && !navStore.isSettled() && performance.now() - t0 < NAV_MAX_MS) await wait(50);
        if (!alive()) return;
        await wait(Math.max(0, NAV_MIN_MS - (performance.now() - t0)));
        if (!alive()) return;
        navStore.end();
        await wait(NAV_REVEAL_MS);
        if (alive()) navStore.idle();
      })();
      return true;
    },
    [],
  );

  // Remember the place in the journey, so a refresh opens on the same page.
  useEffect(() => {
    if (!enabled) return;
    return rememberPosition(() => {
      const st = api.current?.st;
      if (!st) return null;
      return {
        mode: "journey",
        p: gsap.utils.clamp(0, 1, (window.scrollY - st.start) / (st.end - st.start)),
        extra: Math.max(0, window.scrollY - st.end),
      };
    });
  }, [enabled]);

  // Intercept in-page links (header, footer, CTA, HUD) and deep links.
  useEffect(() => {
    if (!enabled) return;
    const html = document.documentElement;
    html.dataset.cinematic = "";
    const prevRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href^='#']");
      if (!link) return;
      const hash = link.getAttribute("href")!.slice(1);
      const label = HASH_TO_LABEL[hash];
      if (!label || !goToLabel(label)) return;
      e.preventDefault();
      history.replaceState(null, "", hash === "top" ? location.pathname + location.search : `#${hash}`);
    };
    const onHashChange = () => {
      const label = HASH_TO_LABEL[decodeURIComponent(location.hash.slice(1))];
      if (label) goToLabel(label);
    };

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", onHashChange);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", onHashChange);
      history.scrollRestoration = prevRestoration;
      delete html.dataset.cinematic;
    };
  }, [enabled, goToLabel]);

  return { goToLabel };
}

/** Jump without a scrubbed fast-forward (used for deep links / restoration). */
function jumpInstant(st: ScrollTrigger, tl: gsap.core.Timeline, y: number) {
  window.scrollTo({ top: y, behavior: "instant" });
  const p = gsap.utils.clamp(0, 1, (y - st.start) / (st.end - st.start));
  tl.progress(p);
  st.update();
}
