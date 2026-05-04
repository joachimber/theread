import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "The Read · Mantle anomaly narrator",
  description:
    "Watches Mantle 24/7 and explains every market move in one sentence. Built for the Turing Test Hackathon 2026.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>
        <div className="ambient" aria-hidden="true" />
        <Header />
        <main>{children}</main>
        <footer className="border-t border-line mt-24 py-8 relative z-10">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-wrap gap-y-2 justify-between text-xs text-dim">
            <span className="flex items-center gap-3">
              <span className="text-accent">●</span>
              <span>The Read · ERC-8004 agent on Mantle</span>
              <span className="text-line">/</span>
              <span>Built for the Turing Test Hackathon 2026 · Track 2</span>
            </span>
            <span className="flex items-center gap-3">
              <span>auto-refresh 5s</span>
              <span className="text-line">/</span>
              <a href="https://mantle.xyz" target="_blank" rel="noreferrer" className="hover:text-ink">mantle.xyz ↗</a>
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
