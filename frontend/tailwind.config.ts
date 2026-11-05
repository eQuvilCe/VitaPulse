import type { Config } from "tailwindcss";

// Vita Health tokens live as CSS variables in globals.css; these map them to utilities.
const vh = (name: string) => `rgb(var(--vh-${name}) / <alpha-value>)`;
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, vh(`${name}-${s}`)]));

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  // Themes switch CSS variables, not classes: see globals.css.
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Legacy name used for big numbers: the text face reads better there.
        serif: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        canvas: vh("canvas"),
        surface: vh("surface"),
        subtle: vh("subtle"),
        line: { DEFAULT: vh("line"), strong: vh("line-strong") },
        fg: { DEFAULT: vh("fg"), muted: vh("fg-muted"), subtle: vh("fg-subtle") },
        brand: { DEFAULT: vh("brand-600"), ...scale("brand", [50, 100, 300, 500, 600, 700, 800]) },
        accent: { DEFAULT: vh("accent"), 2: vh("accent-2"), on: vh("on-accent") },
        lime: vh("lime"),
        halo: vh("halo"),
        // Fixed, theme-independent: text and scrims over photos and video.
        cream: vh("cream"),
        ink: vh("ink"),
        kcal: { DEFAULT: vh("kcal-500"), ...scale("kcal", [50, 100, 300, 500, 600, 700]) },
        warn: { DEFAULT: vh("warn"), soft: vh("warn-soft"), strong: vh("warn-strong") },
        danger: { DEFAULT: vh("danger"), soft: vh("danger-soft") },
        info: { DEFAULT: vh("info"), soft: vh("info-soft") },
      },
      fontSize: {
        caption: ["0.875rem", { lineHeight: "1.25rem" }],
        body: ["1rem", { lineHeight: "1.4" }],
        lead: ["1.25rem", { lineHeight: "1.4" }],
        heading: ["1.375rem", { lineHeight: "1.3", fontWeight: "500" }],
        title: ["2rem", { lineHeight: "1.15" }],
      },
      borderRadius: {
        field: "var(--vh-radius-field)",
        card: "var(--vh-radius-card)",
        panel: "var(--vh-radius-panel)",
      },
      boxShadow: {
        card: "var(--vh-shadow-card)",
        raised: "var(--vh-shadow-raised)",
        glow: "var(--vh-shadow-glow)",
        focus: "var(--vh-ring)",
      },
    },
  },
  plugins: [],
};

export default config;
