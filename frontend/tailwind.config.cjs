/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cursive: ['"Dancing Script"', 'Pacifico', 'Great Vibes', 'cursive'],
      },
      colors: {
        'rose-dust': { 50: '#fef5f7', 500: '#e65a7f' },
        'moonstone': { 50: '#f5faff', 500: '#408adf' },
        'terra': { 400: '#b98c6a' },
      },
    },
  },
  plugins: [],
};
