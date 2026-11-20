/** localStorage: the visitor chose the simple page. */
export const SIMPLE_PAGE_KEY = "sv-simple-page";

/**
 * Runs in <head>. The browser must neither put the visitor back where it thinks
 * they were (a pinned journey has no height yet when it tries; we restore the
 * place ourselves, see below) nor scroll to a #section link before any component
 * could stop it.
 *
 * It also marks a refresh (`data-load="reload"` on <html>) before the first
 * paint, so the loading screen can be chosen in CSS: a fresh visit opens with the
 * rings in the hall, a refresh with the quick blur-and-spinner screen.
 */
export const LANDING_SCRIPT = `try{history.scrollRestoration="manual";if(location.hash)history.replaceState(null,"",location.pathname+location.search)}catch(e){}try{var n=performance.getEntriesByType("navigation")[0];if(n&&n.type==="reload")document.documentElement.dataset.load="reload"}catch(e){}`;

/** True when this page load is a refresh of the page the visitor was on. */
export function isReload() {
  return document.documentElement.dataset.load === "reload";
}

/** Opens at the very top: forgets any restored scroll position or section link. */
export function landOnTop() {
  window.scrollTo({ top: 0, behavior: "instant" });
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
}

/**
 * Where the visitor was, remembered per tab so a refresh puts them back on the
 * same page. In the journey that is the progress through it (so it survives a
 * different window height) plus any distance scrolled below it; on the plain
 * page it is the scroll offset.
 */
export type SavedPosition = { mode: "journey"; p: number; extra: number } | { mode: "static"; y: number };

const POSITION_KEY = "sv-position";
/**
 * The saved place only counts while the refresh's loading screen is up. (Not
 * "once": development builds mount effects twice, and the journey is also rebuilt
 * if the window crosses a breakpoint later, which must not jump back here.)
 */
let restoreOpen = true;

/** The first screen is up: later rebuilds of the page must not go back to the saved place. */
export function closeRestoreWindow() {
  restoreOpen = false;
}

/** Keeps the position written whenever the page is left or refreshed. Returns the cleanup. */
export function rememberPosition(read: () => SavedPosition | null) {
  const save = () => {
    const pos = read();
    if (!pos) return;
    try {
      sessionStorage.setItem(POSITION_KEY, JSON.stringify(pos));
    } catch {
      /* storage unavailable: a refresh simply opens at the top */
    }
  };
  const onHide = () => document.visibilityState === "hidden" && save();
  addEventListener("pagehide", save);
  document.addEventListener("visibilitychange", onHide);
  return () => {
    removeEventListener("pagehide", save);
    document.removeEventListener("visibilitychange", onHide);
  };
}

/**
 * The remembered position, only on a refresh (a new visit opens at the
 * top) and only if it was saved by the same presentation (journey or plain page).
 */
export function takeSavedPosition<M extends SavedPosition["mode"]>(mode: M): Extract<SavedPosition, { mode: M }> | null {
  if (!restoreOpen || !isReload()) return null;
  try {
    const pos = JSON.parse(sessionStorage.getItem(POSITION_KEY) ?? "null") as SavedPosition | null;
    if (!pos || pos.mode !== mode) return null;
    return pos as Extract<SavedPosition, { mode: M }>;
  } catch {
    return null;
  }
}
