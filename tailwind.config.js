/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pastel: { pink: '#FFC1D5', baby: '#FFD6E2', blush: '#FFF0F5', lavender: '#D8C8FA', mint: '#BFEAD9', sky: '#B9DDF0', peach: '#FFE0CC', yellow: '#FFF3C9', coral: '#F36F9C', purple: '#8068B0' },
      },
      fontFamily: { display: ['Playfair Display', 'serif'], body: ['Quicksand', 'sans-serif'] },
      borderRadius: { card: '1.5rem' },
      boxShadow: { soft: '0 8px 32px rgba(74, 68, 88, 0.08)' },
    },
  },
};
