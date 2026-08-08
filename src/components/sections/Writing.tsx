import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Section, Container, AnimatedSection } from '@/components/common'
import { Heading, Text, Eyebrow } from '@/components/ui'
// Imported directly rather than through the barrel — that path reaches the
// article renderer and would pull KaTeX, Prism and 49 canvas figures into the
// home page's bundle.
import { ArticleCard } from '@/components/writing/ArticleCard'
import { ARTICLES, SERIES_SUBTITLE, SERIES_TITLE, SERIES_TOTALS } from '@/content/llm-atlas'

/** The three parts that best show what the series is; the rest live at /writing. */
const FEATURED_SLUGS = [
  'attention-is-all-you-need',
  'quadratic-attention',
  'what-remains-unsolved',
]

const featured = FEATURED_SLUGS.map((slug) => ARTICLES.find((a) => a.slug === slug)).filter(
  (a): a is (typeof ARTICLES)[number] => Boolean(a)
)

export function Writing() {
  return (
    <Section id="writing">
      <Container>
        <AnimatedSection animation="fadeIn">
          <Eyebrow>Blog</Eyebrow>
          <Heading as="h2" size="3xl" gradient className="text-center mb-4">
            {SERIES_TITLE}
          </Heading>
          <Text size="lg" muted className="text-center max-w-2xl mx-auto mb-3">
            {SERIES_SUBTITLE} — a {SERIES_TOTALS.parts}-part series on how language model
            architecture actually evolved, with {SERIES_TOTALS.figures} animated figures and{' '}
            {SERIES_TOTALS.sections} sections of working through the maths.
          </Text>
          <Text
            size="sm"
            muted
            className="text-center mb-12 font-mono uppercase tracking-[0.12em]"
          >
            Not tutorials. The mechanism.
          </Text>
        </AnimatedSection>

        <AnimatedSection animation="slideUp">
          <div className="grid gap-5 md:grid-cols-3">
            {featured.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fadeIn" delay={0.2}>
          <div className="mt-10 text-center">
            <Link
              href="/blog/llm-atlas"
              className="inline-flex items-center gap-2 rounded-lg border border-[var(--rule)] px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-soft)] transition-colors hover:border-accent-amber hover:text-accent-amber"
            >
              Read all {SERIES_TOTALS.parts} parts
              <ArrowRight size={13} />
            </Link>
          </div>
        </AnimatedSection>
      </Container>
    </Section>
  )
}
