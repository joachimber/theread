export function Logo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {/* The Read mark: green disc, almond reading-eye in cream, square pupil
          as on-chain callback. Three shapes, no frame, scales clean to 16px. */}
      <circle cx="12" cy="12" r="11" fill="#0a8244" />
      <path d="M 1.5 12 Q 12 4.5 22.5 12 Q 12 19.5 1.5 12 Z" fill="#f7f4ea" />
      <rect x="10" y="10" width="4" height="4" fill="#0a8244" />
    </svg>
  );
}
