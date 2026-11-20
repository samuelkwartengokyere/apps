export function LogoMark({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="4" y1="2" x2="28" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#22D3EE" />
          <stop offset="1" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <path
        d="M16 2.5 4.5 6.8v8.1c0 7 4.8 12.2 11.5 14.6 6.7-2.4 11.5-7.6 11.5-14.6V6.8L16 2.5Z"
        stroke="url(#lm)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="13.5" r="3.4" stroke="url(#lm)" strokeWidth="1.8" />
      <path d="M16 16.9v5" stroke="url(#lm)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className="text-[17px] font-semibold tracking-tight">SecureVault</span>
    </span>
  );
}
