/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}', // <-- Denna rad är superviktig!
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
