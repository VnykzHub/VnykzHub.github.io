'use client'

import { useEffect, useRef, useState } from 'react'
import type { Card } from '@/lib/games/blackjack/types'
import { hiLo } from '@/lib/games/blackjack/counting'
import { buildShoe } from '@/lib/games/blackjack/shoe'
import { rngFrom } from '@/lib/games/shared/rng'
import { GameButton } from '@/components/games/shared'
import { PlayingCard } from './PlayingCard'
import './felt.css'

interface Batch {
  cards: Card[]
  count: number
  revealed: boolean
}

/** Hi-Lo drill: count a batch of 4–8 cards, check, repeat. */
export function CountTrainerPanel({ seed }: { seed: string }) {
  const shoeRef = useRef<Card[]>([])
  const [batch, setBatch] = useState<Batch | null>(null)
  const [guess, setGuess] = useState('')
  const [stats, setStats] = useState({ correct: 0, wrong: 0, streak: 0 })
  const [feedback, setFeedback] = useState('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const dealBatch = () => {
    if (shoeRef.current.length < 20) shoeRef.current = buildShoe(6, rngFrom(seed, 'count-trainer'))
    const n = 4 + Math.floor(Math.random() * 5)
    const cards: Card[] = []
    let count = 0
    for (let i = 0; i < n; i++) {
      const card = shoeRef.current.pop()!
      cards.push(card)
      count += hiLo(card.rank)
    }
    setBatch({ cards, count, revealed: false })
    setGuess('')
    setFeedback('')
  }

  // Reset the drill when the page seed changes.
  useEffect(() => {
    shoeRef.current = buildShoe(6, rngFrom(seed, 'count-trainer'))
    setStats({ correct: 0, wrong: 0, streak: 0 })
    const n = 4 + Math.floor(Math.random() * 5)
    const cards: Card[] = []
    let count = 0
    for (let i = 0; i < n; i++) {
      const card = shoeRef.current.pop()!
      cards.push(card)
      count += hiLo(card.rank)
    }
    setBatch({ cards, count, revealed: false })
    setGuess('')
    setFeedback('')
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed])

  const check = () => {
    if (!batch || batch.revealed) return
    const g = parseInt(guess, 10)
    if (isNaN(g)) {
      setFeedback('Enter a number.')
      return
    }
    const ok = g === batch.count
    setStats((s) => ({
      correct: s.correct + (ok ? 1 : 0),
      wrong: s.wrong + (ok ? 0 : 1),
      streak: ok ? s.streak + 1 : 0,
    }))
    setFeedback(
      ok
        ? `✓ Correct! Count = ${batch.count > 0 ? '+' : ''}${batch.count}`
        : `✗ Wrong. You said ${g > 0 ? '+' : ''}${g}, correct is ${batch.count > 0 ? '+' : ''}${batch.count}.`
    )
    setBatch({ ...batch, revealed: true })
    timerRef.current = setTimeout(dealBatch, 2000)
  }

  return (
    <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
      <p className="mb-4 text-sm leading-relaxed text-[var(--ink-soft)]">
        Cards are dealt. Enter the <strong className="text-[var(--ink)]">running count</strong> of this batch. Hi-Lo:
        2–6 = +1, 7–9 = 0, 10/Face/Ace = −1.
      </p>

      <div className="flex min-h-[110px] flex-wrap items-center justify-center gap-2">
        {batch?.cards.map((card, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <PlayingCard card={card} />
            {batch.revealed && (
              <span
                className={`rounded-sm px-1 font-mono text-[10px] font-bold text-white ${
                  hiLo(card.rank) > 0 ? 'bg-[#27ae60]' : hiLo(card.rank) < 0 ? 'bg-[#e74c3c]' : 'bg-[#555]'
                }`}
              >
                {hiLo(card.rank) > 0 ? '+1' : hiLo(card.rank) < 0 ? '−1' : '0'}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="number"
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder="0"
          aria-label="Running count"
          className="w-24 rounded-sm border border-[var(--rule)] bg-[var(--card-bg)] px-3 py-2 text-center font-mono text-base text-[var(--ink)] focus:outline-2 focus:outline-[var(--accent-2)]"
        />
        <GameButton variant="primary" onClick={check} disabled={batch?.revealed}>
          Check
        </GameButton>
        <GameButton onClick={dealBatch}>New</GameButton>
        <span
          aria-live="polite"
          className={`font-mono text-sm ${feedback.startsWith('✓') ? 'text-[var(--accent-2)]' : 'text-[var(--accent-3)]'}`}
        >
          {feedback}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {[
          { label: 'correct', value: stats.correct },
          { label: 'wrong', value: stats.wrong },
          { label: 'streak', value: stats.streak },
        ].map((s) => (
          <div key={s.label} className="rounded-md border border-[var(--rule)] bg-[var(--card-bg)] px-3 py-2 text-center">
            <div className="font-mono text-lg font-semibold text-[var(--accent-1)]">{s.value}</div>
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 border-t border-[var(--rule)] pt-4">
        <div className="text-center">
          <div className="font-mono text-sm font-semibold text-[#27ae60]">+1</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">2 3 4 5 6</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-sm font-semibold text-[var(--ink-soft)]">0</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">7 8 9</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-sm font-semibold text-[#e74c3c]">−1</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">10 J Q K A</div>
        </div>
      </div>
    </div>
  )
}
