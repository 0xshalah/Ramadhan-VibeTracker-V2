/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#13ec5b",
        sage: {
          50: "#f4f7f5",
          100: "#e9efeb",
          200: "#d2dfd7",
          300: "#acc4b6",
          400: "#7fa38e",
          500: "#61896f",
          600: "#4a6b57",
          700: "#3d5647",
          800: "#32463a",
          900: "#2a3a31",
        },
        "background-light": "#f6f8f6",
        "background-dark": "#102216",
        gold: "#d4af37",
      },
      fontFamily: {
        display: ["Lexend", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg: "1rem",
        xl: "1.5rem",
        full: "9999px",
      },
    },
  },
  plugins: [],
};
