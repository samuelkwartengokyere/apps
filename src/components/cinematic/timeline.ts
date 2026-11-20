import { gsap } from "gsap";
import { SCENE_START, TOTAL_UNITS, TUNNEL_CARDS, TUNNEL_EXTRA, cardSide } from "./config";
import type { CinematicState } from "./state";

type Selector = (sel: string) => Element[];
type CamKey = Partial<Pick<CinematicState["cam"], "x" | "y" | "z" | "tx" | "ty" | "tz">>;

/**
 * The master choreography. One scrubbed timeline drives the camera, lights,
 * every 3D scene parameter and the HTML overlays, so scroll position is the
 * only clock and reverse scrolling simply plays it backwards.
 *
 * Rules that keep scrubbing stable:
 * - only `.to()` tweens (start values are recorded in timeline order, so
 *   jumping to any point renders every earlier tween first);
 * - camera position tweens never overlap each other;
 * - overlays start hidden via `gsap.set` and use autoAlpha so hidden copy is
 *   also removed from the tab order.
 */
export function buildJourneyTimeline(state: CinematicState, q: Selector, { stacked }: { stacked: boolean }) {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.inOut" } });
  // Every scene after the tunnel is authored at its original time and pushed
  // back by TUNNEL_EXTRA once, below, so its label times are taken pre-shift.
  const S = { ...SCENE_START };
  for (const id of ["personal", "developer", "shared", "security", "zk", "cta"] as const) S[id] -= TUNNEL_EXTRA;

  // Framing helpers: desktop pushes the subject away from the copy column,
  // mobile lifts it above the bottom copy sheet.
  const side = (dx: number) => (stacked ? 0 : dx);
  const lift = (dy: number, m = 1.25) => (stacked ? dy - m : dy);

  Object.assign(state.cam, {
    x: side(-5),
    // Slightly high and tilted down, so the vault's polished floor is in frame.
    y: stacked ? 1.2 : 1.3,
    z: stacked ? 19 : 17,
    tx: side(-5),
    ty: stacked ? 2.3 : -0.8,
    tz: 0,
  });

  const cam = (at: number, dur: number, to: CamKey, ease = "power2.inOut") =>
    tl.to(state.cam, { ...to, duration: dur, ease }, at);
  const fov = (at: number, dur: number, value: number, ease = "sine.inOut") =>
    tl.to(state.cam, { fov: value, duration: dur, ease }, at);
  const set = <T extends object>(target: T, at: number, dur: number, vars: Partial<Record<keyof T, number>>, ease = "power2.inOut") =>
    tl.to(target, { ...vars, duration: dur, ease }, at);
  const env = (at: number, dur: number, bg: [number, number, number], fogNear: number, fogFar: number, ambient = 0.22) =>
    set(state.env, at, dur, { bgR: bg[0], bgG: bg[1], bgB: bg[2], fogNear, fogFar, ambient }, "sine.inOut");
  const accent = (at: number, pos: [number, number, number], intensity: number) =>
    set(state.lights, at, 0.2, { accentX: pos[0], accentY: pos[1], accentZ: pos[2], accent: intensity }, "sine.inOut");

  // ---- HTML overlays -------------------------------------------------------
  const block = (name: string) => q(`[data-cine="${name}"]`);
  const lines = (name: string) => q(`[data-cine="${name}"] [data-line]`);

  gsap.set(q("[data-cine]"), { autoAlpha: 0, y: 30 });
  gsap.set(q("[data-cine] [data-line]"), { autoAlpha: 0, y: 26, clipPath: "inset(0% 0% 100% 0%)" });
  gsap.set([...block("vault-hero"), ...block("scroll-hint")], { autoAlpha: 1, y: 0 });
  gsap.set([...lines("vault-hero"), ...lines("scroll-hint")], { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)" });

  const show = (name: string, at: number, dur = 0.16) => {
    tl.to(block(name), { autoAlpha: 1, y: 0, duration: dur * 0.6, ease: "power1.out" }, at);
    const l = lines(name);
    if (l.length)
      tl.to(l, { autoAlpha: 1, y: 0, clipPath: "inset(0% 0% 0% 0%)", duration: dur, stagger: dur * 0.22, ease: "power3.out" }, at);
  };
  const hide = (name: string, at: number, dur = 0.14) =>
    tl.to(block(name), { autoAlpha: 0, y: -34, duration: dur, ease: "power2.in" }, at);

  // =========================================================================
  // Scene 1 — Vault entrance (0 → 2.0)
  // =========================================================================
  tl.addLabel("vault", S.vault);
  tl.addLabel("vault-approach", 0);
  hide("scroll-hint", 0.01, 0.08);
  tl.to(block("vault-hero"), { autoAlpha: 0, y: -70, duration: 0.3, ease: "power1.in" }, 0.03);
  cam(0, 0.6, { x: 0, y: 0.25, z: 10, tx: 0, ty: lift(0, 0.4), tz: 0 });
  fov(0, 1.15, 38);

  tl.addLabel("vault-unlock", 0.45);
  set(state.vault, 0.45, 0.6, { spin: 1 }, "power1.inOut");
  cam(0.6, 0.55, { z: 8.4, y: 0.1 }, "sine.inOut");
  show("vault-hud-1", 0.5, 0.1);
  hide("vault-hud-1", 0.84, 0.08);

  tl.addLabel("vault-bolts", 0.75);
  set(state.vault, 0.75, 0.45, { bolts: 1 });
  show("vault-hud-2", 0.88, 0.1);
  hide("vault-hud-2", 1.2, 0.08);

  tl.addLabel("vault-glow", 1.0);
  set(state.vault, 1.0, 0.3, { glow: 1 }, "power1.in");
  set(state.lights, 1.05, 0.55, { accent: 45 }, "power1.in");

  tl.addLabel("vault-open", 1.22);
  set(state.vault, 1.22, 0.12, { unseal: 1 }, "power2.out");
  set(state.vault, 1.3, 0.5, { open: 1 });
  set(state.vault, 1.3, 0.4, { beam: 1 }, "power1.out");
  show("vault-hud-3", 1.3, 0.1);
  hide("vault-hud-3", 1.62, 0.08);

  tl.addLabel("vault-through", 1.45);
  // Accelerate through the doorway; exit speed matches the tunnel glide.
  cam(1.45, 0.7, { x: 0, y: 0, z: -6, tx: 0, ty: 0, tz: -30 }, "power2.in");
  fov(1.45, 0.7, 52, "power1.in");
  set(state.vault, 1.85, 0.3, { beam: 0.2 }, "sine.out");
  set(state.cam, 1.8, 0.4, { fit: 0, drift: 0 }, "sine.inOut");
  env(1.75, 0.45, [0.012, 0.035, 0.1], 6, 40, 0.16);

  // =========================================================================
  // Scene 2 — Digital tunnel
  // =========================================================================
  tl.addLabel("tunnel", S.tunnel);
  set(state.tunnel, 1.5, 0.55, { enter: 1 }, "power1.out");
  accent(1.95, [0, 0, -62], 160);
  tl.addLabel("tunnel-streams", 2.25);
  set(state.tunnel, 2.25, 0.45, { streams: 1 }, "power1.out");

  // The tunnel's own beats are authored last (see `buildTunnel`), after the
  // scenes that follow it have been moved to make room for them.


  // =========================================================================
  // Scene 2 camera — four stops in the tunnel (2.15 → 3.6 + TUNNEL_EXTRA)
  // =========================================================================
  // Cards alternate right / left, mounted flat on the wall. At every stop the
  // camera sits on the card's own normal and looks
  // straight at its centre, so the card is seen perfectly square-on; between
  // stops it swings back to the direction of travel and runs on to the next.
  const buildTunnel = () => {
    const C = TUNNEL_CARDS;
    const D = stacked ? 6.4 : 5.2; // camera distance from the card
    const holdFov = stacked ? 58 : 46;
    const sin = Math.sin(C.yaw);
    const cos = Math.cos(C.yaw);
    const stop = (i: number) => {
      const sx = cardSide(i);
      const cx = sx * C.x;
      const cz = C.z0 - i * C.gap;
      return { cx, cz, x: cx - sx * sin * D, z: cz + cos * D };
    };

    // Beat length, in screens of scroll.
    const IN = 0.35;
    const HOLD = 0.3;
    const LEG = 0.2;
    let t = 2.15;
    const aimAt = (i: number) => ({ tx: stop(i).cx, ty: C.y, tz: stop(i).cz });
    const stopPos = (i: number) => ({ x: stop(i).x, y: C.y, z: stop(i).z });

    tl.addLabel("tunnel-messages", t + IN);
    cam(t, IN, { ...stopPos(0), ...aimAt(0) }, "power2.out");
    fov(t, IN, holdFov, "sine.inOut");
    t += IN;

    for (let i = 0; i < C.count; i++) {
      tl.addLabel(`tunnel-card-${i + 1}`, t);
      t += HOLD;
      if (i === C.count - 1) break;

      // Leave the card: straighten up, keep to the same side, run on.
      const from = stop(i);
      const wz = from.cz - 4;
      cam(t, LEG, { x: from.x, y: C.y, z: wz, tx: from.x * 0.25, ty: C.y, tz: wz - 26 }, "power2.in");
      fov(t, LEG, holdFov + 8, "sine.in");
      set(state.cam, t, LEG, { sway: 0.7 }, "sine.out");
      t += LEG;
      // Arrive at the next: cross the axis and turn to face it.
      cam(t, LEG, { ...stopPos(i + 1), ...aimAt(i + 1) }, "power2.out");
      fov(t, LEG, holdFov, "sine.out");
      set(state.cam, t, LEG, { sway: 0 }, "sine.in");
      t += LEG;
    }

    // Straighten out and run to the far end.
    tl.addLabel("tunnel-exit", t);
    cam(t, 0.3, { x: 0, y: 0, z: -61, tx: 0, ty: 0, tz: -86 }, "power1.in");
    fov(t, 0.3, 62, "sine.in");
    set(state.tunnel, t, 0.4, { exit: 1 }, "power1.in");
    // The gate cracks open while the last card is read, then swings wide as we run at it.
    set(state.tunnel, t - HOLD, HOLD, { gate: 0.2 }, "power1.out");
    set(state.tunnel, t, 0.3, { gate: 1 }, "power2.in");
    set(state.tunnel, 2.0, t - 2.0, { light: 1 }, "none");
  };

  // =========================================================================
  // Scene 3 — Personal Vault (3.8 → 5.6), station (0, 0, -86)
  // =========================================================================
  tl.addLabel("personal", S.personal);
  env(3.5, 0.4, [0.075, 0.066, 0.055], 14, 60, 0.34);
  accent(3.55, [0, 1.5, -79], 90);
  // The room is lit like a real one: warm white, not the tunnel's cyan.
  set(state.lights, 3.5, 0.45, { warm: 1 }, "sine.inOut");
  set(state.cam, 3.6, 0.35, { fit: 1, drift: 1 }, "sine.inOut");
  cam(3.6, 0.55, { x: side(-2.3), y: 1.4, z: -73.5, tx: side(-2.3), ty: lift(0.5), tz: -86 }, "power2.out");
  fov(3.6, 0.55, 42);
  set(state.personal, 3.6, 0.4, { room: 1 }, "sine.out");

  tl.addLabel("personal-glass", 3.95);
  set(state.personal, 3.95, 0.4, { glass: 1 }, "power2.out");

  tl.addLabel("personal-cards", 4.2);
  set(state.personal, 4.2, 0.55, { cards: 1 }, "power2.out");
  cam(4.15, 1.15, { x: side(-2.3) + 2.6, y: 1.9, z: -74.5, tx: side(-2.3) + 0.6, ty: lift(0.6) }, "sine.inOut");
  show("personal-copy", 4.15);
  tl.addLabel("personal-copy", 4.45);

  tl.addLabel("personal-organize", 4.75);
  set(state.personal, 4.75, 0.35, { organize: 1 });
  tl.addLabel("personal-notes", 4.95);
  set(state.personal, 4.95, 0.25, { notes: 1 }, "power2.out");
  hide("personal-copy", 5.12);
  set(state.personal, 5.1, 0.25, { panels: 1 }, "power2.out");
  show("personal-recovery", 5.15, 0.12);
  tl.addLabel("personal-recovery", 5.3);
  hide("personal-recovery", 5.45, 0.1);

  // Rise over the room, rotate toward the Developer Vault.
  tl.addLabel("personal-depart", 5.3);
  // The ceiling and walls dissolve as the camera lifts out over the boxes.
  set(state.personal, 5.28, 0.22, { shell: 0 }, "power1.in");
  cam(5.3, 0.65, { x: stacked ? 5.5 : 6.6, z: -108, tx: stacked ? 6 : 6.8, tz: -122 }, "power2.inOut");
  tl.to(state.cam, { y: 4.6, ty: 2.2, duration: 0.3, ease: "power1.out" }, 5.3);
  tl.to(state.cam, { y: 1.7, ty: lift(0.7), duration: 0.35, ease: "power1.in" }, 5.6);

  // =========================================================================
  // Scene 4 — Developer Vault (5.6 → 7.4), station (6, 0, -122)
  // =========================================================================
  tl.addLabel("developer", S.developer);
  env(5.45, 0.35, [0.03, 0.045, 0.065], 14, 70, 0.34);
  accent(5.5, [6, 3.4, -113], 60);
  set(state.lights, 5.45, 0.35, { warm: 0 }, "sine.inOut");
  // The server hall: racks, ceiling and floor appear with the scene.
  set(state.developer, 5.45, 0.4, { room: 1 }, "sine.out");

  tl.addLabel("developer-code", 5.65);
  set(state.developer, 5.65, 0.35, { code: 1 }, "power2.out");
  set(state.developer, 5.9, 0.35, { keys: 1 }, "power2.out");
  cam(5.95, 0.95, { x: stacked ? 5.9 : 6.8, y: 1.4, z: -110.5, tx: stacked ? 5.8 : 6.7, ty: lift(0.7) }, "sine.inOut");
  show("developer-copy", 5.9);
  tl.addLabel("developer-copy", 6.15);

  tl.addLabel("developer-env", 6.15);
  set(state.developer, 6.15, 0.35, { env: 1 }, "power2.out");
  tl.addLabel("developer-ssh", 6.4);
  set(state.developer, 6.4, 0.3, { ssh: 1 }, "power2.out");
  tl.addLabel("developer-collect", 6.7);
  set(state.developer, 6.7, 0.4, { collect: 1 });
  hide("developer-copy", 6.85);

  // Fly through the corridor between the code walls toward the Shared Vault.
  tl.addLabel("developer-depart", 6.9);
  // The hall's walls, racks and ceiling dissolve as the camera lifts away.
  set(state.developer, 6.88, 0.25, { shell: 0 }, "power1.in");
  cam(6.9, 0.7, { x: side(-3.1), y: stacked ? 6.4 : 5.2, z: stacked ? -144 : -146, tx: side(-3.1), ty: lift(0.2, 1.6), tz: -158 }, "power2.inOut");

  // =========================================================================
  // Scene 5 — Shared Vault (7.4 → 9.0), station (0, 0, -158)
  // =========================================================================
  tl.addLabel("shared", S.shared);
  env(7.05, 0.4, [0.02, 0.036, 0.07], 16, 80, 0.3);
  accent(7.1, [0, 4.4, -156], 75);
  set(state.lights, 7.05, 0.4, { warm: 0.55 }, "sine.inOut");
  // The boardroom appears as the developer hall dissolves.
  set(state.shared, 6.95, 0.45, { room: 1 }, "sine.out");
  tl.addLabel("shared-core", 7.45);
  set(state.shared, 7.45, 0.3, { core: 1 }, "power2.out");
  set(state.shared, 7.65, 0.35, { nodes: 1 }, "power2.out");
  show("shared-copy", 7.6);
  tl.addLabel("shared-copy", 7.9);
  cam(7.6, 1.15, { x: side(-3.1) + 1.4, y: stacked ? 5.8 : 3.9, z: stacked ? -143.5 : -148.5, tx: side(-3.1) + 0.4 }, "sine.inOut");
  tl.addLabel("shared-links", 7.9);
  set(state.shared, 7.9, 0.35, { links: 1 });
  tl.addLabel("shared-perms", 8.15);
  set(state.shared, 8.15, 0.3, { perms: 1 }, "power2.out");
  tl.addLabel("shared-transfer", 8.35);
  set(state.shared, 8.35, 0.5, { transfer: 1 }, "none");
  hide("shared-copy", 8.75);

  tl.addLabel("shared-depart", 8.75);
  // Windows, table and halo light dissolve as the camera leaves the room.
  set(state.shared, 8.72, 0.25, { shell: 0 }, "power1.in");
  cam(8.75, 0.65, { x: side(2), y: 2.4, z: stacked ? -178 : -180.5, tx: side(2), ty: lift(1.2), tz: -194 }, "power2.inOut");

  // =========================================================================
  // Scene 6 — Security Center (9.0 → 10.8), station (0, 0, -194)
  // =========================================================================
  tl.addLabel("security", S.security);
  env(8.85, 0.35, [0.02, 0.04, 0.07], 16, 80, 0.3);
  accent(8.9, [0, 2.2, -194], 110);
  set(state.lights, 8.85, 0.35, { warm: 0 }, "sine.inOut");
  set(state.security, 8.85, 0.4, { room: 1 }, "sine.out");
  set(state.security, 9.05, 0.35, { env: 1 }, "power2.out");
  tl.addLabel("security-rings", 9.3);
  set(state.security, 9.3, 0.35, { rings: 1 }, "power2.out");
  show("security-copy", 9.25);
  tl.addLabel("security-copy", 9.5);
  cam(9.4, 0.75, { x: side(1.9), y: 2.0, z: stacked ? -179.5 : -182, tx: side(1.9) }, "sine.inOut");
  set(state.security, 9.5, 0.3, { indicators: 1 }, "none");
  tl.addLabel("security-devices", 9.7);
  set(state.security, 9.7, 0.3, { devices: 1 }, "power2.out");
  tl.addLabel("security-score", 9.9);
  set(state.security, 9.9, 0.4, { score: 1 }, "power2.out");
  set(state.security, 10.0, 0.35, { health: 1 }, "power2.out");
  show("security-hud", 9.9, 0.12);
  const counter = { v: 0 };
  const scoreEls = q("[data-score]");
  tl.to(
    counter,
    {
      v: 82,
      duration: 0.4,
      ease: "power2.out",
      onUpdate: () => {
        const text = String(Math.round(counter.v));
        for (const el of scoreEls) el.textContent = text;
      },
    },
    9.9,
  );
  hide("security-copy", 10.3);
  hide("security-hud", 10.42, 0.1);
  tl.addLabel("security-shield", 10.25);
  set(state.security, 10.25, 0.4, { shield: 1 }, "power1.inOut");

  tl.addLabel("security-pullback", 10.3);
  // The camera steps back inside the room to see the shield, then flies out
  // through the doorway behind the video wall into the next scene.
  cam(10.15, 0.2, { x: side(2.4), y: 4.4, z: stacked ? -174 : -177, tx: 0, ty: 1.0, tz: -194 }, "power2.inOut");
  cam(10.35, 0.4, { x: 0, y: 1.0, z: -221, tx: 0, ty: 1.0, tz: -238 }, "power2.inOut");
  // The room dissolves once the camera has left it.
  set(state.security, 10.82, 0.25, { shell: 0 }, "power1.in");

  // =========================================================================
  // Scene 7 — Zero-knowledge (10.8 → 12.4), station (0, 0, -232)
  // =========================================================================
  tl.addLabel("zk", S.zk);
  env(10.7, 0.35, [0.02, 0.04, 0.085], 16, 70, 0.36);
  set(state.zk, 10.5, 0.4, { room: 1 }, "sine.out");
  accent(10.75, [-4, 2, -230], 90);
  cam(10.75, 0.45, { x: stacked ? -6 : -2.8, y: 1.9, z: stacked ? -221 : -223, tx: stacked ? -6 : -4.6, ty: lift(0.5), tz: -232 }, "power2.inOut");
  set(state.zk, 10.85, 0.3, { device: 1 }, "power2.out");
  show("zk-copy", 10.95);
  show("zk-disclaimer", 11.0, 0.1);
  tl.addLabel("zk-copy", 11.15);
  set(state.zk, 11.1, 0.2, { data: 1 }, "power2.out");
  cam(11.2, 0.35, { x: stacked ? -6.2 : -3.2, y: 1.6, z: stacked ? -222 : -224.5, tx: stacked ? -6 : -5, ty: lift(0.9) }, "sine.inOut");
  tl.addLabel("zk-encrypt", 11.3);
  set(state.zk, 11.3, 0.3, { encrypt: 1 }, "power1.inOut");
  hide("zk-copy", 11.52);
  tl.addLabel("zk-travel", 11.6);
  set(state.zk, 11.6, 0.32, { travel: 1 }, "sine.inOut");
  cam(11.55, 0.4, { x: stacked ? 4 : 2.5, y: 2.0, z: stacked ? -221 : -222.5, tx: stacked ? 4.5 : 3.5, ty: lift(0.9) }, "sine.inOut");
  accent(11.6, [4, 2, -230], 90);
  tl.addLabel("zk-receive", 11.88);
  set(state.zk, 11.88, 0.22, { receive: 1 }, "power2.out");
  cam(11.95, 0.2, { x: stacked ? 6 : 4.5, y: 1.8, z: stacked ? -222 : -223.5, tx: 6, ty: lift(0.9) }, "sine.inOut");

  tl.addLabel("zk-reveal", 12.1);
  set(state.zk, 12.1, 0.3, { reveal: 1 }, "power2.out");
  cam(12.15, 0.35, { x: 0, y: stacked ? 9 : 6, z: stacked ? -206 : -213, tx: 0, ty: stacked ? -2.6 : 0.5, tz: -232 }, "power2.inOut");
  accent(12.15, [0, 2, -232], 90);
  show("zk-steps", 12.15);
  tl.addLabel("zk-architecture", 12.3);
  // The rooms dissolve as the camera heads for the final scene.
  set(state.zk, 12.5, 0.25, { shell: 0 }, "power1.in");
  hide("zk-disclaimer", 12.42, 0.08);
  hide("zk-steps", 12.48, 0.1);

  // =========================================================================
  // Scene 8 — Final CTA (12.4 → 13.6), station (0, 0, -280)
  // =========================================================================
  tl.addLabel("cta", S.cta);
  env(12.4, 0.4, [0.06, 0.07, 0.1], 24, 110, 0.4);
  set(state.lights, 12.4, 0.4, { warm: 1 }, "sine.inOut");
  set(state.cta, 12.3, 0.45, { room: 1 }, "sine.out");
  accent(12.45, [0, 2.5, -272], 110);
  cam(12.5, 0.5, { x: 0, y: 1, z: stacked ? -260 : -262, tx: 0, ty: stacked ? -0.4 : 0.6, tz: -280 }, "power2.inOut");
  fov(12.5, 0.5, 40);
  tl.addLabel("cta-portal", 12.55);
  set(state.cta, 12.55, 0.4, { portal: 1 }, "power2.out");
  tl.addLabel("cta-logo", 12.85);
  set(state.cta, 12.85, 0.3, { logo: 1 }, "power2.out");
  show("cta-headline", 13.0);
  show("cta-actions", 13.15, 0.12);
  tl.addLabel("cta-actions", 13.32);
  tl.addLabel("cta-settle", 13.3);
  set(state.cta, 13.3, 0.3, { settle: 1 }, "sine.out");
  cam(13.05, 0.55, { z: stacked ? -263 : -265.5, y: 0.9 }, "sine.out");

  // Make room for the tunnel stops, then author them in the gap.
  tl.shiftChildren(TUNNEL_EXTRA, true, 3.45);
  buildTunnel();

  // Pin the timeline length to the total scroll length.
  tl.set({}, {}, TOTAL_UNITS);
  return tl;
}
