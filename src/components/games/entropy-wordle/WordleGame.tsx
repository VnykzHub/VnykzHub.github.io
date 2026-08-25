'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { CalibratedGauge, GameButton, GameShell, type ReadoutItem } from '@/components/games/shared'
import { WORDS, bestGuess, pattern } from '@/lib/games/entropy-wordle/engine'
import { rngFrom } from '@/lib/games/shared/rng'

interface GuessRow {
  word: string
  res: number[]
}

interface LedgerEntry {
  word: string
  gained: number
  bestWord: string
  bestBits: number
  before: number
  after: number
}

const TILE_BG = ['var(--panel2)', 'var(--accent-1)', 'var(--accent-2)']
const TILE_FG = ['var(--ink-soft)', '#151006', '#0a1a12']

function Tile({ ch, res, index }: { ch: string; res: number; index: number }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      initial={reduced ? false : { rotateX: 90, opacity: 0 }}
      animate={{ rotateX: 0, opacity: 1 }}
      transition={{ delay: index * 0.08, duration: 0.25 }}
      className="flex h-11 w-11 items-center justify-center rounded-sm border font-mono text-lg font-semibold"
      style={{ background: TILE_BG[res], color: TILE_FG[res], borderColor: 'var(--rule)' }}
    >
      {ch.toUpperCase()}
    </motion.div>
  )
}

