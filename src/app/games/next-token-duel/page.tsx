import type { Metadata } from 'next'
import { DuelGame } from '@/components/games/next-token-duel/DuelGame'

export const metadata: Metadata = {
  title: 'Next-Token Duel — Games',
  description:
    'Predict the next token of a held-out passage and get scored in bits of surprisal against the model — perplexity by playing, not by formula.',
}

export default function Page() {
  return <DuelGame />
}
