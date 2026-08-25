'use client'

import { useState } from 'react'
import type { Move } from '@/lib/games/blackjack/types'
import { SCENARIOS, type Scenario } from '@/lib/games/blackjack/scenarios'
import { shuffle, rngFrom } from '@/lib/games/shared/rng'
import { GameButton } from '@/components/games/shared'
import { PlayingCard } from './PlayingCard'
import './felt.css'

/** Strategy quizzes: 5 of the 8 scenarios per seed, scored. */
export function ScenarioPanel({ seed }: { seed: string }) {
  const [round, setRound] = useState(() => shuffle(SCENARIOS, rngFrom(seed, 'scenarios')).slice(0, 5))
  const [answers, setAnswers] = useState<Record<number, Move>>({})

  const score = round.filter((sc, i) => answers[i] === sc.correct).length
  const answered = round.filter((_, i) => answers[i] !== undefined).length

  const reshuffle = () => {
    setRound(shuffle(SCENARIOS, rngFrom(seed + Math.random(), 'scenarios')).slice(0, 5))
    setAnswers({})
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          Score: <span className="text-[var(--accent-1)]">{score}</span> / {answered} answered · {round.length}{' '}
          scenarios
        </p>
        <GameButton size="sm" onClick={reshuffle}>
          New scenarios
        </GameButton>
      </div>

      {round.map((sc: Scenario, i: number) => {
        const chosen = answers[i]
        return (
          <div key={i} className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
            <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{sc.q}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <div className="flex">
                {sc.player.map((card, j) => (
                  <div key={j} className="-ml-3 origin-left scale-[0.6] first:ml-0">
                    <PlayingCard card={card} />
                  </div>
                ))}
              </div>
              <span className="font-mono text-xs italic text-[var(--ink-faint)]">vs</span>
              <div className="origin-left scale-[0.6]">
                <PlayingCard card={sc.dealer} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {sc.opts.map((opt) => {
                const isChosen = chosen === opt
                const isCorrect = sc.correct === opt
                return (
                  <GameButton
                    key={opt}
                    size="sm"
                    disabled={chosen !== undefined}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: opt }))}
                    className={
                      chosen !== undefined
                        ? isCorrect
                          ? 'border-[var(--accent-2)] text-[var(--accent-2)]'
                          : isChosen
                            ? 'border-[var(--accent-3)] text-[var(--accent-3)]'
                            : 'opacity-50'
                        : ''
                    }
                  >
                    {opt}
                  </GameButton>
                )
              })}
            </div>
            {chosen !== undefined && (
              <p className="mt-3 rounded-md border-l-2 border-[var(--accent-2)] bg-[var(--card-bg)] px-3 py-2 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                {sc.explain}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
