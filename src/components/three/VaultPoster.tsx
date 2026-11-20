/**
 * Static fallback for the hero scene (no WebGL, reduced motion, or before the
 * 3D bundle has loaded). Pure SVG, so it paints with the first HTML.
 */
export function VaultPoster({ className }: { className?: string }) {
  const bolts = Array.from({ length: 12 }, (_, i) => (i / 12) * 360);
  return (
    <svg viewBox="0 0 400 400" className={className} fill="none" role="img" aria-label="Illustration of a vault door surrounded by orbit rings">
      <defs>
        <radialGradient id="vp-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#22D3EE" stopOpacity="0.28" />
          <stop offset="1" stopColor="#22D3EE" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="vp-metal" x1="60" y1="60" x2="340" y2="340" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1f4262" />
          <stop offset="0.5" stopColor="#0c1d31" />
          <stop offset="1" stopColor="#16314b" />
        </linearGradient>
      </defs>
      <circle cx="200" cy="200" r="190" fill="url(#vp-glow)" />
      <ellipse cx="200" cy="200" rx="185" ry="70" stroke="#38BDF8" strokeOpacity="0.3" transform="rotate(-24 200 200)" />
      <ellipse cx="200" cy="200" rx="160" ry="110" stroke="#38BDF8" strokeOpacity="0.22" transform="rotate(38 200 200)" />
      <circle cx="200" cy="200" r="118" fill="url(#vp-metal)" stroke="#2c5a85" strokeWidth="6" />
      <circle cx="200" cy="200" r="92" stroke="#22D3EE" strokeWidth="2" strokeOpacity="0.9" />
      {bolts.map((a) => (
        <rect key={a} x="196" y="92" width="8" height="16" rx="2" fill="#1b3a57" transform={`rotate(${a} 200 200)`} />
      ))}
      <circle cx="200" cy="200" r="52" stroke="#3B82F6" strokeOpacity="0.8" />
      {[0, 60, 120].map((a) => (
        <rect key={a} x="146" y="198" width="108" height="4" rx="2" fill="#16314b" transform={`rotate(${a} 200 200)`} />
      ))}
      <circle cx="200" cy="200" r="30" fill="#0d2238" stroke="#2c5a85" strokeWidth="3" />
      <circle cx="200" cy="194" r="6" fill="#22D3EE" />
      <rect x="197" y="196" width="6" height="14" fill="#22D3EE" />
      {[
        [58, 150],
        [330, 96],
        [352, 258],
        [90, 318],
      ].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="7" height="7" fill="#22D3EE" transform={`rotate(45 ${x + 3.5} ${y + 3.5})`} />
      ))}
    </svg>
  );
}
