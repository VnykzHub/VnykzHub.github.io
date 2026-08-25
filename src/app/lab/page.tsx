import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Calculator, Search, Database, BarChart3, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Lab — Interactive Demos & Tools',
  description: 'Live demos and interactive tools exploring AI engineering concepts.',
}

const DEMOS = [
  {
    title: 'PortfolioBot',
    slug: 'portfolio-bot',
    description: 'A local AI running entirely in your browser via WebGPU. Ask it anything about Vinayak — no server, no API keys.',
    icon: Zap,
    tech: ['WebGPU', 'WebLLM', 'React'],
    category: 'demo',
  },
  {
    title: 'LLM Cost & Latency Calculator',
    slug: 'llm-calculator',
    description: 'Compare pricing across models. Factor in caching, batch discounts, and token distribution to see real monthly costs.',
    icon: Calculator,
    tech: ['Recharts', 'React', 'TypeScript'],
    category: 'demo',
  },
  {
    title: 'RAG Over Public Docs',
    slug: 'rag-explorer',
    description: 'Ask questions against a small corpus. See retrieved chunks, relevance scores, and citations — understand what your retrieval system actually does.',
    icon: Search,
    tech: ['Supabase', 'OpenAI', 'React'],
    category: 'demo',
    status: 'planned',
  },
  {
    title: 'Multi-Agent SQL Translator',
    slug: 'sql-translator',
    description: 'Translate SQL between dialects with explanations. Maps directly to enterprise data platform work.',
    icon: Database,
    tech: ['LLM API', 'React', 'TypeScript'],
    category: 'demo',
    status: 'planned',
  },
  {
    title: 'Quantization Explorer',
    slug: 'quantization-explorer',
    description: 'Choose model size, precision, and quantization method. See memory usage, quality tradeoffs, and throughput estimates.',
    icon: BarChart3,
    tech: ['React', 'TypeScript', 'WebAssembly'],
    category: 'demo',
    status: 'planned',
  },
]

export default function LabPage() {
  return (
    <div className="py-16 md:py-24 lg:py-32">
      <header className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-amber">
          Interactive Playground
        </p>
        <h1 className="mt-4 font-sans text-4xl font-bold text-[var(--heading)] md:text-5xl">
          The Lab
        </h1>
        <p className="mt-4 font-serif text-lg leading-relaxed text-[var(--ink-soft)] max-w-2xl mx-auto">
          Live demos, interactive tools, and games that explore AI engineering concepts. Every item here maps to a real production problem.
        </p>
      </header>

      {/* Demos */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-accent-amber mb-6">Demos & Tools</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {DEMOS.map(demo => {
            const isLive = demo.status !== 'planned'
            const cardContent = (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <demo.icon className="h-5 w-5 text-accent-amber" />
                  {isLive ? (
                    <ArrowRight className="h-4 w-4 text-[var(--ink-faint)] transition-colors group-hover:text-accent-amber" />
                  ) : (
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Soon</span>
                  )}
                </div>
                <h3 className={`font-sans text-lg font-semibold text-[var(--heading)] transition-colors ${isLive ? 'group-hover:text-accent-amber' : ''}`}>
                  {demo.title}
                </h3>
                <p className="mt-3 flex-1 font-serif text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  {demo.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {demo.tech.map(t => (
                    <span key={t} className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--bar-track)] text-[var(--ink-faint)]">
                      {t}
                    </span>
                  ))}
                </div>
              </>
            )

            if (isLive) {
              return (
                <Link
                  key={demo.slug}
                  href={`/lab/${demo.slug}`}
                  className="group relative flex flex-col surface-card p-6 transition-colors duration-200 hover:border-accent-amber"
                >
                  {cardContent}
                </Link>
              )
            }

            // Planned demos are not links: href="#" left them focusable and
            // jumped the URL on click.
            return (
              <div
                key={demo.slug}
                className="group relative flex flex-col surface-card p-6 opacity-60 cursor-default"
              >
                {cardContent}
              </div>
            )
          })}
        </div>
      </section>

    </div>
  )
}
