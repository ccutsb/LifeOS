/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta dirigida por variables CSS (ver src/styles/index.css).
        // Cada token cambia con el tema claro/oscuro; el formato rgb(var / alpha)
        // mantiene funcionando las utilidades de opacidad (bg-brand/15, etc.).
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        'surface-2': 'rgb(var(--c-surface-2) / <alpha-value>)',
        border: 'rgb(var(--c-border) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        text: 'rgb(var(--c-text) / <alpha-value>)',
        // Acentos semánticos
        brand: 'rgb(var(--c-brand) / <alpha-value>)',
        'brand-2': 'rgb(var(--c-brand-2) / <alpha-value>)', // fin del degradado de marca
        success: 'rgb(var(--c-success) / <alpha-value>)',
        warning: 'rgb(var(--c-warning) / <alpha-value>)',
        danger: 'rgb(var(--c-danger) / <alpha-value>)',
        info: 'rgb(var(--c-info) / <alpha-value>)',
        energy: 'rgb(var(--c-energy) / <alpha-value>)', // acento cálido motivacional
        // Cuadrantes Eisenhower
        'q-do': 'rgb(var(--c-q-do) / <alpha-value>)',
        'q-schedule': 'rgb(var(--c-q-schedule) / <alpha-value>)',
        'q-delegate': 'rgb(var(--c-q-delegate) / <alpha-value>)',
        'q-eliminate': 'rgb(var(--c-q-eliminate) / <alpha-value>)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
      },
      spacing: {
        'safe-t': 'env(safe-area-inset-top)',
        'safe-b': 'env(safe-area-inset-bottom)',
        'safe-l': 'env(safe-area-inset-left)',
        'safe-r': 'env(safe-area-inset-right)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-up': 'slide-up 0.25s ease-out',
      },
    },
  },
  plugins: [],
}
