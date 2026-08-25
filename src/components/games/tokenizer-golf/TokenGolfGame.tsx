'use client'

import { useState } from 'react'
import {
  CalibratedGauge,
  GameButton,
  GameSelect,
  GameShell,
  SegmentedControl,
  type ReadoutItem,
} from '@/components/games/shared'
import { tokenize, count, type TokenizerScheme } from '@/lib/games/tokenizer-golf/tokenizer'
import { CORPUS, GOLF } from '@/lib/games/tokenizer-golf/data'
import { rngFrom, shuffle } from '@/lib/games/shared/rng'

type Mode = 'guess' | 'golf' | 'compare'

const MODES = [
  { value: 'guess', label: 'Guess the count' },
  { value: 'golf', label: 'Golf a prompt' },
  { value: 'compare', label: 'Compare schemes' },
] as const

const heur = (text: string) => Math.max(1, Math.round(text.length / 4))

/** Token chips: alternating brass/patina tints, spaces shown as ·. */
function Chips({ text, scheme }: { text: string; scheme: TokenizerScheme }) {
  return (
    <div className="flex flex-wrap gap-0.5 font-mono text-xs leading-loose [word-break:break-all]">
      {tokenize(text, scheme).map((tok, i) => (
        <span
          key={i}
          className={`rounded-sm px-1 ${i % 2 ? 'bg-[var(--accent-2)]/15' : 'bg-[var(--accent-1)]/15'}`}
        >
          {tok.replace(/ /g, '·')}
        </span>
      ))}
    </div>
  )
}

interface GuessRound {
  text: string
  answered: boolean
  guess: number
  actual: number
  heur: number
}

