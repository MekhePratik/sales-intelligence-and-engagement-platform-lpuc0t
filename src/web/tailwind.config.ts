/**
 * Tailwind CSS configuration file for the B2B Sales Intelligence Platform.
 * This configuration defines the platform’s design system, theme customizations,
 * responsive breakpoints, accessibility settings, and plugin integrations.
 */

// tailwindcss@3.3.0
import type { Config } from 'tailwindcss';

// @tailwindcss/forms@0.5.7
import forms from '@tailwindcss/forms';
// @tailwindcss/typography@0.5.10
import typography from '@tailwindcss/typography';

/**
 * A custom Tailwind plugin that registers additional utilities and components.
 * It demonstrates how to extend Tailwind CSS using the plugin API.
 */
function customPlugin({ addComponents, addUtilities, theme }: any) {
  // Example custom component utilizing secondary color and spacing from theme.
  const newComponents = {
    '.custom-container': {
      backgroundColor: theme('colors.secondary.100'),
      borderRadius: theme('borderRadius.lg', '0.5rem'),
      padding: theme('spacing.4'),
      boxShadow: theme('boxShadow.sm'),
    },
  };

  // Example custom utility for text shadows.
  const newUtilities = {
    '.text-shadow-accent': {
      textShadow: '1px 1px 2px rgba(14, 165, 233, 0.5)', // accent-500 at 50% opacity
    },
  };

  addComponents(newComponents);
  addUtilities(newUtilities, ['responsive', 'hover']);
}

/**
 * The main Tailwind CSS configuration object.
 */
export const config: Config = {
  // Paths to all template files and components where Tailwind class names may appear.
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],

  // Extends the default Tailwind theme with the platform’s design system specifications.
  theme: {
    extend: {
      /**
       * Brand and UI color palette.
       * Each color set satisfies modern accessibility requirements (WCAG 2.1 AA),
       * especially around contrast ratios for text and backgrounds.
       */
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        accent: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },

      /**
       * Font stack used throughout the application, including fallback fonts for broad compatibility.
       * The Inter font is used as a primary typeface, with a monospace stack for code or console-like content.
       */
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },

      /**
       * Font size scale ranging from 12px to 48px, aligning with the design system’s
       * typography guidelines. Provides comfortable line-heights to ensure readability.
       */
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '36px' }],
        '4xl': ['36px', { lineHeight: '40px' }],
        '5xl': ['48px', { lineHeight: '48px' }],
      },

      /**
       * Spacing scale from 4px to 64px. This scale is applied throughout the UI
       * for margins, padding, gaps, and other layout properties.
       */
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
      },

      /**
       * Responsive breakpoints chosen to accommodate major device sizes:
       * mobile (320px), tablet (768px), desktop (1024px), and wide (1440px).
       */
      screens: {
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1440px',
      },

      /**
       * Box shadow utility tokens to achieve various levels of depth and emphasis.
       */
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      },

      /**
       * Commonly used animation classes for transitions, providing a consistent
       * motion style across fade-in, fade-out, slide-in, and slide-out states.
       */
      animation: {
        'fade-in': 'fadeIn 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-out': 'fadeOut 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in': 'slideIn 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-out': 'slideOut 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      },

      /**
       * Keyframes for fundamental fade and slide transitions, supporting essential
       * UI animations. These align with the design system’s motion guidelines.
       */
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },

  /**
   * Tailwind plugins to extend core functionalities.
   * - @tailwindcss/forms for improved form element styling.
   * - @tailwindcss/typography for rich text formatting.
   * - A custom plugin that provides additional utilities and components.
   */
  plugins: [
    forms,
    typography,
    customPlugin,
  ],
};