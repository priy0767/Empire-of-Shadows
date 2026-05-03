/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        shadow: {
          900: '#0a0a0f', // Deep background
          800: '#13131a', // Panel background
          700: '#1c1c26', // Lighter panels
          neon: '#a855f7', // Purple accent
          success: '#22c55e', // Green alliances
          danger: '#ef4444', // Red conflicts
        }
      }
    },
  },
  plugins: [],
}