import typographyPlugin from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      typography: (theme) => ({
        stone: {
          css: {
            '--tw-prose-body': theme('colors.stone[900]'),
            '--tw-prose-headings': theme('colors.stone[900]'),
            '--tw-prose-lead': theme('colors.stone[800]'),
            '--tw-prose-links': theme('colors.indigo[600]'),
            '--tw-prose-bold': theme('colors.stone[900]'),
            '--tw-prose-counters': theme('colors.stone[700]'),
            '--tw-prose-bullets': theme('colors.stone[700]'),
            '--tw-prose-hr': theme('colors.stone[300]'),
            '--tw-prose-quotes': theme('colors.stone[900]'),
            '--tw-prose-quote-borders': theme('colors.stone[300]'),
            '--tw-prose-captions': theme('colors.stone[700]'),
            '--tw-prose-code': theme('colors.stone[900]'),
            '--tw-prose-pre-code': theme('colors.stone[200]'),
            '--tw-prose-pre-bg': theme('colors.stone[800]'),
            '--tw-prose-th-borders': theme('colors.stone[300]'),
            '--tw-prose-td-borders': theme('colors.stone[200]'),
          },
        },
        invert: {
          css: {
            '--tw-prose-body': theme('colors.gray[300]'),
            '--tw-prose-headings': theme('colors.gray[100]'),
            '--tw-prose-links': theme('colors.blue[400]'),
            '--tw-prose-code': theme('colors.gray[300]'),
            
            'h1': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'h2': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'h3, h4, h5, h6': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'p': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            'ul, ol': {
              marginTop: '0.25em',
              marginBottom: '0.25em',
            },
            'li': {
              marginTop: '0.15em',
              marginBottom: '0.15em',
            },
            'pre': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
            'blockquote': {
              marginTop: '0.5em',
              marginBottom: '0.5em',
            },
          },
        },
      }),
      animation: {
        fadeIn: 'fadeIn 0.2s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar'),
  ],
}