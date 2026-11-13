/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F45B55",
        background: "#FFF9F8",
        dark: "#17182E",
      },
    },
  },
  plugins: [],
};