'use client'

import { useState } from 'react'
import { GameShell, GameButton, type ReadoutItem } from '@/components/games/shared'
import { Scene, type ApiaryStats } from './Scene'

const INITIAL_STATS: ApiaryStats = {
  captures: 0,
  bestSurvival: 0,
  survivalTime: 0,
  closeCalls: 0,
  chunkCount: 9,
  bufferedFrames: 0,
}

const HOW_IT_WORKS = `Two hunters chase a lead-pursuit force toward the survivor's predicted future position (not its current one — chasing where it is means always arriving late), plus a mutual separation force that keeps them from stacking on the same line, so they tend to flank instead of tailgate. The survivor runs a steep inverse-square flee force from both hunters at once, so a distant threat barely registers but a close one is nearly the whole signal. All three whisker-raycast the terrain ahead — a small fan of rays samples for obstacles a few body-lengths out and steers around whatever's soonest to hit.

The field itself never ends: it's a 3x3 window of 40-unit chunks that streams in around the pack's center of mass, each chunk's obstacle scatter generated once from a hash of the run's seed and that chunk's coordinates, then cached — so the same seed always regrows the same terrain, and terrain outside the window simply isn't computed. A capture doesn't reset the world, just the survivor's position; the chase keeps rolling.

None of this is learned. Every position, action, and a reward figure — computed every frame from the same weighted-distance formulas a trained policy would eventually optimize — is captured into a local buffer (see the "telemetry buffered" reading), but v1 has no server to send it to and no network model to run, so it never leaves your browser. That's the seam a future version would use: swap the scripted steering above for a small neural net run through onnxruntime-web, and the telemetry buffer already speaks the right schema to train it.`

export function ApiaryApexGame() {
  const [seed, setSeed] = useState('')
  const [paused, setPaused] = useState(false)
  const [stats, setStats] = useState<ApiaryStats>(INITIAL_STATS)

  const readoutItems: ReadoutItem[] = [
    { label: 'Captures', value: String(stats.captures), tone: 'bad' },
    { label: 'This chase', value: `${stats.survivalTime.toFixed(1)}s`, tone: 'machine' },
    { label: 'Best survival', value: `${stats.bestSurvival.toFixed(1)}s`, tone: 'human' },
    { label: 'Close calls', value: String(stats.closeCalls), tone: 'mute' },
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
      <div className="mb-3 flex items-center justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--ink-faint)]">
          scripted steering · no learning yet
        </p>
        <GameButton size="sm" variant="ghost" onClick={() => setPaused((p) => !p)}>
          {paused ? 'Resume' : 'Pause'}
        </GameButton>
      </div>
      {seed && (
        <div
          className="relative w-full overflow-hidden rounded-sm border border-[var(--rule)] bg-[#0c1512]"
          style={{ height: 'min(70vh, 620px)', minHeight: 360 }}
        >
          <Scene seed={seed} paused={paused} onStats={setStats} />
        </div>
      )}
    </GameShell>
  )
}
