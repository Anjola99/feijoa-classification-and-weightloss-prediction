/** @type {import('tailwindcss').Config} Purpose: Tailwind design tokens for the Feijoa React frontend. */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        canopy: "#173f35",
        leaf: "#2f7d55",
        rind: "#89b36b",
        pulp: "#f1d96b",
        ember: "#c75a3a",
        ink: "#15231f",
        mist: "#f6f7f1",
        panel: "#ffffff",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(21, 35, 31, 0.12)",
      },
      fontFamily: {
        sans: ["Aptos", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
