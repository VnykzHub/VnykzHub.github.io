'use client'

import { useState, FormEvent } from 'react'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'already_subscribed' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setStatus('loading')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.success) {
        setEmail('')
        setStatus('success')
      } else if (data.message === 'already_subscribed') {
        setStatus('already_subscribed')
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <section id="newsletter" className="py-16 md:py-24 lg:py-32 transition-colors duration-400 bg-[var(--panel)]/20">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="font-mono text-xs tracking-[0.18em] uppercase text-accent-amber mb-4">
          Newsletter
        </div>
        <h2 className="font-sans text-4xl font-bold text-[var(--heading)] md:text-5xl mb-4">
          The AI Engineering Digest
        </h2>
        <p className="font-serif text-lg text-[var(--ink-soft)] mb-8">
          Weekly curated insights on LLMs, RAG, agents, and production AI systems. No fluff, just signal.
        </p>

        {status === 'success' ? (
          <p className="font-serif text-lg text-accent-patina">
            Thanks for subscribing. Check your inbox.
          </p>
        ) : status === 'already_subscribed' ? (
          <p className="font-serif text-lg text-accent-amber">
            You're already on the list.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === 'loading'}
              className="flex-1 px-4 py-3 rounded-lg bg-[var(--panel)] border border-[var(--panel-border)] text-[var(--ink)] font-serif placeholder:text-[var(--ink-faint)] focus:outline-none focus:border-accent-amber transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === 'loading'}
              className="px-6 py-3 rounded-lg bg-accent-amber text-[var(--btn-ink)] font-medium hover:shadow-[0_0_20px_rgba(240,184,76,0.45)] hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading' ? '...' : 'Subscribe'}
            </button>
          </form>
        )}

        {status === 'error' && (
          <p className="mt-4 font-serif text-sm text-accent-rust">
            Something went wrong. Please try again.
          </p>
        )}

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          No spam. Unsubscribe anytime. One email per week.
        </p>
      </div>
    </section>
  )
}
