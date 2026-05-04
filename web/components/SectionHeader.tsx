interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  meta?: string;
}

export function SectionHeader({ eyebrow, title, description, meta }: SectionHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between border-b border-line pb-3 mb-5 gap-2 md:gap-6">
      <div>
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h2 className="text-[20px] md:text-[26px] tracking-tighter font-semibold leading-[1.15] text-ink">{title}</h2>
        {description ? <p className="text-[13px] md:text-sm text-dim mt-1.5 max-w-2xl leading-relaxed">{description}</p> : null}
      </div>
      {meta ? (
        <span className="text-xs text-dim tabular-nums whitespace-nowrap shrink-0">{meta}</span>
      ) : null}
    </div>
  );
}
