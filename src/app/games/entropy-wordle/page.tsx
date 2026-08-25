import type { Metadata } from 'next'
import { WordleGame } from '@/components/games/entropy-wordle/WordleGame'

export const metadata: Metadata = {
  title: 'Entropy Wordle — Games',
  description:
    'The usual game, priced in bits — every guess shows how much information you extracted against the optimal guess. An instrument for information theory.',
}

export default function Page() {
  return <WordleGame />
}
