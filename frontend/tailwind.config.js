/******** EventMax Professional Tailwind Configuration ********/
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors - Professional EventMax Palette
        primary: {
          50: '#fef7ff',
          100: '#fdecff',
          200: '#fbd9ff',
          300: '#f8b9ff',
          400: '#f389ff',
          500: '#ed5aff', // Main brand color
          600: '#e038f7',
          700: '#cc28e3',
          800: '#a622ba',
          900: '#881e96',
          950: '#5b0d68',
          DEFAULT: '#ed5aff',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Secondary blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
          DEFAULT: '#0ea5e9',
        },
        accent: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15', // Accent yellow
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
          950: '#422006',
          DEFAULT: '#facc15',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e', // Success green
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
          DEFAULT: '#22c55e',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Warning orange
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
          DEFAULT: '#f59e0b',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // Danger red
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
          DEFAULT: '#ef4444',
        },
        // Neutral Colors with Rich Depth
        neutral: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Dark Mode Specific Colors
        dark: {
          50: '#18181b',
          100: '#27272a',
          200: '#3f3f46',
          300: '#52525b',
          400: '#71717a',
          500: '#a1a1aa',
          600: '#d4d4d8',
          700: '#e4e4e7',
          800: '#f4f4f5',
          900: '#fafafa',
        },
        // Background Colors
        background: '#ffffff',
        foreground: '#0a0a0a',
        muted: '#f5f5f5',
        'muted-foreground': '#737373',
        popover: '#ffffff',
        'popover-foreground': '#0a0a0a',
        card: '#ffffff',
        'card-foreground': '#0a0a0a',
        border: '#e5e5e5',
        input: '#e5e5e5',
        ring: '#ed5aff',
        // Premium Gold Palette
        gold: {
          50: '#FFFDF5',
          100: '#FEF9E7',
          200: '#FEF3C7',
          300: '#F4E4BA',
          400: '#E5C76B',
          500: '#D4AF37', // Main premium gold
          600: '#C0A062',
          700: '#A68A2A',
          800: '#8B7420',
          900: '#705D1A',
          DEFAULT: '#D4AF37',
        },
        // Premium Slate/Black for dark themes
        slate: {
          850: '#1a1a2e',
          950: '#0A0A0A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'Monaco', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
        '8xl': ['6rem', { lineHeight: '1' }],
        '9xl': ['8rem', { lineHeight: '1' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        'glow': '0 0 20px rgb(237 90 255 / 0.3)',
        'glow-lg': '0 0 40px rgb(237 90 255 / 0.4)',
        'neon': '0 0 5px rgb(237 90 255 / 0.6), 0 0 20px rgb(237 90 255 / 0.4), 0 0 35px rgb(237 90 255 / 0.3)',
        'gold-glow': '0 0 20px rgb(212 175 55 / 0.3)',
        'gold-glow-lg': '0 0 40px rgb(212 175 55 / 0.5), 0 0 60px rgb(212 175 55 / 0.3)',
        'gold-neon': '0 0 5px rgb(212 175 55 / 0.6), 0 0 20px rgb(212 175 55 / 0.4), 0 0 35px rgb(212 175 55 / 0.3)',
        'premium': '0 25px 50px -12px rgb(0 0 0 / 0.4), 0 0 30px rgb(212 175 55 / 0.2)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgb(120, 119, 198) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(255, 119, 198) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(255, 0, 128) 0px, transparent 50%), radial-gradient(at 80% 50%, rgb(120, 119, 198) 0px, transparent 50%), radial-gradient(at 0% 100%, rgb(120, 200, 255) 0px, transparent 50%), radial-gradient(at 80% 100%, rgb(255, 119, 198) 0px, transparent 50%), radial-gradient(at 0% 0%, rgb(255, 200, 0) 0px, transparent 50%)',
        'hero-pattern': "url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 32 32\" width=\"32\" height=\"32\" fill=\"none\" stroke=\"rgb(148 163 184 / 0.05)\"><path d=\"m0 .5 32 32M31.5 0 0 32\"/></svg>')",
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'fade-out': 'fadeOut 0.5s ease-in-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'slide-in-down': 'slideInDown 0.5s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'zoom-in': 'zoomIn 0.5s ease-out',
        'zoom-out': 'zoomOut 0.5s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'shimmer-slow': 'shimmer 3s linear infinite',
        'gradient': 'gradient 3s ease infinite',
        'typing': 'typing 3.5s steps(40, end), blink-caret 0.75s step-end infinite',
        'golden-pulse': 'goldenPulse 2s ease-in-out infinite',
        'holographic': 'holographic 3s linear infinite',
        'ticket-reveal': 'ticketReveal 0.8s ease-out forwards',
        'draw-check': 'drawCheck 0.5s ease-out forwards',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        zoomIn: {
          '0%': { transform: 'scale(0.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        zoomOut: {
          '0%': { transform: 'scale(1.5)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgb(237 90 255 / 0.2), 0 0 10px rgb(237 90 255 / 0.2), 0 0 15px rgb(237 90 255 / 0.2)' },
          '100%': { boxShadow: '0 0 20px rgb(237 90 255 / 0.6), 0 0 30px rgb(237 90 255 / 0.4), 0 0 40px rgb(237 90 255 / 0.3)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        typing: {
          'from': { width: '0' },
          'to': { width: '100%' },
        },
        'blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: 'rgb(237 90 255)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        goldenPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6), 0 0 60px rgba(212, 175, 55, 0.3)' },
        },
        holographic: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '200% 200%' },
        },
        ticketReveal: {
          '0%': { transform: 'perspective(1000px) rotateX(-90deg)', opacity: '0' },
          '60%': { transform: 'perspective(1000px) rotateX(10deg)' },
          '100%': { transform: 'perspective(1000px) rotateX(0)', opacity: '1' },
        },
        drawCheck: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionDuration: {
        '0': '0ms',
        '75': '75ms',
        '100': '100ms',
        '150': '150ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
        '2000': '2000ms',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'dramatic': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
      zIndex: {
        '-1': '-1',
        '0': '0',
        '10': '10',
        '20': '20',
        '30': '30',
        '40': '40',
        '50': '50',
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
        'auto': 'auto',
      },
      screens: {
        'xs': '475px',
        '3xl': '1920px',
        '4xl': '2560px',
      },
    },
  },
  plugins: [
    // Custom plugin for glassmorphism effect and utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.glass': {
          'backdrop-filter': 'blur(16px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(16px) saturate(180%)',
          'background-color': 'rgba(255, 255, 255, 0.75)',
          'border': '1px solid rgba(209, 213, 219, 0.3)',
        },
        '.glass-dark': {
          'backdrop-filter': 'blur(16px) saturate(180%)',
          '-webkit-backdrop-filter': 'blur(16px) saturate(180%)',
          'background-color': 'rgba(0, 0, 0, 0.75)',
          'border': '1px solid rgba(75, 85, 99, 0.3)',
        },
        '.text-gradient': {
          'background': 'linear-gradient(135deg, #ed5aff, #0ea5e9)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-secondary': {
          'background': 'linear-gradient(135deg, #0ea5e9, #22c55e)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.text-gradient-accent': {
          'background': 'linear-gradient(135deg, #facc15, #f59e0b)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-gradient-mesh': {
          'background': 'radial-gradient(at 40% 20%, rgb(120, 119, 198) 0px, transparent 50%), radial-gradient(at 80% 0%, rgb(255, 119, 198) 0px, transparent 50%), radial-gradient(at 0% 50%, rgb(255, 0, 128) 0px, transparent 50%), radial-gradient(at 80% 50%, rgb(120, 119, 198) 0px, transparent 50%), radial-gradient(at 0% 100%, rgb(120, 200, 255) 0px, transparent 50%), radial-gradient(at 80% 100%, rgb(255, 119, 198) 0px, transparent 50%), radial-gradient(at 0% 0%, rgb(255, 200, 0) 0px, transparent 50%)',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            'display': 'none',
          },
        },
        '.scrollbar-thin': {
          'scrollbar-width': 'thin',
          '&::-webkit-scrollbar': {
            'width': '8px',
          },
          '&::-webkit-scrollbar-track': {
            'background': '#f1f1f1',
          },
          '&::-webkit-scrollbar-thumb': {
            'background': '#c1c1c1',
            'border-radius': '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            'background': '#a8a8a8',
          },
        },
      }
      
      addUtilities(newUtilities)
    }
  ],
  darkMode: 'class',
};
