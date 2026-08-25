'use client'

import { useEffect, useRef, useState } from 'react'
import { GameButton, GameSlider, GameShell, type ReadoutItem } from '@/components/games/shared'
import {
  AI,
  H,
  HUMAN,
  ORDER,
  W,
  canPlay,
  findWinLine,
  idx,
  play,
  think,
  type ThinkResult,
} from '@/lib/games/connect-four/engine'
import { rngFrom } from '@/lib/games/shared/rng'

interface GameState {
  board: Int8Array
  turn: number
  over: boolean
  lastCell: [number, number] | null
  winLine: [number, number][] | null
  nodes: number
  ms: number
  scores: (number | null)[] | null
  best: number
  message: string
}

function makeState(seed: string): GameState {
  const board = new Int8Array(W * H)
  const r = rngFrom(seed, 'connect4')
  let lastCell: [number, number] | null = null
  let message = 'You are brass and you move first.'
  if (r() < 0.5) {
    const c = ORDER[Math.floor(r() * 3)]
    const rr = play(board, c, AI)
    lastCell = [rr, c]
    message = `Engine opened on column ${c + 1}. Your move.`
  }
  return { board, turn: HUMAN, over: false, lastCell, winLine: null, nodes: 0, ms: 0, scores: null, best: 0, message }
}

