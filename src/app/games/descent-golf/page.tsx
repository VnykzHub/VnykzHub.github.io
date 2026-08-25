import type { Metadata } from 'next'
import { DescentGame } from '@/components/games/descent-golf/DescentGame'

export const metadata: Metadata = {
  title: 'Descent Golf — Games',
  description:
    'Four loss surfaces, three optimizers, one learning rate — reach the target under par. An instrument for gradient descent.',
}

export default function Page() {
  return <DescentGame />
}
