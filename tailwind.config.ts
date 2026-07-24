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
          DEFAULT: '#3A8FE0',
          dark: '#2B72BF',
          light: '#8FC3F2',
        },
        secondary: '#6FB1EE',
        accent: '#FFB020',
        background: '#EEF5FD',
        surface: '#FFFFFF',
        content: {
          DEFAULT: '#122740',
          muted: '#5A7189',
        },
        border: '#D6E4F3',
        success: '#2FA36B',
        warning: '#E8940C',
        error: '#E5484D',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(24, 71, 122, 0.05), 0 6px 18px rgba(24, 71, 122, 0.06)',
        floating: '0 10px 28px rgba(24, 71, 122, 0.22)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #3A8FE0 0%, #5BA6EC 55%, #6FB1EE 100%)',
        'brand-soft': 'linear-gradient(135deg, #EEF5FD 0%, #E3F0FC 100%)',
      },
      spacing: {
        touch: '44px', // área táctil mínima
      },
    },
  },
  plugins: [],
} satisfies Config
