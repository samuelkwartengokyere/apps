"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { STATIONS, TUNNEL_CARDS, cardSide } from "@/components/cinematic/config";
import { TUNNEL_MESSAGES } from "@/components/marketing/content";
import { range, smooth } from "../kit/math";
import { COLORS, S, useDisposables } from "../kit/parts";
import { brushedRoughness, canvasTexture, font, radialTexture, roundRect } from "../kit/textures";

/*
 * The four message cards in the tunnel. Each one is a real fitting: a glass
 * light-box in a brushed-steel bezel with corner fixings, standing proud of
 * the wall on a deep housing. It throws a pool of light on the lining, casts a
 * soft shadow behind itself, and carries a faint glass reflection that slides
 * as the camera moves. The camera (see timeline.ts) stops on each card's
 * normal, so it reads square-on.
 */

const TUNNEL_Z = STATIONS.tunnel[2];
const R = 3.7; // tunnel lining radius (see DigitalTunnel)
const PX = 1024;
const PY = Math.round((PX * TUNNEL_CARDS.height) / TUNNEL_CARDS.width);
const CYAN = "108, 196, 214";

const LABELS = ["On device", "Storage", "Keys", "Recovery"];

// ---------------------------------------------------------------------------
// Face artwork
// ---------------------------------------------------------------------------

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const out: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      out.push(line);
      line = word;
    } else line = next;
  }
  if (line) out.push(line);
  return out;
}

