import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        'bg':             'rgb(var(--bg-rgb) / <alpha-value>)',
        'bg-tint':        'rgb(var(--bg-tint-rgb) / <alpha-value>)',
        'surface':        'rgb(var(--surface-rgb) / <alpha-value>)',
        'surface-2':      'rgb(var(--surface-2-rgb) / <alpha-value>)',
        'surface-inset':  'rgb(var(--surface-inset-rgb) / <alpha-value>)',
        // Text
        'ink':            'rgb(var(--ink-rgb) / <alpha-value>)',
        'ink-2':          'rgb(var(--ink-2-rgb) / <alpha-value>)',
        'ink-mute':       'rgb(var(--ink-mute-rgb) / <alpha-value>)',
        'ink-faint':      'rgb(var(--ink-faint-rgb) / <alpha-value>)',
        // Structure
        'line':           'rgb(var(--line-rgb) / <alpha-value>)',
        'line-soft':      'rgb(var(--line-soft-rgb) / <alpha-value>)',
        'line-strong':    'rgb(var(--line-strong-rgb) / <alpha-value>)',
        // Accent
        'accent':         'rgb(var(--accent-rgb) / <alpha-value>)',
        'accent-2':       'rgb(var(--accent-2-rgb) / <alpha-value>)',
        'on-accent':      'rgb(var(--on-accent-rgb) / <alpha-value>)',
        // Status
        'status-ok':      'rgb(var(--ok-rgb) / <alpha-value>)',
        'status-warn':    'rgb(var(--warn-rgb) / <alpha-value>)',
        'status-alert':   'rgb(var(--alert-rgb) / <alpha-value>)',
      },
      fontFamily: {
        display: ['var(--font-display-name)', 'system-ui', 'sans-serif'],
        ui:      ['var(--font-ui-name)',      'system-ui', 'sans-serif'],
        sans:    ['var(--font-ui-name)',      'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono-name)',    'monospace'],
      },
      borderRadius: {
        xs:   'var(--r-xs, 2px)',
        sm:   'var(--r-sm, 4px)',
        md:   'var(--r-md, 6px)',
        lg:   'var(--r-lg, 10px)',
        xl:   'var(--r-xl, 14px)',
        pill: 'var(--r-pill, 9999px)',
      },
      minHeight: {
        touch:      '48px',
        'touch-lg': '56px',
        tap:        '64px',
        row:        'var(--row-h, 76px)',
      },
      boxShadow: {
        '1':          'var(--shadow-1)',
        '2':          'var(--shadow-2)',
        '3':          'var(--shadow-3)',
        'glow-ok':    '0 0 0 3px rgb(var(--ok-rgb) / 0.35)',
        'glow-warn':  '0 0 0 3px rgb(var(--warn-rgb) / 0.35)',
        'glow-alert': '0 0 0 3px rgb(var(--alert-rgb) / 0.35)',
        'glow-accent':'0 0 0 3px rgb(var(--accent-rgb) / 0.35)',
      },
      animation: {
        'pulse-ring': 'pr-pulse-ring 1.4s cubic-bezier(0.16,1,0.3,1) infinite',
        'pulse-dot':  'pr-pulse-dot 1.4s ease-in-out infinite',
        'fade-in':    'pr-fade-in 180ms cubic-bezier(0.16,1,0.3,1)',
        'tick':       'pr-tick 300ms cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        'pr-pulse-ring': {
          '0%':   { transform: 'scale(1)',    opacity: '0.6' },
          '80%':  { transform: 'scale(1.85)', opacity: '0' },
          '100%': { transform: 'scale(1.85)', opacity: '0' },
        },
        'pr-pulse-dot': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.1)' },
        },
        'pr-fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'pr-tick': {
          from: { strokeDashoffset: '24' },
          to:   { strokeDashoffset: '0' },
        },
      },
    },
  },
  plugins: [forms],
} satisfies Config
