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
        primary: '#0077FF',
        'primary-hover': '#0066DD',
        'bg-light': '#f7f9fb',
        'text-main': '#222',
      },
      boxShadow: {
        card: '0 10px 30px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
