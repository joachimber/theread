import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "Menlo", "monospace"],
        display: ["var(--font-geist-sans)", "Inter", "sans-serif"],
      },
      colors: {
        bg: "#f7f4ea",
        paper: "#ffffff",
        ink: "#0a0a0a",
        "ink-2": "#2a2a2a",
        dim: "#6f6a5d",
        "dim-2": "#8a8676",
        line: "#e1dccb",
        "line-2": "#ece6d3",
        accent: "#0a8244",
        "accent-2": "#0e9d52",
        "accent-soft": "#d8efe1",
        red: "#b8333d",
        "red-soft": "#f4dadd",
        warn: "#b67200",
        highlight: "#f5e679",
      },
      letterSpacing: {
        tightest: "-0.035em",
        tighter: "-0.02em",
      },
      maxWidth: {
        page: "1320px",
        prose: "65ch",
      },
      fontSize: {
        "display-lg": ["clamp(48px, 7vw, 96px)", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(36px, 5vw, 64px)", { lineHeight: "1.0", letterSpacing: "-0.03em" }],
        "display-sm": ["clamp(28px, 3.5vw, 44px)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
    },
  },
  plugins: [],
};
export default config;
