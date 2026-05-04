import Link from "next/link";
import { TelegramButton } from "./TelegramButton";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="border-b border-line bg-bg/85 backdrop-blur-md sticky top-0 z-30 relative">
      <div className="max-w-page mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-4 md:gap-7 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-2 md:gap-2.5 font-semibold tracking-tighter text-[14px] md:text-[15px] shrink-0"
          >
            <Logo size={20} />
            <span className="hidden sm:inline">The Read</span>
          </Link>
          <span className="hidden xl:flex items-center gap-2 text-[11px] eyebrow">
            <span className="w-1.5 h-1.5 bg-accent inline-block animate-pulse" />
            Mantle anomaly narrator
          </span>
        </div>
        <nav className="flex items-center gap-0.5 md:gap-1 text-sm shrink-0">
          <Link
            href="/"
            className="px-2 md:px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors text-[13px] md:text-sm"
          >
            Feed
          </Link>
          <Link
            href="/wallets"
            className="px-2 md:px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors text-[13px] md:text-sm"
          >
            Wallets
          </Link>
          <Link
            href="/agent"
            className="px-2 md:px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors text-[13px] md:text-sm"
          >
            Agent
          </Link>
          <a
            href="https://github.com/Virtual-Protocol/openclaw-acp"
            target="_blank"
            rel="noreferrer"
            className="hidden lg:inline-flex px-3 py-1.5 text-ink-2 hover:text-ink hover:bg-line-2 transition-colors"
          >
            Docs
          </a>
          <span className="ml-0.5 md:ml-2">
            <span className="hidden sm:inline">
              <TelegramButton size="sm" />
            </span>
            <span className="sm:hidden">
              <TelegramButton size="sm" label="TG" />
            </span>
          </span>
        </nav>
      </div>
    </header>
  );
}
