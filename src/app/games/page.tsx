import type { Metadata } from 'next'
import { GamesHub } from '@/screens/GamesHub'

export const metadata: Metadata = {
  title: 'Games — Instruments for AI Intuition',
  description:
    'Ten playable instruments: expected value, tokenization, perplexity, Kelly sizing, optimizers, alpha-beta search, entropy, deduction, and multi-agent pursuit.',
}

export default function Page() {
  return <GamesHub />
}
