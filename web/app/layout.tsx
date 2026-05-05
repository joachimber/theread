import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "../components/Header";
import { TelegramButton } from "../components/TelegramButton";

export const metadata: Metadata = {
  title: "The Read · Mantle anomaly narrator",
  description:
    "An autonomous agent that watches Mantle 24/7 and explains every market move in one sentence. Built for the Turing Test Hackathon 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <Header />
        <main>{children}</main>
        <footer className="border-t border-line bg-paper mt-24">
          <div className="max-w-page mx-auto px-6 py-12 grid md:grid-cols-[2fr_1fr_1fr] gap-10">
            <div>
              <div className="font-semibold tracking-tighter text-ink text-[17px]">The Read</div>
              <p className="text-sm text-dim mt-2 max-w-md leading-relaxed">
                Track 2 (AI Alpha &amp; Data) submission for the Mantle × Turing Test Hackathon 2026. An ERC-8004 agent
                that narrates Mantle in real time.
              </p>
              <div className="mt-5">
                <TelegramButton size="md" />
              </div>
            </div>
            <div>
              <div className="eyebrow mb-3">Surfaces</div>
              <ul className="space-y-2 text-sm">
                <li><a href="/" className="hover:text-accent">Live feed</a></li>
                <li><a href="/wallets" className="hover:text-accent">Wallet leaderboard</a></li>
                <li><a href="/agent" className="hover:text-accent">Agent identity</a></li>
              </ul>
            </div>
            <div>
              <div className="eyebrow mb-3">Stack</div>
              <ul className="space-y-2 text-sm">
                <li><a href="https://mantle.xyz" target="_blank" rel="noreferrer" className="hover:text-accent">Mantle Network ↗</a></li>
                <li><a href="https://z.ai" target="_blank" rel="noreferrer" className="hover:text-accent">Z.ai GLM-4.7 Flash ↗</a></li>
                <li><a href="https://venice.ai" target="_blank" rel="noreferrer" className="hover:text-accent">Venice ↗</a></li>
                <li><a href="https://eips.ethereum.org/EIPS/eip-8004" target="_blank" rel="noreferrer" className="hover:text-accent">ERC-8004 ↗</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-line">
            <div className="max-w-page mx-auto px-6 py-4 flex flex-wrap justify-between text-xs text-dim gap-3">
              <span>© 2026 · MIT License · No tracking, no cookies.</span>
              <span>auto-refresh 30s · cached 60s</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
