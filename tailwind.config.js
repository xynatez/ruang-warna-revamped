/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./*.html", "./js/**/*.js"],
  darkMode: 'class',
  theme: {
    extend: {
      // Palet Warna Baru (Light Mode Lebih Cerah/Hangat)
      colors: {
        'primary': { // Teal Family (Sedikit lebih cerah di light)
          DEFAULT: '#14B8A6', // teal-500 Base
          light: '#0D9488', // teal-600 Text/Accent Kuat
          hover: '#0F766E', // teal-700
          // Warna Dark Mode
          dark: '#2DD4BF',   // teal-400
          dark_hover: '#5EEAD4' // teal-300
        },
        'secondary': { // Oranye Family (Lebih cerah/hangat di light)
          DEFAULT: '#F97316', // orange-600 Base
          light: '#F97316', // orange-600 Text/Accent
          hover: '#EA580C', // orange-700
          // Warna Dark Mode
          dark: '#FCD34D',   // amber-300
          dark_hover: '#FDE68A' // amber-200
        },
        'background': {
          light: '#FFFFFF', // Putih Murni
          dark: '#020617'   // slate-950
        },
        'content-bg': {
          light: '#FFFFFF', // white
          dark: '#1E293B'   // slate-800
        },
        'text-main': {
          light: '#111827', // gray-900
          dark: '#F1F5F9'   // slate-100
        },
        'text-muted': {
          light: '#4B5563', // gray-600
          dark: '#94A3B8'   // slate-400
        },
        'border-color': {
          light: '#E5E7EB', // gray-200
          dark: '#334155'   // slate-700
        },
        // Warna Hasil (Light Mode Cerah, Dark Mode Kontras Tinggi)
        'result-safe': {
          bg_light: '#ECFDF5',    // green-50
          text_light: '#047857',  // green-700
          border_light: '#A7F3D0',// green-200
          bg_dark: '#064E3B',      // green-900
          text_dark: '#A7F3D0',    // green-200
          border_dark: '#10B981'   // green-500
        },
        'result-tired': {
          bg_light: '#FFFBEB',    // amber-50
          text_light: '#B45309',  // amber-700
          border_light: '#FDE68A',// amber-200
          bg_dark: '#78350F',      // amber-900
          text_dark: '#FCD34D',    // amber-300
          border_dark: '#F59E0B'   // amber-500
        },
        'result-vulnerable': {
          bg_light: '#FFF1F2',    // rose-50
          text_light: '#BE123C',  // rose-700
          border_light: '#FECDD3',// rose-200
          bg_dark: '#881337',      // rose-900
          text_dark: '#FDA4AF',    // rose-300
          border_dark: '#F43F5E'   // rose-500
        },
        'result-emergency': {
          bg_light: '#FEF2F2',    // red-50
          text_light: '#B91C1C',  // red-700
          border_light: '#FECACA',// red-200
          bg_dark: '#7F1D1D',      // red-900
          text_dark: '#FCA5A5',    // red-300
          border_dark: '#EF4444'   // red-500
        },
      },
      // Font, Keyframes, Animation (Sama seperti sebelumnya)
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
           '20%': { transform: 'translateY(-4px)' },
           '40%': { transform: 'translateY(0px)' },
         },
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
        'pulse-slow': 'pulseSlow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'typing-dot': 'typingDot 1.2s infinite both ease-in-out',
      },
      // Unit DVH untuk tinggi dinamis
       height: {
        'dvh': '100dvh',
      },
      minHeight: {
         'dvh': '100dvh',
      },
      // Background Image (Contoh gradien halus, bisa dihapus jika tidak mau)
      backgroundImage: {
         'subtle-gradient': 'linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(20, 184, 166, 0.02) 100%)',
         'subtle-gradient-dark': 'linear-gradient(135deg, rgba(2,6,23,0) 0%, rgba(45, 212, 191, 0.04) 100%)',
      }
    },
  },
  plugins: [],
}
