/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: {
          50: '#fdfbf7',
          100: '#f9f5ec',
          200: '#f2ebd9',
          300: '#e8dcc0',
          400: '#d9c9a3',
          500: '#c7b385',
        },
        midnight: {
          50: '#e8e9ee',
          100: '#c4c7d2',
          200: '#9499ad',
          300: '#646b85',
          400: '#3e445c',
          500: '#252a3d',
          600: '#1a1e2e',
          700: '#131621',
          800: '#0d0f17',
          900: '#080a0f',
        },
        brass: {
          50: '#fbf6ec',
          100: '#f5e8cf',
          200: '#ebd09e',
          300: '#dcb36a',
          400: '#cf9c47',
          500: '#b8862f',
          600: '#9a6f26',
          700: '#7c5820',
          800: '#5e4219',
          900: '#402c12',
        },
        teal: {
          50: '#eef7f6',
          100: '#d2e9e6',
          200: '#a5d2cd',
          300: '#6fb5ad',
          400: '#459790',
          500: '#2e7a73',
          600: '#23605a',
          700: '#1c4c47',
          800: '#163b37',
          900: '#102b28',
        },
        rust: {
          50: '#fbf0ec',
          100: '#f5dcd1',
          200: '#eab29c',
          300: '#dc8568',
          400: '#c95f3f',
          500: '#ad462a',
          600: '#8e3820',
          700: '#702d1a',
          800: '#522418',
          900: '#361810',
        },
      },
      fontFamily: {
        serif: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl2': '1.25rem',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInSlow: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.8)', opacity: '0.6' },
          '80%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        drawLens: {
          '0%': { strokeDashoffset: '200' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-out forwards',
        fadeInSlow: 'fadeInSlow 0.8s ease-out forwards',
        scaleIn: 'scaleIn 0.4s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        pulseRing: 'pulseRing 2s ease-out infinite',
        spinSlow: 'spinSlow 3s linear infinite',
        drawLens: 'drawLens 1.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};
