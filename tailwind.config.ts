import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          navy:         '#1a2744',
          'navy-light': '#243459',
          gold:         '#c9a84c',
          'gold-light': '#d4b96a',
          cream:        '#f8f4ef',
        },
        // Auditare brand
        au: {
          dark:   '#06091A',   // hero / deep bg
          navy:   '#0D1630',   // section dark
          gold:   '#C9A84C',   // primary accent
          'gold-light': '#D9BC72',
          muted:  '#6B7280',   // gray text
          border: '#1E2A3A',   // dark border
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up':    'fadeUp 0.6s ease forwards',
        'fade-in':    'fadeIn 0.5s ease forwards',
        'count-up':   'countUp 0.4s ease forwards',
        'glow-pulse': 'glowPulse 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}

export default config
