import './game-tokens.css'

export type ReadoutTone = 'human' | 'machine' | 'bad' | 'mute'

export interface ReadoutItem {
  label: string
  value: string
  tone?: ReadoutTone
}

const TONE_CLASS: Record<ReadoutTone, string> = {
  human: 'text-[var(--g-human)]',
  machine: 'text-[var(--g-machine)]',
  bad: 'text-[var(--g-bad)]',
  mute: 'text-[var(--ink-soft)]',
}

/** The instrument stat strip: labelled mono numbers in hairline cells. */
export function Readout({ items }: { items: ReadoutItem[] }) {
  return (
    <div className="overflow-x-auto pb-px">
      <div className="grid min-w-fit grid-flow-col auto-cols-fr gap-px overflow-hidden rounded-sm border border-[var(--rule)] bg-[var(--rule)]">
        {items.map((it) => (
          <div key={it.label} className="bg-[var(--panel)] px-4 py-2">
            <span className="block font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              {it.label}
            </span>
            <strong className={`block font-mono text-[15px] font-semibold ${TONE_CLASS[it.tone ?? 'mute']}`}>
              {it.value}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
