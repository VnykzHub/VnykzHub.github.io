'use client'

import type { AgentStats } from '@/lib/games/apiary-apex/simulation'

interface AgentStatsTableProps {
  predatorStats: [AgentStats, AgentStats]
  preyStats: AgentStats
}

const ROWS: { label: string; format: (s: AgentStats) => string }[] = [
  { label: 'Cumulative reward', format: (s) => s.cumulativeReward.toFixed(0) },
  { label: 'Distance traveled', format: (s) => `${s.distanceTraveled.toFixed(0)}u` },
  { label: 'Top speed', format: (s) => `${s.topSpeed.toFixed(1)}u/s` },
]

/** Per-agent breakdown — the aggregate Readout above is session-level; this is what each bee is individually doing. */
export function AgentStatsTable({ predatorStats, preyStats }: AgentStatsTableProps) {
  const columns = [
    { label: 'Hunter A', stats: predatorStats[0], tone: 'text-[var(--g-bad)]' },
    { label: 'Hunter B', stats: predatorStats[1], tone: 'text-[var(--g-bad)]' },
    { label: 'Survivor', stats: preyStats, tone: 'text-[var(--g-human)]' },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse font-mono text-xs">
        <thead>
          <tr>
            <th className="border-b border-[var(--rule)] px-3 py-2 text-left text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              Per agent, this run
            </th>
            {columns.map((c) => (
              <th key={c.label} className={`border-b border-[var(--rule)] px-3 py-2 text-right text-[10px] uppercase tracking-[0.14em] ${c.tone}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label}>
              <td className="border-b border-[var(--rule)] px-3 py-2 text-[var(--ink-soft)]">{row.label}</td>
              {columns.map((c) => (
                <td key={c.label} className="border-b border-[var(--rule)] px-3 py-2 text-right text-[var(--ink)]">
                  {row.format(c.stats)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
