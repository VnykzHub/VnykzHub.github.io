import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import type { Article } from '@/content/atlas'
import { pad } from './format'
import { cn } from '@/utils/cn'

interface ArticleCardProps {
  article: Article
  className?: string
}

export function ArticleCard({ article, className }: ArticleCardProps) {
  return (
    <Link
      to={`/writing/${article.slug}`}
      className={cn(
        'group relative flex flex-col rounded-xl border border-[var(--card-border)] bg-[var(--card-bg)] p-6',
        'transition-colors duration-200 hover:border-accent-cyan',
        className
      )}
    >
      {/* The part number is the instrument index — mono, in the corner. */}
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-amber">
          Part {pad(article.part)}
        </span>
        <ArrowUpRight
          size={16}
          className="text-[var(--ink-faint)] transition-colors group-hover:text-accent-cyan"
        />
      </div>

      <h3 className="font-sans text-lg font-semibold leading-snug text-[var(--heading)] transition-colors group-hover:text-accent-cyan">
        {article.title}
      </h3>

      <p className="mt-3 flex-1 font-serif text-[15px] leading-relaxed text-[var(--ink-soft)]">
        {article.dek}
      </p>

      <div className="mt-5 flex items-center gap-3 border-t border-[var(--rule)] pt-3.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-faint)]">
        <span>{article.readingTime} min</span>
        <span aria-hidden>·</span>
        <span>{article.subCount} sections</span>
        {article.figureCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{article.figureCount} figures</span>
          </>
        )}
      </div>
    </Link>
  )
}
