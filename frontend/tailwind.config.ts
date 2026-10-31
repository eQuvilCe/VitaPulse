import type { Config } from "tailwindcss";

// Vita Health tokens live as CSS variables in globals.css; these map them to utilities.
const vh = (name: string) => `rgb(var(--vh-${name}) / <alpha-value>)`;
const scale = (name: string, steps: number[]) =>
  Object.fromEntries(steps.map((s) => [s, vh(`${name}-${s}`)]));

// Anton has no Cyrillic, so Russian falls through to Oswald, another tall condensed face.
const display = ["var(--font-display)", "var(--font-display-cyr)", "Impact", "sans-serif"];

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display,
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
        accent: { DEFAULT: vh("accent"), on: vh("on-accent") },
        kcal: { DEFAULT: vh("kcal-500"), ...scale("kcal", [50, 100, 300, 500, 600, 700]) },
        warn: { DEFAULT: vh("warn"), soft: vh("warn-soft"), strong: vh("warn-strong") },
        danger: { DEFAULT: vh("danger"), soft: vh("danger-soft") },
        info: { DEFAULT: vh("info"), soft: vh("info-soft") },
      },
      fontSize: {
        caption: ["0.875rem", { lineHeight: "1.25rem" }],
        body: ["1rem", { lineHeight: "1.4" }],
        lead: ["1.25rem", { lineHeight: "1.4" }],
        heading: ["1.375rem", { lineHeight: "1.3", fontWeight: "600" }],
        title: ["2rem", { lineHeight: "1.15" }],
        // Display sizes for the condensed face: line-height 0.85, no tracking.
        "d-40": ["2.5rem", { lineHeight: "0.85", letterSpacing: "0" }],
        "d-90": ["5.625rem", { lineHeight: "0.85", letterSpacing: "0" }],
        "d-120": ["7.5rem", { lineHeight: "0.85", letterSpacing: "0" }],
        "d-150": ["9.375rem", { lineHeight: "0.85", letterSpacing: "0" }],
      },
      borderRadius: {
        field: "var(--vh-radius-field)",
        card: "var(--vh-radius-card)",
        panel: "var(--vh-radius-panel)",
      },
      boxShadow: {
        card: "var(--vh-shadow-card)",
        raised: "var(--vh-shadow-raised)",
        focus: "var(--vh-ring)",
      },
    },
  },
  plugins: [],
};

export default config;
