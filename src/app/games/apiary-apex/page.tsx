import type { Metadata } from 'next'
import { ApiaryApexGame } from '@/components/games/apiary-apex/ApiaryApexGame'

export const metadata: Metadata = {
  title: 'ApiaryApex — Games',
  description:
    'Two hunter bees and a survivor, loose in an endless procedurally-generated field. A steering-behavior instrument for pursuit, evasion, and what a multi-agent reward signal looks like before any learning happens.',
}

export default function Page() {
  return <ApiaryApexGame />
}
