import type { Metadata } from "next";
import "./globals.css";
import { Header } from "../components/Header";

export const metadata: Metadata = {
  title: "The Read · Mantle anomaly narrator",
  description:
    "Watches Mantle 24/7 and explains every market move in one sentence. Built for the Turing Test Hackathon.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="max-w-[1400px] mx-auto px-6 py-8">{children}</main>
        <footer className="border-t border-line mt-16 py-6">
          <div className="max-w-[1400px] mx-auto px-6 flex justify-between text-xs text-dim">
            <span>The Read · ERC-8004 agent on Mantle</span>
            <span>Auto-refresh every 5s</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
