'use client'

import { useEffect, useRef, useState } from 'react'
import { CalibratedGauge, GameButton, GameSelect, GameSlider, GameShell, type ReadoutItem } from '@/components/games/shared'
import { LEVELS, freshOptState, stepFor, type OptimizerId } from '@/lib/games/descent-golf/surfaces'
import { rngFrom } from '@/lib/games/shared/rng'
import { Heatmap } from './Heatmap'

interface DescentState {
  level: number
  opt: OptimizerId
  pos: [number, number]
  path: [number, number][]
  step: number
  loss: number
  solved: boolean
  running: boolean
  diverged: boolean
  optState: ReturnType<typeof freshOptState>
  message: string
}

function makeState(level: number, opt: OptimizerId, seed: string): DescentState {
  const L = LEVELS[level]
  const r = rngFrom(seed, 'descent')
  const jitter = (r() - 0.5) * 0.25
  const start: [number, number] = [L.start[0] + jitter, L.start[1] - jitter]
  return {
    level,
    opt,
    pos: start,
    path: [start],
    step: 0,
    loss: L.f(start[0], start[1]),
    solved: false,
    running: false,
    diverged: false,
    optState: freshOptState(start[0], start[1]),
    message: 'Start at the marker. Reach the target loss before the step budget runs out.',
  }
}

export function DescentGame() {
  const [seed, setSeed] = useState('1729')
  const [level, setLevel] = useState(0)
  const [opt, setOpt] = useState<OptimizerId>('sgd')
  const [lrExp, setLrExp] = useState(-20)
  const [state, setState] = useState<DescentState>(() => makeState(0, 'sgd', '1729'))
  const rafRef = useRef<number | null>(null)

  const L = LEVELS[level]
  const lr = Math.pow(10, lrExp / 10)

  const stepOnceFor = (s: DescentState): DescentState => {
    const lvl = LEVELS[s.level]
    if (s.solved || s.diverged || s.step >= lvl.budget) return s
    const [gx, gy] = lvl.g(s.pos[0], s.pos[1])
    const nextOpt = stepFor(s.opt)(s.optState, lr, gx, gy)
    const pos: [number, number] = [nextOpt.x, nextOpt.y]
    if (!isFinite(pos[0]) || !isFinite(pos[1]) || Math.abs(pos[0]) > 1e4 || Math.abs(pos[1]) > 1e4) {
      return {
        ...s,
        running: false,
        diverged: true,
        message: 'Diverged. The step size is larger than the curvature can absorb — halve it, or switch optimizer.',
      }
    }
    const loss = lvl.f(pos[0], pos[1])
    const step = s.step + 1
    const solved = loss <= lvl.target
    const done = solved || step >= lvl.budget
    return {
      ...s,
      optState: nextOpt,
      pos,
      path: [...s.path, pos],
      step,
      loss,
      solved,
      running: !done,
      message: solved
        ? `Solved in ${step} steps. Par is ${lvl.par}${step <= lvl.par ? ' — under par.' : ` — ${step - lvl.par} over.`}`
        : done
          ? `Out of budget at ${lvl.budget} steps. Still descending — just not fast enough.`
          : 'Descending…',
    }
  }

  const run = () => {
    if (state.solved || state.running) return
    const started = { ...state, running: true, message: 'Descending…' }
    setState(started)
    let cur = started
    const tick = () => {
      for (let k = 0; k < 3 && cur.running; k++) {
        const next = stepOnceFor(cur)
        if (next === cur) break
        cur = next
      }
      setState(cur)
      if (cur.running) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  const doStep = () => setState((s) => (s.running ? s : stepOnceFor(s)))
  const restart = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setState(makeState(level, opt, seed))
  }
  const reseed = (s: string) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setSeed(s)
    setState(makeState(level, opt, s))
  }

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
  }, [])

  // New surface or optimizer → fresh start at the same seed.
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    setState(makeState(level, opt, seed))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, opt])

  const readoutItems: ReadoutItem[] = [
    { label: 'steps', value: `${state.step}/${L.budget}`, tone: 'human' },
    { label: 'par', value: String(L.par), tone: 'machine' },
    {
      label: 'loss',
      value: isFinite(state.loss) ? state.loss.toExponential(2) : 'diverged',
      tone: isFinite(state.loss) ? 'mute' : 'bad',
    },
    { label: 'lr', value: lr.toExponential(1), tone: 'mute' },
    {
      label: 'status',
      value: state.diverged ? 'diverged' : state.solved ? 'solved' : state.step ? 'running' : 'ready',
      tone: state.solved ? 'machine' : state.diverged ? 'bad' : 'mute',
    },
  ]

  return (
    <GameShell
      eyebrow="Game 05 · Engine · measures: optimizers"
      title="Descent Golf"
      lede="Four loss surfaces, each a specific pathology: a ravine, a curved valley, a saddle, and a bumpy basin. Pick an optimizer and a learning rate, then reach the target in as few steps as you can."
      onReseed={reseed}
      readoutItems={readoutItems}
      howItWorks="Each surface has an analytic gradient, so there is no autograd and no library. SGD takes x ← x − lr·g. Momentum accumulates v ← 0.9v + g. Adam keeps the two moment estimates with bias correction, which is why it walks straight down the ravine at a learning rate that makes plain SGD oscillate out of the frame. The point of the ravine level is the condition number: the two curvatures differ by 25×, and every optimizer's behaviour on it follows from that one number."
    >
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          surface
          <GameSelect aria-label="Loss surface" value={level} onChange={(e) => setLevel(Number(e.target.value))}>
            {LEVELS.map((lvl, i) => (
              <option key={i} value={i}>
                {lvl.name}
              </option>
            ))}
          </GameSelect>
        </label>
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          optimizer
          <GameSelect aria-label="Optimizer" value={opt} onChange={(e) => setOpt(e.target.value as OptimizerId)}>
            <option value="sgd">SGD</option>
            <option value="mom">Momentum 0.9</option>
            <option value="adam">Adam</option>
          </GameSelect>
        </label>
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          lr
          <GameSlider
            min={-40}
            max={0}
            value={lrExp}
            onChange={(e) => setLrExp(Number(e.target.value))}
            displayValue={lr.toExponential(1)}
            aria-label="Learning rate"
          />
        </label>
        <GameButton variant="primary" onClick={run} disabled={state.solved || state.running}>
          Run
        </GameButton>
        <GameButton onClick={doStep} disabled={state.solved || state.running || state.diverged}>
          Step
        </GameButton>
        <GameButton onClick={restart}>Reset</GameButton>
      </div>

      <div className="mt-5 rounded-lg border border-[var(--rule)] bg-[var(--panel)] p-3">
        <Heatmap surface={L} path={state.path} solved={state.solved} running={state.running} />
      </div>
      <p aria-live="polite" className="mt-4 font-mono text-xs text-[var(--ink-soft)]">
        {state.message}
      </p>

      <div className="mt-4">
        <CalibratedGauge
          human={1 - Math.min(state.solved ? state.step : L.budget, L.budget) / L.budget}
          machine={1 - Math.min(L.par, L.budget) / L.budget}
          humanLabel="you"
          machineLabel="par"
        />
      </div>
    </GameShell>
  )
}
