import { Reveal } from "@/components/motion/Reveal";

const steps = [
  ["Create an account", "Register and verify the account using the selected authentication method."],
  ["Set up vault protection", "Create a master vault password and establish the recovery approach."],
  ["Unlock on your device", "Derive the appropriate key material on the trusted client and unwrap the vault key."],
  ["Use your vault", "Create, search and manage encrypted records after the vault is unlocked."],
  ["Sync securely", "Send encrypted records and required cryptographic metadata to the service."],
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan">How it works</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">From sign-up to synced, in five steps</h2>
        </Reveal>
        <ol className="mt-12 grid gap-4 md:grid-cols-5">
          {steps.map(([t, b], i) => (
            <Reveal as="li" key={t} delay={i * 0.06} className="glass relative rounded-2xl p-5">
              <span className="font-mono text-xs text-cyan">0{i + 1}</span>
              <h3 className="mt-3 text-base font-medium">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{b}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
