/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px',
      },
      colors: {
        // Restaurant Logo Colors - EXACT MATCH
        charcoal: {
          DEFAULT: '#1C1C1C',
          light: '#2A2A2A',
          dark: '#0F0F0F',
        },
        gold: {
          DEFAULT: '#D4AF37',
          light: '#E6C55A',
          dark: '#B8941F',
        },
        cream: {
          DEFAULT: '#FAF9F6',
          light: '#FFFFFF',
          dark: '#F5F4F1',
        },
        accent: {
          DEFAULT: '#C94F4F',
          light: '#D66B6B',
          dark: '#A83E3E',
        },
        brand: {
          navy: '#1e3653',
        },
      },
      fontFamily: {
        'display': ['Playfair Display', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
        'alt': ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '100%': { boxShadow: '0 0 30px rgba(212, 175, 55, 0.6)' },
        },
      },
      backgroundImage: {
        'restaurant-gradient': 'linear-gradient(135deg, #1C1C1C 0%, #2A2A2A 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37 0%, #B8941F 100%)',
        'cream-gradient': 'linear-gradient(135deg, #FAF9F6 0%, #F5F4F1 100%)',
      },
    },
  },
  plugins: [],
}

