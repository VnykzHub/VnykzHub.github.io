'use client'

import { useEffect, useState } from 'react'
import { CalibratedGauge, GameButton, GameShell, type ReadoutItem } from '@/components/games/shared'
import { PASSAGES, PASSAGES_PER_RUN, type DuelPassage } from '@/lib/games/next-token-duel/data'
import { bits, pickQ, perplexity } from '@/lib/games/next-token-duel/scoring'
import { rngFrom } from '@/lib/games/shared/rng'

const show = (t: string) => t.replace(/\n/g, '⏎').replace(/ /g, '·')

interface Run {
  order: number[]
  pi: number
  si: number
  youBits: number
  modBits: number
  tokens: number
  hits: number
  text: string
  done: boolean
  lastReveal: { step: DuelPassage['steps'][number]; chosen: number } | null
}

export function DuelGame() {
  const [run, setRun] = useState<Run>(() => makeRun('1729'))

  const resetAll = (seed: string) => setRun(makeRun(seed))

  const passage = run.pi < run.order.length ? PASSAGES[run.order[run.pi]] : null
  const step = passage && run.si < passage.steps.length ? passage.steps[run.si] : null
  const youAvg = run.tokens ? run.youBits / run.tokens : 0
  const modAvg = run.tokens ? run.modBits / run.tokens : 0

  const answer = (idx: number) => {
    if (!passage || !step || run.done || run.lastReveal) return
    const truth = step.c
    const pTrue = step.o[truth][1]
    const q = pickQ(idx === truth, step.o.length)
    setRun((r) => ({
      ...r,
      youBits: r.youBits + bits(q),
      modBits: r.modBits + bits(pTrue),
      tokens: r.tokens + 1,
      hits: r.hits + (idx === truth ? 1 : 0),
      text: r.text + step.o[truth][0],
      lastReveal: { step, chosen: idx },
    }))
  }

  const next = () => {
    setRun((r) => {
      if (!passage || !step) return r
      let pi = r.pi
      let si = r.si + 1
      let text = r.text
      if (si >= passage.steps.length) {
        pi += 1
        si = 0
        if (pi < r.order.length) text = PASSAGES[r.order[pi]].prefix
      }
      return { ...r, pi, si, text, lastReveal: null, done: pi >= r.order.length }
    })
  }

  // Keyboard: 1–5 for candidates, Enter/Space to continue after reveal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (run.lastReveal) {
        if (e.key === 'Enter' || e.key === ' ') next()
        return
      }
      if (!step || run.done) return
      const n = parseInt(e.key, 10)
      if (n >= 1 && n <= step.o.length) answer(n - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const readoutItems: ReadoutItem[] = [
    { label: 'token', value: `${run.tokens}/${run.order.length * 4}`, tone: 'mute' },
    { label: 'your bits/tok', value: run.tokens ? youAvg.toFixed(2) : '—', tone: 'human' },
    { label: 'model bits/tok', value: run.tokens ? modAvg.toFixed(2) : '—', tone: 'machine' },
    {
      label: 'your perplexity',
      value: run.tokens ? perplexity(youAvg).toFixed(1) : '—',
      tone: youAvg <= modAvg ? 'machine' : 'bad',
    },
    { label: 'hit rate', value: run.tokens ? `${Math.round((100 * run.hits) / run.tokens)}%` : '—', tone: 'mute' },
  ]

  return (
    <GameShell
      eyebrow="Game 03 · Static · measures: perplexity"
      title="Next-Token Duel"
      lede="Predict the next token of a held-out passage. You and the model are scored in bits of surprisal on the token that actually came next. Lower is better — perplexity stops being an abstraction about four tokens in."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="The distributions are precomputed offline and shipped as data, so the page makes no inference call — the whole duel is a static asset. Your pick is scored as a 70% confidence bet with the remaining 30% spread across the other four candidates, so your loss is −log₂(0.70) when you are right and −log₂(0.075) when you are wrong. The model's loss is −log₂(p_true) under its own distribution. Sum the bits, divide by tokens, exponentiate base 2 and you have perplexity — arrived at by playing rather than by reading a formula."
    >
      <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
        {run.done ? (
          <div>
            <h3 className="font-serif text-xl font-semibold text-[var(--heading)]">
              {youAvg < modAvg ? 'You out-predicted the model.' : 'The model out-predicted you.'}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
              You averaged {youAvg.toFixed(2)} bits per token (perplexity {perplexity(youAvg).toFixed(1)}). The model
              averaged {modAvg.toFixed(2)} (perplexity {perplexity(modAvg).toFixed(1)}). Reseed for a different set of
              passages.
            </p>
            <div className="mt-3 whitespace-pre-wrap rounded-sm bg-[var(--card-bg)] p-4 font-mono text-sm leading-loose [word-break:break-word]">
              {run.text}
            </div>
          </div>
        ) : passage ? (
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
              {passage.genre} · passage {run.pi + 1} of {run.order.length}
            </p>
            <div className="mt-2 whitespace-pre-wrap rounded-sm bg-[var(--card-bg)] p-4 font-mono text-sm leading-loose [word-break:break-word]">
              {run.text}
            </div>

            {step && !run.lastReveal && (
              <div className="mt-5">
                <div className="flex flex-wrap gap-2">
                  {step.o.map(([tok], i) => (
                    <GameButton key={i} onClick={() => answer(i)}>
                      {show(tok)}
                    </GameButton>
                  ))}
                </div>
                <p className="mt-3 font-mono text-xs text-[var(--ink-faint)]">
                  Pick the token that actually comes next. Keys 1–5 work.
                </p>
              </div>
            )}

            {run.lastReveal && step && (
              <div className="mt-5">
                <div className="space-y-1.5">
                  {step.o.map(([tok, prob], i) => {
                    const truth = i === step.c
                    const chosen = i === run.lastReveal!.chosen
                    const max = Math.max(...step.o.map(([, p]) => p))
                    return (
                      <div key={i} className="flex items-center gap-3 font-mono text-xs">
                        <span
                          className={`w-24 shrink-0 text-right ${truth ? 'text-[var(--ink)]' : 'text-[var(--ink-faint)]'}`}
                        >
                          {show(tok)}
                        </span>
                        <div className="h-3 flex-1 overflow-hidden rounded-sm bg-[var(--bar-track)]">
                          <div
                            className="h-full rounded-sm"
                            style={{
                              width: `${Math.max(2, (prob / max) * 100)}%`,
                              background: truth ? 'var(--accent-2)' : chosen ? 'var(--accent-1)' : 'var(--rule)',
                            }}
                          />
                        </div>
                        <span className="w-12 text-[var(--ink-faint)]">{(prob * 100).toFixed(1)}%</span>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-4 font-mono text-xs">
                  {run.lastReveal.chosen === step.c ? (
                    <span className="text-[var(--accent-2)]">hit</span>
                  ) : (
                    <span className="text-[var(--accent-3)]">miss</span>
                  )}{' '}
                  · you paid{' '}
                  <span className="text-[var(--accent-1)]">
                    {bits(pickQ(run.lastReveal.chosen === step.c, step.o.length)).toFixed(2)} bits
                  </span>{' '}
                  · model paid{' '}
                  <span className="text-[var(--accent-2)]">{bits(step.o[step.c][1]).toFixed(2)} bits</span>
                </p>
                <GameButton variant="primary" className="mt-4" onClick={next}>
                  Continue
                </GameButton>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="mt-6">
        <CalibratedGauge
          human={1 - Math.min(youAvg, 4) / 4}
          machine={1 - Math.min(modAvg, 4) / 4}
          humanLabel="you"
          machineLabel="model"
        />
      </div>
    </GameShell>
  )
}

function makeRun(seed: string): Run {
  const idx = PASSAGES.map((_, i) => i)
  const r = rngFrom(seed, 'duel')
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[idx[i], idx[j]] = [idx[j], idx[i]]
  }
  const order = idx.slice(0, PASSAGES_PER_RUN)
  return {
    order,
    pi: 0,
    si: 0,
    youBits: 0,
    modBits: 0,
    tokens: 0,
    hits: 0,
    text: PASSAGES[order[0]].prefix,
    done: false,
    lastReveal: null,
  }
}
