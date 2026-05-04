export function Logo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {/* a 'reading frame' lockup — open eye / spotlight */}
      <rect x="0" y="0" width="24" height="24" fill="#0a8244" />
      <rect x="3" y="3" width="18" height="18" fill="#f7f4ea" />
      <path d="M3 12 Q 12 3 21 12 Q 12 21 3 12 Z" fill="#0a8244" />
      <circle cx="12" cy="12" r="3.2" fill="#f7f4ea" />
      <circle cx="12" cy="12" r="1.4" fill="#0a8244" />
    </svg>
  );
}
