'use client'

import { useEffect, useMemo, useReducer } from 'react'
import { createBlackjackReducer, initialState, type BlackjackState } from '@/lib/games/blackjack/reducer'
import { rngFrom } from '@/lib/games/shared/rng'

const BANK_KEY = 'games.blackjack.bank'

/** Reducer wired to the page seed; bankroll persists across visits. */
export function useBlackjackGame(seed: string) {
  const reducer = useMemo(() => createBlackjackReducer(rngFrom(seed, 'blackjack')), [seed])

  const [state, dispatch] = useReducer(reducer, undefined, () => {
    const s = initialState(rngFrom(seed, 'blackjack'))
    if (typeof window !== 'undefined') {
      const saved = Number(window.localStorage.getItem(BANK_KEY))
      if (Number.isFinite(saved) && saved >= 0) s.bank = saved
    }
    return s
  })

  useEffect(() => {
    if (typeof window !== 'undefined') window.localStorage.setItem(BANK_KEY, String(state.bank))
  }, [state.bank])

  return { state, dispatch }
}

export type { BlackjackState }
