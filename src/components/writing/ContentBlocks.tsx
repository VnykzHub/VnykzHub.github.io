import { Fragment, ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import { Check, Copy } from 'lucide-react'
import { ANIMS } from '@/content/llm-atlas/anims'
import type { AtlasCode, AtlasEquation } from '@/content/llm-atlas/types'
import { cn } from '@/utils/cn'

/* ────────────────────────────────────────────────────────────────
   Prose — the source bodies are markdown-lite: blank-line paragraphs
   with **bold** and *italic* and nothing else. Rendering to React
   elements rather than HTML strings keeps it injection-proof.
   ──────────────────────────────────────────────────────────────── */

const INLINE = /(\*\*[^*]+\*\*|\*[^*]+\*)/g

function renderInline(text: string): ReactNode[] {
  return text.split(INLINE).map((chunk, i) => {
    if (chunk.startsWith('**') && chunk.endsWith('**')) {
      return <strong key={i}>{chunk.slice(2, -2)}</strong>
    }
    if (chunk.startsWith('*') && chunk.endsWith('*')) {
      return <em key={i}>{chunk.slice(1, -1)}</em>
    }
    return <Fragment key={i}>{chunk}</Fragment>
  })
}

interface ProseProps {
  children: string
  /** Adds the amber drop cap to the first paragraph */
  dropCap?: boolean
  className?: string
}

export function Prose({ children, dropCap, className }: ProseProps) {
  const paragraphs = useMemo(
    () =>
      children
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .filter(Boolean),
    [children]
  )

  return (
    <div className={cn('prose-article', dropCap && 'prose-dropcap', className)}>
      {paragraphs.map((p, i) => (
        <p key={i}>{renderInline(p)}</p>
      ))}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Copy button — shared by equations and code
   ──────────────────────────────────────────────────────────────── */

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value).then(
          () => setCopied(true),
          () => {
            /* clipboard blocked — leave the button in its resting state */
          }
        )
      }}
      aria-label={label}
      className={cn(
        'flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]',
        'rounded px-2 py-1 border border-[var(--rule)] transition-colors',
        copied
          ? 'text-accent-rust border-accent-rust'
          : 'text-[var(--ink-faint)] hover:text-accent-amber hover:border-accent-amber'
      )}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

/* ────────────────────────────────────────────────────────────────
   Math — KaTeX, rendered once per equation
   ──────────────────────────────────────────────────────────────── */

export function MathBlock({ eqs }: { eqs: AtlasEquation[] }) {
  return (
    <div className="article-eq space-y-4">
      {eqs.map((eq, i) => (
        <Equation key={i} eq={eq} />
      ))}
    </div>
  )
}

function Equation({ eq }: { eq: AtlasEquation }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(eq.t, {
        displayMode: true,
        throwOnError: false,
        output: 'html',
      })
    } catch {
      return ''
    }
  }, [eq.t])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-accent-amber">
          {eq.l}
        </span>
        <CopyButton value={`$$${eq.t}$$`} label={`Copy TeX for ${eq.l}`} />
      </div>
      {html ? (
        // KaTeX output is generated locally from trusted content in
        // src/content/atlas, never from user input.
        <div dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <code className="font-mono text-xs text-[var(--ink-soft)]">{eq.t}</code>
      )}
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Code
   ──────────────────────────────────────────────────────────────── */

export function CodeBlock({ code }: { code: AtlasCode }) {
  const html = useMemo(() => {
    const grammar = Prism.languages[code.lang]
    return grammar ? Prism.highlight(code.text, grammar, code.lang) : null
  }, [code])

  return (
    <div className="article-code">
      <div className="flex items-center justify-between border-b border-[var(--code-border)] bg-[var(--panel2)] px-3.5 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
          {code.lang}
        </span>
        <CopyButton value={code.text} label="Copy code" />
      </div>
      <pre>
        {html ? (
          // Prism output derived from trusted content in src/content/atlas.
          <code dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{code.text}</code>
        )}
      </pre>
    </div>
  )
}

/* ────────────────────────────────────────────────────────────────
   Figure — canvas animation, ported wholesale from the original Atlas.
   Only runs while on screen; honours prefers-reduced-motion by
   painting a single frame.
   ──────────────────────────────────────────────────────────────── */

/** Below this width the original animations start colliding; scale instead. */
const MIN_DRAW_WIDTH = 540

export function AtlasFigure({ anim, label }: { anim: string; label?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const draw = ANIMS[anim]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { rootMargin: '120px' }
    )
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !draw) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!visible && !still) return

    let frame = 0
    let start: number | null = null

    const paint = (elapsed: number) => {
      const dpr = window.devicePixelRatio || 1
      const cssW = canvas.offsetWidth
      const cssH = canvas.offsetHeight
      if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = cssW * dpr
        canvas.height = cssH * dpr
      }
      ctx.save()
      ctx.scale(dpr, dpr)
      // Narrow viewports draw at MIN_DRAW_WIDTH then scale down, so the
      // fixed pixel geometry inside each animation stays legible.
      let vw = cssW
      let vh = cssH
      if (cssW > 0 && cssW < MIN_DRAW_WIDTH) {
        const s = cssW / MIN_DRAW_WIDTH
        ctx.scale(s, s)
        vw = MIN_DRAW_WIDTH
        vh = cssH / s
      }
      try {
        draw(ctx, vw, vh, elapsed)
      } catch {
        /* a broken figure must not take the article down */
      }
      ctx.restore()
    }

    if (still) {
      paint(0)
      return
    }

    const loop = (ts: number) => {
      if (start === null) start = ts
      paint((ts - start) / 1000)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [draw, visible])

  if (!draw) return null

  return (
    <figure className="article-figure">
      {label && <figcaption className="article-figure-label">{label}</figcaption>}
      <canvas ref={canvasRef} role="img" aria-label={label ?? 'Diagram'} />
    </figure>
  )
}
