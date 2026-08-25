import type { Metadata } from 'next'
import { BlackjackGame } from '@/components/games/blackjack/BlackjackGame'

export const metadata: Metadata = {
  title: 'Blackjack Trainer — Games',
  description:
    'Basic strategy and true-count drilling with a coach that prices every deviation. Seeded, shareable, and entirely in your browser.',
}

export default function Page() {
  return <BlackjackGame />
}