function drawIcon(ctx: CanvasRenderingContext2D, kind: number, cx: number, cy: number) {
  ctx.save();
  ctx.strokeStyle = `rgb(${CYAN})`;
  ctx.fillStyle = `rgb(${CYAN})`;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (kind === 0) {
    // Padlock
    ctx.roundRect(cx - 19, cy - 4, 38, 29, 7);
    ctx.moveTo(cx - 11, cy - 4);
    ctx.lineTo(cx - 11, cy - 11);
    ctx.arc(cx, cy - 11, 11, Math.PI, 0);
    ctx.lineTo(cx + 11, cy - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + 9, 3.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 1) {
    // Stacked records
    for (let i = 0; i < 3; i++) {
      ctx.roundRect(cx - 22, cy - 24 + i * 17, 44, 13, 4);
    }
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(cx + 14, cy - 17.5 + i * 17, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 2) {
    // Key
    ctx.arc(cx - 12, cy, 11, 0, Math.PI * 2);
    ctx.moveTo(cx - 1, cy);
    ctx.lineTo(cx + 24, cy);
    ctx.moveTo(cx + 15, cy);
    ctx.lineTo(cx + 15, cy + 10);
    ctx.moveTo(cx + 23, cy);
    ctx.lineTo(cx + 23, cy + 8);
    ctx.stroke();
  } else {
    // Recovery: a circular arrow
    ctx.arc(cx, cy, 19, -Math.PI * 0.2, Math.PI * 1.45);
    ctx.stroke();
    ctx.beginPath();
    const ax = cx + Math.cos(-Math.PI * 0.2) * 19;
    const ay = cy + Math.sin(-Math.PI * 0.2) * 19;
    ctx.moveTo(ax + 11, ay - 5);
    ctx.lineTo(ax, ay);
    ctx.lineTo(ax + 3, ay + 13);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCard(ctx: CanvasRenderingContext2D, w: number, h: number, index: number, title: string, body: string) {
  ctx.clearRect(0, 0, w, h);
  const rad = Math.round((w * 0.126) / TUNNEL_CARDS.width); // matches the bezel's inner radius
  ctx.save();
  roundRect(ctx, 0, 0, w, h, rad);
  ctx.clip();

  // Deep glass: dark navy with a cool glow rising from the lower right.
  const bg = ctx.createLinearGradient(0, 0, w * 0.6, h);
  bg.addColorStop(0, "#0e1c30");
  bg.addColorStop(1, "#050c18");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * 0.92, h * 1.0, 10, w * 0.92, h * 1.0, w * 0.75);
  glow.addColorStop(0, `rgba(${CYAN}, 0.2)`);
  glow.addColorStop(1, `rgba(${CYAN}, 0)`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  const top = ctx.createLinearGradient(0, 0, 0, h * 0.45);
  top.addColorStop(0, "rgba(170, 220, 240, 0.09)");
  top.addColorStop(1, "rgba(170, 220, 240, 0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, w, h * 0.45);

  // Fine dot grid
  ctx.fillStyle = "rgba(150, 200, 220, 0.07)";
  for (let y = 24; y < h; y += 34) for (let x = 24; x < w; x += 34) ctx.fillRect(x, y, 2, 2);

  // Oversized index numeral, as a watermark
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.font = font(430, 800);
  ctx.fillStyle = "rgba(190, 225, 240, 0.045)";
  ctx.fillText(String(index + 1).padStart(2, "0"), w - 18, h - 30);
  ctx.textAlign = "left";

  // Top light line
  const hair = ctx.createLinearGradient(0, 0, w, 0);
  hair.addColorStop(0, `rgba(${CYAN}, 0)`);
  hair.addColorStop(0.5, `rgba(${CYAN}, 0.75)`);
  hair.addColorStop(1, `rgba(${CYAN}, 0)`);
  ctx.fillStyle = hair;
  ctx.fillRect(0, 0, w, 3);

  const left = 78;
  const maxW = w - left * 2 + 10;

  // Header: icon badge, index and topic
  const cy0 = 128;
  ctx.beginPath();
  ctx.arc(left + 48, cy0, 48, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(${CYAN}, 0.09)`;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = `rgba(${CYAN}, 0.5)`;
  ctx.stroke();
  drawIcon(ctx, index, left + 48, cy0);

  ctx.letterSpacing = "7px";
  ctx.font = font(30, 600, true);
  ctx.fillStyle = `rgb(${CYAN})`;
  ctx.fillText(`${String(index + 1).padStart(2, "0")} / ${String(TUNNEL_MESSAGES.length).padStart(2, "0")}`, left + 122, cy0 - 4);
  ctx.letterSpacing = "5px";
  ctx.font = font(22, 500, true);
  ctx.fillStyle = "rgba(160, 178, 196, 0.85)";
  ctx.fillText((LABELS[index] ?? "").toUpperCase(), left + 122, cy0 + 30);
  ctx.letterSpacing = "0px";

  // Text block, centred between header and footer
  ctx.font = font(72, 650);
  const titleLines = wrap(ctx, title, maxW);
  ctx.font = font(40, 400);
  const bodyLines = wrap(ctx, body, maxW);
  const TL = 82;
  const BL = 56;
  const block = titleLines.length * TL + 30 + bodyLines.length * BL;
  const top0 = 214;
  const bottom0 = h - 128;
  let y = top0 + (bottom0 - top0 - block) / 2;

  const tg = ctx.createLinearGradient(0, y, 0, y + titleLines.length * TL);
  tg.addColorStop(0, "#ffffff");
  tg.addColorStop(1, "#cfe6f2");
  ctx.font = font(72, 650);
  ctx.fillStyle = tg;
  for (const l of titleLines) {
    y += TL;
    ctx.fillText(l, left, y - 18);
  }
  y += 30;
  ctx.font = font(40, 400);
  ctx.fillStyle = "#aebdcc";
  for (const l of bodyLines) {
    y += BL;
    ctx.fillText(l, left, y - 14);
  }

  // Footer: divider, progress pips, wordmark
  const fy = h - 112;
  const rule = ctx.createLinearGradient(left, 0, w - left, 0);
  rule.addColorStop(0, "rgba(148, 163, 184, 0.35)");
  rule.addColorStop(1, "rgba(148, 163, 184, 0.05)");
  ctx.fillStyle = rule;
  ctx.fillRect(left, fy, w - left * 2, 2);
  for (let i = 0; i < TUNNEL_MESSAGES.length; i++) {
    roundRect(ctx, left + i * 50, fy + 34, i === index ? 38 : 14, 8, 4);
    ctx.fillStyle = i === index ? `rgb(${CYAN})` : "rgba(148, 163, 184, 0.35)";
    ctx.fill();
  }
  ctx.textAlign = "right";
  ctx.letterSpacing = "6px";
  ctx.font = font(20, 500, true);
  ctx.fillStyle = "rgba(160, 178, 196, 0.6)";
  ctx.fillText("SECUREVAULT", w - left, fy + 48);
  ctx.letterSpacing = "0px";
  ctx.restore();
}

function cardTexture(index: number) {
  const [title, body] = TUNNEL_MESSAGES[index];
  const draw = (ctx: CanvasRenderingContext2D, w: number, h: number) => drawCard(ctx, w, h, index, title, body);
  const tex = canvasTexture(`tunnel-card-${index}`, PX, PY, draw);
  tex.anisotropy = 8;
  // The face font may still be loading on first paint: redraw once it is ready.
  if (typeof document !== "undefined" && document.fonts && document.fonts.status !== "loaded") {
    document.fonts.ready.then(() => {
      const canvas = tex.image as HTMLCanvasElement;
      draw(canvas.getContext("2d")!, PX, PY);
      tex.needsUpdate = true;
    });
  }
  return tex;
}

/** Faint diagonal glass reflections; mapped additively over the face. */
function sheenTexture() {
  return canvasTexture("tunnel-card-sheen", 512, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.translate(w * 0.5, h * 0.5);
    ctx.rotate(-0.38);
    const band = (x: number, width: number, a: number) => {
      const g = ctx.createLinearGradient(x - width, 0, x + width, 0);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, `rgba(255,255,255,${a})`);
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - width, -h * 4, width * 2, h * 8);
    };
    band(-40, 90, 0.3);
    band(70, 22, 0.22);
    band(120, 9, 0.14);
    ctx.restore();
  });
}

/** Soft rounded-box shadow, black with alpha. */
function shadowTexture() {
  return canvasTexture("tunnel-card-shadow", 256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.filter = "blur(18px)";
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.roundRect(w * 0.2, h * 0.2, w * 0.6, h * 0.6, 22);
    ctx.fill();
    ctx.filter = "none";
  });
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

function roundedRect(target: THREE.Path, w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  target.moveTo(x + r, y);
  target.lineTo(x + w - r, y);
  target.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false);
  target.lineTo(x + w, y + h - r);
  target.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false);
  target.lineTo(x + r, y + h);
  target.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false);
  target.lineTo(x, y + r);
  target.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false);
}

function ringShape(ow: number, oh: number, or: number, iw: number, ih: number, ir: number) {
  const shape = new THREE.Shape();
  roundedRect(shape, ow, oh, or);
  const hole = new THREE.Path();
  roundedRect(hole, iw, ih, ir);
  shape.holes.push(hole);
  return shape;
}

function solidShape(w: number, h: number, r: number) {
  const shape = new THREE.Shape();
  roundedRect(shape, w, h, r);
  return shape;
}

const world = new THREE.Vector3();

function TunnelCard({ index }: { index: number }) {
  const { geo, mat } = S();
  const C = TUNNEL_CARDS;
  const sx = cardSide(index);
  const cz = C.z0 - index * C.gap - TUNNEL_Z;
  const W = C.width;
  const H = C.height;
  const cornerR = 0.126;

  const res = useDisposables(() => {
    const bevel = { bevelEnabled: true, bevelSize: 0.022, bevelThickness: 0.022, bevelSegments: 3, bevelOffset: -0.022, curveSegments: 20 };
    // The wall patches follow the lining's curvature, centred on the card's height.
    const theta = sx * Math.acos(-C.y / R);
    const patch = (zLen: number, arcLen: number) => {
      const d = arcLen / R;
      return new THREE.CylinderGeometry(R - 0.04, R - 0.04, zLen, 28, 1, true, theta - d / 2, d);
    };
    const edge = COLORS.cyan.clone();
    return {
      frameGeo: new THREE.ExtrudeGeometry(ringShape(W + 0.34, H + 0.34, 0.2, W, H, cornerR), { ...bevel, depth: 0.07 }),
      bodyGeo: new THREE.ExtrudeGeometry(solidShape(W + 0.18, H + 0.18, 0.15), { ...bevel, depth: 0.45 }),
      lineGeo: new THREE.ShapeGeometry(ringShape(W, H, cornerR, W - 0.035, H - 0.035, cornerR - 0.02), 20),
      washGeo: patch(9, 7),
      shadowGeo: patch((W + 0.9) / 0.6, (H + 0.9) / 0.6),
      face: new THREE.MeshBasicMaterial({ map: cardTexture(index), alphaTest: 0.5, toneMapped: false, fog: false }),
      frame: new THREE.MeshPhysicalMaterial({
        color: "#59626e",
        metalness: 1,
        roughness: 0.34,
        roughnessMap: brushedRoughness(),
        envMapIntensity: 1.25,
        clearcoat: 0.25,
        clearcoatRoughness: 0.4,
      }),
      body: new THREE.MeshStandardMaterial({ color: "#1a2028", metalness: 0.85, roughness: 0.5, envMapIntensity: 0.7 }),
      line: new THREE.MeshBasicMaterial({ color: edge.clone().multiplyScalar(1.2), toneMapped: false, fog: false }),
      led: new THREE.MeshBasicMaterial({ color: edge.clone(), toneMapped: false, fog: false }),
      sheen: new THREE.MeshBasicMaterial({
        map: sheenTexture(),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        fog: false,
        color: "#ffffff",
      }),
      wash: new THREE.MeshBasicMaterial({
        map: radialTexture(),
        color: "#000000",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.BackSide,
        toneMapped: false,
        fog: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      }),
      shadow: new THREE.MeshBasicMaterial({
        map: shadowTexture(),
        color: "#000000",
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
        side: THREE.BackSide,
        fog: false,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }),
    };
  });

  const ref = useRef<THREE.Group>(null);
  const edgeColor = useMemo(() => COLORS.cyan.clone(), []);
  const sheenTex = res.sheen.map as THREE.Texture;
  sheenTex.wrapS = THREE.RepeatWrapping;

  useFrame(({ camera, clock }) => {
    // Cards power up as the camera closes on them.
    ref.current?.getWorldPosition(world);
    const near = 1 - smooth(range(camera.position.distanceTo(world), 7, 26));
    res.face.color.setScalar(0.3 + 0.7 * near);
    res.line.color.copy(edgeColor).multiplyScalar(0.35 + 1.2 * near);
    res.led.color.copy(edgeColor).multiplyScalar((0.4 + 1.3 * near) * (0.85 + 0.15 * Math.sin(clock.elapsedTime * 2.2 + index)));
    res.wash.color.copy(edgeColor).multiplyScalar(0.03 + 0.4 * near);
    // The reflection slides across the glass as the camera moves past.
    sheenTex.offset.x = (camera.position.z - world.z) * 0.045 + (camera.position.x - world.x) * 0.02;
    res.sheen.opacity = 0.3 + 0.45 * near;
  });

  const hw = W / 2;
  const hh = H / 2;

  return (
    <>
      {/* Light on and shadow behind the card, laid on the lining */}
      <mesh geometry={res.shadowGeo} material={res.shadow} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, cz]} renderOrder={1} />
      <mesh geometry={res.washGeo} material={res.wash} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, cz]} renderOrder={2} />

      <group ref={ref} position={[sx * C.x, C.y, cz]} rotation={[0, -sx * C.yaw, 0]}>
        {/* Housing, running back into the wall, and the steel bezel */}
        <mesh geometry={res.bodyGeo} material={res.body} position={[0, 0, -0.52]} />
        <mesh geometry={res.frameGeo} material={res.frame} position={[0, 0, -0.045]} />

        {/* Glass face, set back inside the bezel */}
        <mesh geometry={geo.plane} material={res.face} position={[0, 0, 0]} scale={[W, H, 1]} />
        <mesh geometry={res.lineGeo} material={res.line} position={[0, 0, 0.006]} />
        <mesh geometry={geo.plane} material={res.sheen} position={[0, 0, 0.012]} scale={[W, H, 1]} />

        {/* Corner fixings */}
        {[-1, 1].flatMap((ix) =>
          [-1, 1].map((iy) => (
            <group key={`${ix}${iy}`} position={[ix * (hw + 0.085), iy * (hh + 0.085), 0.072]}>
              <mesh geometry={geo.sphere} material={mat.metalLight} scale={[0.04, 0.04, 0.02]} />
              <mesh geometry={geo.box} material={mat.metalDark} scale={[0.05, 0.008, 0.012]} position={[0, 0, 0.018]} rotation={[0, 0, (ix * iy * Math.PI) / 4 + 0.3]} />
            </group>
          )),
        )}

        {/* Status light in the lower lip */}
        <mesh geometry={geo.box} material={res.led} position={[hw - 0.35, -hh - 0.085, 0.075]} scale={[0.34, 0.016, 0.01]} />
      </group>
    </>
  );
}

export function TunnelCards() {
  return (
    <group>
      {TUNNEL_MESSAGES.map((m, i) => (
        <TunnelCard key={m[0]} index={i} />
      ))}
    </group>
  );
}
