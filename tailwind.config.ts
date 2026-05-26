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
        background: '#1a1a1a',
        surface: '#212121',
        card: '#2a2a2a',
        'card-hover': '#333333',
        border: '#3a3a3a',
        'border-light': '#444444',
        accent: '#3b82f6',
        'accent-hover': '#2563eb',
        success: '#22c55e',
        'success-hover': '#16a34a',
        danger: '#ef4444',
        'danger-hover': '#dc2626',
        muted: '#6b7280',
        'muted-light': '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
