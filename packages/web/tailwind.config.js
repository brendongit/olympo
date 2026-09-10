/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        eter: '#f5eecb',
        oceano: '#1d4e89',
        terra: '#4b6b3a',
        chama: '#b3401f',
        sombra: '#1b1523',
        icor: '#d4a821',
      },
    },
  },
  plugins: [],
};
