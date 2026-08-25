import type { Metadata } from 'next'
import { TokenGolfGame } from '@/components/games/tokenizer-golf/TokenGolfGame'

export const metadata: Metadata = {
  title: 'Tokenizer Golf — Games',
  description:
    'Guess token counts, cut prompts under par, and compare BPE vs SentencePiece segmentation — an instrument for pricing language.',
}

export default function Page() {
  return <TokenGolfGame />
}