export function WordleGame() {
  const [answer, setAnswer] = useState(() => {
    const r = rngFrom('1729', 'wordle')
    return WORDS[Math.floor(r() * WORDS.length)]
  })
  const [cands, setCands] = useState<string[]>(() => WORDS.slice())
  const [guesses, setGuesses] = useState<GuessRow[]>([])
  const [ledger, setLedger] = useState<LedgerEntry[]>([])
  const [bitsYou, setBitsYou] = useState(0)
  const [bitsBest, setBitsBest] = useState(0)
  const [input, setInput] = useState('')
  const [message, setMessage] = useState(
    'The answer is fixed by the page seed — share the link and someone plays the same word.'
  )

  const done = guesses.length >= 6 || guesses.some((g) => g.word === answer)
  const solved = guesses.some((g) => g.word === answer)

  const resetAll = (seed: string) => {
    const r = rngFrom(seed, 'wordle')
    setAnswer(WORDS[Math.floor(r() * WORDS.length)])
    setCands(WORDS.slice())
    setGuesses([])
    setLedger([])
    setBitsYou(0)
    setBitsBest(0)
    setInput('')
    setMessage('The answer is fixed by the page seed — share the link and someone plays the same word.')
  }

  const submit = (word?: string) => {
    if (done) return
    const w = (word ?? input).toLowerCase().trim()
    if (w.length !== 5) {
      setMessage('Five letters.')
      return
    }
    if (!WORDS.includes(w)) {
      setMessage('Not in this list — it is a trimmed dictionary, try another.')
      return
    }

    const before = cands.length
    const opt = bestGuess(cands)
    const { res, code } = pattern(w, answer)
    const nextCands = cands.filter((c) => pattern(w, c).code === code)
    const gained = Math.log2(before / Math.max(1, nextCands.length))

    setCands(nextCands)
    setBitsYou((b) => b + gained)
    setBitsBest((b) => b + opt.bits)
    setGuesses((g) => [...g, { word: w, res }])
    setLedger((l) => [
      { word: w, gained, bestWord: opt.word, bestBits: opt.bits, before, after: nextCands.length },
      ...l,
    ])
    setInput('')

    const nextGuesses = guesses.length + 1
    if (w === answer) {
      setMessage(
        `Solved in ${nextGuesses}, taking ${(bitsYou + gained).toFixed(2)} bits against a solver expectation of ${(
          bitsBest + opt.bits
        ).toFixed(2)}.`
      )
    } else if (nextGuesses >= 6) {
      setMessage(`Out of guesses — it was ${answer.toUpperCase()}.`)
    } else {
      setMessage(nextCands.length === 1 ? 'One candidate left. You know what to do.' : '')
    }
  }

  const readoutItems: ReadoutItem[] = [
    { label: 'guess', value: `${guesses.length}/6`, tone: 'mute' },
    { label: 'candidates', value: String(cands.length), tone: 'mute' },
    { label: 'bits you got', value: bitsYou.toFixed(2), tone: 'human' },
    { label: 'solver expected', value: bitsBest.toFixed(2), tone: 'machine' },
    {
      label: 'vs solver',
      value: `${bitsYou - bitsBest >= 0 ? '+' : ''}${(bitsYou - bitsBest).toFixed(2)}`,
      tone: bitsYou - bitsBest >= -1 ? 'machine' : 'bad',
    },
  ]

  return (
    <GameShell
      eyebrow="Game 07 · Engine · measures: information"
      title="Entropy Wordle"
      lede="The usual game, priced in bits. After every guess you see how much information you actually extracted, what the best available guess would have extracted, and the regret between them."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="Before a guess there are N candidate words left; after it there are M. You gained log₂(N/M) bits. The solver scores every word in the list by the entropy of the colour pattern it would produce across the current candidate set — −Σ p log₂ p over the 3⁵ possible patterns — and plays the maximum. That is the machine number: the bits you could have had. The list here is trimmed to a few hundred common words so the exhaustive scan runs in a frame; the algorithm is unchanged at full scale, it just wants a worker."
    >
      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          {/* tile rows */}
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 6 }, (_, i) => {
              const row = guesses[i]
              return (
                <div key={i} className="flex gap-1.5">
                  {Array.from({ length: 5 }, (_, j) =>
                    row ? (
                      <Tile key={j} ch={row.word[j]} res={row.res[j]} index={j} />
                    ) : (
                      <div key={j} className="h-11 w-11 rounded-sm border border-[var(--rule)] bg-[var(--panel2)]" />
                    )
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <input
              type="text"
              maxLength={5}
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="FIVE LETTERS"
              aria-label="Your guess"
              disabled={done}
              spellCheck={false}
              className="w-36 rounded-sm border border-[var(--rule)] bg-[var(--card-bg)] px-3 py-2 font-mono text-sm uppercase tracking-[0.18em] text-[var(--ink)] focus:outline-2 focus:outline-[var(--accent-2)] disabled:opacity-40"
            />
            <GameButton variant="primary" onClick={() => submit()} disabled={done}>
              Guess
            </GameButton>
            <GameButton
              onClick={() => {
                const { word } = bestGuess(cands)
                submit(word)
              }}
              disabled={done}
            >
              Play the optimal guess
            </GameButton>
          </div>
          <p aria-live="polite" className="mt-4 font-mono text-xs leading-relaxed text-[var(--ink-soft)]">
            {message}
            {solved && bitsYou > bitsBest && " You beat the solver's expectation — that is luck, and it counts."}
          </p>
        </div>

        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Information ledger
          </p>
          {ledger.length === 0 ? (
            <p className="font-mono text-xs text-[var(--ink-faint)]">
              No guesses yet. Every row prices a guess in bits against the solver's best.
            </p>
          ) : (
            <div className="space-y-1 font-mono text-[11px] leading-relaxed">
              {ledger.map((e, i) => (
                <p key={i} className="text-[var(--ink-soft)]">
                  {e.word.toUpperCase()} → <span className="text-[var(--accent-1)]">{e.gained.toFixed(2)} bits</span> ·
                  best was {e.bestWord.toUpperCase()}{' '}
                  <span className="text-[var(--accent-2)]">{e.bestBits.toFixed(2)}</span> · {e.before} → {e.after} left
                </p>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <CalibratedGauge
          human={Math.min(1, bitsYou / Math.max(1, bitsBest, bitsYou))}
          machine={Math.min(1, bitsBest / Math.max(1, bitsBest, bitsYou))}
          humanLabel="you"
          machineLabel="solver"
        />
      </div>
    </GameShell>
  )
}
