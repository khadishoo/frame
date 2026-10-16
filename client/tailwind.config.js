import defaultTheme from 'tailwindcss/defaultTheme';

// Цвет из CSS-переменной с поддержкой модификатора прозрачности (bg-accent/10)
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  // Тёмная тема включается классом .dark на <html>
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    // Шкала дизайн-системы: 12/14/16/20/24/32/48
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.25rem', { lineHeight: '1.75rem' }],
      xl: ['1.5rem', { lineHeight: '2rem' }],
      '2xl': ['2rem', { lineHeight: '2.5rem' }],
      '3xl': ['3rem', { lineHeight: '1.1' }],
    },
    // Радиусы 8/12/16
    borderRadius: {
      none: '0',
      sm: '0.25rem',
      DEFAULT: '0.5rem',
      md: '0.5rem',
      lg: '0.75rem',
      xl: '1rem',
      full: '9999px',
    },
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-2': token('surface-2'),
        border: token('border'),
        fg: token('text'),
        muted: token('text-muted'),
        accent: { DEFAULT: token('accent'), fg: token('accent-fg') },
        ring: token('ring'),
        danger: token('danger'),
        success: token('success'),
        warning: token('warning'),
        overlay: token('overlay'),
        type: {
          art: token('type-art'),
          music: token('type-music'),
          video: token('type-video'),
          photo: token('type-photo'),
          script: token('type-script'),
          dev: token('type-dev'),
          other: token('type-other'),
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        display: ['"Space Grotesk"', 'Inter', ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        soft: '0 1px 2px rgb(var(--shadow) / 0.04), 0 2px 6px rgb(var(--shadow) / 0.05)',
        pop: '0 4px 12px rgb(var(--shadow) / 0.08), 0 16px 40px rgb(var(--shadow) / 0.12)',
      },
      screens: {
        xs: '400px',
      },
    },
  },
  plugins: [],
};
