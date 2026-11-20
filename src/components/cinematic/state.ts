/**
 * The director state: plain mutable numbers that the master GSAP timeline
 * scrubs and the Three.js scenes read inside `useFrame`. Nothing here goes
 * through React state, so scrolling never triggers re-renders.
 *
 * Every scene parameter is normalised 0 → 1 so scenes stay declarative:
 * the timeline decides *when*, the scene decides *what that looks like*.
 * Deliberately free of `three` imports so it stays out of the main bundle.
 */
export function createCinematicState() {
  return {
    /** Current timeline time in units (see config.ts). */
    time: 0,
    /** Smoothed scroll velocity in px/s (signed). */
    velocity: 0,

    cam: {
      x: -3.4,
      y: 0.6,
      z: 17,
      tx: -3.4,
      ty: 0.2,
      tz: 0,
      fov: 40,
      roll: 0,
      /** Helical sway amplitude used inside the tunnel. */
      sway: 0,
      /** 0 = keep FOV (tunnel), 1 = widen/dolly to fit narrow screens. */
      fit: 1,
      /** Idle "breathing" drift while a scene is held. */
      drift: 1,
    },

    env: {
      bgR: 0.016,
      bgG: 0.035,
      bgB: 0.07,
      fogNear: 14,
      fogFar: 46,
      ambient: 0.22,
      exposure: 1,
    },

    lights: {
      keyX: 5,
      keyY: 5,
      keyZ: 9,
      key: 26,
      accentX: 0,
      accentY: 0,
      accentZ: -3,
      accent: 0,
      /** 0 = cool cyan accent light, 1 = warm white (the Personal Vault room). */
      warm: 0,
    },

    vault: { spin: 0, bolts: 0, glow: 0, unseal: 0, open: 0, beam: 0 },
    tunnel: { enter: 0, streams: 0, light: 0, exit: 0, gate: 0 },
    personal: { room: 0, shell: 1, glass: 0, cards: 0, organize: 0, notes: 0, panels: 0 },
    developer: { room: 0, shell: 1, code: 0, keys: 0, env: 0, ssh: 0, collect: 0 },
    shared: { room: 0, shell: 1, core: 0, nodes: 0, links: 0, perms: 0, transfer: 0 },
    security: { room: 0, shell: 1, env: 0, rings: 0, indicators: 0, devices: 0, score: 0, health: 0, shield: 0 },
    zk: { room: 0, shell: 1, device: 0, data: 0, encrypt: 0, travel: 0, receive: 0, reveal: 0 },
    cta: { room: 0, portal: 0, logo: 0, settle: 0 },
  };
}

export type CinematicState = ReturnType<typeof createCinematicState>;

/** Restore every value in place (the object identity is shared with the scenes). */
export function resetCinematicState(state: CinematicState) {
  const fresh = createCinematicState() as Record<string, unknown>;
  const target = state as Record<string, unknown>;
  for (const key of Object.keys(fresh)) {
    const v = fresh[key];
    if (typeof v === "object" && v !== null) Object.assign(target[key] as object, v);
    else target[key] = v;
  }
}
