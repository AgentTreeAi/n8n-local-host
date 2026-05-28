/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Sans', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#09090b', // zinc-950
        card: '#18181b', // zinc-900
        border: '#27272a', // zinc-800
        brand: {
          DEFAULT: '#6366f1', // Indigo-500
          hover: '#4f46e5', // Indigo-600
        },
        success: '#10b981', // Emerald-500
        warning: '#f43f5e', // Rose-500
        text: {
          primary: '#f4f4f5', // zinc-100
          secondary: '#a1a1aa', // zinc-400
          muted: '#71717a', // zinc-500
        }
      },
      boxShadow: {
        'brand': '0 0 15px rgba(99, 102, 241, 0.15)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
