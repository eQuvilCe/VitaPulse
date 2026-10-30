import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        bg: "#0b0f14",
        card: "#121821",
        accent: "#34d399",
        pulse: "#fb7185",
      },
    },
  },
  plugins: [],
};

export default config;
