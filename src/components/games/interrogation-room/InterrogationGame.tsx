'use client'

import { useState } from 'react'
import { GameButton, GameSelect, GameShell, type ReadoutItem } from '@/components/games/shared'
import {
  SCENE,
  TURNS,
  ask,
  generateCase,
  ledgerText,
  type GeneratedCase,
  type QuestionKind,
  type RevealedFact,
  type Tone,
} from '@/lib/games/interrogation-room/case'
import { rngFrom, type Rng } from '@/lib/games/shared/rng'

interface TranscriptEntry {
  speaker: string
  line: string
  tone: Tone | 'brief' | 'verdict'
}

const TONE_TEXT: Record<TranscriptEntry['tone'], string> = {
  mute: 'text-[var(--ink-soft)]',
  machine: 'text-[var(--accent-2)]',
  bad: 'text-[var(--accent-3)]',
  brief: 'text-[var(--accent-2)]',
  verdict: 'text-[var(--accent-3)]',
}

const QUESTIONS: { value: QuestionKind; label: string }[] = [
  { value: 'where', label: 'Where were you at 02:14?' },
  { value: 'saw', label: 'Who did you see?' },
  { value: 'vouch', label: 'Can you vouch for someone?' },
  { value: 'confront', label: 'Confront with a contradiction' },
]

