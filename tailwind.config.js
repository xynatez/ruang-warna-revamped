/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Palet Warna Baru (Kontras Tinggi)
        'primary': { // Teal Family
          DEFAULT: '#14B8A6', // teal-500 Base
          light: '#0D9488', // teal-600 for Light Mode Text/Accent
          dark: '#2DD4BF',   // teal-400 for Dark Mode Text/Accent
          hover: '#0F766E', // teal-700
          dark_hover: '#5EEAD4' // teal-300
        },
        'secondary': { // Amber Family
          DEFAULT: '#F59E0B', // amber-500 Base
          light: '#B45309', // amber-700 for Light Mode Text/Accent
          dark: '#FCD34D',   // amber-300 for Dark Mode Text/Accent
          hover: '#92400E', // amber-800
          dark_hover: '#FDE68A' // amber-200
        },
        'background': {
          light: '#F8FAFC', // slate-50
          dark: '#020617'   // slate-950 (Lebih gelap)
        },
        'content-bg': {
          light: '#FFFFFF', // white
          dark: '#1E293B'   // slate-800
        },
        'text-main': {
          light: '#0F172A', // slate-900
          dark: '#F1F5F9'   // slate-100
        },
        'text-muted': {
          light: '#475569', // slate-600
          dark: '#94A3B8'   // slate-400
        },
        'border-color': {
          light: '#E2E8F0', // slate-200
          dark: '#334155'   // slate-700
        },
        // Warna Hasil (Dengan Background & Text Spesifik Light/Dark)
        'result-safe': {
          bg_light: '#ECFDF5', // green-50
          text_light: '#065F46', // green-800
          border_light: '#A7F3D0', // green-200
          bg_dark: '#042F2E',   // Dark Green BG (Custom or Near green-950)
          text_dark: '#6EE7B7',   // green-300 Text
          border_dark: '#10B981' // green-500 Border
        },
        'result-tired': {
          bg_light: '#FFFBEB', // amber-50
          text_light: '#92400E', // amber-800
          border_light: '#FDE68A', // amber-200
          bg_dark: '#422006',   // Dark Amber BG (Custom or Near amber-950)
          text_dark: '#FCD34D',   // amber-300 Text
          border_dark: '#F59E0B' // amber-500 Border
        },
        'result-vulnerable': {
          bg_light: '#FFF1F2', // rose-50
          text_light: '#9F1239', // rose-800
          border_light: '#FECDD3', // rose-200
          bg_dark: '#4c0519',   // Dark Rose BG (Custom or Near rose-950)
          text_dark: '#FDA4AF',   // rose-300 Text
          border_dark: '#F43F5E' // rose-500 Border
        },
        'result-emergency': {
          bg_light: '#FEF2F2', // red-50
          text_light: '#991B1B', // red-800
          border_light: '#FECACA', // red-200
          bg_dark: '#450a0a',   // Dark Red BG (Custom or Near red-950)
          text_dark: '#FCA5A5',   // red-300 Text
          border_dark: '#EF4444' // red-500 Border
        },
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Nunito', 'sans-serif'],
      },
      keyframes: {
          fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } },
          slideUp: { '0%': { transform: 'translateY(15px)', opacity: 0 }, '100%': { transform: 'translateY(0)', opacity: 1 } },
          pulseSlow: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0.7 } },
          typingDot: {
           '0%': { transform: 'translateY(0px)' },
           '20%': { transform: 'translateY(-4px)' }, // Sedikit lebih kecil
           '40%': { transform: 'translateY(0px)' },
         },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards', // Easing lebih halus
        'pulse-slow': 'pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing-dot': 'typingDot 1.2s infinite both ease-in-out',
      },
      backgroundImage: { // Opsional: Background pattern halus
        'grid-pattern-light': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23E2E8F0'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
        'grid-pattern-dark': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%231E293B'%3E%3Cpath d='M0 38.59l2.83-2.83 1.41 1.41L1.41 40H0v-1.41zM0 1.4l2.83 2.83 1.41-1.41L1.41 0H0v1.41zM38.59 40l-2.83-2.83 1.41-1.41L40 38.59V40h-1.41zM40 1.41l-2.83 2.83-1.41-1.41L38.59 0H40v1.41z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      }
    },
  },
  plugins: [],
}
