import { Reveal } from "@/components/motion/Reveal";
import { HOW_STEPS } from "./content";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-16 sm:py-20 lg:py-28 xl:py-32">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="t-eyebrow">How it works</p>
          <h2 className="t-h2 mt-4">From sign-up to synced, in five steps</h2>
        </Reveal>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 sm:mt-12 lg:mt-14 lg:grid-cols-5">
          {HOW_STEPS.map(([t, b], i) => (
            <Reveal as="li" key={t} delay={i * 0.06} className="glass relative rounded-2xl p-5 transition hover:-translate-y-1 hover:border-cyan/30 sm:p-6">
              <span className="font-mono text-sm text-cyan">0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight">{t}</h3>
              <p className="t-small mt-2.5 text-muted">{b}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
