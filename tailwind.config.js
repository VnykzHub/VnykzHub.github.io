/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        // Instrument register: brass, oxidised copper, iron oxide. Deliberately
        // no cool-blue accent — the electric cyan these replaced was the last
        // survivor of the original cyberpunk palette, and was the reason the
        // site still read blue against warm-black neutrals.
        //
        // All values now point at the CSS custom properties declared in
        // src/index.css — the single source of truth for color. NOTE: Tailwind
        // opacity modifiers (bg-accent-amber/50) do NOT work on var()-backed
        // colors; use the arbitrary form bg-[var(--accent-1)]/50 instead.
        accent: {
          amber:  'var(--accent-1)',
          patina: 'var(--accent-2)',
          rust:   'var(--accent-3)',
          slate:  'var(--accent-slate)',
        },
        surface: {
          paper: 'var(--paper)',
          panel: 'var(--panel)',
          card:  'var(--card-bg)',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          soft: 'var(--ink-soft)',
          faint: 'var(--ink-faint)',
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
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.bg-radial-gradient': {
          backgroundImage: 'radial-gradient(var(--tw-gradient-stops))',
        },
      })
    },
  ],
}
