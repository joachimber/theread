interface TelegramButtonProps {
  variant?: "primary" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
  className?: string;
}

const TG_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_URL ||
  "https://t.me/theread_mantle_bot";

export function TelegramButton({
  variant = "primary",
  size = "md",
  label = "Open in Telegram",
  className = "",
}: TelegramButtonProps) {
  const sizeClass =
    size === "sm" ? "text-xs px-3 py-2" : size === "lg" ? "text-base px-5 py-3" : "text-sm px-4 py-2.5";
  const variantClass = variant === "primary" ? "btn-primary" : "btn-ghost";
  return (
    <a
      href={TG_URL}
      target="_blank"
      rel="noreferrer"
      className={`${variantClass} ${sizeClass} ${className} inline-flex items-center gap-2 font-medium`}
    >
      <TelegramGlyph size={size === "sm" ? 13 : size === "lg" ? 18 : 15} />
      <span>{label}</span>
      <span className="opacity-70">→</span>
    </a>
  );
}

function TelegramGlyph({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71l-4.14-3.05-1.99 1.93c-.23.23-.42.42-.83.42z" />
    </svg>
  );
}
