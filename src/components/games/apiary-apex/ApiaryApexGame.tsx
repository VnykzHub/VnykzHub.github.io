'use client'

import { useEffect, useRef, useState } from 'react'
import { GameShell, GameButton, SegmentedControl, type ReadoutItem } from '@/components/games/shared'
import { Scene, type ApiaryStats, type FollowTarget } from './Scene'
import { AgentStatsTable } from './AgentStatsTable'

const FOLLOW_OPTIONS: { value: FollowTarget; label: string }[] = [
  { value: 'prey', label: 'Survivor' },
  { value: 'predator-0', label: 'Hunter A' },
  { value: 'predator-1', label: 'Hunter B' },
]

const INITIAL_STATS: ApiaryStats = {
  captures: 0,
  bestSurvival: 0,
  survivalTime: 0,
  closeCalls: 0,
  chunkCount: 9,
  bufferedFrames: 0,
  overtakes: 0,
  predatorStats: [
    { cumulativeReward: 0, distanceTraveled: 0, topSpeed: 0 },
    { cumulativeReward: 0, distanceTraveled: 0, topSpeed: 0 },
  ],
  preyStats: { cumulativeReward: 0, distanceTraveled: 0, topSpeed: 0 },
}

const BEST_SURVIVAL_KEY = 'games.apiary-apex.best-survival-ever'
const CAPTURES_EVER_KEY = 'games.apiary-apex.captures-ever'

interface AllTimeRecord {
  bestSurvival: number
  capturesEver: number
}

function loadAllTime(): AllTimeRecord {
  if (typeof window === 'undefined') return { bestSurvival: 0, capturesEver: 0 }
  return {
    bestSurvival: Number(window.localStorage.getItem(BEST_SURVIVAL_KEY)) || 0,
    capturesEver: Number(window.localStorage.getItem(CAPTURES_EVER_KEY)) || 0,
  }
}

const HOW_IT_WORKS = `Two hunters chase a lead-pursuit force toward the survivor's predicted future position (not its current one — chasing where it is means always arriving late), plus a mutual separation force that keeps them from stacking on the same line, so they tend to flank instead of tailgate. Whichever hunter is currently farther behind also gets a small speed bonus proportional to the gap — the two race each other, not just the prey, so the lead swaps back and forth instead of settling ("overtakes" in the readout counts these swaps). The survivor runs a steep inverse-square flee force from both hunters at once, so a distant threat barely registers but a close one is nearly the whole signal. All three whisker-raycast the terrain ahead — a small fan of rays samples ten different obstacle shapes a few body-lengths out and steers around whatever's soonest to hit; anything that gets shoved past that soft avoidance anyway (a sharp turn, two competing forces) is hard-stopped at the surface afterward, so nothing actually clips through geometry.

The ground itself has real terrain: elevation and a temperature field, both smooth deterministic noise seeded the same way as the obstacle scatter. Climbing a rise costs speed, descending one gives it back, and everyone slows down symmetrically in patches that are too hot or too cold — the same physics for hunters and survivor alike, so it never secretly favors a side. The field never ends: it's a 3x3 window of 40-unit chunks that streams in around the pack's center of mass, each chunk's terrain, obstacles, and elevation generated once from a hash of the run's seed and that chunk's coordinates, then cached — so the same seed always regrows the same field. A capture doesn't reset the world, just the survivor's position (with a brief head start before it can be caught again); the chase keeps rolling.

Every position, action, and reward is computed every frame from the spec's weighted-distance formulas — only the hunter that actually made contact banks the capture bonus, and every uninterrupted minute of survival pays the prey a bonus and costs both hunters a penalty, on top of the continuous distance-based reward. None of it is learned yet, though: it's captured into a local buffer (see "telemetry buffered") purely as the schema a future trained policy would need, but v1 has no server to send it to and no network model to run, so it never leaves your browser. That's the seam a future version would use: swap the scripted steering above for a small neural net run through onnxruntime-web, and the telemetry buffer already speaks the right schema to train it.`

export function ApiaryApexGame() {
  const [seed, setSeed] = useState('')
  const [paused, setPaused] = useState(false)
  const [follow, setFollow] = useState<FollowTarget>('prey')
  const [stats, setStats] = useState<ApiaryStats>(INITIAL_STATS)
  const [allTime, setAllTime] = useState<AllTimeRecord>({ bestSurvival: 0, capturesEver: 0 })
  const prevCaptures = useRef(0)

  // Load the running record once on mount (client-only — localStorage isn't
  // available during SSR).
  useEffect(() => {
    setAllTime(loadAllTime())
  }, [])

  // Fold each session's numbers into the persisted all-time record. Reseeding
  // resets stats.captures to 0, which reads as a negative delta here — that's
  // fine, it's just clamped to 0 rather than "un-counting" past captures.
  useEffect(() => {
    const delta = Math.max(0, stats.captures - prevCaptures.current)
    prevCaptures.current = stats.captures
    if (delta === 0 && stats.bestSurvival <= allTime.bestSurvival) return
    setAllTime((prev) => {
      const next = {
        bestSurvival: Math.max(prev.bestSurvival, stats.bestSurvival),
        capturesEver: prev.capturesEver + delta,
      }
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(BEST_SURVIVAL_KEY, String(next.bestSurvival))
        window.localStorage.setItem(CAPTURES_EVER_KEY, String(next.capturesEver))
      }
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allTime.bestSurvival read is intentionally not a dep; it would re-run this on its own write
  }, [stats.captures, stats.bestSurvival])

  const readoutItems: ReadoutItem[] = [
    { label: 'Captures', value: String(stats.captures), tone: 'bad' },
    { label: 'This chase', value: `${stats.survivalTime.toFixed(1)}s`, tone: 'machine' },
    { label: 'Best (session)', value: `${stats.bestSurvival.toFixed(1)}s`, tone: 'human' },
    { label: 'Best (all-time)', value: `${allTime.bestSurvival.toFixed(1)}s`, tone: 'human' },
    { label: 'Captures (all-time)', value: String(allTime.capturesEver), tone: 'bad' },
    { label: 'Close calls', value: String(stats.closeCalls), tone: 'mute' },
    { label: 'Overtakes', value: String(stats.overtakes), tone: 'machine' },
    { label: 'Chunks loaded', value: String(stats.chunkCount), tone: 'mute' },
    { label: 'Telemetry buffered', value: String(stats.bufferedFrames), tone: 'mute' },
  ]

  return (
    <GameShell
      eyebrow="Field · measures: pursuit and evasion"
      title="ApiaryApex"
      lede="Two hunter bees and one survivor, loose in an endless procedurally-generated field. Nobody wins for good — a capture just resets the chase, and the terrain keeps unrolling underneath it."
      onReseed={setSeed}
      readoutItems={readoutItems}
      howItWorks={HOW_IT_WORKS}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Follow" options={FOLLOW_OPTIONS} value={follow} onChange={setFollow} />
        <GameButton size="sm" variant="ghost" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume' : 'Pause'}
        </GameButton>
      </div>
      <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
        scripted steering · no learning yet · drag the scene to look around
      </p>
      {seed && (
        <>
          <div
            className="relative w-full overflow-hidden rounded-sm border border-[var(--rule)] bg-[#0c1512]"
            style={{ height: 'min(70vh, 620px)', minHeight: 360 }}
          >
            <Scene seed={seed} paused={paused} follow={follow} onStats={setStats} />
          </div>
          <div className="mt-4">
            <AgentStatsTable predatorStats={stats.predatorStats} preyStats={stats.preyStats} />
          </div>
        </>
      )}
    </GameShell>
  )
}
