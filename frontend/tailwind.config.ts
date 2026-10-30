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
        // Landing palette: flat, monochrome, no shadows or gradients.
        putty: "#c4c3b6",
        ink: "#000000",
        bone: "#e7e5e4",
        chalk: "#ebebeb",
        vellum: "#dfdcd5",
        graphite: "#595855",
        paper: "#ffffff",
      },
    },
  },
  plugins: [],
};

export default config;
