import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
        bg: "#0b0f14",
        card: "#121821",
        accent: "#34d399",
        // Landing palette: warm plum night, cream daylight, peach/coral warmth,
        // a calm sea-mint for balance.
        plum: { DEFAULT: "#17121e", 2: "#211a2a", 3: "#2c2337" },
        cream: { DEFAULT: "#f8f2ec", 2: "#f1e8df" },
        ink: { DEFAULT: "#2a2130", soft: "#6c6071" },
        mist: "#bfb2c3",
        peach: "#ffb48f",
        coral: "#f47b63",
        mint: "#86d9c2",
        glow: "#fff7f1",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42,33,48,0.04), 0 12px 32px -12px rgba(42,33,48,0.14)",
        lift: "0 2px 4px rgba(42,33,48,0.05), 0 24px 48px -16px rgba(42,33,48,0.22)",
        warm: "0 12px 40px -10px rgba(244,123,99,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
