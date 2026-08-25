'use client'

import './game-tokens.css'

interface CalibratedGaugeProps {
  /** 0..1 positions of the two markers. Clamped internally. */
  human: number
  machine: number
  humanLabel: string
  machineLabel: string
}

const clamp = (v: number) => Math.max(0, Math.min(1, v))

/**
 * The games section's signature element: a ruled instrument track — the
 * odometer register rendered as a duel. Brass marks the human, patina marks
 * the machine. Decorative by design; the numbers live in the Readout.
 */
export function CalibratedGauge({ human, machine, humanLabel, machineLabel }: CalibratedGaugeProps) {
  const h = clamp(human) * 100
  const m = clamp(machine) * 100

  return (
    <div aria-hidden="true" className="relative h-16 select-none">
      {/* mid-track hairline */}
      <div className="absolute left-0 right-0 top-1/2 border-t border-[var(--rule)]" />

      {/* tick marks, 10% steps */}
      {Array.from({ length: 11 }, (_, i) => (
        <div
          key={i}
          className="absolute top-1/2 h-1 w-px -translate-y-1/2 bg-[var(--rule)]"
          style={{ left: `${i * 10}%` }}
        />
      ))}

      {/* human marker (above) */}
      <div
        className="absolute top-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-300 ease-out motion-reduce:transition-none"
        style={{ left: `${h}%` }}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--g-human)]">{humanLabel}</span>
        <span className="mt-1 h-2 w-2 rounded-full bg-[var(--g-human)]" />
      </div>

      {/* machine marker (below) */}
      <div
        className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-300 ease-out motion-reduce:transition-none"
        style={{ left: `${m}%` }}
      >
        <span className="h-2 w-2 rounded-full bg-[var(--g-machine)]" />
        <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--g-machine)]">
          {machineLabel}
        </span>
      </div>
    </div>
  )
}
