/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta oscura minimalista. `bg` = fondo, `surface` = tarjetas.
        bg: '#0b0f17',
        surface: '#121826',
        'surface-2': '#1a2234',
        border: '#243049',
        muted: '#8b97ad',
        text: '#e6eaf2',
        // Acentos semánticos
        brand: '#6366f1', // indigo
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#06b6d4',
        // Cuadrantes Eisenhower
        'q-do': '#ef4444', // urgente + importante
        'q-schedule': '#6366f1', // importante
        'q-delegate': '#f59e0b', // urgente
        'q-eliminate': '#64748b', // ni uno ni otro
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
        card: '0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 24px -12px rgba(0,0,0,0.6)',
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
