import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ivory Bloom & Champagne Academic Palette
        ivory: {
          50: "#FFFDFE",
          100: "#FDF6F9",
          200: "#FAF0F4", // Primary Ivory Bloom
          300: "#F5E4EC",
          400: "#EED5E0",
          500: "#E3BFD0",
          600: "#CFA4B8",
          700: "#B8869E",
          800: "#98627A",
          900: "#75455A",
        },
        rose: {
          subtle: "#FDF2F6",
          light: "#F9DEE8",
          container: "#F6E6ED",
          accent: "#D17C9B", // Soft Rose Accent
          primary: "#8E4662", // Deep Academic Rose Primary
          hover: "#7B3953",
          dark: "#682E44",
          deep: "#4E1D31",
        },
        charcoal: {
          50: "#F9F8F9",
          100: "#EBE9EC",
          200: "#D7D3D8",
          300: "#B8B2BA",
          400: "#98909A",
          500: "#7C747F",
          600: "#635B66", // Text Secondary (Light)
          700: "#4B444E",
          800: "#342E37",
          900: "#201B22", // Text Primary (Light) / Card Dark
          950: "#130F14", // Deep Velvet Dark Canvas
        },
        surface: {
          DEFAULT: "var(--color-surface)",
          ground: "var(--color-surface-ground)",
          card: "var(--color-surface-card)",
          soft: "var(--color-surface-soft)",
          muted: "var(--color-surface-muted)",
        },
        border: {
          DEFAULT: "var(--color-border)",
          subtle: "var(--color-border-subtle)",
          strong: "var(--color-border-strong)",
        },
        // Operational & Academic Indicator States
        academic: {
          success: "#2E8555",
          "success-subtle": "#EAF5EE",
          warning: "#C27A23",
          "warning-subtle": "#FDF5E8",
          danger: "#C54545",
          "danger-subtle": "#FDF0F0",
          info: "#3A7EBF",
          "info-subtle": "#EBF3FA",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        soft: "0 2px 10px -2px rgba(142, 70, 98, 0.05), 0 1px 3px -1px rgba(0, 0, 0, 0.03)",
        card: "0 4px 20px -2px rgba(142, 70, 98, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        elevated: "0 14px 34px -4px rgba(142, 70, 98, 0.10), 0 6px 14px -2px rgba(0, 0, 0, 0.05)",
        glow: "0 0 25px rgba(209, 124, 155, 0.28)",
        "glow-dark": "0 0 25px rgba(209, 124, 155, 0.15)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-jakarta)", "Plus Jakarta Sans", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
