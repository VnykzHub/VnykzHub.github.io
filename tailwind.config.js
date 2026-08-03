/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Instrument register: brass, oxidised copper, iron oxide. Deliberately
        // no cool-blue accent — the electric cyan these replaced was the last
        // survivor of the original cyberpunk palette, and was the reason the
        // site still read blue against warm-black neutrals.
        accent: {
          amber:  '#F0B84C', // primary   — buttons, name gradient, drop caps
          patina: '#4A9E93', // secondary — links, hover, live status
          rust:   '#C4703F', // tertiary  — third category, warm accents
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', 'serif'],
        mono: ['IBM Plex Mono', 'ui-monospace', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-glow': 'pulseGlow 2s infinite',
      },
    },
  },
  plugins: [],
}
