import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // modo oscuro activable con clase (Fase 5)
  theme: {
    extend: {
      colors: {
        // Color de acento único de la app.
        accent: {
          DEFAULT: '#10b981', // emerald-500
          dark: '#059669',
        },
      },
      fontFamily: {
        // Tipografía del sistema (limpia, nativa en iPhone).
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