export function ConnectFourGame() {
  const [seed, setSeed] = useState('1729')
  const [depth, setDepth] = useState(5)
  const [prune, setPrune] = useState(true)
  const [state, setState] = useState<GameState>(() => makeState('1729'))
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (thinkTimer.current) clearTimeout(thinkTimer.current)
    },
    []
  )

  const move = (c: number) => {
    if (state.over || state.turn !== HUMAN || !canPlay(state.board, c)) return
    const board = new Int8Array(state.board)
    const r = play(board, c, HUMAN)
    const winLine = findWinLine(board, r, c, HUMAN)
    if (winLine) {
      setState({ ...state, board, lastCell: [r, c], winLine, over: true, message: 'You win. Raise the depth.' })
      return
    }
    if (!ORDER.some((x) => canPlay(board, x))) {
      setState({ ...state, board, lastCell: [r, c], over: true, message: 'Draw.' })
      return
    }
    setState({ ...state, board, lastCell: [r, c], turn: AI, message: 'Searching…' })

    thinkTimer.current = setTimeout(() => {
      const result: ThinkResult = think(board, depth, prune)
      const after = new Int8Array(board)
      const rr = play(after, result.bestCol, AI)
      const aiLine = findWinLine(after, rr, result.bestCol, AI)
      const over = !!aiLine || !ORDER.some((x) => canPlay(after, x))
      setState((s) => ({
        ...s,
        board: after,
        turn: HUMAN,
        lastCell: [rr, result.bestCol],
        winLine: aiLine,
        over,
        nodes: result.nodes,
        ms: result.ms,
        scores: result.scores,
        best: result.bestCol,
        message: aiLine
          ? `Engine wins — it saw it ${depth} plies out.`
          : over
            ? 'Draw.'
            : `Engine played column ${result.bestCol + 1} after visiting ${result.nodes.toLocaleString()} positions.`,
      }))
    }, 20)
  }

  const resetAll = (s: string) => {
    setSeed(s)
    setState(makeState(s))
  }

  const newGame = () => {
    setState(makeState(seed))
  }

  const dropPreview = (c: number): number => {
    for (let i = H - 1; i >= 0; i--) {
      if (state.board[idx(i, c)] === 0) return i
    }
    return -1
  }

  const readoutItems: ReadoutItem[] = [
    { label: 'depth', value: String(depth), tone: 'mute' },
    { label: 'nodes searched', value: state.nodes ? state.nodes.toLocaleString() : '—', tone: 'machine' },
    { label: 'search time', value: state.ms ? `${Math.round(state.ms)} ms` : '—', tone: 'mute' },
    { label: 'pruning', value: prune ? 'on' : 'off', tone: prune ? 'machine' : 'bad' },
    {
      label: 'to move',
      value: state.over ? '—' : state.turn === HUMAN ? 'you' : 'engine',
      tone: state.turn === HUMAN ? 'human' : 'machine',
    },
  ]

  return (
    <GameShell
      eyebrow="Game 06 · Engine · measures: search"
      title="Connect Four, with the search exposed"
      lede="The game is the excuse. The readout is the point: how many positions the engine visited, what it thinks each column is worth, and what alpha-beta pruning saves you."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="Negamax with alpha-beta over a 7×6 board, moves ordered centre-outward because centre columns participate in more winning lines and good ordering is most of what makes pruning work. The static evaluation scores every four-cell window: an open three is worth a lot, a blocked one nothing. Depth is plies, not moves — depth 6 means the engine sees three of your replies. The node counter is the honest measure of what the search cost, and the same position searched with pruning off gives you the ratio for free."
    >
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          depth
          <GameSlider
            min={1}
            max={7}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            displayValue={String(depth)}
            aria-label="Search depth in plies"
          />
        </label>
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-soft)]">
          <input
            type="checkbox"
            checked={prune}
            onChange={(e) => setPrune(e.target.checked)}
            className="accent-[var(--accent-1)]"
          />
          alpha-beta pruning
        </label>
        <GameButton onClick={newGame}>New game</GameButton>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* board */}
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-4">
          <div className="mx-auto max-w-[380px]">
            {/* column buttons */}
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: W }, (_, c) => {
                const full = !canPlay(state.board, c)
                return (
                  <button
                    key={c}
                    onClick={() => move(c)}
                    onMouseEnter={() => setHoverCol(c)}
                    onMouseLeave={() => setHoverCol(null)}
                    onFocus={() => setHoverCol(c)}
                    onBlur={() => setHoverCol(null)}
                    disabled={state.over || state.turn !== HUMAN || full}
                    aria-label={`Play column ${c + 1}`}
                    className="rounded-sm py-1.5 font-mono text-xs text-[var(--ink-faint)] transition-colors hover:bg-[var(--card-bg)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ↓
                  </button>
                )
              })}
            </div>
            {/* grid */}
            <div className="mt-1.5 grid grid-cols-7 gap-1.5">
              {Array.from({ length: H * W }, (_, i) => {
                const r = Math.floor(i / W)
                const c = i % W
                const v = state.board[idx(r, c)]
                const isLast = state.lastCell?.[0] === r && state.lastCell[1] === c
                const inWinLine = state.winLine?.some(([wr, wc]) => wr === r && wc === c)
                const previewed = hoverCol === c && v === 0 && dropPreview(c) === r && state.turn === HUMAN
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-full border transition-colors"
                    style={{
                      background: v === HUMAN ? 'var(--accent-1)' : v === AI ? 'var(--accent-2)' : 'var(--panel2)',
                      borderColor: 'var(--rule)',
                      boxShadow:
                        inWinLine || isLast
                          ? '0 0 0 2px var(--ink)'
                          : previewed
                            ? 'inset 0 0 0 2px var(--accent-1)'
                            : undefined,
                      opacity: previewed ? 0.6 : 1,
                    }}
                  />
                )
              })}
            </div>
          </div>
          <p aria-live="polite" className="mt-4 font-mono text-xs text-[var(--ink-soft)]">
            {state.message}
          </p>
        </div>

        {/* column evaluations */}
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Column evaluations
          </p>
          {!state.scores ? (
            <p className="font-mono text-xs text-[var(--ink-faint)]">
              Play a move and the engine's per-column values appear here.
            </p>
          ) : (
            <div className="space-y-1.5">
              {state.scores.map((v, c) => {
                const max = Math.max(1, ...state.scores!.map((x) => Math.abs(x ?? 0)))
                return (
                  <div key={c} className="flex items-center gap-3 font-mono text-xs">
                    <span className="w-10 text-[var(--ink-faint)]">col {c + 1}</span>
                    <div className="h-3 flex-1 overflow-hidden rounded-sm bg-[var(--bar-track)]">
                      <div
                        className="h-full rounded-sm"
                        style={{
                          width: v === null ? '0%' : `${Math.min(100, (Math.abs(v) / max) * 100)}%`,
                          background: v === state.best ? 'var(--accent-2)' : 'var(--rule)',
                          opacity: v === null ? 0.3 : 1,
                        }}
                      />
                    </div>
                    <span
                      className={`w-12 text-right ${v === state.best ? 'text-[var(--accent-2)]' : 'text-[var(--ink-faint)]'}`}
                    >
                      {v === null ? 'full' : Math.abs(v) > 9000 ? 'win' : String(Math.round(v))}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
            Turn pruning off at depth 6 and watch the node count climb by an order of magnitude for exactly the same
            move.
          </p>
        </div>
      </div>
    </GameShell>
  )
}
