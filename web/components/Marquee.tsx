"use client";

interface Item {
  symbol: string;
  priceUsd: number | null;
  change24h: number | null;
}

export function Marquee({ items, blockNumber }: { items: Item[]; blockNumber: number }) {
  const filtered = items.filter((i) => i.priceUsd !== null);
  if (filtered.length === 0) return null;
  const sequence = [...filtered, ...filtered];
  return (
    <div className="border-y border-line bg-panel overflow-hidden">
      <div className="flex items-center gap-8 whitespace-nowrap py-2.5 marquee-track text-xs">
        {sequence.map((i, idx) => {
          const tone = (i.change24h ?? 0) >= 0 ? "text-accent" : "text-red";
          return (
            <span key={`${i.symbol}-${idx}`} className="inline-flex items-center gap-3">
              <span className="text-dim uppercase tracking-widest text-[10px]">{i.symbol}</span>
              <span className="font-semibold tabular-nums">
                ${(i.priceUsd ?? 0).toLocaleString("en-US", { maximumFractionDigits: i.priceUsd! < 1 ? 4 : 2 })}
              </span>
              {i.change24h !== null ? (
                <span className={`tabular-nums ${tone}`}>
                  {(i.change24h ?? 0) >= 0 ? "+" : ""}
                  {i.change24h?.toFixed(2)}%
                </span>
              ) : null}
              <span className="text-line">·</span>
            </span>
          );
        })}
        <span className="inline-flex items-center gap-3 text-dim">
          <span className="uppercase tracking-widest text-[10px]">Block</span>
          <span className="font-semibold tabular-nums text-ink">{blockNumber.toLocaleString()}</span>
          <span className="text-line">·</span>
        </span>
      </div>
      <style>{`
        .marquee-track {
          width: max-content;
          animation: marquee-slide 60s linear infinite;
        }
        @keyframes marquee-slide {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
