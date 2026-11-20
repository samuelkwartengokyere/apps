/**
 * Lightweight, CSS/SVG feature illustrations (blueprint §4.2). They are
 * explanatory metaphors with placeholder content only — no real data.
 */

const frame = "glass relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-3xl";

export function PersonalVisual() {
  const cards = [
    { label: "Logins", meta: "Multiple accounts per service", pos: "left-[6%] top-[10%]", d: "0s" },
    { label: "Secure notes", meta: "Private text", pos: "right-[6%] top-[16%]", d: "-1.5s" },
    { label: "Wi-Fi", meta: "Network credentials", pos: "left-[8%] bottom-[12%]", d: "-3s" },
    { label: "Recovery codes", meta: "Backup access", pos: "right-[7%] bottom-[10%]", d: "-4.5s" },
  ];
  return (
    <div className={frame} role="img" aria-label="Illustration: logins, notes, Wi-Fi details and recovery codes arranged around a central vault">
      <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
        <span className="anim-pulse-ring absolute inset-0 rounded-full border border-cyan/40" />
        <span className="anim-pulse-ring absolute inset-0 rounded-full border border-cyan/30 [animation-delay:-1.5s]" />
        <div className="absolute inset-4 rounded-full border border-line bg-gradient-to-br from-navy-2 to-midnight shadow-[0_0_50px_-10px_#22d3ee]">
          <div className="absolute inset-5 rounded-full border border-cyan/60" />
          <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_14px_#22d3ee]" />
        </div>
      </div>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{ animationDelay: c.d }}
          className={`anim-float absolute ${c.pos} w-[38%] rounded-xl border border-line bg-navy/90 p-3 shadow-xl`}
        >
          <p className="text-sm font-medium">{c.label}</p>
          <p className="mt-0.5 text-xs text-muted">{c.meta}</p>
          <div className="mt-2.5 h-1.5 w-2/3 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}

export function DeveloperVisual() {
  const envs = [
    { name: "Development", tone: "text-success border-success/40 bg-success/10", key: "DATABASE_URL" },
    { name: "Staging", tone: "text-warning border-warning/40 bg-warning/10", key: "DATABASE_URL" },
    { name: "Production", tone: "text-danger border-danger/40 bg-danger/10", key: "DATABASE_URL" },
  ];
  return (
    <div className={frame} role="img" aria-label="Illustration: project secrets separated into Development, Staging and Production panels">
      <div className="absolute inset-0 flex items-center justify-center [perspective:1000px]">
        <div className="flex w-[74%] flex-col gap-3.5 [transform-style:preserve-3d] [transform:rotateX(10deg)_rotateY(-22deg)_rotateZ(2deg)]">
          {envs.map((e, i) => (
            <div
              key={e.name}
              style={{ transform: `translateZ(${i * 34}px) translateX(${i * 14}px)` }}
              className="rounded-xl border border-line bg-navy/95 p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <span className={`rounded-md border px-2 py-0.5 font-mono text-[11px] ${e.tone}`}>{e.name}</span>
                <span className="font-mono text-[11px] text-muted">my-project</span>
              </div>
              <p className="mt-3 font-mono text-xs text-muted">{e.key}</p>
              <p className="mt-1 font-mono text-sm tracking-widest text-ink/80">••••••••••••••••</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SharedVisual() {
  const nodes = [
    { x: 50, y: 50, label: "Owner", r: 9 },
    { x: 18, y: 24, label: "Administrator", r: 6 },
    { x: 82, y: 26, label: "Editor", r: 6 },
    { x: 24, y: 80, label: "Viewer", r: 6 },
    { x: 78, y: 78, label: "Viewer", r: 6 },
  ];
  return (
    <div className={frame}>
      <svg viewBox="0 0 100 75" className="absolute inset-0 h-full w-full" role="img" aria-label="Illustration: a shared vault with an owner, administrator, editor and two viewers connected to it">
        {nodes.slice(1).map((n) => (
          <line
            key={n.x}
            x1={50}
            y1={37.5}
            x2={n.x}
            y2={n.y * 0.75}
            stroke="#22d3ee"
            strokeOpacity="0.55"
            strokeWidth="0.4"
            strokeDasharray="1.6 1.6"
            className="anim-flow"
          />
        ))}
        {nodes.map((n, i) => (
          <g key={`${n.x}-${n.y}`}>
            <circle cx={n.x} cy={n.y * 0.75} r={n.r} fill="#0d1b2a" stroke={i === 0 ? "#22d3ee" : "#3b82f6"} strokeWidth="0.6" />
            <circle cx={n.x} cy={n.y * 0.75} r={n.r / 3} fill={i === 0 ? "#22d3ee" : "#60a5fa"} />
            <text x={n.x} y={n.y * 0.75 + n.r + 4.5} textAnchor="middle" fontSize="3.2" fill="#94a3b8">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function SecurityVisual() {
  const rows = [
    { label: "Reused passwords", state: "Needs attention", tone: "text-warning" },
    { label: "Weak passwords", state: "Needs attention", tone: "text-warning" },
    { label: "Active sessions", state: "Review", tone: "text-cyan" },
  ];
  return (
    <div className={frame}>
      <div className="absolute left-[6%] top-1/2 aspect-square w-[38%] -translate-y-1/2" aria-hidden="true">
        <div className="absolute inset-0 rounded-full border border-line" />
        <div className="absolute inset-[16%] rounded-full border border-line" />
        <div className="absolute inset-[32%] rounded-full border border-line" />
        <div
          className="anim-sweep absolute inset-0 rounded-full"
          style={{ background: "conic-gradient(from 0deg, rgb(34 211 238 / 0.35), transparent 22%)" }}
        />
        <span className="absolute left-[62%] top-[26%] h-2 w-2 rounded-full bg-warning shadow-[0_0_10px_#f59e0b]" />
        <span className="absolute left-[30%] top-[64%] h-2 w-2 rounded-full bg-cyan shadow-[0_0_10px_#22d3ee]" />
      </div>
      <div className="absolute right-[6%] top-1/2 w-[44%] -translate-y-1/2 space-y-2.5">
        <p className="mb-3 text-xs uppercase tracking-widest text-muted">Example findings</p>
        {rows.map((r) => (
          <div key={r.label} className="rounded-lg border border-line bg-navy/90 px-3 py-2.5">
            <p className="text-sm">{r.label}</p>
            <p className={`mt-0.5 flex items-center gap-1.5 text-xs ${r.tone}`}>
              <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
                <path d="M5 1 9.5 9h-9L5 1Z" fill="currentColor" />
              </svg>
              {r.state}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function StorageVisual() {
  const layers = [
    { t: "Encrypted export", s: "Portable backup", o: "translate-y-0" },
    { t: "Recovery kit", s: "Store it somewhere safe", o: "translate-y-3 translate-x-4" },
    { t: "Version history", s: "Restore earlier edits", o: "translate-y-6 translate-x-8" },
    { t: "Trash", s: "Soft delete before removal", o: "translate-y-9 translate-x-12" },
  ];
  return (
    <div className={frame} role="img" aria-label="Illustration: layered cards for encrypted export, recovery kit, version history and trash">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative h-44 w-[62%]">
          {layers.map((l, i) => (
            <div
              key={l.t}
              style={{ zIndex: 10 - i, opacity: 1 - i * 0.12 }}
              className={`absolute inset-x-0 top-0 rounded-xl border border-line bg-navy-2/95 p-4 shadow-xl ${l.o} -translate-x-6 -translate-y-3`}
            >
              <p className="text-sm font-medium">{l.t}</p>
              <p className="text-xs text-muted">{l.s}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
