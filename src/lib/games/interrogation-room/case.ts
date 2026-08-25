/**
 * Interrogation Room: a deterministic deduction engine. The scenario generator
 * writes a truth ledger first — who was where, who saw whom, who took the key.
 * Every answer is a lookup against that ledger, filtered by what the speaker
 * knows and bent by whether they have a reason to lie. Nothing is generated at
 * answer time, so the case is always solvable and never contradicts itself:
 * that is the truth firewall. Phrasing uses templates (the prototype's own
 * design: the production version swaps the phrasing layer for a model call).
 */

import { shuffle, type Rng } from '../shared/rng'

export const SCENE = 'the server room'
export const TURNS = 8

const CAST: [string, string][] = [
  ['Priya Raghavan', 'platform lead'],
  ['Arjun Sekhar', 'SRE, on call'],
  ['Meera Iyer', 'data engineer'],
  ['Karthik Nair', 'security analyst'],
  ['Farah Qureshi', 'release manager'],
  ['Dev Anand', 'intern, week two'],
]

const ELSEWHERE = ['the roof access', 'the archive', 'the lobby', 'the parking level']

export interface Sighting {
  who: number
  loc: string
  atScene: boolean
}

export interface Person {
  name: string
  role: string
  guilty: boolean
  loc: string
  cover: string | null
  saw: Sighting[]
}

export interface GeneratedCase {
  people: Person[]
  guiltyIdx: number
}

export type QuestionKind = 'where' | 'saw' | 'vouch' | 'confront'

export type Tone = 'mute' | 'machine' | 'bad'

export interface RevealedFact {
  type: 'loc' | 'sight'
  who: number
  value?: string
  subject?: number
  loc?: string
}

export interface AskResult {
  line: string
  tone: Tone
  reveals: RevealedFact[]
  broken: boolean
  note: string
}

const pick = <T,>(r: Rng, arr: T[]): T => arr[Math.floor(r() * arr.length)]

/** Build a case: 3 suspects, exactly one guilty, always solvable (a witness anchors the culprit). */
export function generateCase(rng: Rng): GeneratedCase {
  const cast = shuffle(CAST, rng).slice(0, 3)
  const guiltyIdx = Math.floor(rng() * 3)
  const spare = shuffle(ELSEWHERE, rng)

  const people: Person[] = cast.map(([name, role], i) => ({
    name,
    role,
    guilty: i === guiltyIdx,
    loc: i === guiltyIdx ? SCENE : spare.pop()!,
    cover: null,
    saw: [],
  }))
  people[guiltyIdx].cover = spare.pop() || ELSEWHERE[0]

  // Witnesses: at least one innocent places the culprit at the scene.
  const innocents = people.map((_, i) => i).filter((i) => i !== guiltyIdx)
  let anchored = false
  innocents.forEach((i) => {
    if (rng() < 0.6) {
      people[i].saw.push({ who: guiltyIdx, loc: SCENE, atScene: true })
      anchored = true
    }
  })
  if (!anchored) people[innocents[0]].saw.push({ who: guiltyIdx, loc: SCENE, atScene: true })

  innocents.forEach((i) => {
    const other = innocents.find((j) => j !== i)
    if (other !== undefined && rng() < 0.5) {
      people[i].saw.push({ who: other, loc: people[other].loc, atScene: false })
    }
  })

  // The culprit noticed one innocent, and will offer it up to look helpful.
  const noticed = innocents[Math.floor(rng() * innocents.length)]
  people[guiltyIdx].saw.push({ who: noticed, loc: people[noticed].loc, atScene: false })

  return { people, guiltyIdx }
}

const first = (name: string) => name.split(' ')[0]

/**
 * Ask a suspect one question. Pure: returns the template answer plus the facts
 * it puts on the record; the caller appends them to `known`.
 */
