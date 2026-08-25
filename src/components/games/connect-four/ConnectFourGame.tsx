'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  GameButton,
  GameSlider,
  GameShell,
  SegmentedControl,
  type ReadoutItem,
} from '@/components/games/shared'
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

type Mode = 'ai' | '2p'

const MODES = [
  { value: 'ai', label: 'Vs engine' },
  { value: '2p', label: '2 players' },
] as const

const PLAYER_LABEL = ['—', 'brass', 'patina']
const PLAYER_COLOR = ['var(--rule)', 'var(--accent-1)', 'var(--accent-2)']

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

function makeState(seed: string, mode: Mode): GameState {
  const board = new Int8Array(W * H)
  const r = rngFrom(seed, 'connect4')
  let lastCell: [number, number] | null = null
  let message = 'You are brass — click any column to drop your disc.'
  if (mode === 'ai' && r() < 0.5) {
    const c = ORDER[Math.floor(r() * 3)]
    const rr = play(board, c, AI)
    lastCell = [rr, c]
    message = `Engine opened on column ${c + 1}. Click a column to drop your disc.`
  }
  return { board, turn: HUMAN, over: false, lastCell, winLine: null, nodes: 0, ms: 0, scores: null, best: 0, message }
}

export function ConnectFourGame() {
  const [seed, setSeed] = useState('')
  const [mode, setMode] = useState<Mode>('ai')
  const [depth, setDepth] = useState(5)
  const [prune, setPrune] = useState(true)
  const [state, setState] = useState<GameState>(() => makeState('', 'ai'))
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const thinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (thinkTimer.current) clearTimeout(thinkTimer.current)
    },
    []
  )

  const startEngineTurn = (board: Int8Array) => {
    setState((s) => ({ ...s, message: 'Engine is searching…' }))
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
            : `Engine played column ${result.bestCol + 1} after visiting ${result.nodes.toLocaleString()} positions. Click a column to drop.`,
      }))
    }, 20)
  }

  const move = (c: number) => {
    if (state.over || !canPlay(state.board, c)) return
    if (mode === 'ai' && state.turn !== HUMAN) return

    const player = state.turn
    const board = new Int8Array(state.board)
    const r = play(board, c, player)
    const winLine = findWinLine(board, r, c, player)

    if (winLine) {
      setState({
        ...state,
        board,
        lastCell: [r, c],
        winLine,
        over: true,
        message:
          mode === '2p'
            ? `${PLAYER_LABEL[player].toUpperCase()} wins. New game for a rematch.`
            : 'You win. Raise the depth.',
      })
      return
    }
    if (!ORDER.some((x) => canPlay(board, x))) {
      setState({ ...state, board, lastCell: [r, c], over: true, message: 'Draw.' })
      return
    }

    if (mode === '2p') {
      const next = player === HUMAN ? AI : HUMAN
      setState({
        ...state,
        board,
        lastCell: [r, c],
        turn: next,
        message: `${PLAYER_LABEL[next].toUpperCase()}'s move — click a column to drop.`,
      })
      return
    }

    setState({ ...state, board, lastCell: [r, c], turn: AI })
    startEngineTurn(board)
  }

  const resetAll = (s: string) => {
    setSeed(s)
    setState(makeState(s, mode))
  }

  const newGame = () => setState(makeState(seed, mode))

  const switchMode = (m: Mode) => {
    if (thinkTimer.current) clearTimeout(thinkTimer.current)
    setMode(m)
    setState(makeState(seed, m))
  }

  const dropPreview = (c: number): number => {
    for (let i = H - 1; i >= 0; i--) {
      if (state.board[idx(i, c)] === 0) return i
    }
    return -1
  }

  const turnLabel = state.over ? '—' : mode === '2p' ? PLAYER_LABEL[state.turn] : state.turn === HUMAN ? 'you' : 'engine'

  const readoutItems: ReadoutItem[] = [
    { label: 'mode', value: mode === 'ai' ? 'vs engine' : '2 players', tone: 'mute' },
    ...(mode === 'ai'
      ? ([
          { label: 'depth', value: String(depth), tone: 'mute' as const },
          { label: 'nodes searched', value: state.nodes ? state.nodes.toLocaleString() : '—', tone: 'machine' as const },
          { label: 'search time', value: state.ms ? `${Math.round(state.ms)} ms` : '—', tone: 'mute' as const },
          { label: 'pruning', value: prune ? 'on' : 'off', tone: prune ? ('machine' as const) : ('bad' as const) },
        ] as ReadoutItem[])
      : []),
    { label: 'to move', value: turnLabel, tone: state.turn === HUMAN ? 'human' : 'machine' },
  ]

  return (
    <GameShell
      eyebrow="Game 06 · Engine · measures: search"
      title="Connect Four, with the search exposed"
      lede="The game is the excuse. The readout is the point: how many positions the engine visited, what it thinks each column is worth, and what alpha-beta pruning saves you."
      onReseed={resetAll}
      readoutItems={readoutItems}
      howItWorks="Negamax with alpha-beta over a 7×6 board, moves ordered centre-outward because centre columns participate in more winning lines and good ordering is most of what makes pruning work. The static evaluation scores every four-cell window: an open three is worth a lot, a blocked one nothing. Depth is plies, not moves — depth 6 means the engine sees three of your replies. The node counter is the honest measure of what the search cost, and the same position searched with pruning off gives you the ratio for free. Two-player mode skips the engine entirely — same board, no search."
    >
      <div className="flex flex-wrap items-center gap-4">
        <SegmentedControl<Mode> options={[...MODES]} value={mode} onChange={switchMode} label="Game mode" />
        {mode === 'ai' && (
          <>
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
          </>
        )}
        <GameButton onClick={newGame}>New game</GameButton>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {/* board — whole columns are the drop targets */}
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-4">
          <p aria-live="polite" className="mb-3 font-mono text-xs text-[var(--ink-soft)]">
            {state.message}
          </p>
          <div className="mx-auto max-w-[420px]">
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: W }, (_, c) => {
                const full = !canPlay(state.board, c)
                const mine = !state.over && !full && (mode === '2p' || state.turn === HUMAN)
                const previewRow = dropPreview(c)
                return (
                  <button
                    key={c}
                    onClick={() => move(c)}
                    onMouseEnter={() => setHoverCol(c)}
                    onMouseLeave={() => setHoverCol(null)}
                    onFocus={() => setHoverCol(c)}
                    onBlur={() => setHoverCol(null)}
                    disabled={!mine}
                    aria-label={`Drop a disc in column ${c + 1}`}
                    className={`group/col flex flex-col gap-1.5 rounded-md p-1 transition-colors ${
                      hoverCol === c && mine ? 'bg-[var(--card-bg)]' : ''
                    } ${full ? 'opacity-50' : ''} disabled:cursor-default`}
                  >
                    {/* drop slot — the coin appears here on hover/focus */}
                    <span
                      className="flex h-7 items-center justify-center rounded-full border transition-colors"
                      style={{
                        borderColor: hoverCol === c && mine ? PLAYER_COLOR[state.turn] : 'var(--rule)',
                        background: hoverCol === c && mine ? PLAYER_COLOR[state.turn] : 'transparent',
                      }}
                    >
                      <ChevronDown
                        className="h-3.5 w-3.5 transition-opacity"
                        style={{ color: 'var(--ink-faint)', opacity: hoverCol === c && mine ? 0 : 1 }}
                      />
                    </span>
                    {/* cells */}
                    {Array.from({ length: H }, (_, r) => {
                      const v = state.board[idx(r, c)]
                      const isLast = state.lastCell?.[0] === r && state.lastCell[1] === c
                      const inWinLine = state.winLine?.some(([wr, wc]) => wr === r && wc === c)
                      const previewed = hoverCol === c && mine && previewRow === r && v === 0
                      return (
                        <span
                          key={r}
                          className="aspect-square rounded-full border transition-colors"
                          style={{
                            background: v === HUMAN ? 'var(--accent-1)' : v === AI ? 'var(--accent-2)' : 'var(--panel2)',
                            borderColor: 'var(--rule)',
                            boxShadow: inWinLine
                              ? '0 0 0 2px var(--ink)'
                              : isLast
                                ? '0 0 0 2px var(--ink)'
                                : previewed
                                  ? `inset 0 0 0 2px ${PLAYER_COLOR[state.turn]}`
                                  : undefined,
                            opacity: previewed ? 0.55 : 1,
                          }}
                        />
                      )
                    })}
                  </button>
                )
              })}
            </div>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--ink-faint)]">
            {mode === '2p' ? 'brass goes first · click any column to drop' : 'brass = you · click any column to drop'}
          </p>
        </div>

        {/* column evaluations */}
        <div className="rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-5">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
            Column evaluations
          </p>
          {mode === '2p' ? (
            <p className="font-mono text-xs leading-relaxed text-[var(--ink-faint)]">
              No engine in two-player mode — no search, no evaluations. The readout keeps score of who moves next.
            </p>
          ) : !state.scores ? (
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
          {mode === 'ai' && (
            <p className="mt-4 font-mono text-[11px] leading-relaxed text-[var(--ink-faint)]">
              Turn pruning off at depth 6 and watch the node count climb by an order of magnitude for exactly the same
              move.
            </p>
          )}
        </div>
      </div>
    </GameShell>
  )
}
