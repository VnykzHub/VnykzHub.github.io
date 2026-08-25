import type { Metadata } from 'next'
import { KellyGame } from '@/components/games/kelly-run/KellyGame'

export const metadata: Metadata = {
  title: 'Kelly Run — Games',
  description:
    'Infer a hidden coin bias from outcomes while you bet against a full-Kelly bot — an instrument for bet sizing and Bayesian updating.',
}

export default function Page() {
  return <KellyGame />
}
