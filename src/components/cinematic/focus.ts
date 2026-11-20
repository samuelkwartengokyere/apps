import { useSyncExternalStore } from "react";
import type { Object3D } from "three";

/**
 * Which 3D card the camera is looking at, if any. Written by click handlers in
 * the scenes, read every frame by the camera rig and by the HTML layer (to
 * step its copy aside while a card is in focus).
 */
let target: Object3D | null = null;
let anchorY = 0;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

export const focusStore = {
  get: () => target,
  /** Scroll offset when focus began; scrolling away from it releases focus. */
  anchorY: () => anchorY,
  toggle(o: Object3D) {
    target = target === o ? null : o;
    anchorY = window.scrollY;
    emit();
  },
  clear() {
    if (!target) return;
    target = null;
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};

export function useHasFocus() {
  return useSyncExternalStore(
    focusStore.subscribe,
    () => target !== null,
    () => false,
  );
}
