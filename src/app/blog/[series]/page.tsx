import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getSeries, readableSeries } from '@/content/series'
import { ArticleCard } from '@/components/writing/ArticleCard'

interface Props { params: Promise<{ series: string }> }

export async function generateStaticParams() {
  return readableSeries().map(s => ({ series: s.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { series: seriesId } = await params
  const series = getSeries(seriesId)
  if (!series) return { title: 'Not Found' }
  return {
    title: `${series.title} — ${series.subtitle}`,
    description: series.dek,
  }
}

export default async function SeriesPage({ params }: Props) {
  const { series: seriesId } = await params
  const series = getSeries(seriesId)
  if (!series || series.articles.length === 0) notFound()

  return (
    <div className="py-16 md:py-24 lg:py-32">
      <header className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-amber">
          {series.articles.length}-part series
        </p>
        <h1 className="mt-4 font-sans text-4xl font-bold text-[var(--heading)] md:text-5xl">
          {series.title}
        </h1>
        <p className="mt-4 font-serif text-lg leading-relaxed text-[var(--ink-soft)]">
          {series.subtitle}
        </p>
        <p className="mt-3 max-w-2xl mx-auto font-serif text-[15px] leading-relaxed text-[var(--ink-soft)]">
          {series.dek}
        </p>
      </header>

      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="grid gap-5 md:grid-cols-3">
          {series.articles.map(article => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  )
}
