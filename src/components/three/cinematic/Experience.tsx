"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SCENES, STATIONS, type SceneId } from "@/components/cinematic/config";
import { focusStore } from "@/components/cinematic/focus";
import { navStore } from "@/components/cinematic/navTransition";
import type { CinematicState } from "@/components/cinematic/state";
import { Atmosphere } from "./Atmosphere";
import { CameraRig } from "./CameraRig";
import { CineContext, type Quality, useCine } from "./kit/context";
import { Dust, disposeShared } from "./kit/parts";
import { disposeTextureCache } from "./kit/textures";
import VaultEntrance from "./scenes/VaultEntrance";

// The opening scene ships with this chunk; later scenes are split and
// fetched just before the camera reaches them.
const LAZY: Record<Exclude<SceneId, "vault">, React.LazyExoticComponent<() => React.JSX.Element>> = {
  tunnel: lazy(() => import("./scenes/DigitalTunnel")),
  personal: lazy(() => import("./scenes/PersonalVault")),
  developer: lazy(() => import("./scenes/DeveloperVault")),
  shared: lazy(() => import("./scenes/SharedVault")),
  security: lazy(() => import("./scenes/SecurityCenter")),
  zk: lazy(() => import("./scenes/ZeroKnowledge")),
  cta: lazy(() => import("./scenes/FinalPortal")),
};

/** How far ahead (timeline units ≈ screens of scroll) a scene is mounted. */
const PRELOAD = 1.6;

/** Each mounted scene's group, so its shaders can be compiled before the camera gets there. */
const shells = new Map<SceneId, THREE.Group>();

/** Positions a scene at its station and skips rendering it outside its window. */
function SceneShell({ id, children }: { id: SceneId; children: React.ReactNode }) {
  const { state } = useCine();
  const ref = useRef<THREE.Group>(null);
  const win = SCENES.find((s) => s.id === id)!.visible;
  useEffect(() => {
    if (ref.current) shells.set(id, ref.current);
    return () => void shells.delete(id);
  }, [id]);
  useFrame(() => {
    if (ref.current) ref.current.visible = state.time >= win[0] && state.time <= win[1];
  });
  return (
    <group ref={ref} position={STATIONS[id]}>
      {children}
    </group>
  );
}

/** Mounts inside a scene's Suspense boundary, so it commits only once the scene's chunk has resolved. */
function LoadedMark({ id, loaded }: { id: SceneId; loaded: Set<SceneId> }) {
  useEffect(() => {
    loaded.add(id);
  }, [id, loaded]);
  return null;
}

/** The visitor has stopped scrolling: the moment to do background work. */
const isCalm = (state: { velocity: number }) => Math.abs(state.velocity) < 5;
/** Pause between scenes mounted in the background (ms). */
const WARM_INTERVAL = 1400;

/**
 * Progressive mounting: scenes mount once the journey approaches them and then
 * stay mounted. Once the first reveal is over and the visitor is idle, the rest
 * are mounted too, one at a time, and their shaders compiled without blocking, so
 * a jump from the nav lands on a scene that is already prepared instead of
 * stalling while it loads.
 */
function SceneGate({ loaded, ready }: { loaded: Set<SceneId>; ready: React.RefObject<boolean> }) {
  const { state, quality } = useCine();
  const { gl, scene, camera } = useThree();
  const [mounted, setMounted] = useState<ReadonlySet<SceneId>>(() => new Set<SceneId>(["vault", "tunnel"]));
  const mountedRef = useRef(mounted);
  const compiled = useRef(new Set<SceneId>());

  useEffect(() => {
    if (quality.low) return;
    let timer = 0;
    const step = () => {
      const waiting = !ready.current || navStore.get().phase !== "idle" || focusStore.get() !== null || !isCalm(state);
      const next = waiting
        ? undefined
        : SCENES.filter((s) => !mountedRef.current.has(s.id)).sort((a, b) => Math.abs(a.visible[0] - state.time) - Math.abs(b.visible[0] - state.time))[0];
      if (next) {
        const set = new Set(mountedRef.current).add(next.id);
        mountedRef.current = set;
        setMounted(set);
      }
      if (waiting || next) timer = window.setTimeout(step, next ? WARM_INTERVAL : 600);
    };
    timer = window.setTimeout(step, 1500);
    return () => clearTimeout(timer);
  }, [quality.low, state]);

  useFrame(() => {
    if (!quality.low) {
      // Start compiling a freshly loaded scene's programs; the browser does it off the main thread.
      for (const id of loaded) {
        const group = shells.get(id);
        if (!group || compiled.current.has(id)) continue;
        compiled.current.add(id);
        const was = group.visible;
        group.visible = true;
        gl.compileAsync(scene, camera).catch(() => {});
        group.visible = was;
      }
    }
    const t = state.time;
    let next: Set<SceneId> | null = null;
    for (const s of SCENES) {
      if (mountedRef.current.has(s.id)) continue;
      if (t >= s.visible[0] - PRELOAD && t <= s.visible[1]) (next ??= new Set(mountedRef.current)).add(s.id);
    }
    if (next) {
      mountedRef.current = next;
      setMounted(next);
    }
  });

  return (
    <>
      {SCENES.map((s) => {
        if (!mounted.has(s.id)) return null;
        const Comp = s.id === "vault" ? VaultEntrance : LAZY[s.id];
        return (
          <Suspense key={s.id} fallback={null}>
            <SceneShell id={s.id}>
              <Comp />
            </SceneShell>
            <LoadedMark id={s.id} loaded={loaded} />
          </Suspense>
        );
      })}
    </>
  );
}

