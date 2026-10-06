/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/tailwind/native')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'eco-dark':   '#2c5f3f',
        'eco-mid':    '#3d7a55',
        'eco-main':   '#4a8f65',
        'eco-light':  '#5ea87a',
        'eco-soft':   '#cde4d5',
        'eco-pale':   '#f2f8f4',
        'eco-bg':     '#e8f3ec',
        'ivory':      '#f9f6f0',
        'ivory-dark': '#ede8df',
      },
    },
  },
};