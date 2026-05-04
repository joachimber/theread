import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-line backdrop-blur-sm sticky top-0 z-20 bg-bg/80 relative">
      <div className="max-w-page mx-auto px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tightest">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <rect x="0" y="0" width="14" height="14" fill="#5cf2a4" />
              <rect x="2" y="2" width="10" height="10" fill="#060606" />
              <rect x="4" y="4" width="6" height="6" fill="#5cf2a4" />
            </svg>
            <span>THE&nbsp;READ</span>
          </Link>
          <span className="hidden md:inline text-[10px] text-dim uppercase tracking-[0.22em]">
            Mantle anomaly narrator
          </span>
        </div>
        <nav className="flex items-center gap-1 text-xs uppercase tracking-[0.2em]">
          <Link href="/" className="px-2.5 py-1 text-dim hover:text-ink hover:bg-panel transition-colors">Feed</Link>
          <Link href="/wallets" className="px-2.5 py-1 text-dim hover:text-ink hover:bg-panel transition-colors">Wallets</Link>
          <Link href="/agent" className="px-2.5 py-1 text-dim hover:text-ink hover:bg-panel transition-colors">Agent</Link>
          <a
            href="https://mantlescan.xyz"
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1 text-dim hover:text-ink hover:bg-panel transition-colors"
          >
            Mantle ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
