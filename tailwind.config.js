/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          base: '#FAFAFA',
          card: '#FFFFFF',
          muted: '#E8E8E8',
        },
        ink: {
          DEFAULT: '#000000',
          muted: '#808080',
          soft: '#A3A3A3',
        },
        mono: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#000000',
        },
        error: {
          text: '#DC2626',
        },
        action: {
          like: '#FF4444',
          report: '#FF4444',
        },
      },
      boxShadow: {
        neo: '4px 4px 0 0 #000000',
        'neo-sm': '2px 2px 0 0 #000000',
        'neo-header': '0 4px 0 0 #000000',
      },
      keyframes: {
        slideUpFade: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [],
}
