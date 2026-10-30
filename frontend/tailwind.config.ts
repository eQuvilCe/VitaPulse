import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        // Biometric readouts only (numbers, units, timestamps).
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      colors: {
        bg: "#0b0f14",
        card: "#121821",
        accent: "#34d399",
        // Landing "Living Rhythm" palette.
        night: "#050b0a",
        deep: "#0a1412",
        mint: "#6ff2c2",
        // Heartbeat moments only: beat dots, the pulse head, the intro spark.
        coral: "#ff7a66",
        bone: "#eef1ec",
        sage: "#93a59d",
      },
    },
  },
  plugins: [],
};

export default config;
