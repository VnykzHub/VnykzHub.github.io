import { describe, it, expect } from 'vitest'
import { SCENE, ask, generateCase, ledgerText, type RevealedFact } from './case'
import { rngFrom } from '../shared/rng'

describe('generateCase invariants (50 seeds)', () => {
  it('builds a solvable, consistent case every time', () => {
    for (let s = 0; s < 50; s++) {
      const kase = generateCase(rngFrom(String(s), 'interro'))
      const { people, guiltyIdx } = kase

      expect(people.length).toBe(3)
      expect(people.filter((p) => p.guilty).length).toBe(1)

      const guilty = people[guiltyIdx]
      expect(guilty.cover).not.toBeNull()
      expect(guilty.cover).not.toBe(SCENE)
      expect(guilty.loc).toBe(SCENE)

      for (const p of people) {
        expect(p.loc.length).toBeGreaterThan(0)
        expect(p.role.length).toBeGreaterThan(0)
      }
      expect(new Set(people.map((p) => p.name)).size).toBe(3)
      expect(new Set(people.map((p) => p.role)).size).toBe(3)

      // Solvable: some innocent saw the guilty at the scene.
      const innocents = people.map((_, i) => i).filter((i) => i !== guiltyIdx)
      const anchored = innocents.some((i) => people[i].saw.some((w) => w.who === guiltyIdx && w.atScene))
      expect(anchored).toBe(true)
    }
  })
})

describe('ask', () => {
  const rng = () => rngFrom('1729', 'interro-ask')
  const kase = generateCase(rngFrom('42', 'interro'))

  it('guilty lies about their location', () => {
    const g = kase.guiltyIdx
    const result = ask(kase, g, 'where', [], undefined, rng())
    expect(result.reveals[0].value).toBe(kase.people[g].cover)
    expect(result.reveals[0].value).not.toBe(SCENE)
  })

  it('innocents tell the truth about their location', () => {
    const i = kase.people.findIndex((p) => !p.guilty)
    const result = ask(kase, i, 'where', [], undefined, rng())
    expect(result.reveals[0].value).toBe(kase.people[i].loc)
  })

  it('an innocent with a sighting reveals it', () => {
    const i = kase.people.findIndex((p) => !p.guilty && p.saw.length > 0)
    if (i === -1) return // impossible — the anchor guarantees one
    const result = ask(kase, i, 'saw', [], undefined, rng())
    expect(result.reveals.length).toBe(kase.people[i].saw.length)
  })

  it('confront needs an on-record scene sighting', () => {
    const g = kase.guiltyIdx
    const result = ask(kase, g, 'confront', [], undefined, rng())
    expect(result.broken).toBe(false)
    expect(result.note.length).toBeGreaterThan(0)
  })

  it('confront breaks the guilty once anchored', () => {
    const g = kase.guiltyIdx
    const known: RevealedFact[] = [{ type: 'sight', who: 0, subject: g, loc: SCENE }]
    const result = ask(kase, g, 'confront', known, undefined, rng())
    expect(result.broken).toBe(true)
  })

  it('confront on an innocent is a denial, not a break', () => {
    const i = kase.people.findIndex((p) => !p.guilty)
    const known: RevealedFact[] = [{ type: 'sight', who: 0, subject: i, loc: SCENE }]
    const result = ask(kase, i, 'confront', known, undefined, rng())
    expect(result.broken).toBe(false)
    expect(result.tone).toBe('bad')
  })

  it('vouch confirms a genuine sighting', () => {
    const i = kase.people.findIndex((p) => !p.guilty && p.saw.some((s) => !s.atScene))
    if (i === -1) return
    const sight = kase.people[i].saw.find((s) => !s.atScene)!
    const result = ask(kase, i, 'vouch', [], sight.who, rng())
    expect(result.line).toContain('put my name to that')
  })
})

describe('ledgerText', () => {
  it('names the culprit and their cover', () => {
    const kase = generateCase(rngFrom('7', 'interro'))
    const lines = ledgerText(kase)
    expect(lines.length).toBe(3)
    expect(lines[kase.guiltyIdx]).toContain('took the key')
  })
})
