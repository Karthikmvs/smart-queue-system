/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f6fe',
          100: '#eaedfcf',
          200: '#d9defa',
          300: '#bec5f7',
          400: '#9ca4f2',
          500: '#797fe9',
          600: '#5e61dc',
          700: '#4e4fc4',
          800: '#42429f',
          900: '#39397f',
          950: '#22224b',
        }
      }
    },
  },
  plugins: [],
}
