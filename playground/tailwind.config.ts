/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,vue}"],
  theme: {
    fontFamily: {
      sans: ["Satoshi", "ui-sans-serif", "system-ui", "sans-serif"],
      mono: ["'Google Sans Code'", "Consolas", "ui-monospace", "monospace"]
    },
    extend: {
      // The showcase palette lives as CSS custom properties in `index.css`;
      // these names just hand it to utilities when a component wants one.
      colors: {
        canvas: "var(--c-canvas)",
        ink: "var(--c-ink)",
        dim: "var(--c-dim)",
        faint: "var(--c-faint)",
        line: "var(--c-line)",
        accent: "var(--c-accent)"
      }
    }
  },
  plugins: []
};
