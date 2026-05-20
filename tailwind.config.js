/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'th-bg': 'var(--bg-primary)',
        'th-bg2': 'var(--bg-secondary)',
        'th-text': 'var(--text-primary)',
        'th-text2': 'var(--text-secondary)',
        'th-accent': 'var(--accent)',
        'th-accent-h': 'var(--accent-hover)',
        'th-card': 'var(--card-bg)',
        'th-border': 'var(--card-border)',
        'th-gold': 'var(--gold)',
        'th-coral': 'var(--coral)',
        'th-success': 'var(--success)',
      },
      fontFamily: {
        display: ['Lexend', 'Nunito', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        wide: '0.06em',
        wider: '0.1em',
      },
      lineHeight: {
        relaxed: '1.8',
        loose: '2',
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'star-pop': 'starPop 0.6s ease-out',
        'gentle-pulse': 'gentlePulse 2s ease-in-out infinite',
        'slide-up': 'slideUp 0.4s ease-out',
        'shake': 'shake 0.4s ease-in-out',
        'fall': 'fall var(--fall-duration, 8s) linear forwards',
      },
      keyframes: {
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.08)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        starPop: {
          '0%': { transform: 'scale(0) rotate(-30deg)', opacity: '0' },
          '60%': { transform: 'scale(1.4) rotate(10deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        gentlePulse: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        slideUp: {
          from: { transform: 'translateY(30px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-8px)' },
          '75%': { transform: 'translateX(8px)' },
        },
        fall: {
          from: { transform: 'translateY(-80px)' },
          to: { transform: 'translateY(calc(100vh + 80px))' },
        },
      },
    },
  },
  plugins: [],
};
