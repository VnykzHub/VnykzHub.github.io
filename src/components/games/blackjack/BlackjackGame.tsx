'use client'

import { useState } from 'react'
import { GameShell, SegmentedControl, type ReadoutItem } from '@/components/games/shared'
import { useBlackjackGame } from '@/hooks/useBlackjackGame'
import { PlayTable } from './PlayTable'
import { ScenarioPanel } from './ScenarioPanel'
import { CountTrainerPanel } from './CountTrainerPanel'
import { StrategyChartPanel } from './StrategyChartPanel'
import './felt.css'

type Tab = 'play' | 'scenarios' | 'count' | 'chart'

const TABS = [
  { value: 'play', label: 'Play' },
  { value: 'scenarios', label: 'Scenarios' },
  { value: 'count', label: 'Count' },
  { value: 'chart', label: 'Chart' },
] as const

/** The trainer: felt table + coach, seeded and shareable. */
export function BlackjackGame() {
  // Seed lives OUTSIDE the keyed core so reseeding remounts the game with a
  // fresh reducer + shoe (useReducer keeps state across reducer identity
  // changes, so the keyed remount is the reset mechanism).
  const [seed, setSeed] = useState('')
  return <BlackjackCore key={seed} seed={seed} onSeedChange={setSeed} />
}

function BlackjackCore({ seed, onSeedChange }: { seed: string; onSeedChange: (s: string) => void }) {
  const [tab, setTab] = useState<Tab>('play')
  const { state, dispatch } = useBlackjackGame(seed)

  const readoutItems: ReadoutItem[] = [
    { label: 'bankroll', value: `${state.bank} pts`, tone: state.bank < 500 ? 'bad' : ('human' as const) },
    {
      label: 'running count',
      value: (state.runningCount > 0 ? '+' : '') + state.runningCount,
      tone: 'mute' as const,
    },
    {
      label: 'true count',
      value: String(state.decksRemaining > 0 ? Math.round(state.runningCount / state.decksRemaining) : 0),
      tone: 'mute' as const,
    },
    {
      label: 'coach',
      value: state.totalPlays > 0 ? `${state.optimalPlays}/${state.totalPlays} optimal` : '—',
      tone: state.totalPlays > 0 && state.optimalPlays === state.totalPlays ? 'machine' : ('human' as const),
    },
    { label: 'phase', value: state.phase, tone: 'mute' as const },
  ]

  return (
    <GameShell
      eyebrow="Game 01 · Static · measures: expected value"
      title="Blackjack Trainer"
      lede="Basic strategy and true-count drilling against a computer dealer. The coach prices every deviation from the chart — and the count never hides: the running tally is the point."
      initialSeed={seed}
      onReseed={onSeedChange}
      readoutItems={readoutItems}
      howItWorks="A six-deck shoe, shuffled fresh every visit — share your link and someone else plays your exact cards. The dealer is a computer agent: it stands on all 17s and plays out its hand the moment you stand. Blackjack pays 3:2, you may split once and double after splitting. The strategy engine behind the Hint button and the Chart tab is standard 6-deck basic strategy, and the charts are test-locked to it cell by cell."
    >
      <SegmentedControl<Tab> options={[...TABS]} value={tab} onChange={setTab} label="Blackjack trainer tabs" />
      <div className="mt-6">
        {tab === 'play' && <PlayTable state={state} dispatch={dispatch} />}
        {tab === 'scenarios' && <ScenarioPanel seed={seed} />}
        {tab === 'count' && <CountTrainerPanel seed={seed} />}
        {tab === 'chart' && <StrategyChartPanel />}
      </div>
    </GameShell>
  )
}
