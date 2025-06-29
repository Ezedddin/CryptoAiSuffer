/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'dark-bg': '#121212',
        'dark-card': '#1e1e1e',
        'dark-border': '#333333',
        'crypto-green': '#00ff88',
        'crypto-blue': '#00d4ff',
        'crypto-purple': '#8b5cf6',
      },
      backgroundColor: {
        'dark': '#121212',
        'card-dark': '#1e1e1e',
      },
      textColor: {
        'dark': '#ffffff',
        'dark-secondary': '#b3b3b3',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 