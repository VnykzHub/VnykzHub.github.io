import type { Metadata } from 'next'
import { ConnectFourGame } from '@/components/games/connect-four/ConnectFourGame'

export const metadata: Metadata = {
  title: 'Connect Four — Games',
  description:
    'Play Connect Four against a negamax engine with the search exposed — node counts, per-column values, and what alpha-beta pruning saves.',
}

export default function Page() {
  return <ConnectFourGame />
}
