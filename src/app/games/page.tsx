import type { Metadata } from 'next'
import { GamesHub } from '@/screens/GamesHub'

export const metadata: Metadata = {
  title: 'Games — Instruments for AI Intuition',
  description:
    'Nine playable instruments: expected value, tokenization, perplexity, Kelly sizing, optimizers, alpha-beta search, entropy, and deduction.',
}

export default function Page() {
  return <GamesHub />
}
