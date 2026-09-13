export interface TelemetryFrame {
  agentId: 'predator-0' | 'predator-1' | 'prey'
  obs: number[]
  action: number[]
  reward: number
  t: number
}

/**
 * Client-side experience buffer, shaped the way a server ingest endpoint
 * would eventually want it (see the project spec's TelemetryHarvester).
 * v1 has no backend and no learned policy — nothing here is uploaded.
 * `dispatch()` just drains the local ring buffer and hands back what
 * *would* ship, so the HUD can show a live "buffered frames" count without
 * a single byte leaving the browser. Wiring an actual endpoint (Supabase
 * table + a Vercel API route) is Phase 4 of the roadmap — see
 * docs/superpowers/plans/2026-09-13-apiary-apex-simulation.md.
 */
export class TelemetryHarvester {
  private buffer: TelemetryFrame[] = []
  private readonly maxBufferSize: number

  constructor(maxBufferSize = 500) {
    this.maxBufferSize = maxBufferSize
  }

  record(frame: TelemetryFrame): void {
    this.buffer.push(frame)
    if (this.buffer.length > this.maxBufferSize) this.buffer.shift()
  }

  get size(): number {
    return this.buffer.length
  }

  /** Drains the buffer locally. No network call in v1 — see class doc above. */
  dispatch(): TelemetryFrame[] {
    const batch = this.buffer
    this.buffer = []
    return batch
  }
}