/** Frames rendered with every on-screen scene loaded before revealing (first frames compile shaders). */
const SETTLE_FRAMES = 3;
/** Reveal anyway if a scene chunk is very slow. */
const READY_TIMEOUT = 6;

/**
 * Fires once the scenes visible at the current journey time have loaded and
 * drawn, so a reload part-way through never reveals an empty world.
 */
function ReadySignal({ onReady, loaded }: { onReady: () => void; loaded: Set<SceneId> }) {
  const { state } = useCine();
  const done = useRef(false);
  const settled = useRef(0);
  const epoch = useRef(navStore.epoch());
  useFrame(({ clock }) => {
    const t = state.time;
    const ok = SCENES.every((s) => t < s.visible[0] || t > s.visible[1] || loaded.has(s.id));
    // A section jump restarts the count, so its first frames are drawn behind the transition screen.
    if (epoch.current !== navStore.epoch()) {
      epoch.current = navStore.epoch();
      settled.current = 0;
    }
    settled.current = ok ? settled.current + 1 : 0;
    navStore.setSettled(settled.current >= SETTLE_FRAMES);
    if (done.current) return;
    if (settled.current < SETTLE_FRAMES && clock.elapsedTime < READY_TIMEOUT) return;
    done.current = true;
    onReady();
  });
  return null;
}

export default function Experience({
  state,
  compact,
  finePointer,
  onReady,
}: {
  state: CinematicState;
  compact: boolean;
  finePointer: boolean;
  onReady: () => void;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [low, setLow] = useState(false);
  const [dpr, setDpr] = useState(compact ? 1.25 : 1.5);
  const quality = useMemo<Quality>(() => ({ compact, low, finePointer }), [compact, low, finePointer]);
  const ctx = useMemo(() => ({ state, quality }), [state, quality]);
  const loaded = useMemo(() => new Set<SceneId>(), []);
  // Background warming of the other scenes waits until the first reveal is done.
  const ready = useRef(false);
  const onFirstFrame = () => {
    ready.current = true;
    onReady();
  };

  // Stop rendering once the journey has scrolled away (footer).
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(
    () => () => {
      disposeTextureCache();
      disposeShared();
    },
    [],
  );

  const post = !compact && !low;

  return (
    <div ref={wrap} className="absolute inset-0" aria-hidden="true">
      <Canvas
        frameloop={onScreen ? "always" : "never"}
        dpr={dpr}
        camera={{ position: [state.cam.x, state.cam.y, state.cam.z], fov: state.cam.fov, near: 0.1, far: 140 }}
        gl={{
          antialias: !post,
          alpha: false,
          stencil: false,
          powerPreference: "high-performance",
          // Filmic roll-off: highlights compress instead of clipping to flat colour.
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 0.95,
        }}
        onPointerMissed={() => focusStore.clear()}
      >
        <PerformanceMonitor
          onDecline={() => {
            setLow(true);
            setDpr(1);
          }}
          onIncline={() => setDpr(compact ? 1.25 : 1.5)}
          flipflops={3}
          onFallback={() => {
            setLow(true);
            setDpr(1);
          }}
        />
        <CineContext.Provider value={ctx}>
          {/* Neutral studio: a large overhead softbox, a key strip and a dim cool fill, so metal reads as metal. */}
          <Environment resolution={256} frames={1}>
            <Lightformer form="rect" intensity={1.5} color="#ffffff" position={[0, 6, 3]} scale={[10, 3, 1]} />
            <Lightformer form="rect" intensity={0.9} color="#dbe8f5" position={[-6, 1, 3]} scale={[3, 7, 1]} />
            <Lightformer form="rect" intensity={0.4} color="#6f93bb" position={[6, 0, 1]} scale={[3, 6, 1]} />
            <Lightformer form="rect" intensity={0.3} color="#f2e9dc" position={[0, 2, -6]} scale={[12, 3, 1]} />
            <Lightformer form="rect" intensity={0.15} color="#0b1a2e" position={[0, -5, 0]} scale={[14, 2, 1]} />
          </Environment>
          <Atmosphere />
          <CameraRig />
          <Dust count={compact ? 260 : 700} />
          <SceneGate loaded={loaded} ready={ready} />
          <ReadySignal onReady={onFirstFrame} loaded={loaded} />
        </CineContext.Provider>
        {post && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur radius={0.5} intensity={0.35} luminanceThreshold={1} luminanceSmoothing={0.15} />
            <Vignette offset={0.3} darkness={0.5} />
            {/* Fine grain, as on a photographed or filmed image: removes the banding and "digital" flatness of gradients. */}
            <Noise premultiply opacity={0.045} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
