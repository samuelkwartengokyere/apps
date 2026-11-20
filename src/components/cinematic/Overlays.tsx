import { LogoMark } from "@/components/ui/Logo";
import {
  CTA_COPY,
  DEMO_NOTE,
  HERO,
  HOW_STEPS,
  TUNNEL_MESSAGES,
  VAULT_HUD,
  ZK_COPY,
  ZK_POINTS,
  featureById,
} from "@/components/marketing/content";

/**
 * HTML layer of the journey. Every `data-cine` block starts hidden and is
 * revealed by the master timeline (see timeline.ts); `data-line` children are
 * staggered inside their block. Positioning lives on the outer wrappers so it
 * never fights GSAP's transforms.
 */

const card = "cine-card p-5 pl-6 sm:p-7 sm:pl-8 xl:p-9 xl:pl-10";
const eyebrow = "t-eyebrow";
const title = "t-h3 mt-4";
const body = "t-body mt-4";

/** Pinned copy: bottom sheet on phones, side column on larger screens. */
const side = {
  left: "inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:inset-x-8 md:inset-x-[10vw] lg:inset-y-0 lg:left-(--edge-text) lg:right-auto lg:flex lg:w-[min(32rem,42vw)] lg:items-center xl:w-[min(34rem,38vw)]",
  right: "inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] sm:inset-x-8 md:inset-x-[10vw] lg:inset-y-0 lg:left-auto lg:right-(--edge) lg:flex lg:w-[min(32rem,42vw)] lg:items-center xl:w-[min(34rem,38vw)]",
} as const;

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-5 space-y-2.5 sm:mt-6">
      {items.map((p) => (
        <li key={p} data-line className="t-small flex items-start gap-3 text-ink/90 sm:text-[0.9375rem]">
          <svg className="mt-[0.2em] shrink-0 text-cyan" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {p}
        </li>
      ))}
    </ul>
  );
}

function FeatureCopy({ id, name, at }: { id: Parameters<typeof featureById>[0]; name: string; at: keyof typeof side }) {
  const f = featureById(id);
  return (
    <div className={`absolute ${side[at]}`}>
      <div data-cine={name} className={`${card} w-full`}>
        <p data-line className={eyebrow}>{f.eyebrow}</p>
        <h2 data-line className={title}>{f.title}</h2>
        <p data-line className={`${body} hidden lg:block`}>{f.body}</p>
        <Points items={f.points} />
      </div>
    </div>
  );
}

const caption = "absolute inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center sm:bottom-10";
const pill = "rounded-full border border-cyan/20 bg-midnight/75 px-5 py-2.5 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-cyan shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-md sm:text-xs lg:text-[13px]";

