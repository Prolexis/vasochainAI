/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Modo Oscuro (predeterminado)
        'ledger-dark': {
          950: '#0a0d0a',
          900: '#10140f',
          800: '#181d17',
          700: '#222922',
          600: '#323b30',
        },
        'paper-dark': {
          100: '#f3efe2',
          200: '#e8e2d2',
          300: '#d8d0ba',
        },
        'seal-dark': {
          400: '#d68955',
          500: '#c2703d',
          600: '#9c5527',
        },
        'confirm-dark': {
          300: '#8fd4ad',
          400: '#5fba8c',
          500: '#3f9a6d',
          600: '#2d7350',
        },
        'deny-dark': {
          400: '#c66552',
          500: '#a8493a',
        },

        // Modo Claro
        'ledger-light': {
          950: '#f8f6ef',
          900: '#f3efe2',
          800: '#e8e2d2',
          700: '#d8d0ba',
          600: '#b8b09a',
        },
        'paper-light': {
          100: '#0a0d0a',
          200: '#181d17',
          300: '#323b30',
        },
        'seal-light': {
          400: '#b86a30',
          500: '#9c5527',
          600: '#7a411e',
        },
        'confirm-light': {
          300: '#2d7350',
          400: '#3f9a6d',
          500: '#5fba8c',
          600: '#8fd4ad',
        },
        'deny-light': {
          400: '#a8493a',
          500: '#c66552',
        },

        // Alias dinámicos para facilitar uso en componentes
        ledger: {
          950: 'var(--color-ledger-950)',
          900: 'var(--color-ledger-900)',
          800: 'var(--color-ledger-800)',
          700: 'var(--color-ledger-700)',
          600: 'var(--color-ledger-600)',
        },
        paper: {
          100: 'var(--color-paper-100)',
          200: 'var(--color-paper-200)',
          300: 'var(--color-paper-300)',
        },
        seal: {
          400: 'var(--color-seal-400)',
          500: 'var(--color-seal-500)',
          600: 'var(--color-seal-600)',
        },
        confirm: {
          300: 'var(--color-confirm-300)',
          400: 'var(--color-confirm-400)',
          500: 'var(--color-confirm-500)',
          600: 'var(--color-confirm-600)',
        },
        deny: {
          400: 'var(--color-deny-400)',
          500: 'var(--color-deny-500)',
        },
      },
      fontFamily: {
        display: ['"Outfit"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'neu-dark': '6px 6px 12px #060806, -6px -6px 12px #0e120e',
        'neu-dark-inset': 'inset 4px 4px 8px #060806, inset -4px -4px 8px #0e120e',
        'neu-light': '6px 6px 12px #d8d0ba, -6px -6px 12px #ffffff',
        'neu-light-inset': 'inset 4px 4px 8px #d8d0ba, inset -4px -4px 8px #ffffff',
        'soft-xl': '0 20px 40px -15px var(--shadow-color, rgba(0,0,0,0.15))',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25), 0 8px 10px -6px rgba(16, 185, 129, 0.2)',
        'glow-amber': '0 0 25px -5px rgba(245, 158, 11, 0.25), 0 8px 10px -6px rgba(245, 158, 11, 0.2)',
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.25), 0 8px 10px -6px rgba(59, 130, 246, 0.2)',
        'glow-rose': '0 0 25px -5px rgba(244, 63, 94, 0.25), 0 8px 10px -6px rgba(244, 63, 94, 0.2)',
      },
    },
  },
  plugins: [],
};
