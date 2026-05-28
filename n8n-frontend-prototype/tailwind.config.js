/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        none: '0px',
        sm: '0px',
        DEFAULT: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '9999px', // keep full for specific circles if needed, but we'll try to avoid it
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        background: '#000000', // true black
        card: '#0a0a0a', // very dark grey
        border: '#1f1f1f', // dark border
        brand: {
          DEFAULT: '#39ff14', // Acid Green
          hover: '#32cc11',
        },
        success: '#39ff14', // Acid Green
        warning: '#ff003c', // Deep Crimson/Neon Red
        text: {
          primary: '#ffffff', // pure white
          secondary: '#888888', // mid grey
          muted: '#444444', // dark grey
        }
      },
      boxShadow: {
        'brand': '0 0 15px rgba(57, 255, 20, 0.15)',
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}
