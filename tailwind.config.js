/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.025em', fontWeight: '400' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.01em', fontWeight: '400' }],
        'base': ['1rem', { lineHeight: '1.75', letterSpacing: '0', fontWeight: '400' }],
        'lg': ['1.125rem', { lineHeight: '1.75', letterSpacing: '-0.01em', fontWeight: '500' }],
        'xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '-0.015em', fontWeight: '600' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.02em', fontWeight: '600' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '-0.025em', fontWeight: '700' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.03em', fontWeight: '700' }],
        '5xl': ['3rem', { lineHeight: '1.2', letterSpacing: '-0.035em', fontWeight: '800' }],
        '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.04em', fontWeight: '900' }],
      },
      colors: {
        // Light theme with purple accents
        background: {
          DEFAULT: '#FAFBFC',     // Very light gray background
          secondary: '#F1F5F9',   // Light card background
          tertiary: '#E2E8F0',    // Subtle accent background
          glass: 'rgba(255, 255, 255, 0.8)',  // Glass card background
        },
        // Modern purple gradients
        primary: {
          50: '#faf7ff',
          100: '#f3ecff',
          200: '#e9dcff',
          300: '#d8bfff',
          400: '#c197ff',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        // Cyan-blue accents
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Pink gradients for CTAs
        pink: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        // Rich emerald for success
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // Amber for warnings
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Red for errors
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // High contrast readable text
        text: {
          primary: '#0F172A',    // Near black for maximum readability
          secondary: '#1E293B',  // Dark gray for body text
          tertiary: '#475569',   // Medium gray for secondary text
          muted: '#64748B',      // Lighter gray for metadata
          inverse: '#F8FAFC',    // White text for dark backgrounds
        },
        // Glass surfaces
        glass: {
          primary: 'rgba(255, 255, 255, 0.05)',
          secondary: 'rgba(255, 255, 255, 0.08)',
          purple: 'rgba(139, 92, 246, 0.1)',
          border: 'rgba(255, 255, 255, 0.1)',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 2px 4px 0 rgb(0 0 0 / 0.1)',
        'DEFAULT': '0 4px 8px 0 rgb(0 0 0 / 0.1)',
        'md': '0 8px 16px 0 rgb(0 0 0 / 0.1)',
        'lg': '0 16px 32px 0 rgb(0 0 0 / 0.1)',
        'xl': '0 24px 48px 0 rgb(0 0 0 / 0.15)',
        '2xl': '0 32px 64px 0 rgb(0 0 0 / 0.2)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-lg': '0 16px 48px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'purple': '0 8px 32px rgba(139, 92, 246, 0.2)',
        'purple-lg': '0 16px 48px rgba(139, 92, 246, 0.3)',
        'glow': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.6)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'slideInUp': 'slideInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        'scaleIn': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'glow': 'glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'number-ticker': 'numberTicker 0.4s ease-out',
        'checkmark': 'checkmarkDraw 0.5s ease-out forwards',
        'pulse-gentle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(139, 92, 246, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(139, 92, 246, 0.6)' },
        },
        numberTicker: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        checkmarkDraw: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [],
};
