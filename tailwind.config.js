/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#10b981',
          light: 'rgba(16, 185, 129, 0.1)',
        }
      }
    },
  },
  plugins: [],
}
