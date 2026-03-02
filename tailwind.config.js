/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary brand palette (AI Search Mastery - March 2026)
        'mastery': '#1E3A5F',
        'signal': '#2563EB',
        'clarity': '#0D9488',
        'amber': '#D97706',
        // Neutrals
        'ink': '#1E293B',
        'slate': '#475569',
        'stone': '#94A3B8',
        'mist': '#E2E8F0',
        'cloud': '#F1F5F9',
        // Status colors
        'success': '#059669',
        'warning': '#D97706',
        'error': '#DC2626',
        // Legacy aliases (for gradual migration)
        'mastery-blue': '#1E3A5F',
        'innovation-teal': '#0D9488',
        'framework-black': '#1E293B',
        'ai-silver': '#475569',
        'authority-white': '#FFFFFF',
        'success-green': '#059669',
        'warning-amber': '#D97706',
        'error-red': '#DC2626',
      },
      fontFamily: {
        'primary': ['Inter', 'sans-serif'],
        'mono': ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}