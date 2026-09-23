/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ivory: {
          50: "#FFF9FB",
          100: "#FFF0F5",
          200: "#FCE8EF",
          300: "#F7D6E2",
          400: "#F0B8CC",
        },
        rose: {
          primary: "#8E5368",
          dark: "#6F3E50",
          accent: "#C9829B",
          container: "#FCEEF3",
          light: "#F5D5E0",
        },
        charcoal: {
          950: "#141014",
          900: "#1C171B",
          800: "#2A2328",
          700: "#453C42",
          600: "#695D65",
          500: "#8E808A",
          400: "#B8ABB4",
          300: "#D6CBD3",
        },
        academic: {
          success: "#3D8B67",
          warning: "#C58A35",
          danger: "#C75A5A",
          info: "#5B7C99",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px rgba(0, 0, 0, 0.04)',
        card: '0 4px 20px rgba(142, 83, 104, 0.08)',
        elevated: '0 10px 30px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
}
