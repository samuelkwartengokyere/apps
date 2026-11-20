import { HeroVisual } from "./SceneLoader";

export function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden pt-28 sm:pt-32 lg:pt-36">
      <div className="bg-grid pointer-events-none absolute inset-0 -z-10" />
      <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 pb-16 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:gap-4 lg:pb-24">
        {/* Text renders without waiting for any 3D assets */}
        <div className="relative z-10">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.03] px-3 py-1 font-mono text-xs text-cyan">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            Personal credentials · Developer secrets
          </p>
          <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
            Your digital life. <span className="text-gradient">Protected in one vault.</span>
          </h1>
          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            Securely manage passwords, private information and developer secrets with client-side encryption designed
            to keep your vault under your control.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="#get-started"
              className="rounded-xl bg-primary px-6 py-3.5 text-base font-medium text-white shadow-[0_0_40px_-8px_#2563eb] transition hover:bg-blue-500"
            >
              Create your vault
            </a>
            <a
              href="#how-it-works"
              className="rounded-xl border border-line bg-white/[0.03] px-6 py-3.5 text-base text-ink transition hover:bg-white/[0.07]"
            >
              Explore how it works
            </a>
          </div>
        </div>

        <div className="relative lg:-mr-8">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}
