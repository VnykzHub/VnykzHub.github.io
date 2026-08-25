import type { Metadata } from 'next'
import KindergartenChaos from './GameClient'

export const metadata: Metadata = {
  title: 'Kindergarten Chaos — Games',
  description: 'Survive waves of kindergartners in this PixiJS arcade game. Push, dodge, and run!',
}

export default function Page() {
  return (
    <div className="py-16 md:py-24 lg:py-32">
      <header className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-accent-patina">Games / Arcade</p>
        <h1 className="mt-4 font-sans text-4xl font-bold text-[var(--heading)] md:text-5xl">
          Kindergarten Chaos
        </h1>
        <p className="mt-4 font-serif text-lg leading-relaxed text-[var(--ink-soft)] max-w-2xl mx-auto">
          Survive waves of kindergartners. Push them back, dodge their attacks, and don&apos;t get dogpiled.
        </p>
      </header>
      <section className="mx-auto mt-16 max-w-4xl px-4 sm:px-6">
        <KindergartenChaos />
      </section>
    </div>
  )
}
