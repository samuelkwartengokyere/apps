import { Reveal } from "@/components/motion/Reveal";
import { TunnelVisual } from "./SceneLoader";

export function ZeroKnowledge() {
  return (
    <section id="zero-knowledge" className="relative scroll-mt-20 overflow-hidden border-y border-line bg-navy/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <Reveal className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan">Zero-knowledge design</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Encrypted on your device, before it's sent
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted">
            Your vault is encrypted on your trusted device before encrypted data is sent to the service. The server
            stores ciphertext; decryption authority stays with you.
          </p>
        </Reveal>

        <div className="relative mt-10 h-[260px] sm:h-[340px] lg:h-[400px]">
          <div className="pointer-events-none absolute inset-0 rounded-3xl border border-line bg-midnight/60" />
          <TunnelVisual />
          <div className="pointer-events-none absolute inset-x-5 bottom-3 flex items-center justify-between text-[11px] text-muted sm:inset-x-8">
            <span>Your device</span>
            <span className="hidden sm:inline">Conceptual illustration — not a representation of the actual cryptographic process</span>
            <span>Encrypted vault</span>
          </div>
        </div>

        <Reveal className="mt-8 grid gap-4 sm:grid-cols-3">
          {[
            ["Derived on your device", "Key material is derived on the trusted client from your master password."],
            ["Ciphertext in the service", "The server stores encrypted records and the metadata needed to sync them."],
            ["Recovery has limits", "A forgotten master password may not be recoverable through a standard reset."],
          ].map(([t, b]) => (
            <div key={t} className="glass rounded-2xl p-5">
              <p className="text-sm font-medium">{t}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{b}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
