/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'none' } },
        scaleUp: { '0%': { opacity: '0', transform: 'scale(.96)' }, '100%': { opacity: '1', transform: 'none' } },
      },
      animation: {
        fadeIn: 'fadeIn .25s ease-out',
        'fade-in': 'fadeIn .25s ease-out',
        'scale-up': 'scaleUp .2s ease-out',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        '2xs': '0 1px 1px 0 rgb(0 0 0 / 0.04)',
      },
    },
  },
  plugins: [],
}
