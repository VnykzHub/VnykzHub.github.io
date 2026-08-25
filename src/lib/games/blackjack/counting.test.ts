import { describe, it, expect } from 'vitest'
import { hiLo } from './counting'

describe('hiLo', () => {
  it('assigns +1 to 2–6', () => {
    for (const r of ['2', '3', '4', '5', '6'] as const) expect(hiLo(r)).toBe(1)
  })
  it('assigns 0 to 7–9', () => {
    for (const r of ['7', '8', '9'] as const) expect(hiLo(r)).toBe(0)
  })
  it('assigns −1 to tens and aces', () => {
    for (const r of ['10', 'J', 'Q', 'K', 'A'] as const) expect(hiLo(r)).toBe(-1)
  })
})
