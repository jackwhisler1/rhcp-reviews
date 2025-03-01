/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        night: "#0B090A",
        "eerie-black": "#161A1D",
        "blood-red": "#660708",
        "cornell-red": "#A4161A",
        "cornell-red-2": "#BA181B",
        "imperial-red": "#E5383B",
        silver: "#B1A7A6",
        timberwolf: "#D3D3D3",
        "white-smoke": "#F5F3F4",
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
