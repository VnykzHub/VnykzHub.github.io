/**
 * Hero backdrop — painted while three.js streams in, and permanently when WebGL
 * is unavailable.
 *
 * Rewritten for two reasons:
 *
 * 1. Colour. This was the last large cyan surface on the site: cyan radial
 *    gradients, cyan orbs and cyan grid lines, all sitting on warm-black paper.
 *
 * 2. Cost. The previous version drove a `radial-gradient` through
 *    framer-motion's `animate` prop. background-image is not a compositable
 *    property, so every frame forced a full repaint of a viewport-sized element
 *    — for as long as the page was open, directly behind the most important
 *    content on the site. Five further infinite loops animated orb x/y/scale on
 *    top of that.
 *
 *    Now the gradient wash is static and the orbs animate transform only, via
 *    CSS keyframes the compositor can run off the main thread. Dropping
 *    framer-motion here also means the hero fallback no longer pulls the
 *    animation runtime just to draw a background.
 *
 * Orb positions were `Math.random()` evaluated during render, so they jumped on
 * every re-render. They are fixed values now.
 */

const ORBS = [
  { left: '12%', top: '18%', size: 280, tint: 'rgba(240, 184, 76, 0.10)', dur: '14s', delay: '0s' },
  { left: '74%', top: '12%', size: 220, tint: 'rgba(74, 158, 147, 0.10)', dur: '18s', delay: '-3s' },
  { left: '58%', top: '62%', size: 320, tint: 'rgba(196, 112, 63, 0.08)', dur: '22s', delay: '-7s' },
  { left: '22%', top: '70%', size: 240, tint: 'rgba(74, 158, 147, 0.08)', dur: '16s', delay: '-11s' },
  { left: '88%', top: '48%', size: 200, tint: 'rgba(240, 184, 76, 0.07)', dur: '20s', delay: '-5s' },
]

export function StaticBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Static wash — warm brass and patina bloom. No animation, no repaint. */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 18% 42%, rgba(240, 184, 76, 0.09) 0%, transparent 52%),
            radial-gradient(circle at 82% 58%, rgba(74, 158, 147, 0.08) 0%, transparent 50%)
          `,
        }}
      />

      {/* Drifting orbs — transform only, so the compositor owns them. */}
      {ORBS.map((orb, i) => (
        <div
          key={i}
          className="hero-orb absolute rounded-full"
          style={{
            left: orb.left,
            top: orb.top,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.tint} 0%, transparent 70%)`,
            animationDuration: orb.dur,
            animationDelay: orb.delay,
          }}
        />
      ))}

      {/* Grid — token-driven, so it follows the theme instead of hardcoding a
          cyan that ignored both palettes. */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `
            linear-gradient(var(--rule) 1px, transparent 1px),
            linear-gradient(90deg, var(--rule) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  )
}
