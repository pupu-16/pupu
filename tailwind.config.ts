import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        glass: "0 24px 80px rgba(0, 0, 0, 0.34)",
        glow: "0 0 60px rgba(116, 232, 210, 0.24)"
      }
    }
  },
  plugins: []
};

export default config;
