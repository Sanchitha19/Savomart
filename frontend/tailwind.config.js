/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        savomart: {
          purple: '#782B90',
          'purple-dark': '#4A1A5C',
          'purple-light': '#F3E8F7',
          yellow: '#FFF200',
          'yellow-dark': '#E6D800',
          white: '#FFFFFF',
          dark: '#1A1A1A'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