export function InterrogationGame() {
  const [kase, setKase] = useState<GeneratedCase>(() => generateCase(rngFrom('1729', 'interro')))
  const [rng] = useState<Rng>(() => rngFrom('1729', 'interro'))
  const [sel, setSel] = useState(0)
  const [question, setQuestion] = useState<QuestionKind>('where')
  const [vouchTarget, setVouchTarget] = useState<number | undefined>(undefined)
  const [left, setLeft] = useState(TURNS)
  const [known, setKnown] = useState<RevealedFact[]>([])
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([
    {
      speaker: 'BRIEF',
      line: `the deploy key left ${SCENE} at 02:14. Three badges were live in the building.`,
      tone: 'brief',
    },
  ])
  const [over, setOver] = useState(false)
  const [won, setWon] = useState<boolean | null>(null)
  const [ledgerOpen, setLedgerOpen] = useState(false)
  const [message, setMessage] = useState(
    'Start with where everyone says they were, then find the person whose story someone else contradicts.'
  )

  const resetAll = (s: string) => {
    setKase(generateCase(rngFrom(s, 'interro')))
    setSel(0)
    setQuestion('where')
    setVouchTarget(undefined)
    setLeft(TURNS)
    setKnown([])
    setTranscript([
      {
        speaker: 'BRIEF',
        line: `the deploy key left ${SCENE} at 02:14. Three badges were live in the building.`,
        tone: 'brief',
      },
    ])
    setOver(false)
    setWon(null)
    setLedgerOpen(false)
    setMessage('Start with where everyone says they were, then find the person whose story someone else contradicts.')
  }

  const claimsOf = (i: number): string | null => {
    const loc = known.find((k) => k.type === 'loc' && k.who === i)
    return loc?.value ?? null
  }

  const askQuestion = () => {
    if (over || left <= 0) return
    const result = ask(kase, sel, question, known, question === 'vouch' ? vouchTarget : undefined, rng)
    const speaker = kase.people[sel].name.split(' ')[0]

    if (result.line) {
      setTranscript((t) => [{ speaker, line: result.line, tone: result.tone }, ...t])
    }
    const nextKnown = [...known, ...result.reveals]
    setKnown(nextKnown)
    const nextLeft = left - 1
    setLeft(nextLeft)

    if (result.broken) {
      setOver(true)
      setWon(true)
      setMessage(`${kase.people[sel].name} broke with ${nextLeft} questions to spare.`)
    } else if (result.note) {
      setMessage(result.note)
    } else if (nextLeft <= 0) {
      setOver(true)
      setMessage('Out of questions. Make the accusation.')
    } else {
      setMessage('')
    }
  }

  const accuse = (i: number) => {
    if (over || ledgerOpen) return
    const correct = kase.people[i].guilty
    const culprit = kase.people[kase.guiltyIdx]
    setOver(true)
    setWon(correct)
    setTranscript((t) => [
      { speaker: 'VERDICT', line: correct ? 'case closed.' : 'wrong call.', tone: 'verdict' as const },
      ...t,
    ])
    setMessage(
      correct
        ? `Correct. ${culprit.name} took the key, with ${left} questions unused.`
        : `Wrong. It was ${culprit.name}, who was in ${SCENE} while claiming ${culprit.cover}.`
    )
  }

  const openLedger = () => {
    setOver(true)
    setLedgerOpen(true)
    const lines = ledgerText(kase).map((line) => ({ speaker: 'LEDGER', line, tone: 'mute' as const }))
    setTranscript((t) => [...lines, ...t])
    setMessage('Ledger opened — that is the whole world model the suspects were answering from.')
  }

  const readoutItems: ReadoutItem[] = [
    { label: 'questions left', value: String(left), tone: left > 2 ? 'human' : 'bad' },
    { label: 'suspects', value: String(kase.people.length), tone: 'mute' },
    { label: 'claims on record', value: String(known.length), tone: 'machine' },
    {
      label: 'case',
      value: ledgerOpen ? 'opened' : over ? (won ? 'closed' : won === false ? 'cold' : 'open') : 'open',
      tone: over && won ? 'machine' : over ? 'bad' : 'mute',
    },
  ]

  return (
    <GameShell
      eyebrow="Game 08 · Ledger · measures: deduction"
      title="Interrogation Room"
      lede="A deploy key left the server room at 02:14. Three people were in the building. You get eight questions and one accusation. The suspects can lie to you, but they cannot invent facts."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="The scenario generator runs first and writes a truth ledger: who was where, who saw whom, and who took the key. Every answer you get is a lookup against that ledger, filtered by what the speaker knows and bent by whether they have a reason to lie. Nothing is generated at answer time, so the case is always solvable and never contradicts itself — that is the truth firewall. This build phrases the answers with templates. The production version swaps the phrasing layer for a model call: it receives the permitted facts and the speaker's disposition and returns only the wording, so a hallucination cannot change what is true."
    >
      <div className="grid gap-5 md:grid-cols-2">
        {/* suspects + questioning */}
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          {/* question dots */}
          <div className="mb-4 flex gap-1.5">
            {Array.from({ length: TURNS }, (_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${
                  i < TURNS - left
                    ? 'bg-[var(--accent-2)]'
                    : i >= TURNS - 2
                      ? 'bg-[var(--accent-3)]/50'
                      : 'bg-[var(--rule)]'
                }`}
              />
            ))}
            <span className="ml-2 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
              questions
            </span>
          </div>

          <div className="space-y-2">
            {kase.people.map((p, i) => {
              const claimed = claimsOf(i)
              return (
                <button
                  key={i}
                  onClick={() => setSel(i)}
                  aria-pressed={sel === i}
                  className={`w-full rounded-md border px-4 py-3 text-left transition-colors ${
                    sel === i
                      ? 'border-[var(--accent-1)] bg-[var(--card-bg)]'
                      : 'border-[var(--rule)] hover:border-[var(--ink-faint)]'
                  }`}
                >
                  <span className="font-sans text-sm font-semibold text-[var(--heading)]">{p.name}</span>
                  <span className="ml-2 font-mono text-xs text-[var(--ink-faint)]">· {p.role}</span>
                  <br />
                  <span className="font-mono text-[11px] text-[var(--ink-soft)]">
                    {claimed ? `claims: ${claimed}` : 'no statement on record'}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <GameSelect
              aria-label="Question"
              value={question}
              onChange={(e) => setQuestion(e.target.value as QuestionKind)}
              disabled={over}
              className="min-w-[220px] flex-1"
            >
              {QUESTIONS.map((q) => (
                <option key={q.value} value={q.value}>
                  {q.label}
                </option>
              ))}
            </GameSelect>
            {question === 'vouch' && (
              <GameSelect
                aria-label="Person to vouch for"
                value={vouchTarget ?? 0}
                onChange={(e) => setVouchTarget(Number(e.target.value))}
                disabled={over}
              >
                {kase.people.map((p, i) =>
                  i !== sel ? (
                    <option key={i} value={i}>
                      {p.name}
                    </option>
                  ) : null
                )}
              </GameSelect>
            )}
            <GameButton variant="primary" onClick={askQuestion} disabled={over || left <= 0}>
              Ask
            </GameButton>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">accuse</span>
            {kase.people.map((p, i) => (
              <GameButton key={i} size="sm" disabled={over || ledgerOpen} onClick={() => accuse(i)}>
                {p.name.split(' ')[0]}
              </GameButton>
            ))}
          </div>
          <p aria-live="polite" className="mt-4 font-mono text-xs leading-relaxed text-[var(--ink-soft)]">
            {message}
          </p>
        </div>

        {/* transcript */}
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Transcript</p>
          <div className="max-h-[380px] space-y-1.5 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {transcript.map((entry, i) => (
              <p key={i}>
                <span className={`${TONE_TEXT[entry.tone]} font-semibold`}>{entry.speaker}</span>{' '}
                <span className="text-[var(--ink-soft)]">{entry.line}</span>
              </p>
            ))}
          </div>
          <GameButton className="mt-4" onClick={openLedger} disabled={ledgerOpen}>
            Open the ledger (ends the case)
          </GameButton>
        </div>
      </div>
    </GameShell>
  )
}
