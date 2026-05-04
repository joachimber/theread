import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#0a0a0a",
        panel: "#101010",
        line: "#1a1a1a",
        ink: "#f5f5f5",
        dim: "#7a7a7a",
        accent: "#00ff88",
        warn: "#ffb020",
        red: "#ff5555",
      },
    },
  },
  plugins: [],
};
export default config;
