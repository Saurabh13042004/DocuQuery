/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  plugins: [require("tailwindcss-animate")],
}
