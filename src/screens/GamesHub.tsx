import Link from 'next/link'
import {
  ArrowRight,
  Brain,
  Coins,
  Diamond,
  Fingerprint,
  Gamepad2,
  Grid3x3,
  MessageSquareText,
  Scissors,
  Swords,
  TrendingDown,
  Type,
  type LucideIcon,
} from 'lucide-react'

interface GameCardData {
  title: string
  slug: string
  tagline: string
  tech: string[]
  icon: LucideIcon
  status: 'live' | 'planned'
}

interface Category {
  id: string
  label: string
  note: string
  games: GameCardData[]
}

const CATEGORIES: Category[] = [
  {
    id: 'static',
    label: 'Static',
    note: 'odds and information, before anything moves',
    games: [
      {
        title: 'Blackjack Trainer',
        slug: 'blackjack-trainer',
        tagline: 'Basic strategy and true-count drilling. Every deviation you make from the chart is priced — and the coach tells you.',
        tech: ['React', 'TypeScript', 'Reducer'],
        icon: Diamond,
        status: 'live',
      },
      {
        title: 'Tokenizer Golf',
        slug: 'tokenizer-golf',
        tagline: 'You price LLM calls in tokens but estimate them in characters. Guess counts, cut prompts under par, watch two schemes disagree.',
        tech: ['TypeScript', 'BPE', 'SentencePiece'],
        icon: Scissors,
        status: 'live',
      },
      {
        title: 'Next-Token Duel',
        slug: 'next-token-duel',
        tagline: 'Predict the next token of a held-out passage, scored in bits of surprisal. Perplexity stops being an abstraction about four tokens in.',
        tech: ['TypeScript', 'Entropy'],
        icon: MessageSquareText,
        status: 'live',
      },
      {
        title: 'Kelly Run',
        slug: 'kelly-run',
        tagline: 'Twenty flips of a biased coin. The bias is never told to you — infer it from outcomes while you bet against a full-Kelly bot.',
        tech: ['Bayesian', 'Log-scale', 'SVG'],
        icon: Coins,
        status: 'live',
      },
    ],
  },
  {
    id: 'engine',
    label: 'Engine',
    note: 'the machinery, with the covers off',
    games: [
      {
        title: 'Descent Golf',
        slug: 'descent-golf',
        tagline: 'Four loss surfaces, each a specific pathology. Pick an optimizer and a learning rate, reach the target under par.',
        tech: ['SGD', 'Momentum', 'Adam'],
        icon: TrendingDown,
        status: 'live',
      },
      {
        title: 'Connect Four',
        slug: 'connect-four',
        tagline: 'The game is the excuse. Node counts, per-column evaluations, and what alpha-beta pruning actually saves you.',
        tech: ['Negamax', 'Alpha-Beta'],
        icon: Grid3x3,
        status: 'live',
      },
      {
        title: 'Entropy Wordle',
        slug: 'entropy-wordle',
        tagline: 'The usual game, priced in bits. Every guess shows how much information you extracted — and what the optimal guess would have gotten.',
        tech: ['Information Theory', 'Solver'],
        icon: Type,
        status: 'live',
      },
    ],
  },
  {
    id: 'ledger',
    label: 'Ledger',
    note: 'the truth, written down before you asked',
    games: [
      {
        title: 'Interrogation Room',
        slug: 'interrogation-room',
        tagline: 'A deploy key left the server room at 02:14. Eight questions, one accusation. Suspects can lie — but they cannot invent facts.',
        tech: ['Deduction', 'Truth Ledger'],
        icon: Fingerprint,
        status: 'live',
      },
    ],
  },
  {
    id: 'arcade',
    label: 'Arcade',
    note: 'pure reflex, zero theory',
    games: [
      {
        title: 'Kindergarten Chaos',
        slug: 'kindergarten-chaos',
        tagline: 'Survive waves of kindergartners in this PixiJS arcade game. Push, dodge, sprint — and don’t get dogpiled.',
        tech: ['PixiJS', 'Canvas'],
        icon: Swords,
        status: 'live',
      },
    ],
  },
]

const PLANNED: GameCardData[] = [
  {
    title: 'Context Window Tetris',
    slug: 'context-tetris',
    tagline: 'Blocks fall — documents, chat history, tool outputs. Summarize, chunk, and evict to prevent context overflow.',
    tech: ['React', 'Framer Motion'],
    icon: Gamepad2,
    status: 'planned',
  },
  {
    title: 'Prompt Telephone',
    slug: 'prompt-telephone',
    tagline: 'A prompt transforms through multiple voices and models. Guess the original from the final output.',
    tech: ['React', 'LLM API'],
    icon: Brain,
    status: 'planned',
  },
]

function GameCard({ game }: { game: GameCardData }) {
  const live = game.status === 'live'
  const inner = (
    <>
      <div className="mb-4 flex items-center justify-between">
        <game.icon className="h-5 w-5 text-[var(--accent-2)]" />
        {live ? (
          <ArrowRight className="h-4 w-4 text-[var(--ink-faint)] transition-colors group-hover:text-[var(--accent-2)]" />
        ) : (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">Soon</span>
        )}
      </div>
      <h3
        className={`font-sans text-lg font-semibold text-[var(--heading)] transition-colors ${
          live ? 'group-hover:text-[var(--accent-2)]' : ''
        }`}
      >
        {game.title}
      </h3>
      <p className="mt-3 flex-1 font-serif text-[15px] leading-relaxed text-[var(--ink-soft)]">{game.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {game.tech.map((t) => (
          <span
            key={t}
            className="rounded-full bg-[var(--bar-track)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-faint)]"
          >
            {t}
          </span>
        ))}
      </div>
    </>
  )

  if (live) {
    return (
      <Link
        href={`/games/${game.slug}`}
        className="group relative flex flex-col surface-card p-6 transition-colors duration-200 hover:border-[var(--accent-2)]"
      >
        {inner}
      </Link>
    )
  }

  // Planned games are not links: href="#" left them focusable and jumped the URL on click.
  return <div className="group relative flex flex-col surface-card p-6 opacity-60 cursor-default">{inner}</div>
}

export function GamesHub() {
  return (
    <div className="py-16 md:py-24 lg:py-32">
      <header className="mx-auto max-w-4xl px-4 text-center sm:px-6">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-2)]">The Games</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-[var(--heading)] md:text-5xl">
          Games that are actually instruments
        </h1>
        <p className="mx-auto mt-4 max-w-2xl font-serif text-lg leading-relaxed text-[var(--ink-soft)]">
          Every one of these measures something you probably think you already understand. Brass is you, patina is the
          machine. Everything runs in your browser — no server, no inference calls.
        </p>
      </header>

      {CATEGORIES.map((cat) => (
        <section key={cat.id} className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-3">
            <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-2)]">
              {cat.label}
              <span className="ml-3 text-[var(--ink-faint)]">× {cat.games.length}</span>
            </h2>
            <p className="font-mono text-[11px] text-[var(--ink-faint)]">{cat.note}</p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {cat.games.map((game) => (
              <GameCard key={game.slug} game={game} />
            ))}
          </div>
        </section>
      ))}

      {/* In the works */}
      <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-3">
          <h2 className="font-mono text-xs uppercase tracking-[0.18em] text-[var(--ink-faint)]">
            In the works
            <span className="ml-3 text-[var(--ink-faint)]">× {PLANNED.length}</span>
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {PLANNED.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>
    </div>
  )
}
