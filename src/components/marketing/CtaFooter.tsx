import { Logo } from "@/components/ui/Logo";

export function Cta() {
  return (
    <section id="get-started" className="scroll-mt-20 px-5 pb-24 sm:px-8">
      <div className="glass relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-14 text-center sm:px-12">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[70%] -translate-x-1/2 rounded-full bg-primary/30 blur-3xl" />
        <h2 className="relative text-balance text-3xl font-semibold tracking-tight sm:text-4xl">Create your vault</h2>
        <p className="relative mx-auto mt-4 max-w-xl text-pretty text-muted">
          Account creation isn't live yet — this site is a design preview of the SecureVault experience.
        </p>
        <a
          href="#top"
          className="relative mt-8 inline-block rounded-xl bg-primary px-6 py-3.5 font-medium text-white shadow-[0_0_40px_-8px_#2563eb] transition hover:bg-blue-500"
        >
          Back to top
        </a>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-md text-xs leading-relaxed text-muted">
            Design preview. SecureVault is not yet a production credential manager; its cryptography has not been
            implemented, audited or certified.
          </p>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#security" className="hover:text-ink">Security</a>
          <a href="#developers" className="hover:text-ink">Developers</a>
          <a href="#how-it-works" className="hover:text-ink">How it works</a>
        </nav>
      </div>
      <div className="border-t border-line/60 py-4 text-center text-xs text-muted">© 2026 SecureVault · v0.1 preview</div>
    </footer>
  );
}
