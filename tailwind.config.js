/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./layouts/**/*.html",
    "./layouts/**/*.{html,js}",
    "./content/**/*.{html,md}",
  ],
  theme: {
    extend: {
      fontFamily: {
        simsun: ["SimSun", "sans-serif"],
      }
    },
  },
  plugins: [],
}
