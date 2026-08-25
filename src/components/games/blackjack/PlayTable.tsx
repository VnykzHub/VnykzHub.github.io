'use client'

import { useEffect } from 'react'
import type { BlackjackAction, BlackjackState, Card } from '@/lib/games/blackjack/types'
import { handTotal, isPair } from '@/lib/games/blackjack/hand'
import { GameButton } from '@/components/games/shared'
import { PlayingCard } from './PlayingCard'
import './felt.css'

interface PlayTableProps {
  state: BlackjackState
  dispatch: (action: BlackjackAction) => void
}

const CHIPS = [5, 10, 25, 100] as const

const CHIP_CLASS: Record<(typeof CHIPS)[number], string> = {
  5: 'bg-[var(--chip-red)]',
  10: 'bg-[var(--chip-blue)]',
  25: 'bg-[var(--chip-green)]',
  100: 'bg-[var(--chip-black)] border-[var(--gold-dim)]',
}

const MESSAGE_COLOR = {
  neutral: 'text-[var(--cream)]',
  win: 'text-[var(--win)]',
  lose: 'text-[var(--lose)]',
  push: 'text-[var(--gold)]',
} as const

function handDisplay(cards: Card[]): string {
  return String(handTotal(cards))
}

export function PlayTable({ state, dispatch }: PlayTableProps) {
  const active = state.hands[state.activeHand]
  const dealing = state.phase === 'player'
  const betting = state.phase === 'betting'

  const canHit = dealing && !!active && active.status === 'active'
  const canStand = canHit
  const canDouble = dealing && !!active && active.cards.length === 2 && state.bank >= active.bet
  const canSplit =
    dealing && state.hands.length === 1 && isPair(state.hands[0].cards) && state.bank >= state.hands[0].bet
  const canDeal = betting && state.bet > 0

  const trueCount = Math.round(state.runningCount / state.decksRemaining)

  // Keyboard shortcuts: H/S/D/P.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      switch (e.key.toLowerCase()) {
        case 'h':
          if (canHit) dispatch({ type: 'HIT' })
          break
        case 's':
          if (canStand) dispatch({ type: 'STAND' })
          break
        case 'd':
          if (canDouble) dispatch({ type: 'DOUBLE' })
          break
        case 'p':
          if (canSplit) dispatch({ type: 'SPLIT' })
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [canHit, canStand, canDouble, canSplit, dispatch])

  const dealerHidden = state.phase === 'player' && state.dealer.length > 1

  return (
    <div
      className="bj-felt relative flex min-h-[540px] flex-col items-center gap-5 overflow-hidden rounded-xl px-4 py-8"
      style={{
        background: 'radial-gradient(ellipse at center, var(--felt-light) 0%, var(--felt) 50%, var(--felt-rim) 100%)',
      }}
    >
      {/* felt rim */}
      <div className="pointer-events-none absolute inset-2 rounded-[100px] border-2 border-[var(--gold)]/20" />

      {/* dealer */}
      <div className="relative flex w-full max-w-[600px] flex-col items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--gold)]/50">Dealer</span>
        <div className="flex min-h-[90px] items-center justify-center">
          {state.dealer.map((card, i) => (
            <div key={i} className="-ml-3 first:ml-0">
              <PlayingCard card={card} hidden={dealerHidden && i === 1} />
            </div>
          ))}
        </div>
        <div className="min-h-[1.5rem] font-mono text-sm font-semibold text-[var(--gold)]">
          {state.dealer.length > 0 &&
            (dealerHidden ? state.dealer[0].rank + state.dealer[0].suit : handDisplay(state.dealer))}
        </div>
      </div>

      {/* count + message */}
      <div className="relative flex flex-col items-center gap-3">
        <div className="flex gap-4 rounded-lg border border-[var(--gold)]/20 bg-black/40 px-4 py-2">
          {[
            {
              label: 'running',
              value: (state.runningCount > 0 ? '+' : '') + state.runningCount,
              cls:
                state.runningCount > 0
                  ? 'text-[var(--win)]'
                  : state.runningCount < 0
                    ? 'text-[var(--lose)]'
                    : 'text-[var(--gold)]/60',
            },
            { label: 'decks left', value: state.decksRemaining.toFixed(1), cls: 'text-[var(--cream)]' },
            {
              label: 'true',
              value: (trueCount > 0 ? '+' : '') + trueCount,
              cls: trueCount > 0 ? 'text-[var(--win)]' : trueCount < 0 ? 'text-[var(--lose)]' : 'text-[var(--gold)]/60',
            },
          ].map((cell) => (
            <div key={cell.label} className="text-center">
              <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--cream)]/40">
                {cell.label}
              </div>
              <div className={`font-mono text-sm font-semibold ${cell.cls}`}>{cell.value}</div>
            </div>
          ))}
        </div>

        <div
          aria-live="polite"
          className={`min-w-[260px] max-w-[340px] rounded-md border border-[var(--gold)]/30 bg-black/40 px-5 py-2.5 text-center text-sm ${MESSAGE_COLOR[state.tone]}`}
        >
          {state.message}
        </div>

        {/* coach + hint */}
        {(state.coachFeedback || (state.hintShown && state.lastOptimal)) && (
          <div className="max-w-[360px] rounded-md border border-white/10 bg-black/50 px-4 py-2 text-center text-xs leading-relaxed text-[var(--cream)]/60">
            {state.coachFeedback && <p>{state.coachFeedback}</p>}
            {state.hintShown && state.lastOptimal && (
              <p className={state.coachFeedback ? 'mt-1' : ''}>
                <span className="font-semibold text-[var(--gold)]">Optimal: {state.lastOptimal.move}</span> —{' '}
                {state.lastOptimal.reason}
              </p>
            )}
          </div>
        )}
      </div>

      {/* player hands */}
      <div className="relative flex w-full max-w-[600px] flex-col items-center gap-2">
        {state.hands.map((hand, i) => (
          <div key={i} className="flex w-full flex-col items-center gap-1">
            <div className="min-h-[1.5rem] font-mono text-sm font-semibold text-[var(--gold)]">
              {handDisplay(hand.cards)}
              {hand.status === 'bust' && <span className="ml-2 text-[var(--lose)]">bust</span>}
            </div>
            <div
              className={`flex min-h-[90px] items-center justify-center rounded-lg px-2 py-1 ${
                i === state.activeHand && dealing ? 'outline outline-1 outline-[var(--gold)]/60' : ''
              }`}
            >
              {hand.cards.map((card, j) => (
                <div key={j} className="-ml-3 first:ml-0">
                  <PlayingCard card={card} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* betting + actions */}
      <div className="relative flex flex-col items-center gap-4">
        <div className="flex gap-2">
          {CHIPS.map((amount) => (
            <button
              key={amount}
              onClick={() => dispatch({ type: 'ADD_BET', amount })}
              disabled={!betting}
              aria-label={`Bet $${amount}`}
              className={`flex h-11 w-11 items-center justify-center rounded-full border-[3px] border-dashed border-white/30 font-mono text-[11px] font-bold text-white transition-transform hover:scale-110 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 ${CHIP_CLASS[amount]}`}
            >
              ${amount}
            </button>
          ))}
        </div>
        <div className="font-mono text-xs text-[var(--cream)]/50">
          Bet: <span className="font-semibold text-[var(--gold)]">${state.bet}</span> &nbsp;|&nbsp; Bank:{' '}
          <span className="font-semibold text-[var(--gold)]">${state.bank}</span>
          {state.optimalPlays + state.totalPlays > 0 && (
            <span className="ml-3">
              coach: {state.optimalPlays}/{state.totalPlays} optimal
            </span>
          )}
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <GameButton variant="primary" disabled={!canDeal} onClick={() => dispatch({ type: 'DEAL' })}>
            Deal
          </GameButton>
          <GameButton disabled={!canHit} onClick={() => dispatch({ type: 'HIT' })}>
            Hit <span className="opacity-50">h</span>
          </GameButton>
          <GameButton disabled={!canStand} onClick={() => dispatch({ type: 'STAND' })}>
            Stand <span className="opacity-50">s</span>
          </GameButton>
          <GameButton disabled={!canDouble} onClick={() => dispatch({ type: 'DOUBLE' })}>
            Double <span className="opacity-50">d</span>
          </GameButton>
          <GameButton disabled={!canSplit} onClick={() => dispatch({ type: 'SPLIT' })}>
            Split <span className="opacity-50">p</span>
          </GameButton>
          <GameButton
            variant="danger"
            disabled={!betting || state.bet === 0}
            onClick={() => dispatch({ type: 'CLEAR_BET' })}
          >
            Clear
          </GameButton>
          <GameButton size="sm" disabled={!state.lastOptimal} onClick={() => dispatch({ type: 'SHOW_HINT' })}>
            Hint
          </GameButton>
          <GameButton size="sm" onClick={() => dispatch({ type: 'RESET_BANK' })}>
            Reset bank
          </GameButton>
        </div>
        {state.newShoe && (
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--gold)]">
            New shoe dealt — count reset
          </p>
        )}
      </div>
    </div>
  )
}