export function Overlays() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Scene 1 — brand + opening */}
      <div className="absolute inset-x-4 bottom-24 sm:inset-x-8 md:inset-x-[10vw] lg:inset-y-0 lg:left-(--edge-text) lg:right-auto lg:flex lg:w-[min(56rem,66vw)] lg:items-center lg:pb-0">
        <div data-cine="vault-hero" className="relative w-full">
          {/* Soft scrim so copy stays legible over the 3D vault at every size */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -inset-y-14 -z-10 bg-[radial-gradient(ellipse_at_50%_55%,rgb(7_17_31/0.82),rgb(7_17_31/0.5)_55%,transparent_78%)] lg:-inset-x-16 lg:-inset-y-24 lg:bg-[radial-gradient(ellipse_at_35%_50%,rgb(7_17_31/0.72),rgb(7_17_31/0.35)_55%,transparent_75%)]"
          />
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-midnight/60 px-3.5 py-1.5 font-mono text-xs tracking-wide text-cyan backdrop-blur sm:mb-6">
            <LogoMark className="h-4 w-4" />
            SecureVault
          </p>
          <h1 className="t-display t-legible md:!text-[clamp(2.75rem,1.2rem+4.6vw,3.75rem)] lg:!text-[clamp(3.25rem,1.6rem+2.9vw,4.5rem)]">
            <span className="md:block">{HERO.titleLead}</span> <span className="text-gradient md:block md:w-fit">{HERO.titleAccent}</span>
          </h1>
          <p className="t-lead t-legible mt-5 max-w-[34rem] sm:mt-6 xl:max-w-[38rem]">{HERO.body}</p>
          <p className="t-eyebrow t-eyebrow--bare mt-6 !text-cyan/80 sm:mt-8">{HERO.eyebrow}</p>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-5 flex justify-center sm:bottom-7">
        <div data-cine="scroll-hint" className="flex flex-col items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-soft sm:text-xs">
          <span data-line className="t-legible">Scroll to open the vault</span>
          <span data-line className="relative block h-10 w-[1.35rem] rounded-full border border-cyan/50 bg-midnight/40 shadow-[0_0_24px_-6px_#22d3ee] backdrop-blur-sm" aria-hidden="true">
            <span className="anim-scroll-dot absolute left-1/2 top-2 h-2 w-1 -translate-x-1/2 rounded-full bg-cyan" />
          </span>
        </div>
      </div>
      {VAULT_HUD.map((t, i) => (
        <div key={t} className={caption}>
          <p data-cine={`vault-hud-${i + 1}`} className={pill}>
            {String(i + 1).padStart(2, "0")} · {t}
          </p>
        </div>
      ))}

      {/* Scene 2 — the four tunnel messages are 3D cards in the scene itself */}

      {/* Scene 3 — Personal Vault */}
      <FeatureCopy id="features" name="personal-copy" at="left" />
      <div className={caption}>
        <p data-cine="personal-recovery" className={pill}>
          Recovery codes · personal information · sample data
        </p>
      </div>

      {/* Scene 4 — Developer Vault */}
      <FeatureCopy id="developers" name="developer-copy" at="right" />

      {/* Scene 5 — Shared Vault */}
      <FeatureCopy id="shared" name="shared-copy" at="left" />

      {/* Scene 6 — Security Center */}
      <FeatureCopy id="security" name="security-copy" at="right" />
      <div className="absolute inset-x-4 bottom-[max(1.5rem,env(safe-area-inset-bottom))] flex justify-center sm:bottom-10 lg:justify-start lg:pl-(--edge-text)">
        <div data-cine="security-hud" className="flex items-center gap-4 rounded-2xl border border-cyan/20 bg-midnight/75 px-5 py-3 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md sm:gap-5 sm:px-6 sm:py-4">
          <p className="font-mono text-4xl font-semibold tabular-nums text-cyan sm:text-5xl lg:text-6xl">
            <span data-score>0</span>
            <span className="text-lg text-muted">/100</span>
          </p>
          <div className="text-left">
            <p className="text-sm font-medium sm:text-base">Example security score</p>
            <p className="font-mono text-[11px] text-warning">{DEMO_NOTE}</p>
          </div>
        </div>
      </div>

      {/* Scene 7 — Zero-knowledge */}
      <div className={`absolute ${side.right}`}>
        <div data-cine="zk-copy" className={`${card} w-full`}>
          <p data-line className={eyebrow}>{ZK_COPY.eyebrow}</p>
          <h2 data-line className={title}>{ZK_COPY.title}</h2>
          <p data-line className={`${body} hidden lg:block`}>{ZK_COPY.body}</p>
        </div>
      </div>
      <div className="absolute inset-x-4 top-20 flex justify-center">
        <p data-cine="zk-disclaimer" className="max-w-xl rounded-full border border-warning/40 bg-midnight/75 px-4 py-2 text-center font-mono text-[11px] text-warning backdrop-blur-md sm:text-xs">
          {ZK_COPY.disclaimer}
        </p>
      </div>
      <div className="absolute inset-x-4 bottom-5 sm:inset-x-8 sm:bottom-8">
        <div data-cine="zk-steps" className="mx-auto max-w-6xl">
          <p data-line className={`${eyebrow} t-eyebrow--bare mb-3 w-full justify-center`}>How it works</p>
          <ol className="grid grid-cols-5 gap-2 sm:gap-3">
            {HOW_STEPS.map(([t], i) => (
              <li key={t} data-line className="rounded-xl border border-line bg-midnight/75 p-2 backdrop-blur-md sm:p-3.5 lg:p-4">
                <span className="font-mono text-[10px] text-cyan sm:text-xs">0{i + 1}</span>
                <p className="mt-1 text-[10px] font-medium leading-tight sm:text-sm lg:text-base">{t}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {/* Scene 8 — final CTA */}
      <div className="absolute inset-x-4 bottom-[8%] flex flex-col items-center text-center sm:bottom-[9%]">
        <div data-cine="cta-headline" className="max-w-3xl">
          <h2 data-line className="t-display t-legible !text-[clamp(2rem,1.2rem+3.6vw,4.5rem)]">
            Your digital life. <span className="text-gradient">One vault.</span>
          </h2>
          <p data-line className="t-lead t-legible mx-auto mt-4 max-w-xl !text-ink/85">
            {CTA_COPY.body}
          </p>
        </div>
        <div data-cine="cta-actions" className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <a
            data-line
            href="#top"
            className="pointer-events-auto rounded-xl bg-primary px-6 py-3.5 text-base font-medium sm:px-7 sm:py-4 text-white shadow-[0_0_40px_-8px_#2563eb] transition hover:bg-blue-500"
          >
            Replay the journey
          </a>
          <a
            data-line
            href="#how-it-works"
            className="pointer-events-auto rounded-xl border border-line bg-midnight/60 px-6 py-3.5 text-base sm:px-7 sm:py-4 text-ink backdrop-blur transition hover:bg-white/[0.07]"
          >
            Explore how it works
          </a>
        </div>
      </div>

      {/* Same story as text, for assistive tech, while the visuals are scrubbed */}
      <div className="sr-only">
        <h2>SecureVault overview</h2>
        <p>{HERO.body}</p>
        {TUNNEL_MESSAGES.map(([t, b]) => (
          <p key={t}>
            {t}. {b}
          </p>
        ))}
        {(["features", "developers", "shared", "security"] as const).map((id) => {
          const f = featureById(id);
          return (
            <section key={id}>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
              <ul>
                {f.points.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </section>
          );
        })}
        <section>
          <h3>{ZK_COPY.title}</h3>
          <p>{ZK_COPY.body}</p>
          <p>{ZK_COPY.disclaimer}.</p>
          <ul>
            {ZK_POINTS.map(([t, b]) => (
              <li key={t}>
                {t}: {b}
              </li>
            ))}
          </ul>
        </section>
        <p>{DEMO_NOTE}.</p>
      </div>
    </div>
  );
}
