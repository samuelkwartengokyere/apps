import { useSyncExternalStore } from "react";
import { closeRestoreWindow, isReload } from "./landing";

/**
 * State of the site's two loading screens, which share these phases:
 *  - the first load (`boot`): the rings in the hall, until the page is ready;
 *    on a refresh, the nav screen below instead
 *  - a nav item (header, footer, side dots, buttons) taking the visitor to
 *    another section of the journey: a spinner over the blurred page
 */
export type NavPhase = "idle" | "cover" | "reveal";
export type NavState = {
  phase: NavPhase;
  from: number;
  to: number;
  /** True while the screen is covering the first load rather than a section jump. */
  boot: boolean;
};

/** The first load starts covered, so the screen is part of the server-rendered first paint. */
let state: NavState = { phase: "cover", from: 0, to: 0, boot: true };
/** Bumped on every jump, so the renderer can count frames drawn since then. */
let epoch = 0;
/** True once the scenes visible at the new position have loaded and drawn a few frames. */
let settled = false;
const listeners = new Set<() => void>();

const set = (next: Partial<NavState>) => {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
};

/** First load: the screen stays up at least this long (ms since navigation), so it never flashes by. */
const BOOT_MIN_MS = 1500;
const BOOT_MIN_REDUCED_MS = 500;
/** A refresh gets the quick spinner screen, so it needs less time to read as intentional. */
const BOOT_MIN_RELOAD_MS = 700;
/** Never keep a visitor waiting longer than this, whatever is still loading. */
const BOOT_MAX_MS = 12000;
/** Length of the reveal animations (see .nt-* and .nv-* in globals.css). */
export const REVEAL_MS = 1100;
export const NAV_REVEAL_MS = 500;

let bootFinishing = false;

/** The first screen is ready: lift the loading screen (after its minimum time). */
export function finishBoot() {
  if (bootFinishing) return;
  bootFinishing = true;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const reload = isReload();
  const min = reduced ? BOOT_MIN_REDUCED_MS : reload ? BOOT_MIN_RELOAD_MS : BOOT_MIN_MS;
  const wait = Math.max(0, min - performance.now());
  setTimeout(() => {
    closeRestoreWindow();
    // A nav jump may have taken the screen over in the meantime.
    if (!state.boot) return;
    set({ phase: "reveal" });
    setTimeout(() => {
      if (state.boot) set({ phase: "idle", boot: false });
    }, reload ? NAV_REVEAL_MS : REVEAL_MS);
  }, wait);
}
if (typeof window !== "undefined") setTimeout(finishBoot, BOOT_MAX_MS);

export const navStore = {
  get: () => state,
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  begin(from: number, to: number) {
    set({ phase: "cover", from, to, boot: false });
  },
  retarget(to: number) {
    set({ to, boot: false });
  },
  end() {
    set({ phase: "reveal" });
  },
  idle() {
    set({ phase: "idle" });
  },
  /** Called right before the camera jumps. */
  markJump() {
    epoch++;
    settled = false;
  },
  epoch: () => epoch,
  isSettled: () => settled,
  setSettled(v: boolean) {
    settled = v;
  },
};

export function useNavState() {
  return useSyncExternalStore(navStore.subscribe, navStore.get, navStore.get);
}
