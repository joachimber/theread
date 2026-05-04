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
        bg: "#060606",
        panel: "#0e0e0e",
        line: "#1c1c1c",
        ink: "#f0f0f0",
        dim: "#6f6f6f",
        accent: "#5cf2a4",
        warn: "#ffc14d",
        red: "#ff6464",
      },
      letterSpacing: {
        tightest: "-0.025em",
      },
      maxWidth: {
        page: "1400px",
      },
    },
  },
  plugins: [],
};
export default config;
