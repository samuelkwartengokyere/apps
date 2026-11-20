import { HERO } from "./content";
import { HeroVisual } from "./SceneLoader";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-16 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-6 lg:pb-28 xl:pb-32">
        <div className="relative z-10">
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan/25 bg-white/[0.03] px-3.5 py-1.5 font-mono text-xs tracking-wide text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            {HERO.eyebrow}
          </p>
          <h1 className="t-display">
            {HERO.titleLead} <span className="text-gradient">{HERO.titleAccent}</span>
          </h1>
          <p className="t-lead mt-6 max-w-[36rem] sm:mt-7">{HERO.body}</p>
          <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:items-center">
            <a
              href="#get-started"
              className="rounded-xl bg-primary px-7 py-4 text-center text-base font-medium text-white shadow-[0_0_40px_-8px_#2563eb] transition hover:-translate-y-0.5 hover:bg-blue-500"
            >
              Create your vault
            </a>
            <a
              href="#how-it-works"
              className="rounded-xl border border-line bg-white/[0.03] px-7 py-4 text-center text-base text-ink transition hover:-translate-y-0.5 hover:bg-white/[0.07]"
            >
              Explore how it works
            </a>
          </div>
        </div>

        <div className="relative lg:-mr-8 xl:-mr-12">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
