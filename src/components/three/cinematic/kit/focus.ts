import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { focusStore } from "@/components/cinematic/focus";

/** Breathing room around a focused card (1 = edge to edge). */
const MARGIN = 1.45;
const MIN_DIST = 0.9;

/** Shown on screen right now: every ancestor visible and not faded out. */
export function isShown(obj: THREE.Object3D) {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) if (!o.visible) return false;
  const m = (obj as THREE.Mesh).material as THREE.Material | undefined;
  return !(m && !Array.isArray(m) && m.transparent && m.opacity < 0.35);
}

const setCursor = (on: boolean) => void (document.body.style.cursor = on ? "pointer" : "");

/**
 * Spread onto a card mesh (or a group, to focus the whole group) to let a
 * click bring the camera in front of it. Hidden or faded cards let the event
 * fall through to whatever is behind them.
 */
const hit = (e: ThreeEvent<PointerEvent | MouseEvent>) => isShown(e.object) && isShown(e.eventObject);

export const FOCUS = {
  onClick(e: ThreeEvent<MouseEvent>) {
    if (!hit(e)) return;
    e.stopPropagation();
    focusStore.toggle(e.eventObject);
  },
  onPointerOver(e: ThreeEvent<PointerEvent>) {
    if (!hit(e)) return;
    e.stopPropagation();
    setCursor(true);
  },
  onPointerOut() {
    setCursor(false);
  },
};

/** Draw order of the lightbox backdrop; the focused card draws just after it. */
export const BACKDROP_ORDER = 9000;

/** Glass screens keep only a faint reflection while read up close. */
const FOCUS_ENV = 0.15;

/**
 * Draws `obj` after the backdrop so everything else, even neighbours in front
 * of it, is dimmed rather than covering it. Its materials are swapped for
 * transparent copies (only transparent objects honour the draw order, and the
 * originals may be shared), with the studio reflection on screens damped so no
 * highlight runs across the text. Returns a function that restores it.
 */
export function bringToFront(obj: THREE.Object3D) {
  const saved = new Map<THREE.Object3D, [number, THREE.Material | THREE.Material[] | undefined]>();
  const copies = new Map<THREE.Material, THREE.Material>();
  const copy = (m: THREE.Material) => {
    let c = copies.get(m);
    if (!c) {
      c = m.clone();
      c.transparent = true;
      const s = c as THREE.MeshPhysicalMaterial;
      if (s.isMeshStandardMaterial && s.emissiveMap) {
        s.envMapIntensity = FOCUS_ENV;
        // Not 0: crossing zero switches shader programs (a recompile hitch).
        if (s.isMeshPhysicalMaterial && s.clearcoat > 0) s.clearcoat = 0.001;
      }
      copies.set(m, c);
    }
    return c;
  };
  obj.traverse((o) => {
    const mesh = o as THREE.Mesh;
    saved.set(o, [o.renderOrder, mesh.material]);
    o.renderOrder = BACKDROP_ORDER + 1 + o.renderOrder;
    if (mesh.material) mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material);
  });
  return () => {
    saved.forEach(([order, material], o) => {
      o.renderOrder = order;
      if (material) (o as THREE.Mesh).material = material;
    });
    copies.forEach((c) => c.dispose());
  };
}

const _p = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _n = new THREE.Vector3();
const _size = new THREE.Vector3();
const _box = new THREE.Box3();

/**
 * Camera pose that looks squarely at `obj` and fits it in the frame. Planes use
 * their exact face; anything else its bounding box. The camera stays on the
 * side of the card it is already on (cards may be double-sided).
 * Returns how far behind the target its back lies (0 for a flat card).
 */
export function framePose(obj: THREE.Object3D, fovDeg: number, aspect: number, from: THREE.Vector3, outPos: THREE.Vector3, outTarget: THREE.Vector3) {
  obj.updateWorldMatrix(true, false);
  obj.matrixWorld.decompose(_p, _q, _s);
  const g = (obj as THREE.Mesh).geometry as THREE.PlaneGeometry | undefined;
  let w: number;
  let h: number;
  let depth = 0;
  if (g?.type === "PlaneGeometry") {
    w = g.parameters.width * Math.abs(_s.x);
    h = g.parameters.height * Math.abs(_s.y);
    outTarget.copy(_p);
  } else {
    _box.setFromObject(obj).getCenter(outTarget);
    _box.getSize(_size);
    w = Math.max(_size.x, _size.z);
    h = _size.y;
    depth = Math.min(_size.x, _size.z) / 2;
  }
  _n.set(0, 0, 1).applyQuaternion(_q);
  if (_n.dot(_p.copy(from).sub(outTarget)) < 0) _n.negate();
  const tanV = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  const dist = Math.max((h * MARGIN) / (2 * tanV), (w * MARGIN) / (2 * tanV * aspect), MIN_DIST);
  outPos.copy(outTarget).addScaledVector(_n, dist);
  return depth;
}
