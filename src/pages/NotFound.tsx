import { Link } from 'react-router-dom'
import { Container } from '@/components/common'
import { Eyebrow } from '@/components/ui'

export function NotFound() {
  return (
    <>
      <title>Not found — Vinayak Mathur</title>
      <meta name="robots" content="noindex" />

      <Container maxWidth="lg">
        <div className="flex min-h-[60vh] flex-col justify-center py-20">
          <Eyebrow>404</Eyebrow>
          <h1 className="font-sans text-4xl font-bold text-[var(--heading)]">
            No page at this address
          </h1>
          <p className="mt-4 max-w-lg font-serif text-lg leading-relaxed text-[var(--ink-soft)]">
            The link is either wrong or points at something that has since moved.
          </p>

          <div className="mt-8 flex flex-wrap gap-5 font-mono text-[11px] uppercase tracking-[0.14em]">
            <Link to="/" className="text-accent-amber hover:underline">
              Home
            </Link>
            <Link to="/writing" className="text-accent-amber hover:underline">
              Writing
            </Link>
          </div>
        </div>
      </Container>
    </>
  )
}
