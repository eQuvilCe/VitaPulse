import type { Config } from "tailwindcss";

// Vita Health tokens live as CSS variables in globals.css; these map them to utilities.
const vh = (name: string) => `rgb(var(--vh-${name}) / <alpha-value>)`;
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, vh(`${name}-${s}`)]));

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
      },
      colors: {
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

        // Vita Health
        canvas: vh("canvas"),
        surface: vh("surface"),
        subtle: vh("subtle"),
        line: { DEFAULT: vh("line"), strong: vh("line-strong") },
        fg: { DEFAULT: vh("fg"), muted: vh("fg-muted"), subtle: vh("fg-subtle") },
        brand: { DEFAULT: vh("brand-600"), ...scale("brand", [50, 100, 300, 500, 600, 700, 800]) },
        kcal: { DEFAULT: vh("kcal-500"), ...scale("kcal", [50, 100, 300, 500, 600, 700]) },
        warn: { DEFAULT: vh("warn"), soft: vh("warn-soft") },
        danger: { DEFAULT: vh("danger"), soft: vh("danger-soft") },
        info: { DEFAULT: vh("info"), soft: vh("info-soft") },
      },
      fontSize: {
        caption: ["0.8125rem", { lineHeight: "1.125rem" }],
        body: ["0.9375rem", { lineHeight: "1.5rem" }],
        lead: ["1.125rem", { lineHeight: "1.75rem" }],
        heading: ["1.375rem", { lineHeight: "1.875rem", letterSpacing: "-0.01em", fontWeight: "650" }],
        title: ["2rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em" }],
        display: ["clamp(2.5rem, 5vw, 4rem)", { lineHeight: "1.05", letterSpacing: "-0.03em" }],
      },
      borderRadius: {
        field: "var(--vh-radius-field)",
        card: "var(--vh-radius-card)",
        panel: "var(--vh-radius-panel)",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(42,33,48,0.04), 0 12px 32px -12px rgba(42,33,48,0.14)",
        lift: "0 2px 4px rgba(42,33,48,0.05), 0 24px 48px -16px rgba(42,33,48,0.22)",
        warm: "0 12px 40px -10px rgba(244,123,99,0.55)",
        card: "var(--vh-shadow-card)",
        raised: "var(--vh-shadow-raised)",
        focus: "var(--vh-ring)",
      },
    },
  },
  plugins: [],
};

export default config;
