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
        titanium: {
          950: '#07090E',
          900: '#0B0E14',
          800: '#141822',
          700: '#1F2533',
        }
      }
    },
  },
  plugins: [],
}
