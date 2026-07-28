/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0d0d0d',
        surface: '#1a1a1a',
        'surface-hover': '#242424',
        'surface-2': '#202020',
        'border-subtle': '#2a2a2a',
        accent: {
          DEFAULT: '#f7941d',
          hover: '#ffa63d',
          muted: 'rgba(247, 148, 29, 0.15)',
        },
        'text-primary': '#ffffff',
        'text-muted': '#9a9a9a',
        'text-dim': '#6b6b6b',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.85)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
        'spin-slow': 'spin-slow 1.2s linear infinite',
        'fade-up': 'fade-up 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
