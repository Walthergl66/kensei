/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        surface: '#141414',
        border: '#2A2A2A',
        primary: '#E8C547',
        'primary-dark': '#C4A32E',
        text: '#F5F5F5',
        'text-muted': '#888888',
        success: '#4CAF50',
        warning: '#FF9800',
        danger: '#F44336',
        rest: '#2196F3',
      },
    },
  },
  plugins: [],
};
