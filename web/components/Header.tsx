import Link from "next/link";

export function Header() {
  return (
    <header className="border-b border-line">
      <div className="max-w-[1400px] mx-auto px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold tracking-tight">
            <span className="text-accent">●</span> THE READ
          </Link>
          <span className="text-[10px] text-dim uppercase tracking-widest">Mantle anomaly narrator</span>
        </div>
        <nav className="flex items-center gap-5 text-xs text-dim uppercase tracking-widest">
          <Link href="/" className="hover:text-ink">Feed</Link>
          <Link href="/wallets" className="hover:text-ink">Wallets</Link>
          <Link href="/agent" className="hover:text-ink">Agent</Link>
          <a
            href="https://mantlescan.xyz"
            target="_blank"
            rel="noreferrer"
            className="hover:text-ink"
          >
            Mantle ↗
          </a>
        </nav>
      </div>
    </header>
  );
}
