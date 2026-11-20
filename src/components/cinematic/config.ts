/**
 * Single source of truth for the cinematic journey: scene order, scroll
 * lengths (in vh), world stations and the anchors used by navigation.
 *
 * Timeline time is measured in "screens" (100vh = 1 unit) so the master
 * timeline maps linearly onto the pinned scroll distance.
 */

export type SceneId = "vault" | "tunnel" | "personal" | "developer" | "shared" | "security" | "zk" | "cta";

type SceneDef = {
  id: SceneId;
  title: string;
  /** Scroll length in vh. */
  length: number;
  /** Timeline label where the scene's main content is fully on screen. */
  anchor: string;
  /** Timeline window (in units) during which the scene is rendered. */
  visible: [number, number];
};

/**
 * Extra scroll (in screens) the tunnel needs so each of its four cards gets
 * its own stop. Every scene after the tunnel is pushed back by this much.
 */
export const TUNNEL_EXTRA = 1.6;
const E = TUNNEL_EXTRA;

export const SCENES: readonly SceneDef[] = [
  { id: "vault", title: "Vault entrance", length: 200, anchor: "vault", visible: [0, 2.6] },
  { id: "tunnel", title: "Digital tunnel", length: 180 + E * 100, anchor: "tunnel-messages", visible: [1.05, 4.3 + E] },
  { id: "personal", title: "Personal Vault", length: 180, anchor: "personal-copy", visible: [3.45 + E, 6.05 + E] },
  { id: "developer", title: "Developer Vault", length: 180, anchor: "developer-copy", visible: [5.3 + E, 7.85 + E] },
  { id: "shared", title: "Shared Vault", length: 160, anchor: "shared-copy", visible: [7.05 + E, 9.45 + E] },
  { id: "security", title: "Security Center", length: 180, anchor: "security-copy", visible: [8.7 + E, 11.25 + E] },
  { id: "zk", title: "Zero-knowledge", length: 160, anchor: "zk-copy", visible: [10.5 + E, 12.95 + E] },
  { id: "cta", title: "Create your vault", length: 120, anchor: "cta-actions", visible: [12.1 + E, 13.61 + E] },
];

export const SCENE_START: Record<SceneId, number> = (() => {
  let t = 0;
  const out = {} as Record<SceneId, number>;
  for (const s of SCENES) {
    out[s.id] = t;
    t += s.length / 100;
  }
  return out;
})();

/** Total timeline duration in units (13.6 = 1360vh of scroll). */
export const TOTAL_UNITS = SCENES.reduce((n, s) => n + s.length, 0) / 100;

/**
 * The four message cards in the tunnel (world space; the tunnel runs from
 * z = -2 to z = -66). They are mounted flat on the wall, back against the
 * lining, and alternate right, left, right, left. Each faces straight at the
 * tunnel axis, and the camera stops on the card's own normal, so it is seen
 * perfectly square-on.
 */
export const TUNNEL_CARDS = {
  count: 4,
  /** World z of the first card and spacing between cards. */
  /** Midway between the tunnel's steel ribs (every 10 units from z = -6), so no rib crosses a card. */
  z0: -21,
  gap: 10,
  /** Centre height and the x of the card face (right wall is x > 0). */
  y: 0.3,
  x: 3.3,
  /** Turn of the card's normal away from straight down the tunnel; 90° = flat on the wall. */
  yaw: Math.PI / 2,
  width: 3.4,
  height: 2.4,
} as const;

/** +1 for the right wall, -1 for the left. */
export const cardSide = (i: number) => (i % 2 === 0 ? 1 : -1);

/** World-space centre of each scene. The camera travels along -Z between them. */
export const STATIONS: Record<SceneId, [number, number, number]> = {
  vault: [0, 0, 0],
  tunnel: [0, 0, -34],
  personal: [0, 0, -86],
  developer: [6, 0, -122],
  shared: [0, 0, -158],
  security: [0, 0, -194],
  zk: [0, 0, -232],
  cta: [0, 0, -280],
};

/**
 * In-page hashes (header, footer, CTA buttons, deep links) mapped to timeline
 * labels, so `#security` lands on the moment the Security Center is revealed.
 */
export const HASH_TO_LABEL: Record<string, string> = {
  top: "vault",
  tunnel: "tunnel-messages",
  features: "personal-copy",
  personal: "personal-copy",
  recovery: "personal-recovery",
  developers: "developer-copy",
  shared: "shared-copy",
  security: "security-copy",
  "zero-knowledge": "zk-copy",
  "how-it-works": "zk-architecture",
  "get-started": "cta-actions",
};

/** Mobile visitors get a slightly shorter journey (less thumb-scrolling). */
export const COMPACT_SCROLL_SCALE = 0.85;

export function sceneIndexAt(time: number): number {
  let idx = 0;
  for (let i = 0; i < SCENES.length; i++) if (time >= SCENE_START[SCENES[i].id] - 0.001) idx = i;
  return idx;
}
