/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        canvas: '#F2F7FF',
        surface: '#FFFFFF',
        ink: '#10243F',
        muted: '#435877',
        line: '#D8E5F6',
        brand: '#0759BA',
        'brand-hover': '#003D88',
        accent: '#005B87',
      },
    },
  },
  plugins: [],
};
