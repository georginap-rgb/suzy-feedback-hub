/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        suzy: {
          pink: '#FF3B6B',
          'pink-dark': '#D42F5A',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  safelist: [
    'border-l-red-500',
    'border-l-amber-500',
    'border-l-green-500',
    'bg-red-100', 'text-red-700', 'text-red-400',
    'bg-amber-100', 'text-amber-700', 'text-amber-400',
    'bg-green-100', 'text-green-700', 'text-green-400',
  ],
  plugins: [],
}
