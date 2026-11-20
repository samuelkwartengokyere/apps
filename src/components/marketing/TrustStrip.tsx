import { TRUST_ITEMS } from "./content";

export function TrustStrip() {
  return (
    <section aria-label="Capabilities" className="border-y border-line bg-navy/40">
      <ul className="mx-auto grid max-w-7xl gap-px px-5 py-8 sm:grid-cols-2 sm:gap-x-8 sm:px-8 sm:py-10 lg:grid-cols-4 lg:gap-10 lg:py-14">
        {TRUST_ITEMS.map((it) => (
          <li key={it.title} className="py-3 lg:border-l lg:border-line/70 lg:pl-6 lg:first:border-l-0 lg:first:pl-0">
            <p className="text-base font-semibold tracking-tight text-ink">{it.title}</p>
            <p className="t-small mt-1.5 text-muted">{it.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
