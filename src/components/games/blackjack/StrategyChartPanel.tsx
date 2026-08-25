import { HARD_TABLE, PAIR_TABLE, SOFT_TABLE, UPCOLS, type Cell, type StrategyTable } from '@/lib/games/blackjack/chart'

const CELL_STYLE: Record<Cell, string> = {
  H: 'bg-[#e74c3c] text-white',
  S: 'bg-[#27ae60] text-[#0a1a12]',
  D: 'bg-[#f39c12] text-[#0a1a12]',
  P: 'bg-[#8e44ad] text-white',
}

const CELL_NAME: Record<Cell, string> = {
  H: 'Hit',
  S: 'Stand',
  D: 'Double',
  P: 'Split',
}

function StrategyTable({ table }: { table: StrategyTable }) {
  return (
    <div className="overflow-x-auto rounded-md border border-[var(--rule)]">
      <table className="w-full border-collapse font-mono text-[11px]">
        <thead>
          <tr>
            <th className="border border-[#1a3a2a] bg-[#0a1a12] px-2 py-1.5 text-center font-semibold text-[#c9a84c]">
              {table === HARD_TABLE ? 'Hand' : table === SOFT_TABLE ? 'Hand' : 'Pair'}
            </th>
            {UPCOLS.map((col) => (
              <th key={col} className="border border-[#1a3a2a] bg-[#0a1a12] px-2 py-1.5 text-center font-semibold text-[#c9a84c]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <tr key={row.label}>
              <td className="border border-[#1a3a2a] bg-[#0a1a12] px-2 py-1.5 text-center font-semibold text-[#c9a84c]">
                {row.label}
              </td>
              {row.cells.map((cell, i) => (
                <td
                  key={i}
                  title={CELL_NAME[cell]}
                  className={`border border-[#1a3a2a] px-1.5 py-1.5 text-center font-semibold ${CELL_STYLE[cell]}`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** The three basic strategy tables, rendered from the engine's chart data. */
export function StrategyChartPanel() {
  const legend: [Cell, string][] = [
    ['S', 'Stand'],
    ['H', 'Hit'],
    ['D', 'Double'],
    ['P', 'Split'],
  ]
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        {legend.map(([cell, name]) => (
          <span
            key={cell}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]"
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-sm ${CELL_STYLE[cell]}`} />
            {name}
          </span>
        ))}
        <span className="font-mono text-[11px] text-[var(--ink-faint)]">
          dealer stands on all 17s · blackjack pays 3:2 · single split, double after split
        </span>
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          {HARD_TABLE.heading}
        </p>
        <StrategyTable table={HARD_TABLE} />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          {SOFT_TABLE.heading}
        </p>
        <StrategyTable table={SOFT_TABLE} />
      </div>
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          {PAIR_TABLE.heading}
        </p>
        <StrategyTable table={PAIR_TABLE} />
      </div>
      <p className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
        These tables and the coach on the Play tab come from the same strategy engine — a test locks every cell to
        the engine so the chart can never contradict the advice.
      </p>
    </div>
  )
}
