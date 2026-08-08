import { WritingIndex } from '@/screens/WritingIndex'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'LLM Atlas',
  description: 'How large language models work — explainers, comparisons, and cost analysis in plain language.',
}

export default function LlmAtlasPage() {
  return <WritingIndex />
}
