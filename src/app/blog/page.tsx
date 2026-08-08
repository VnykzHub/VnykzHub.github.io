import { BlogHub } from '@/screens/BlogHub'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — The Atlas Series',
  description: 'Long-form technical writing on AI engineering: LLMs, RAG, agents, MCP, vector databases, and production systems.',
}

export default function BlogPage() {
  return <BlogHub />
}
