import { Reveal } from "@/components/motion/Reveal";
import { FEATURES, type FeatureId } from "./content";
import { DeveloperVisual, PersonalVisual, SecurityVisual, SharedVisual, StorageVisual } from "./FeatureVisuals";

const visuals: Record<FeatureId, React.ReactNode> = {
  features: <PersonalVisual />,
  developers: <DeveloperVisual />,
  shared: <SharedVisual />,
  security: <SecurityVisual />,
  recovery: <StorageVisual />,
};

export function Features() {
  return (
    <div>
      {FEATURES.map((f, i) => (
        <section key={f.id} id={f.id} className="scroll-mt-20 border-t border-line/60 py-16 first:border-t-0 sm:py-20 lg:py-28 xl:py-32">
          <div
            className={`mx-auto grid max-w-7xl items-center gap-10 px-5 sm:gap-12 sm:px-8 lg:grid-cols-2 lg:gap-16 xl:gap-24 ${
              i % 2 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <Reveal>
              <p className="t-eyebrow">{f.eyebrow}</p>
              <h2 className="t-h2 mt-4">{f.title}</h2>
              <p className="t-body mt-5 max-w-xl sm:mt-6 xl:max-w-[34rem]">{f.body}</p>
              <ul className="mt-7 space-y-3">
                {f.points.map((p) => (
                  <li key={p} className="t-small flex items-start gap-3 text-ink/90 sm:text-base">
                    <svg className="mt-[0.25em] shrink-0 text-cyan" width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.08}>{visuals[f.id]}</Reveal>
          </div>
        </section>
      ))}
    </div>
  );
}
