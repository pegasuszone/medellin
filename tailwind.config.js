/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#00BFBD",
          50: "#4FFFD5",
          100: "#3AFFD7",
          200: "#12FFDE",
          300: "#00E8D6",
          400: "#00BFBD",
          500: "#0098A0",
          600: "#007282",
          700: "#005163",
          800: "#003345",
          900: "#001A26",
        },
        firefly: {
          DEFAULT: "#0B1328",
          50: "#7130B0",
          100: "#662EA8",
          200: "#522A98",
          300: "#402588",
          400: "#312178",
          500: "#231D68",
          600: "#181858",
          700: "#141948",
          800: "#0F1738",
          900: "#0B1328",
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/line-clamp"),
    require("tailwind-scrollbar-hide"),
  ],
};
