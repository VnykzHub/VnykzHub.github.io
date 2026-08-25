'use client'

import { useState } from 'react'
import { CalibratedGauge, GameButton, GameSlider, GameShell, type ReadoutItem } from '@/components/games/shared'
import { CAP, ROUNDS, START, kellyFraction, kellySide, posterior } from '@/lib/games/kelly-run/kelly'
import { rngFrom, type Rng } from '@/lib/games/shared/rng'
import { LogChart } from './LogChart'

interface LogEntry {
  line: string
  tone: 'human' | 'mute'
}

interface Run {
  p: number
  rng: Rng
  i: number
  heads: number
  tails: number
  you: number[]
  bot: number[]
  log: LogEntry[]
  done: boolean
  message: string
}

export function KellyGame() {
  const [run, setRun] = useState<Run>(() => makeRun('1729'))
  const [frac, setFrac] = useState(10)

  const resetAll = (seed: string) => setRun(makeRun(seed))

  const p = posterior(run.heads, run.tails)
  const f = kellyFraction(p)
  const side = kellySide(p)
  const youLast = run.you[run.you.length - 1]
  const botLast = run.bot[run.bot.length - 1]

  const play = (betSide: 'H' | 'T' | null) => {
    setRun((r) => {
      if (r.done) return r
      const myFrac = Math.min(CAP, frac / 100)
      const botF = Math.min(CAP, kellyFraction(posterior(r.heads, r.tails)))
      const botSide = kellySide(posterior(r.heads, r.tails))
      const flip: 'H' | 'T' = r.rng() < r.p ? 'H' : 'T'

      const yb = r.you[r.you.length - 1]
      const bb = r.bot[r.bot.length - 1]
      const ny = betSide ? (betSide === flip ? yb * (1 + myFrac) : yb * (1 - myFrac)) : yb
      const nb = botSide === flip ? bb * (1 + botF) : bb * (1 - botF)

      const heads = r.heads + (flip === 'H' ? 1 : 0)
      const tails = r.tails + (flip === 'T' ? 1 : 0)
      const i = r.i + 1
      const you = [...r.you, ny]
      const bot = [...r.bot, nb]
      const log: LogEntry[] = [
        {
          line: `flip ${String(i).padStart(2, '0')}  ${flip}   you ${
            betSide ? `${betSide} ${Math.round(myFrac * 100)}%` : 'sit out'
          } → ${Math.round(ny)}   bot ${botSide} ${Math.round(botF * 100)}% → ${Math.round(nb)}`,
          tone: betSide && betSide === flip ? 'human' : 'mute',
        },
        ...r.log,
      ]

      const done = ny < 1 || i >= ROUNDS
      const message = done
        ? `${ny < 1 ? `Ruined on flip ${i}.` : 'Run complete.'} The coin was ${r.p.toFixed(3)} heads. You finished at ${Math.round(ny)}, the bot at ${Math.round(nb)}.`
        : ''

      return { ...r, you, bot, heads, tails, i, log, done, message }
    })
  }

  const readoutItems: ReadoutItem[] = [
    { label: 'flip', value: `${run.i}/${ROUNDS}`, tone: 'mute' },
    {
      label: 'your bankroll',
      value: youLast < 1 ? 'ruined' : String(Math.round(youLast)),
      tone: youLast < START ? 'bad' : 'human',
    },
    { label: 'kelly bot', value: String(Math.round(botLast)), tone: 'machine' },
    { label: 'posterior p̂', value: p.toFixed(3), tone: 'mute' },
    { label: 'kelly stake', value: `${Math.round(f * 100)}% ${side}`, tone: 'machine' },
  ]

  return (
    <GameShell
      eyebrow="Game 04 · Static · measures: bet sizing"
      title="Kelly Run"
      lede="Twenty flips of a biased coin, even money. The bias is never told to you — you have to infer it from outcomes while you bet on it. The machine line is a bot running full Kelly on the same posterior and the same coin."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="The coin's bias p is drawn once from the page seed and never revealed until the run ends. After every flip the posterior over p updates as Beta(1 + heads, 1 + tails), and the Kelly fraction for an even-money bet is f* = 2p̂ − 1 on whichever side the posterior favours. The bot bets exactly that; you bet whatever the slider says. The chart is log-scaled because that is the only scale on which compounding is legible — and it is why over-betting kills you even when you are right about the coin."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          <LogChart you={run.you} bot={run.bot} start={START} />
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">stake</span>
            <GameSlider
              min={0}
              max={60}
              value={frac}
              onChange={(e) => setFrac(Number(e.target.value))}
              displayValue={`${frac}%`}
              aria-label="Your stake as a fraction of bankroll"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <GameButton variant="primary" disabled={run.done} onClick={() => play('H')}>
              Bet on heads
            </GameButton>
            <GameButton disabled={run.done} onClick={() => play('T')}>
              Bet on tails
            </GameButton>
            <GameButton disabled={run.done} onClick={() => play(null)}>
              Sit out
            </GameButton>
          </div>
          <p aria-live="polite" className="mt-4 font-mono text-xs leading-relaxed text-[var(--ink-soft)]">
            {run.message ||
              'The bias is fixed for this seed. First few flips are cheap information — bet accordingly.'}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Ledger</p>
          <div className="max-h-[300px] space-y-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {run.log.length === 0 && (
              <p className="text-[var(--ink-faint)]">
                No flips yet. The first bet is the cheapest information you will ever buy.
              </p>
            )}
            {run.log.map((entry, i) => (
              <p key={i} className={entry.tone === 'human' ? 'text-[var(--accent-1)]' : 'text-[var(--ink-soft)]'}>
                {entry.line}
              </p>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CalibratedGauge
          human={Math.min(1, youLast / Math.max(youLast, botLast, START * 2))}
          machine={Math.min(1, botLast / Math.max(youLast, botLast, START * 2))}
          humanLabel="you"
          machineLabel="bot"
        />
      </div>
    </GameShell>
  )
}

function makeRun(seed: string): Run {
  const r = rngFrom(seed, 'kelly')
  const p = 0.35 + r() * 0.4
  return { p, rng: r, i: 0, heads: 0, tails: 0, you: [START], bot: [START], log: [], done: false, message: '' }
}
