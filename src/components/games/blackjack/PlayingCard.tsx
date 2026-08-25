'use client'

import { motion, useReducedMotion } from 'framer-motion'
import type { Card } from '@/lib/games/blackjack/types'

const RED_SUITS = new Set(['♥', '♦'])

/** One playing card: Newsreader rank, mono-free suit glyph, settle animation. */
export function PlayingCard({ card, hidden = false }: { card: Card; hidden?: boolean }) {
  const reduced = useReducedMotion()

  if (hidden) {
    return <div className="bj-card-back h-[86px] w-[60px] rounded-md shadow-[2px_3px_8px_rgba(0,0,0,0.4)] md:h-[98px] md:w-[68px]" />
  }

  const red = RED_SUITS.has(card.suit)

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: -24, rotate: -8 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex h-[86px] w-[60px] shrink-0 flex-col items-center justify-center rounded-md border border-[#ddd] bg-[#fefefe] shadow-[2px_3px_8px_rgba(0,0,0,0.4)] md:h-[98px] md:w-[68px] ${
        red ? 'text-[#c0392b]' : 'text-[#111]'
      }`}
    >
      <span className="font-serif text-xl font-bold leading-none md:text-2xl">{card.rank}</span>
      <span className="text-sm leading-none md:text-base">{card.suit}</span>
    </motion.div>
  )
}
