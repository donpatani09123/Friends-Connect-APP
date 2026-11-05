/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          neon: '#6C5CE7',
          cyan: '#00CEC9',
          pink: '#FF7675',
          dark: '#0F172A',
          card: '#1E293B'
        }
      }
    },
  },
  plugins: [],
}
