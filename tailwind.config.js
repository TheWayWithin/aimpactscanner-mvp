/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mastery-blue': '#1E3A8A',
        'ai-silver': '#64748B',
        'authority-white': '#FFFFFF',
        'framework-black': '#0F172A',
        'innovation-teal': '#0891B2',
        'success-green': '#059669',
        'warning-amber': '#D97706',
        'error-red': '#DC2626',
      },
      fontFamily: {
        'primary': ['Inter', 'sans-serif'],
        'secondary': ['Source Sans Pro', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}