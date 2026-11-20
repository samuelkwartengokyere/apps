import { Reveal } from "@/components/motion/Reveal";
import { DeveloperVisual, PersonalVisual, SecurityVisual, SharedVisual, StorageVisual } from "./FeatureVisuals";

const features = [
  {
    id: "features",
    eyebrow: "Personal Vault",
    title: "One vault for personal credentials",
    body: "Keep the credentials and private information you rely on, organized in one place: logins, secure notes, Wi-Fi details and recovery codes. Search, categories, tags and favorites keep everyday access quick.",
    points: ["Multiple accounts per service", "Sensitive fields masked by default", "Custom fields and attachments"],
    visual: <PersonalVisual />,
  },
  {
    id: "developers",
    eyebrow: "Developer Vault",
    title: "A dedicated space for developer secrets",
    body: "Keep project secrets organized across Development, Staging and Production, with environment labels that are hard to miss, so the wrong value is harder to reach for.",
    points: ["API keys, SSH keys and environment variables", "Project and environment organization", "Monospaced display with reveal and copy controls"],
    visual: <DeveloperVisual />,
  },
  {
    id: "shared",
    eyebrow: "Shared Vault",
    title: "Share with control",
    body: "Family and team vaults with clear roles — Owner, Administrator, Editor and Viewer — so you can see who has access and what they can do. Secure links support expiry, view limits and revocation where implemented.",
    points: ["Role-based access", "Expiring and revocable shares", "Visible membership and permissions"],
    visual: <SharedVisual />,
  },
  {
    id: "security",
    eyebrow: "Security Center",
    title: "Security you can understand",
    body: "Understand what needs attention and why. Weak and reused password checks run locally after you unlock your vault, and device and session lists let you end access you don't recognise.",
    points: ["Transparent security score and its factors", "Alerts for new devices and account changes", "Audit log that never records secret values"],
    visual: <SecurityVisual />,
  },
  {
    id: "recovery",
    eyebrow: "Backup & Recovery",
    title: "Encrypted storage and recovery",
    body: "Encrypted exports, a recovery kit, version history and a Trash before permanent deletion. Because the vault is designed so you hold the keys, your recovery material matters — we'll explain exactly what it can and can't restore.",
    points: ["Encrypted backups", "Recovery kit you keep safe", "Versions and soft delete"],
    visual: <StorageVisual />,
  },
];

export function Features() {
  return (
    <div>
      {features.map((f, i) => (
        <section key={f.id} id={f.id} className="scroll-mt-20 border-t border-line/60 py-20 first:border-t-0 lg:py-28">
          <div
            className={`mx-auto grid max-w-7xl items-center gap-10 px-5 sm:px-8 lg:grid-cols-2 lg:gap-16 ${
              i % 2 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <Reveal>
              <p className="font-mono text-xs uppercase tracking-widest text-cyan">{f.eyebrow}</p>
              <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">{f.title}</h2>
              <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">{f.body}</p>
              <ul className="mt-6 space-y-2.5">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-3 text-sm text-ink/90">
                    <svg className="mt-0.5 shrink-0 text-cyan" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.08}>{f.visual}</Reveal>
          </div>
        </section>
      ))}
    </div>
  );
}
