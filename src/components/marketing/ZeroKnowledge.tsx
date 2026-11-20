import { Reveal } from "@/components/motion/Reveal";
import { ZK_COPY, ZK_POINTS } from "./content";
import { TunnelVisual } from "./SceneLoader";

export function ZeroKnowledge() {
  return (
    <section id="zero-knowledge" className="relative scroll-mt-20 overflow-hidden border-y border-line bg-navy/50 py-16 sm:py-20 lg:py-28 xl:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-3xl">
          <p className="t-eyebrow">{ZK_COPY.eyebrow}</p>
          <h2 className="t-h2 mt-4">{ZK_COPY.title}</h2>
          <p className="t-body mt-5 sm:mt-6">{ZK_COPY.body}</p>
        </Reveal>

        <div className="relative mt-10 h-[260px] sm:h-[340px] lg:h-[400px]">
          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-line bg-midnight/60" />
          <TunnelVisual />
          <div className="pointer-events-none absolute inset-x-5 bottom-3 flex items-center justify-between text-[11px] text-muted sm:inset-x-8 sm:text-xs">
            <span>Your device</span>
            <span className="hidden sm:inline">{ZK_COPY.disclaimer}</span>
            <span>Encrypted vault</span>
          </div>
        </div>

        <Reveal className="mt-8 grid gap-4 sm:grid-cols-3 lg:gap-6">
          {ZK_POINTS.map(([t, b]) => (
            <div key={t} className="glass rounded-2xl p-5 sm:p-6">
              <p className="text-base font-semibold tracking-tight">{t}</p>
              <p className="t-small mt-2 text-muted">{b}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
