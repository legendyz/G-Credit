/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          '"Segoe UI"',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'sans-serif',
        ],
        mono: ['"Cascadia Code"', 'Consolas', 'Monaco', '"Courier New"', 'monospace'],
      },
      colors: {
        brand: {
          50: '#E6F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B8FF',
          400: '#71AFE5',
          500: '#2B88D8',
          600: '#0078D4',
          700: '#106EBE',
          800: '#005A9E',
          900: '#004578',
        },
        success: {
          DEFAULT: '#107C10',
          light: '#DFF6DD',
          bright: '#13A10E',
        },
        warning: {
          DEFAULT: '#F7630C',
          light: '#FFF4CE',
          bright: '#FF8C00',
        },
        error: {
          DEFAULT: '#D13438',
          light: '#FDE7E9',
          bright: '#E81123',
        },
        info: {
          DEFAULT: '#0078D4',
          light: '#E6F3FF',
        },
        neutral: {
          50: '#FAFAFA',
          100: '#F3F2F1',
          200: '#EDEBE9',
          300: '#E1DFDD',
          400: '#D2D0CE',
          500: '#A19F9D',
          600: '#605E5C',
          700: '#3B3A39',
          800: '#323130',
          900: '#201F1E',
        },
        gold: {
          DEFAULT: '#FFB900',
          light: '#FFF100',
        },
      },
      fontSize: {
        display: [
          '4.25rem',
          { lineHeight: '5.75rem', fontWeight: '600', letterSpacing: '-1px' },
        ],
        h1: ['2.625rem', { lineHeight: '3.25rem', fontWeight: '600', letterSpacing: '-0.5px' }],
        h2: ['1.75rem', { lineHeight: '2.25rem', fontWeight: '600' }],
        h3: ['1.25rem', { lineHeight: '1.75rem', fontWeight: '600' }],
        h4: ['1rem', { lineHeight: '1.5rem', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.5rem' }],
        body: ['0.875rem', { lineHeight: '1.25rem' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem' }],
        caption: ['0.6875rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'elevation-1': '0 2px 4px rgba(0, 0, 0, 0.08)',
        'elevation-2': '0 4px 8px rgba(0, 0, 0, 0.12)',
        'elevation-3': '0 8px 16px rgba(0, 0, 0, 0.16)',
        'elevation-4': '0 16px 32px rgba(0, 0, 0, 0.24)',
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        lg: '12px',
      },
    },
  },
  plugins: [],
};
