const items = [
  { title: "Client-side encryption", body: "Designed so vault data is encrypted before it leaves your device." },
  { title: "Personal & developer vaults", body: "Credentials and project secrets, kept in one place." },
  { title: "Secure sharing", body: "Roles, expiry and revocation for family and team vaults." },
  { title: "Device & session controls", body: "See where you're signed in and end sessions." },
];

export function TrustStrip() {
  return (
    <section aria-label="Capabilities" className="border-y border-line bg-navy/40">
      <ul className="mx-auto grid max-w-7xl gap-px px-5 py-8 sm:grid-cols-2 sm:px-8 lg:grid-cols-4 lg:gap-8">
        {items.map((it) => (
          <li key={it.title} className="py-3">
            <p className="text-sm font-medium text-ink">{it.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{it.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
