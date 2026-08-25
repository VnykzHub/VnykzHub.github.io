'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GameButton } from './GameButton'
import { Readout, type ReadoutItem } from './Readout'
import './game-tokens.css'

interface GameShellProps {
  eyebrow: string
  title: string
  lede: string
  /**
   * Seed chosen by the parent. When empty, the shell rolls a fresh random one
   * once and reports it through onReseed — parents that remount on seed change
   * must pass it back so it is not regenerated every mount.
   */
  initialSeed?: string
  /** Called with the new seed whenever reseed happens or the page loads with ?seed=. */
  onReseed: (seed: string) => void
  readoutItems: ReadoutItem[]
  howItWorks: string
  children: ReactNode
}

const randomSeed = () => String(Math.random()).slice(2) + String(Date.now()).slice(-4)

/**
 * Shared editorial frame for every game: header, seed bar, instrument stage,
 * stat readout, and the "How it works" manual. Theme-aware; the game itself
 * owns everything inside the stage.
 */
export function GameShell({
  eyebrow,
  title,
  lede,
  initialSeed = '',
  onReseed,
  readoutItems,
  howItWorks,
  children,
}: GameShellProps) {
  const [seed, setSeed] = useState('')
  const [copied, setCopied] = useState(false)
  const [focused, setFocused] = useState(false)
  const seedInputRef = useRef<HTMLInputElement>(null)

  // Seed: ?seed= in the URL gives a reproducible run (share-link); the
  // parent's initialSeed is reused on remounts; only roll a random one when
  // neither exists.
  useEffect(() => {
    const urlSeed = new URLSearchParams(window.location.search).get('seed')
    const initial = urlSeed?.trim() || initialSeed.trim() || randomSeed()
    setSeed(initial)
    if (seedInputRef.current) seedInputRef.current.value = initial
    onReseed(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onReseed is game-owned; run once per mount
  }, [])

  // Focus mode: hide site chrome via the body class seam; Escape exits.
  useEffect(() => {
    if (!focused) return
    document.body.classList.add('game-focus')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.classList.remove('game-focus')
      window.removeEventListener('keydown', onKey)
    }
  }, [focused])

  const reseed = () => {
    const next = seedInputRef.current?.value.trim() || String(Date.now())
    setSeed(next)
    if (seedInputRef.current) seedInputRef.current.value = next
    onReseed(next)
  }

  const copyLink = async () => {
    const url = window.location.origin + window.location.pathname + '?seed=' + encodeURIComponent(seed)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard unavailable (permissions / http) — keep the label honest */
      setCopied(false)
    }
  }

  return (
    <div className={`mx-auto px-4 py-8 sm:px-6 ${focused ? 'max-w-none md:py-10' : 'max-w-5xl md:py-24'}`}>
      {focused ? (
        /* slim focus bar — the game is the page now */
        <div className="mb-6 flex items-center justify-between">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--g-machine)]">{title}</p>
          <GameButton size="sm" variant="ghost" onClick={() => setFocused(false)}>
            Exit focus
          </GameButton>
        </div>
      ) : (
        <>
          {/* back to the gallery */}
          <Link
            href="/games"
            className="mb-8 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)] transition-colors hover:text-[var(--accent-1)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All games
          </Link>

          {/* editorial header */}
          <header className="mb-10 flex flex-wrap items-end justify-between gap-6 border-b border-[var(--rule)] pb-8">
            <div>
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--g-machine)]">
                {eyebrow}
              </p>
              <h1 className="font-serif text-3xl font-semibold text-[var(--heading)] md:text-4xl">{title}</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--ink-soft)]">{lede}</p>
            </div>
            {/* seed bar — reproducible challenges */}
            <div className="flex items-center gap-2 font-mono text-[11px] text-[var(--ink-faint)]">
              <label htmlFor="seed-input">seed</label>
              <input
                id="seed-input"
                ref={seedInputRef}
                type="text"
                defaultValue={seed}
                spellCheck={false}
                className="w-24 rounded-sm border border-[var(--rule)] bg-[var(--panel)] px-2 py-1.5 font-mono text-[11px] text-[var(--ink)]"
              />
              <GameButton size="sm" onClick={reseed}>
                reseed
              </GameButton>
              <GameButton size="sm" onClick={copyLink}>
                {copied ? 'copied' : 'copy link'}
              </GameButton>
              <GameButton size="sm" variant="primary" onClick={() => setFocused(true)}>
                Focus
              </GameButton>
            </div>
          </header>
        </>
      )}

      {/* the instrument */}
      <div className={focused ? 'flex min-h-[calc(100vh-7rem)] flex-col justify-center' : ''}>{children}</div>

      {!focused && (
        <>
          {/* stat strip */}
          <div className="mt-10">
            <Readout items={readoutItems} />
          </div>

          {/* the manual — open by default; the fold hides it otherwise */}
          <details open className="group mt-10 border-t border-[var(--rule)] pt-5">
            <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-[0.16em] text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]">
              How it works
            </summary>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--ink-soft)]">{howItWorks}</p>
          </details>
        </>
      )}
    </div>
  )
}
