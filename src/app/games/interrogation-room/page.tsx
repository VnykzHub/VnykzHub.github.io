import type { Metadata } from 'next'
import { InterrogationGame } from '@/components/games/interrogation-room/InterrogationGame'

export const metadata: Metadata = {
  title: 'Interrogation Room — Games',
  description:
    'A deploy key left the server room at 02:14. Eight questions, one accusation — and a truth ledger the suspects cannot lie their way out of.',
}

export default function Page() {
  return <InterrogationGame />
}
