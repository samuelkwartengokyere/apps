/**
 * Marketing copy shared by the static sections and the cinematic overlays so
 * both presentations always say the same thing.
 */

export const HERO = {
  eyebrow: "Personal credentials · Developer secrets",
  titleLead: "Your digital life.",
  titleAccent: "Protected in one vault.",
  body: "Securely manage passwords, private information and developer secrets with client-side encryption designed to keep your vault under your control.",
};

export const TRUST_ITEMS = [
  { title: "Client-side encryption", body: "Designed so vault data is encrypted before it leaves your device." },
  { title: "Personal & developer vaults", body: "Credentials and project secrets, kept in one place." },
  { title: "Secure sharing", body: "Roles, expiry and revocation for family and team vaults." },
  { title: "Device & session controls", body: "See where you're signed in and end sessions." },
];

export type FeatureId = "features" | "developers" | "shared" | "security" | "recovery";

export const FEATURES: { id: FeatureId; eyebrow: string; title: string; body: string; points: string[] }[] = [
  {
    id: "features",
    eyebrow: "Personal Vault",
    title: "One vault for personal credentials",
    body: "Keep the credentials and private information you rely on, organized in one place: logins, secure notes, Wi-Fi details and recovery codes. Search, categories, tags and favorites keep everyday access quick.",
    points: ["Multiple accounts per service", "Sensitive fields masked by default", "Custom fields and attachments"],
  },
  {
    id: "developers",
    eyebrow: "Developer Vault",
    title: "A dedicated space for developer secrets",
    body: "Keep project secrets organized across Development, Staging and Production, with environment labels that are hard to miss, so the wrong value is harder to reach for.",
    points: ["API keys, SSH keys and environment variables", "Project and environment organization", "Monospaced display with reveal and copy controls"],
  },
  {
    id: "shared",
    eyebrow: "Shared Vault",
    title: "Share with control",
    body: "Family and team vaults with clear roles — Owner, Administrator, Editor and Viewer — so you can see who has access and what they can do. Secure links support expiry, view limits and revocation where implemented.",
    points: ["Role-based access", "Expiring and revocable shares", "Visible membership and permissions"],
  },
  {
    id: "security",
    eyebrow: "Security Center",
    title: "Security you can understand",
    body: "Understand what needs attention and why. Weak and reused password checks run locally after you unlock your vault, and device and session lists let you end access you don't recognise.",
    points: ["Transparent security score and its factors", "Alerts for new devices and account changes", "Audit log that never records secret values"],
  },
  {
    id: "recovery",
    eyebrow: "Backup & Recovery",
    title: "Encrypted storage and recovery",
    body: "Encrypted exports, a recovery kit, version history and a Trash before permanent deletion. Because the vault is designed so you hold the keys, your recovery material matters — we'll explain exactly what it can and can't restore.",
    points: ["Encrypted backups", "Recovery kit you keep safe", "Versions and soft delete"],
  },
];

export const featureById = (id: FeatureId) => FEATURES.find((f) => f.id === id)!;

export const ZK_COPY = {
  eyebrow: "Zero-knowledge design",
  title: "Encrypted on your device, before it's sent",
  body: "Your vault is encrypted on your trusted device before encrypted data is sent to the service. The server stores ciphertext; decryption authority stays with you.",
  disclaimer: "Conceptual illustration — not a representation of the actual cryptographic process",
};

export const ZK_POINTS: [string, string][] = [
  ["Derived on your device", "Key material is derived on the trusted client from your master password."],
  ["Ciphertext in the service", "The server stores encrypted records and the metadata needed to sync them."],
  ["Recovery has limits", "A forgotten master password may not be recoverable through a standard reset."],
];

export const HOW_STEPS: [string, string][] = [
  ["Create an account", "Register and verify the account using the selected authentication method."],
  ["Set up vault protection", "Create a master vault password and establish the recovery approach."],
  ["Unlock on your device", "Derive the appropriate key material on the trusted client and unwrap the vault key."],
  ["Use your vault", "Create, search and manage encrypted records after the vault is unlocked."],
  ["Sync securely", "Send encrypted records and required cryptographic metadata to the service."],
];

export const CTA_COPY = {
  title: "Create your vault",
  body: "Account creation isn't live yet — this site is a design preview of the SecureVault experience.",
};

/** Captions shown while travelling through the digital tunnel. */
export const TUNNEL_MESSAGES: [string, string][] = [
  ["Encrypted before it leaves your device", "Designed so vault data is encrypted on your trusted device first."],
  ["The service stores ciphertext", "Designed so the server holds encrypted records, not readable secrets."],
  ["You hold the keys", "Key material is derived on your device from your master password."],
  ["Recovery has limits", "A forgotten master password may not be recoverable. Keep your recovery kit safe."],
];

export const VAULT_HUD = [
  "Locking mechanisms engaging",
  "Bolts retracting",
  "Door unsealing",
] as const;

export const DEMO_NOTE = "Demonstration data · not connected to a real account";
