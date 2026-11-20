import { Logo } from "@/components/ui/Logo";
import { CTA_COPY } from "./content";

export function Cta() {
  return (
    <section id="get-started" className="scroll-mt-20 px-5 pb-20 sm:px-8 lg:pb-28">
      <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12 sm:py-20 lg:py-24">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <h2 className="t-h2 relative">{CTA_COPY.title}</h2>
        <p className="t-lead relative mx-auto mt-5 max-w-xl">{CTA_COPY.body}</p>
        <a
          href="#top"
          className="relative mt-9 inline-block rounded-xl bg-primary px-7 py-4 font-medium text-white shadow-[0_0_40px_-8px_#2563eb] transition hover:bg-blue-500"
        >
          Back to top
        </a>
      </div>
    </section>
  );
}

const FOOTER_COLUMNS = [
  {
    title: "Explore",
    links: [
      { href: "#features", label: "Personal vault" },
      { href: "#developers", label: "Developer vault" },
      { href: "#shared", label: "Shared vault" },
      { href: "#recovery", label: "Account recovery" },
    ],
  },
  {
    title: "Security",
    links: [
      { href: "#security", label: "Security Center" },
      { href: "#zero-knowledge", label: "Zero-knowledge design" },
      { href: "#how-it-works", label: "How it works" },
    ],
  },
  {
    title: "Project",
    links: [
      { href: "#get-started", label: "Get started" },
      { href: "#top", label: "Replay the journey" },
    ],
  },
];

const FOOTER_NOTES = [
  "Every name, device and record shown is sample data.",
  "Cryptography is not yet implemented, audited or certified.",
  "Account creation and sign-in are not live yet.",
];

export function Footer() {
  return (
    <footer className="relative isolate overflow-hidden bg-[#0a0f17]">
      {/* Carries the warm stone hall of the final scene down into the footer */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-[#2a2219] via-[#14120f] to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-px w-[min(60rem,90%)] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#ffd9a8]/70 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-40 w-[min(48rem,80%)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffcf99]/10 blur-3xl" />

      <div className="mx-auto max-w-7xl px-5 pb-10 pt-16 sm:px-8 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] lg:gap-16">
          <div>
            <a href="#top" aria-label="SecureVault — back to the start" className="inline-block">
              <Logo />
            </a>
            <p className="mt-5 max-w-sm t-small text-soft">
              One place for your passwords, keys and shared secrets — encrypted on your device before anything is sent.
            </p>
            <p className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/[0.07] px-3.5 py-1.5 text-xs text-[#f7c46c]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-warning/60 anim-pulse-ring" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-warning" />
              </span>
              Design preview · not yet available
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted/80">{col.title}</p>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-[15px] text-soft transition-colors hover:text-ink">
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <ul className="mt-14 grid gap-3 border-y border-line/70 py-6 sm:grid-cols-3 sm:gap-6">
          {FOOTER_NOTES.map((n) => (
            <li key={n} className="flex items-start gap-3 text-[13px] leading-relaxed text-muted">
              <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-cyan/80" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
                <circle cx="8" cy="8" r="6.25" />
                <path d="M8 7.2v4M8 4.9v.1" strokeLinecap="round" />
              </svg>
              {n}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col-reverse items-start justify-between gap-4 text-xs text-muted sm:flex-row sm:items-center">
          <p>© 2026 SecureVault · v0.1 preview</p>
          <a href="#top" className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-soft transition-colors hover:border-cyan/40 hover:text-ink">
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              <path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to the vault door
          </a>
        </div>
      </div>

      {/* Engraved wordmark, like lettering cut into the stone floor */}
      <p
        aria-hidden="true"
        className="pointer-events-none select-none text-center font-semibold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgb(255_217_168/0.09)] text-[clamp(4rem,17vw,15rem)] -mb-[0.18em]"
      >
        SecureVault
      </p>
    </footer>
  );
}