export function ask(
  kase: GeneratedCase,
  who: number,
  q: QuestionKind,
  known: RevealedFact[],
  other: number | undefined,
  rng: Rng
): AskResult {
  const me = kase.people[who]
  const people = kase.people

  if (q === 'where') {
    const loc = me.guilty ? me.cover! : me.loc
    const line = pick(rng, [
      `“I was in ${loc}. Same as every night this week.”`,
      `“${loc.charAt(0).toUpperCase() + loc.slice(1)}. I had the badge log if you want it.”`,
      `“${loc.charAt(0).toUpperCase() + loc.slice(1)}, until about half two.”`,
    ])
    return { line, tone: 'mute', reveals: [{ type: 'loc', who, value: loc }], broken: false, note: '' }
  }

  if (q === 'saw') {
    if (me.guilty) {
      const harmless = me.saw.find((s) => !s.atScene)
      if (harmless) {
        return {
          line: `“I passed ${first(people[harmless.who].name)} near ${harmless.loc}. That's all.”`,
          tone: 'mute',
          reveals: [{ type: 'sight', who, subject: harmless.who, loc: harmless.loc }],
          broken: false,
          note: '',
        }
      }
      return {
        line: pick(rng, ['“Nobody. The floor was empty.”', '“I wasn’t paying attention. Nobody, I think.”']),
        tone: 'mute',
        reveals: [],
        broken: false,
        note: '',
      }
    }
    if (me.saw.length) {
      const reveals: RevealedFact[] = me.saw.map((s) => ({ type: 'sight', who, subject: s.who, loc: s.loc }))
      return {
        line: me.saw.map((s) => `“I saw ${first(people[s.who].name)} by ${s.loc}.”`).join(' '),
        tone: 'machine',
        reveals,
        broken: false,
        note: '',
      }
    }
    return {
      line: pick(rng, ['“I didn’t see a soul.”', '“Nobody came past me.”']),
      tone: 'mute',
      reveals: [],
      broken: false,
      note: '',
    }
  }

  if (q === 'vouch') {
    if (other === undefined) return { line: '', tone: 'mute', reveals: [], broken: false, note: '' }
    const s = me.saw.find((x) => x.who === other)
    if (s && !me.guilty) {
      return {
        line: `“${first(people[other].name)}? They were at ${s.loc}. I'd put my name to that.”`,
        tone: 'machine',
        reveals: [{ type: 'sight', who, subject: other, loc: s.loc }],
        broken: false,
        note: '',
      }
    }
    if (me.guilty && s && s.atScene) {
      return {
        line: pick(rng, ['“I couldn’t say where they were.”', '“Don’t ask me. I wasn’t watching the door.”']),
        tone: 'mute',
        reveals: [],
        broken: false,
        note: '',
      }
    }
    return {
      line: '“No. I can’t place them anywhere.”',
      tone: 'mute',
      reveals: [],
      broken: false,
      note: '',
    }
  }

  // confront
  const onRecord = known.some((k) => k.type === 'sight' && k.subject === who && k.loc === SCENE)
  if (!onRecord) {
    return {
      line: pick(rng, ['“Confront me with what, exactly?”', '“You’ve got nothing that puts me anywhere.”']),
      tone: 'mute',
      reveals: [],
      broken: false,
      note: 'You need a witness statement placing them at the server room before that lands.',
    }
  }
  if (me.guilty) {
    return {
      line: `“…Fine. I was in ${SCENE}. I took the key. I was going to put it back.”`,
      tone: 'machine',
      reveals: [],
      broken: true,
      note: '',
    }
  }
  return {
    line: `“Then whoever told you that is lying, because I was in ${me.loc}.”`,
    tone: 'bad',
    reveals: [],
    broken: false,
    note: '',
  }
}

/** The full truth ledger for the reveal. */
export function ledgerText(kase: GeneratedCase): string[] {
  return kase.people.map((p, i) => {
    const culprit = i === kase.guiltyIdx
    const sightings = p.saw.length
      ? '; saw ' + p.saw.map((s) => `${first(kase.people[s.who].name)} at ${s.loc}`).join(', ')
      : '; saw nobody'
    return `${p.name} was in ${p.loc}${culprit ? ` and took the key, claiming ${p.cover}` : ''}${sightings}.`
  })
}