export function TokenGolfGame() {
  const [mode, setMode] = useState<Mode>('guess')

  // guess mode
  const [rounds, setRounds] = useState<GuessRound[]>(() =>
    shuffle(CORPUS, rngFrom('1729', 'tokenizer'))
      .slice(0, 6)
      .map((text) => ({ text, answered: false, guess: 0, actual: 0, heur: 0 }))
  )
  const [roundIdx, setRoundIdx] = useState(0)
  const [guessInput, setGuessInput] = useState('')

  // golf mode
  const [golfIdx, setGolfIdx] = useState(0)
  const [golfText, setGolfText] = useState(GOLF[0].text)

  // compare mode
  const [cmpText, setCmpText] = useState('Fine-tuning a 7B model on 512-token windows costs about ₹18,400 per epoch.')

  const resetAll = (s: string) => {
    const r = rngFrom(s, 'tokenizer')
    setRounds(
      shuffle(CORPUS, r)
        .slice(0, 6)
        .map((text) => ({ text, answered: false, guess: 0, actual: 0, heur: 0 }))
    )
    setRoundIdx(0)
    setGuessInput('')
    const g = GOLF[Math.floor(r() * GOLF.length)]
    setGolfIdx(GOLF.indexOf(g))
    setGolfText(g.text)
  }

  const round = rounds[roundIdx]
  const answeredCount = rounds.filter((r) => r.answered).length
  const errU = rounds.reduce((s, r) => s + Math.abs(r.guess - r.actual), 0)
  const errH = rounds.reduce((s, r) => s + Math.abs(r.heur - r.actual), 0)
  const maeU = answeredCount ? errU / answeredCount : 0
  const maeH = answeredCount ? errH / answeredCount : 0

  const golf = GOLF[golfIdx]
  const golfCount = count(golfText, 'bpe')

  const lockIn = () => {
    const g = parseInt(guessInput, 10)
    if (!g || !round) return
    const actual = count(round.text, 'bpe')
    const next = rounds.slice()
    next[roundIdx] = { ...round, answered: true, guess: g, actual, heur: heur(round.text) }
    setRounds(next)
    setGuessInput('')
  }

  const readoutItems: ReadoutItem[] =
    mode === 'guess'
      ? [
          { label: 'round', value: `${Math.min(roundIdx + 1, rounds.length)}/${rounds.length}`, tone: 'mute' },
          { label: 'your MAE', value: answeredCount ? maeU.toFixed(1) : '—', tone: 'human' },
          { label: 'chars÷4 MAE', value: answeredCount ? maeH.toFixed(1) : '—', tone: 'machine' },
          {
            label: 'edge',
            value: answeredCount ? `${maeH - maeU >= 0 ? '+' : ''}${(maeH - maeU).toFixed(1)}` : '—',
            tone: maeH - maeU >= 0 ? 'machine' : 'bad',
          },
        ]
      : mode === 'golf'
        ? [
            { label: 'par', value: String(golf.par), tone: 'machine' },
            { label: 'yours', value: String(golfCount), tone: golfCount <= golf.par ? 'machine' : 'human' },
            { label: 'original', value: String(count(golf.text, 'bpe')), tone: 'mute' },
            { label: 'saved', value: `${Math.round(100 * (1 - golfCount / count(golf.text, 'bpe')))}%`, tone: 'human' },
          ]
        : [
            { label: 'byte-pair', value: String(count(cmpText, 'bpe')), tone: 'human' },
            { label: 'sentencepiece', value: String(count(cmpText, 'sp')), tone: 'machine' },
            {
              label: 'divergence',
              value: `${count(cmpText, 'sp') - count(cmpText, 'bpe') > 0 ? '+' : ''}${count(cmpText, 'sp') - count(cmpText, 'bpe')}`,
              tone: 'mute',
            },
            { label: 'chars', value: String(cmpText.length), tone: 'mute' },
          ]

  const gauge =
    mode === 'guess' ? (
      <CalibratedGauge
        human={1 - Math.min(maeU, 25) / 25}
        machine={1 - Math.min(maeH, 25) / 25}
        humanLabel="you"
        machineLabel="÷4"
      />
    ) : mode === 'golf' ? (
      <CalibratedGauge
        human={Math.max(0, Math.min(1, 1 - golfCount / count(golf.text, 'bpe')))}
        machine={Math.max(0, Math.min(1, 1 - golf.par / count(golf.text, 'bpe')))}
        humanLabel="yours"
        machineLabel="par"
      />
    ) : (
      <CalibratedGauge
        human={count(cmpText, 'bpe') / Math.max(count(cmpText, 'bpe'), count(cmpText, 'sp'), 1)}
        machine={count(cmpText, 'sp') / Math.max(count(cmpText, 'bpe'), count(cmpText, 'sp'), 1)}
        humanLabel="bpe"
        machineLabel="sp"
      />
    )

  return (
    <GameShell
      eyebrow="Game 02 · Static · measures: segmentation"
      title="Tokenizer Golf"
      lede="You price LLM calls in tokens but you estimate them in characters. Guess counts, cut a prompt under par, and watch two segmentation schemes disagree on the same string."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="The segmenter is an approximation — a GPT-2-style regex pre-tokenizer feeding a greedy longest-match over a small subword table, plus a SentencePiece-style variant that marks word starts with ▁ and splits digits individually. It reproduces the behaviours that matter: whitespace binds to the following word, rare words shatter, numbers and URLs are expensive. The machine line is the folk heuristic — characters ÷ 4 — which is what you are actually competing against."
    >
      <SegmentedControl<Mode> options={[...MODES]} value={mode} onChange={setMode} label="Tokenizer modes" />

      <div className="mt-6 space-y-5">
        {/* GUESS */}
        {mode === 'guess' && (
          <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
            {roundIdx >= rounds.length ? (
              <div>
                <h3 className="font-serif text-xl font-semibold text-[var(--heading)]">
                  {maeU < maeH ? 'You beat the ÷4 heuristic.' : 'The ÷4 heuristic beat you.'}
                </h3>
                <p className="mt-2 text-sm text-[var(--ink-soft)]">
                  Your mean absolute error: {maeU.toFixed(1)} tokens. Characters ÷ 4: {maeH.toFixed(1)} tokens. Reseed
                  for a new set.
                </p>
              </div>
            ) : (
              <div>
                <div className="rounded-sm bg-[var(--card-bg)] p-4 font-mono text-sm leading-relaxed [word-break:break-all]">
                  {round.text}
                </div>
                {round.answered ? (
                  <div className="mt-4">
                    <Chips text={round.text} scheme="bpe" />
                    <p className="mt-3 font-mono text-xs">
                      actual <strong className="text-[var(--ink)]">{round.actual}</strong> · you{' '}
                      <span className="text-[var(--accent-1)]">{round.guess}</span> · chars÷4{' '}
                      <span className="text-[var(--accent-2)]">{round.heur}</span>
                    </p>
                    <GameButton variant="primary" className="mt-4" onClick={() => setRoundIdx((i) => i + 1)}>
                      {roundIdx === rounds.length - 1 ? 'See result' : 'Next string'}
                    </GameButton>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && lockIn()}
                      placeholder="tokens"
                      aria-label="Your token count guess"
                      className="w-28 rounded-sm border border-[var(--rule)] bg-[var(--card-bg)] px-3 py-2 font-mono text-sm text-[var(--ink)] focus:outline-2 focus:outline-[var(--accent-2)]"
                    />
                    <GameButton variant="primary" onClick={lockIn}>
                      Lock in
                    </GameButton>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* GOLF */}
        {mode === 'golf' && (
          <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
            <div className="flex flex-wrap items-center gap-3">
              <GameSelect
                aria-label="Prompt to golf"
                value={golfIdx}
                onChange={(e) => {
                  const idx = Number(e.target.value)
                  setGolfIdx(idx)
                  setGolfText(GOLF[idx].text)
                }}
              >
                {GOLF.map((g, i) => (
                  <option key={i} value={i}>
                    prompt {i + 1} · par {g.par}
                  </option>
                ))}
              </GameSelect>
              <p className="font-mono text-xs text-[var(--ink-faint)]">
                original — <span className="text-[var(--ink-soft)]">{count(golf.text, 'bpe')} tokens</span>. Keep the
                instruction intact, get under par.
              </p>
            </div>
            <textarea
              value={golfText}
              onChange={(e) => setGolfText(e.target.value)}
              rows={4}
              aria-label="Your prompt"
              className="mt-4 w-full resize-y rounded-sm border border-[var(--rule)] bg-[var(--card-bg)] px-3 py-2 font-mono text-[13px] text-[var(--ink)] focus:outline-2 focus:outline-[var(--accent-2)]"
            />
            <p className="mt-2 font-mono text-xs">
              <span className={golfCount <= golf.par ? 'text-[var(--accent-2)]' : 'text-[var(--accent-1)]'}>
                {golfCount}
              </span>{' '}
              / par {golf.par}
              {golfCount <= golf.par ? ' — under par' : ` — ${golfCount - golf.par} over`}
            </p>
            <div className="mt-3">
              <Chips text={golfText} scheme="bpe" />
            </div>
          </div>
        )}

        {/* COMPARE */}
        {mode === 'compare' && (
          <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
            <textarea
              value={cmpText}
              onChange={(e) => setCmpText(e.target.value)}
              rows={3}
              aria-label="Text to compare"
              className="w-full resize-y rounded-sm border border-[var(--rule)] bg-[var(--card-bg)] px-3 py-2 font-mono text-[13px] text-[var(--ink)] focus:outline-2 focus:outline-[var(--accent-2)]"
            />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  byte-pair · space binds forward — {count(cmpText, 'bpe')} tokens
                </p>
                <Chips text={cmpText} scheme="bpe" />
              </div>
              <div>
                <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
                  sentencepiece · ▁ marks word start — {count(cmpText, 'sp')} tokens
                </p>
                <Chips text={cmpText} scheme="sp" />
              </div>
            </div>
          </div>
        )}

        {/* the duel gauge */}
        <div className="pt-2">{gauge}</div>
      </div>
    </GameShell>
  )
}
