/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./sidepanel.html', './src/**/*.{ts,html}'],
  // Keep the extension's carefully tuned native controls and canvas layout intact.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: {
        mono: ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
};
