/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cấu hình màu đỏ đặc trưng của FTU theo UI
        'ftu-red': '#941B0C',
        'ftu-red-dark': '#7A1508',
      }
    },
  },
  plugins: [],
}