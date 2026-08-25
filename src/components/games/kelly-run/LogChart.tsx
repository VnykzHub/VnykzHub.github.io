'use client'

/**
 * Log-scaled bankroll chart — the only scale on which compounding is legible.
 * Theme-aware SVG: brass = you, patina = the Kelly bot, dashed hairline = start.
 */
export function LogChart({ you, bot, start }: { you: number[]; bot: number[]; start: number }) {
  const W = 600
  const H = 160
  const PAD = 8
  const n = Math.max(you.length, bot.length, 2)

  const all = [...you, ...bot].filter((v) => v > 0)
  const lo = Math.log(Math.max(1, Math.min(...all, start) * 0.8))
  const hi = Math.log(Math.max(...all, start) * 1.2)
  const span = Math.max(1e-6, hi - lo)

  const X = (i: number) => PAD + (W - 2 * PAD) * (i / (n - 1))
  const Y = (v: number) => H - PAD - ((Math.log(Math.max(v, 1)) - lo) / span) * (H - 2 * PAD)

  const path = (series: number[]) =>
    series.map((v, i) => `${i === 0 ? 'M' : 'L'}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Log-scaled bankroll chart">
      {/* start line */}
      <line
        x1={PAD}
        x2={W - PAD}
        y1={Y(start)}
        y2={Y(start)}
        stroke="var(--rule)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      {/* series */}
      <path d={path(bot)} fill="none" stroke="var(--accent-2)" strokeWidth="2" strokeLinejoin="round" />
      <path d={path(you)} fill="none" stroke="var(--accent-1)" strokeWidth="2" strokeLinejoin="round" />
      {/* end markers */}
      {you.length > 0 && <circle cx={X(you.length - 1)} cy={Y(you[you.length - 1])} r="3.5" fill="var(--accent-1)" />}
      {bot.length > 0 && <circle cx={X(bot.length - 1)} cy={Y(bot[bot.length - 1])} r="3.5" fill="var(--accent-2)" />}
      <text x={PAD} y={12} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-faint)">
        log bankroll
      </text>
    </svg>
  )
}
