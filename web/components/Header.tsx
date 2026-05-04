import Link from "next/link";
import { TelegramButton } from "./TelegramButton";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b border-line bg-bg/85 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-page mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tighter text-[15px]">
            <Logo size={20} />
            <span>The Read</span>
          </Link>
          <span className="hidden lg:flex items-center gap-2 text-[11px] eyebrow">
            <span className="w-1.5 h-1.5 bg-accent inline-block animate-pulse" />
            Mantle anomaly narrator
          </span>
        </div>
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/" className="px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors">Feed</Link>
          <Link href="/wallets" className="px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors">Wallets</Link>
          <Link href="/agent" className="px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors">Agent</Link>
          <a
            href="https://github.com/anthropics"
            target="_blank"
            rel="noreferrer"
            className="hidden md:inline-flex px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors"
          >
            Docs
          </a>
          <TelegramButton size="sm" className="ml-3" />
        </nav>
      </div>
    </header>
  );
}
