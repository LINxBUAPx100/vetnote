import type { Config } from 'tailwindcss'

/**
 * Sistema visual VetNote.
 *
 * Paleta intencionada, NO la de Tailwind por defecto:
 *  - Neutros "slate" matizados en frío (nada de gray genérico).
 *  - Acento azul PETRÓLEO profundo (clínico, sereno, distintivo).
 *  - Secundario TERRACOTA cálido para dar cercanía y equilibrar el frío.
 *
 * Reglas: jerarquía tipográfica con mucho contraste, separación por espacio en
 * blanco y bordes sutiles (no sombras pesadas), transiciones en todo lo
 * interactivo. Los tokens se exponen también en src/styles/index.css.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // — Acento principal: azul petróleo —
        primary: {
          50: '#EDF6F9',
          100: '#D6EAF1',
          200: '#AED5E2',
          300: '#7BB8CC',
          400: '#4595B2',
          DEFAULT: '#0F6E8A',
          500: '#0F6E8A',
          600: '#0C5A72',
          700: '#09475B',
          800: '#073644',
          dark: '#0C5A72',
        },
        // — Secundario cálido: terracota —
        accent: {
          50: '#FBF1EC',
          100: '#F4DED2',
          200: '#E8BFA9',
          DEFAULT: '#B9633A',
          500: '#B9633A',
          600: '#9C4F2C',
        },
        secondary: '#4595B2',

        // — Neutros (slate matizado) —
        canvas: '#F6F8FA',
        background: '#F6F8FA',
        surface: '#FFFFFF',
        sunken: '#EEF2F6',
        content: {
          DEFAULT: '#334155', // texto de cuerpo
          strong: '#0B1B2B', // títulos
          muted: '#64748B', // secundario
          subtle: '#94A3B8', // metadatos
        },
        ink: '#0B1B2B',
        line: {
          DEFAULT: '#E4EAF1',
          strong: '#CFDAE6',
        },
        border: '#E4EAF1',

        // — Semánticos —
        success: { DEFAULT: '#0F7B5F', soft: '#E7F4EF' },
        warning: { DEFAULT: '#B45309', soft: '#FBF0E2' },
        error: { DEFAULT: '#B42318', soft: '#FBEAE8' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Escala con ritmo: metadatos diminutos → títulos con presencia.
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.02em' }],
        xs: ['0.75rem', { lineHeight: '1.125rem' }],
        sm: ['0.8125rem', { lineHeight: '1.25rem' }],
        base: ['0.9375rem', { lineHeight: '1.5rem' }],
        lg: ['1.0625rem', { lineHeight: '1.6rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.018em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.022em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.026em' }],
      },
      letterSpacing: {
        label: '0.06em',
      },
      borderRadius: {
        card: '12px',
      },
      boxShadow: {
        // Sombras casi imperceptibles: la separación la hace el borde.
        xs: '0 1px 2px rgba(11, 27, 43, 0.04)',
        card: '0 1px 2px rgba(11, 27, 43, 0.04)',
        pop: '0 16px 40px -12px rgba(11, 27, 43, 0.22), 0 2px 8px rgba(11, 27, 43, 0.06)',
        floating: '0 12px 28px -10px rgba(15, 110, 138, 0.45)',
      },
      spacing: {
        touch: '44px', // área táctil mínima
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        'slide-up': 'slide-up 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
} satisfies Config
