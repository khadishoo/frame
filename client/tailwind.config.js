/** @type {import('tailwindcss').Config} */
export default {
  // Тёмная тема включается классом .dark на <html>, а не только системной настройкой
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
