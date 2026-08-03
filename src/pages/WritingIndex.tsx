import { Container } from '@/components/common'
import { Eyebrow } from '@/components/ui'
// Imported directly rather than through the barrel — that path reaches the
// article renderer and would pull KaTeX and Prism into this chunk.
import { ArticleCard } from '@/components/writing/ArticleCard'
import { formatDate } from '@/components/writing/format'
import {
  ARTICLES,
  SERIES_PUBLISHED,
  SERIES_SUBTITLE,
  SERIES_TITLE,
  SERIES_TOTALS,
} from '@/content/llm-atlas'
import { ATLAS_GLOSSARY, ATLAS_PAPERS } from '@/content/llm-atlas/atlas.refs'

const paperCount = ATLAS_PAPERS.reduce((n, c) => n + c.papers.length, 0)

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="font-mono text-2xl font-medium text-[var(--heading)]">{value}</div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        {label}
      </div>
    </div>
  )
}

export function WritingIndex() {
  return (
    <>
      <title>Blog — LLM Atlas | Vinayak Mathur</title>
      <meta
        name="description"
        content="LLM Atlas: a 14-part series on how language model architecture evolved from 2017 to 2026 — attention variants, efficiency lineages, tokenizers, serving, and scaling laws."
      />

      <Container maxWidth="7xl">
        {/* ── Series masthead ─────────────────────────────────── */}
        <header className="border-b border-[var(--rule)] py-16 md:py-24">
          <div className="max-w-3xl">
            <Eyebrow>Blog</Eyebrow>

            <h1 className="font-sans text-[2.6rem] font-bold leading-[1.05] text-[var(--heading)] sm:text-[3.4rem]">
              <span className="text-gradient">{SERIES_TITLE}</span>
            </h1>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.2em] text-accent-amber">
              {SERIES_SUBTITLE}
            </p>

            <p className="mt-7 font-serif text-lg leading-relaxed text-[var(--ink-soft)]">
              Every architectural decision that took language models from the 2017
              Transformer to what runs in production today — the maths, the trade-offs, and
              the ideas that did not survive contact with a GPU budget. Written for people
              who want the mechanism, not the metaphor.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-10">
              <Stat value={SERIES_TOTALS.parts} label="Parts" />
              <Stat value={SERIES_TOTALS.sections} label="Sections" />
              <Stat value={SERIES_TOTALS.figures} label="Animated figures" />
              <Stat value={paperCount} label="Papers cited" />
            </div>

            <p className="mt-8 font-mono text-[11px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
              Published {formatDate(SERIES_PUBLISHED)} · about {SERIES_TOTALS.minutes} minutes
              end to end
            </p>
          </div>
        </header>

        {/* ── The series ──────────────────────────────────────── */}
        <section className="py-16 md:py-20" aria-labelledby="series-heading">
          <Eyebrow>The series</Eyebrow>
          <h2 id="series-heading" className="sr-only">
            Articles in the series
          </h2>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {ARTICLES.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </section>

        {/* ── Bibliography ────────────────────────────────────── */}
        <section
          className="border-t border-[var(--rule)] py-16 md:py-20"
          aria-labelledby="refs-heading"
        >
          <Eyebrow>References</Eyebrow>
          <h2
            id="refs-heading"
            className="font-sans text-2xl font-semibold text-[var(--heading)]"
          >
            The papers behind the series
          </h2>
          <p className="mt-3 max-w-2xl font-serif text-[var(--ink-soft)]">
            {paperCount} papers, grouped by what they changed.
          </p>

          <div className="mt-10 grid gap-x-10 gap-y-10 md:grid-cols-2">
            {ATLAS_PAPERS.map((cat) => (
              <div key={cat.label}>
                <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.16em] text-accent-amber">
                  {cat.label}
                </h3>
                <ul className="space-y-3">
                  {cat.papers.map((paper) => (
                    <li
                      key={paper.t}
                      className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-4"
                    >
                      <div className="font-mono text-[11px] text-[var(--ink-faint)]">
                        {paper.a}
                      </div>
                      <div className="mt-1 font-sans text-sm font-semibold text-[var(--heading)]">
                        {paper.url ? (
                          <a
                            href={paper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-accent-amber"
                          >
                            {paper.t}
                          </a>
                        ) : (
                          paper.t
                        )}
                      </div>
                      <div className="mt-0.5 font-mono text-[10px] text-accent-patina">
                        {paper.v}
                      </div>
                      <p className="mt-2 font-serif text-[14px] leading-relaxed text-[var(--ink-soft)]">
                        {paper.d}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Glossary ────────────────────────────────────────── */}
        <section
          className="border-t border-[var(--rule)] py-16 md:py-20"
          aria-labelledby="glossary-heading"
        >
          <Eyebrow>Glossary</Eyebrow>
          <h2
            id="glossary-heading"
            className="font-sans text-2xl font-semibold text-[var(--heading)]"
          >
            Terms used throughout
          </h2>

          <dl className="mt-8 grid gap-5 md:grid-cols-2">
            {ATLAS_GLOSSARY.map((entry) => (
              <div
                key={entry.term}
                className="rounded-lg border border-[var(--card-border)] bg-[var(--card-bg)] p-5"
              >
                <dt className="font-mono text-xs uppercase tracking-[0.12em] text-accent-amber">
                  {entry.term}
                </dt>
                <dd className="mt-2 font-serif text-[15px] leading-relaxed text-[var(--ink-soft)]">
                  {entry.def}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      </Container>
    </>
  )
}
