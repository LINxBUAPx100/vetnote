import type { Config } from 'tailwindcss'

// Sistema visual VetNote (ver docs/04-sistema-diseno.md).
// Los colores se exponen también como variables CSS en src/styles/index.css
// para permitir theming futuro sin recompilar clases.
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2F6F64',
          dark: '#24584F',
        },
        secondary: '#5B7FA3',
        accent: '#D99A4E',
        background: '#F5F7F6',
        surface: '#FFFFFF',
        content: {
          DEFAULT: '#1F2933',
          muted: '#667085',
        },
        border: '#DDE3E1',
        success: '#348A5B',
        warning: '#C98624',
        error: '#C94A4A',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(31, 41, 51, 0.04), 0 2px 8px rgba(31, 41, 51, 0.04)',
        floating: '0 6px 20px rgba(31, 41, 51, 0.12)',
      },
      spacing: {
        touch: '44px', // área táctil mínima
      },
    },
  },
  plugins: [],
} satisfies Config
