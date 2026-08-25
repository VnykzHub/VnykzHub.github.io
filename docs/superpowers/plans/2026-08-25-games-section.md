# Games Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/games` section on vnykzhub.com — a hub plus 9 live games (Blackjack Trainer, Kindergarten Chaos moved from lab, and the 7 "Bench" instruments from `pending integration/games/game_ideas.html`), all rebuilt as site-styled React/TypeScript with pure, tested engines.

**Architecture:** Each game splits into a pure TS engine in `src/lib/games/<name>/` (no DOM, unit-tested with vitest) and a React client page at `src/app/games/<name>/` built from shared site-styled components (`src/components/games/shared/`). The shared shell gives every game the same editorial header, seeded-RNG controls, stat readout, and the signature "calibrated gauge" (human = brass, machine = patina — the site's odometer-instrument identity). Games are individual pages, NOT the prototype's tab-rail SPA (that UI is explicitly rejected by the user).

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, Tailwind 3.4 (site tokens: `--paper/--panel/--card-bg/--ink*/--rule/--accent-1..3`), framer-motion 12, lucide-react, vitest (new dev dep), site fonts (@fontsource Newsreader / Space Grotesk / IBM Plex Mono).

**Design direction (user: "I don't like the UI this file has at all — plan improvements on each one"):**
- Reject the prototype's dark control-panel rail, raw `#0B0F14` palette, and cyan/amber neon. Use the site's warm instrument aesthetic everywhere: theme-aware paper/panel surfaces, brass (`--accent-1`) = human, patina (`--accent-2`) = machine, rust (`--accent-3`) = loss/error.
- Editorial page header per game: mono eyebrow `GAME 01 · STATIC · measures: expected value`, Newsreader display title, one-sentence thesis lede.
- **Signature element:** `CalibratedGauge` — a ruled instrument track (hairline rule + tick marks, odometer register style) with a brass marker (you) and patina marker (machine), labels above/below. Reused on every game page; each game calibrates it differently.
- Per-game identities: blackjack keeps its felt table (dark in both themes — physical table); wordle gets flip-animated tiles; connect-four gets a drop-preview + win-line highlight; interrogation gets dossier-styled suspect cards and transcript; descent keeps canvas heatmap (the right tool) in a site-styled frame.
- Keep the prototype's genuinely good ideas: seeded RNG + share-link (reproducible challenges), readout strips, "How it works" explainers, you-vs-machine scoring.

**Repo caveat:** the working tree has uncommitted lab work (`src/app/lab/`, `src/game/`, nav, deps). All commits MUST be path-scoped (`git add` explicit paths only) so that work is never swept in.

**Route map:** `/games` (hub) · `/games/blackjack-trainer` · `/games/tokenizer-golf` · `/games/next-token-duel` · `/games/kelly-run` · `/games/descent-golf` · `/games/connect-four` · `/games/entropy-wordle` · `/games/interrogation-room` · `/games/kindergarten-chaos` (moved from `/lab`).

**Design token mapping (game-scoped, in `src/components/games/shared/game-tokens.css`):**

```css
:root { /* game tokens ride on site tokens */
  --g-human: var(--accent-1);   /* brass — you */
  --g-machine: var(--accent-2); /* patina — the model/bot/solver */
  --g-bad: var(--accent-3);     /* rust — loss, wrong, bust */
  --g-track: var(--bar-track);  /* gauge rail */
}
[data-theme="dark"] { --g-human: var(--accent-1); --g-machine: var(--accent-2); --g-bad: var(--accent-3); }
```
(Site tokens are already theme-aware via `data-theme`; the game tokens exist to give components one indirection and a single place to retune.)

---

## File Structure

```
src/lib/games/
  shared/rng.ts                          # seeded RNG: FNV-1a + mulberry32, shuffle (ported)
  blackjack/{types,shoe,counting,hand,strategy,chart,scenarios,reducer}.ts
  tokenizer-golf/{tokenizer,data}.ts
  next-token-duel/{data,scoring}.ts
  kelly-run/kelly.ts
  descent-golf/surfaces.ts
  connect-four/engine.ts
  entropy-wordle/engine.ts
  interrogation-room/case.ts
  kindergarten-chaos/{GameEngine,config,placeholders}.js   # moved from src/game/
src/components/games/
  shared/{game-tokens.css,GameShell,Readout,CalibratedGauge,GameButton,GameSelect,GameSlider,SegmentedControl,index}.tsx
  blackjack/{BlackjackGame,PlayTable,PlayingCard,ChipRow,ActionBar,CountHUD,MessageBox,HintBox,ScenarioPanel,CountTrainerPanel,StrategyChartPanel,StrategyTable}.tsx
  tokenizer-golf/TokenGolfGame.tsx
  next-token-duel/DuelGame.tsx
  kelly-run/{KellyGame,LogChart}.tsx
  descent-golf/{DescentGame,Heatmap}.tsx
  connect-four/{ConnectFourGame,Board}.tsx
  entropy-wordle/WordleGame.tsx
  interrogation-room/InterrogationGame.tsx
src/app/games/
  page.tsx                               # hub
  blackjack-trainer/page.tsx
  tokenizer-golf/page.tsx
  next-token-duel/page.tsx
  kelly-run/page.tsx
  descent-golf/page.tsx
  connect-four/page.tsx
  entropy-wordle/page.tsx
  interrogation-room/page.tsx
  kindergarten-chaos/{page,GameClient}.tsx   # moved from src/app/lab/
src/screens/GamesHub.tsx                 # hub screen
src/data/navigation.ts                   # + Games nav item (edit; Lab item already pending)
src/app/lab/page.tsx                     # remove GAMES array + section (edit)
tests/ (vitest, colocated: src/lib/games/**/*.test.ts)
package.json                             # + vitest devDep, + test script
.github/workflows/…                      # + test job in existing CI workflow
public/sitemap.xml                       # + new /games URLs
```

---

## Phase 0 — Foundations

### Task 1: vitest setup

**Files:**
- Modify: `package.json` (scripts + devDependencies)
- Create: `vitest.config.ts`
- Modify: `.github/workflows/*.yml` (find existing; add test job)

- [ ] **Step 1:** Install vitest

Run: `npm i -D vitest`
Expected: vitest added to devDependencies.

- [ ] **Step 2:** Add test script to package.json

```json
"scripts": { "test": "vitest run", "test:watch": "vitest" }
```

- [ ] **Step 3:** Create `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
})
```

- [ ] **Step 4:** Add CI test job to the existing workflow (currently typecheck + build); append a `test` job running `npm ci && npm test`.

- [ ] **Step 5:** Verify

Run: `npx vitest run` (no tests yet → "No test files found" is fine)

- [ ] **Step 6:** Commit (paths: `package.json package-lock.json vitest.config.ts .github/workflows/`)

```bash
git add package.json package-lock.json vitest.config.ts .github/workflows
git commit -m "chore: add vitest test runner and CI test job"
```

### Task 2: Seeded RNG (`src/lib/games/shared/rng.ts`)

Ported verbatim from the Bench (FNV-1a hash + mulberry32). Seeded RNG powers reseed + share-link on every game.

**Files:**
- Create: `src/lib/games/shared/rng.ts`
- Test: `src/lib/games/shared/rng.test.ts`

- [ ] **Step 1:** Write the failing test

```ts
import { describe, it, expect } from 'vitest'
import { rngFrom, shuffle } from './rng'

describe('seeded rng', () => {
  it('is deterministic for the same seed', () => {
    const a = rngFrom('1729', 'test')
    const b = rngFrom('1729', 'test')
    expect(Array.from({ length: 5 }, a)).toEqual(Array.from({ length: 5 }, b))
  })
  it('differs across seeds and salts', () => {
    const a = rngFrom('1729', 'test')
    const b = rngFrom('1730', 'test')
    const c = rngFrom('1729', 'other')
    expect(a()).not.toBe(b())
    expect(a()).not.toBe(c())
  })
  it('produces values in [0,1)', () => {
    const r = rngFrom('42', 'test')
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('shuffle is a permutation, deterministic per seed', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    const a = shuffle([...arr], rngFrom('s', 'test'))
    const b = shuffle([...arr], rngFrom('s', 'test'))
    expect(a).toEqual(b)
    expect([...a].sort((x, y) => x - y)).toEqual(arr)
  })
})
```

- [ ] **Step 2:** Run to verify fail: `npx vitest run src/lib/games/shared/rng.test.ts` → FAIL (module not found)

- [ ] **Step 3:** Implement `src/lib/games/shared/rng.ts`

```ts
export type Rng = () => number

function hashSeed(str: string): number {
  let h = 2166136261 >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** mulberry32 seeded via FNV-1a over `seed|salt` — deterministic per (seed, salt). */
export function rngFrom(seed: string, salt: string): Rng {
  let a = hashSeed(seed + '|' + salt)
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(arr: T[], r: Rng): T[] {
  const out = arr.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
```

- [ ] **Step 4:** Run to verify pass: `npx vitest run src/lib/games/shared/rng.test.ts` → PASS (4 tests)

- [ ] **Step 5:** Commit: `git add src/lib/games/shared && git commit -m "feat: seeded RNG for games section"`

### Task 3: Shared game UI (`src/components/games/shared/`)

Site-styled building blocks. All theme-aware via site tokens; mono numbers; hairline rules.

**Files:**
- Create: `src/components/games/shared/game-tokens.css` (token mapping block above)
- Create: `src/components/games/shared/CalibratedGauge.tsx` — the signature element.
  - Props: `{ human: number; machine: number; humanLabel: string; machineLabel: string }` (values clamped 0–1)
  - Render: relative container h-14; full-width hairline `border-t border-[var(--rule)]` mid-track; 11 tick marks (10% steps) as 1px×4px lines in `var(--rule)`; brass dot + label (mono 10px uppercase, above) at `human%`; patina dot + label below at `machine%`; markers positioned via `style={{ left: pct + '%' }}` with `translateX(-50%)`; transition `left .35s cubic-bezier(.2,.7,.3,1)`. `aria-hidden` (decorative; the readout carries the numbers).
- Create: `src/components/games/shared/Readout.tsx`
  - Props: `{ items: { label: string; value: string; tone?: 'human'|'machine'|'bad'|'mute' }[] }`
  - Render: `grid grid-flow-col auto-cols-fr gap-px bg-[var(--rule)] border border-[var(--rule)] rounded-sm overflow-hidden` — each cell `bg-[var(--panel)] px-4 py-2`: label = mono 9px uppercase tracking-wide `text-[var(--ink-faint)]`; value = mono 15px semibold, tone colors: human→`text-[var(--accent-1)]`, machine→`text-[var(--accent-2)]`, bad→`text-[var(--accent-3)]`, mute→`text-[var(--ink-soft)]`. Overflow-x auto on mobile.
- Create: `src/components/games/shared/GameButton.tsx`
  - Variants: `primary` (brass bg `bg-[var(--accent-1)] text-[#151006]`), `ghost` (transparent, `border-[var(--rule)] text-[var(--ink-soft)] hover:border-[var(--ink-faint)]`), `danger` (rust bg). Sizes `sm|md`. Shared base: mono 11px uppercase tracking-[0.08em] font-semibold px-4 py-2 rounded-sm border transition-colors; `disabled:opacity-40 disabled:cursor-not-allowed`; focus-visible ring `outline-2 outline-[var(--accent-2)]`.
- Create: `src/components/games/shared/GameSelect.tsx` — native select styled: `bg-[var(--panel)] border border-[var(--rule)] rounded-sm px-3 py-2 text-sm text-[var(--ink)]`.
- Create: `src/components/games/shared/GameSlider.tsx` — `input[type=range]` with `accent-color: var(--accent-1)`, plus a mono readout span prop `displayValue`.
- Create: `src/components/games/shared/SegmentedControl.tsx` — props `{ options: {value,label}[], value, onChange }`; row of buttons, active = brass text + `border-b-2 border-[var(--accent-1)]`, inactive = `text-[var(--ink-faint)]`.
- Create: `src/components/games/shared/GameShell.tsx` ('use client')
  - Props: `{ eyebrow: string; title: string; lede: string; seedSalt: string; onReseed: (seed: string) => void; readoutItems: …; howItWorks: string; children: ReactNode }`
  - Renders: editorial header (eyebrow mono 11px uppercase `text-[var(--accent-2)]`, title `font-serif text-3xl md:text-4xl`, lede `text-[var(--ink-soft)] max-w-2xl`); seed bar right-aligned (mono: label `seed`, input w-28 `bg-[var(--panel)] border-[var(--rule)]`, buttons `reseed` / `copy link` via GameButton ghost sm — copy uses `navigator.clipboard.writeText(url + '?seed=' + seed)` and swaps label to `copied` for 1.4s); children; Readout; `<details>` "How it works" styled with `border-t border-[var(--rule)]` summary mono uppercase — content `prose`-lite mono-free `text-[var(--ink-soft)]`; initial seed read from `?seed=` query param.
  - GameShell imports `game-tokens.css`.
- Create: `src/components/games/shared/index.ts` re-exporting all.

- [ ] **Step 1:** Implement all files (no separate tests — UI components; verified by typecheck + build + browser later).
- [ ] **Step 2:** Verify: `npx tsc --noEmit` → PASS.
- [ ] **Step 3:** Commit: `git add src/components/games/shared && git commit -m "feat: shared game UI — shell, gauge, readout, controls"`

---

## Phase 1 — Hub, nav, and Kindergarten Chaos move

### Task 4: Games hub page + nav + KC move + lab cleanup

**Files:**
- Create: `src/screens/GamesHub.tsx` — server component.
  - Data: a `GAMES` array (same shape as the lab's): `{ title, slug, tagline, tech[], icon, category, status: 'live'|'planned' }`.
  - Categories (order): `Static` (Blackjack Trainer · Tokenizer Golf · Next-Token Duel · Kelly Run), `Engine` (Descent Golf · Connect Four · Entropy Wordle), `Ledger` (Interrogation Room), `Arcade` (Kindergarten Chaos). Planned: Context Window Tetris, Prompt Telephone (kept from lab, "Soon" badge, non-link).
  - Layout: hero (`Eyebrow` "The Games", serif H1 "Games that are actually instruments", lede: "Every one of these measures something you probably think you already understand. Amber is you, patina is the machine. Everything runs in your browser — no server, no inference calls."), then one section per category: mono uppercase category heading with count (`font-mono text-xs uppercase tracking-[0.18em] text-[var(--accent-2)]`), grid `md:grid-cols-2` of cards. Card = `surface-card p-6` (site pattern): icon top-left `text-[var(--accent-2)]`, title `font-sans text-lg font-semibold`, tagline `font-serif text-[15px] text-[var(--ink-soft)]`, tech chips (`font-mono text-[10px] px-2 py-0.5 rounded-full bg-[var(--bar-track)] text-[var(--ink-faint)]`), `Play →` CTA for live, `Soon` badge for planned. Link via `next/link` to `/games/<slug>`.
- Create: `src/app/games/page.tsx`

```tsx
import type { Metadata } from 'next'
import { GamesHub } from '@/screens/GamesHub'
export const metadata: Metadata = {
  title: 'Games — Instruments for AI Intuition',
  description: 'Nine playable instruments: expected value, tokenization, perplexity, Kelly sizing, optimizers, alpha-beta search, entropy, and deduction.',
}
export default function Page() { return <GamesHub /> }
```

- Modify: `src/data/navigation.ts` — add `{ id: 'games', label: 'Games', href: '/games', icon: Gamepad2, kind: 'route' }` after `blog`; extend the lucide import with `Gamepad2`. (File already has the uncommitted Lab item — add on top, don't touch it.)
- Move: `git mv`-style moves are fine but files are untracked — use `mv`:
  - `mv src/app/lab/kindergarten-chaos src/app/games/kindergarten-chaos`
  - `mkdir -p src/lib/games && mv src/game src/lib/games/kindergarten-chaos`
  - Edit `src/app/games/kindergarten-chaos/GameClient.tsx:51`: `'@/game/GameEngine'` → `'@/lib/games/kindergarten-chaos/GameEngine'`
  - Edit KC page: metadata title `'Kindergarten Chaos — Games'`, eyebrow `Games / Arcade` (was `Lab / Game`).
  - Check for other `@/game` references: `grep -rn "@/game" src` → only GameClient (verified earlier).
- Modify: `src/app/lab/page.tsx` — remove the `GAMES` array (lines ~56–82), the Games `<section>` (~160–196), and now-unused icon imports (`Swords`, `Gamepad2`; keep `Brain` — verify it's still used by DEMOS; keep `ArrowRight` if still used by demos cards — verify).
- Modify: `public/sitemap.xml` — add the 9 `/games/...` URLs (read file first, follow existing entry format).

- [ ] **Step 1:** Create hub screen + page.
- [ ] **Step 2:** Nav item + KC move + lab cleanup + sitemap.
- [ ] **Step 3:** Verify: `npx tsc --noEmit` → PASS; `npm run build` → PASS (also verifies KC dynamic import resolves).
- [ ] **Step 4:** Commit (paths only):

```bash
git add src/screens/GamesHub.tsx src/app/games/page.tsx src/app/games/kindergarten-chaos src/lib/games/kindergarten-chaos src/data/navigation.ts src/app/lab/page.tsx public/sitemap.xml
git commit -m "feat: games hub + nav entry; move kindergarten-chaos to /games"
```

---

## Phase 2 — Blackjack Trainer (per committed spec `docs/superpowers/specs/2026-08-25-games-blackjack-design.md`)

### Task 5: Blackjack engine types + shoe + counting + hand

**Files:**
- Create: `src/lib/games/blackjack/types.ts`, `shoe.ts`, `counting.ts`, `hand.ts`
- Test: `src/lib/games/blackjack/shoe.test.ts`, `hand.test.ts`, `counting.test.ts`

types.ts:

```ts
export type Suit = '♠' | '♣' | '♥' | '♦'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export interface Card { rank: Rank; suit: Suit }
export type Move = 'Hit' | 'Stand' | 'Double' | 'Split'
export type Phase = 'betting' | 'dealing' | 'player' | 'dealer' | 'settled'
export type Tone = 'neutral' | 'win' | 'lose' | 'push'
export type HandStatus = 'active' | 'stood' | 'bust' | 'blackjack'
export interface PlayerHand { cards: Card[]; bet: number; status: HandStatus; doubled: boolean }

export interface BlackjackState {
  phase: Phase
  shoe: Card[]
  cardsSeen: number
  decksRemaining: number
  runningCount: number
  newShoe: boolean
  bank: number
  bet: number
  hands: PlayerHand[]
  activeHand: number
  dealer: Card[]
  message: string
  tone: Tone
  lastOptimal: { move: Move; reason: string } | null
  hintShown: boolean
  coachFeedback: string | null
  optimalPlays: number
  totalPlays: number
}

export type BlackjackAction =
  | { type: 'ADD_BET'; amount: number }
  | { type: 'CLEAR_BET' }
  | { type: 'DEAL' }
  | { type: 'HIT' }
  | { type: 'STAND' }
  | { type: 'DOUBLE' }
  | { type: 'SPLIT' }
  | { type: 'SHOW_HINT' }
  | { type: 'RESET_BANK' }
  | { type: 'NEW_ROUND' }
```

counting.ts:

```ts
import type { Rank } from './types'
export function hiLo(rank: Rank): number {
  if (['2', '3', '4', '5', '6'].includes(rank)) return 1
  if (['7', '8', '9'].includes(rank)) return 0
  return -1
}
```

shoe.ts:

```ts
import type { Card, Rank, Suit } from './types'
import { shuffle, type Rng } from '../shared/rng'
import { hiLo } from './counting'

export const SUITS: Suit[] = ['♠', '♣', '♥', '♦']
export const RANKS: Rank[] = ['A','2','3','4','5','6','7','8','9','10','J','Q','K']
export const NUM_DECKS = 6
export const RESHUFFLE_AT = 52 // cards remaining at which the shoe is rebuilt between rounds
export const TOTAL_CARDS = NUM_DECKS * 52

export function buildShoe(numDecks = NUM_DECKS, r: Rng = Math.random): Card[] {
  const cards: Card[] = []
  for (let d = 0; d < numDecks; d++)
    for (const suit of SUITS) for (const rank of RANKS) cards.push({ rank, suit })
  return shuffle(cards, r)
}

export function countOf(card: Card): number { return hiLo(card.rank) }
```

hand.ts:

```ts
import type { Card } from './types'

export function cardValue(rank: Card['rank']): number {
  if (['J', 'Q', 'K'].includes(rank)) return 10
  if (rank === 'A') return 11
  return parseInt(rank, 10)
}

export function handTotal(cards: Card[]): number {
  let total = 0, aces = 0
  for (const c of cards) { total += cardValue(c.rank); if (c.rank === 'A') aces++ }
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && handTotal(cards) === 21
}

export function isPair(cards: Card[]): boolean {
  return cards.length === 2 && cards[0].rank === cards[1].rank
}

/** Soft total when the hand counts an Ace as 11 without busting; null for hard hands. */
export function softTotal(cards: Card[]): number | null {
  if (!cards.some(c => c.rank === 'A')) return null
  const nonAce = cards.filter(c => c.rank !== 'A').reduce((s, c) => s + cardValue(c.rank), 0)
  if (nonAce + 11 > 21) return null
  return nonAce + 11
}

export function handLabel(cards: Card[]): string {
  if (isBlackjack(cards)) return 'BJ!'
  return String(handTotal(cards))
}
```

Tests (write first, key cases):
- `handTotal`: A+K = 21; A+A+9 = 21; A+A+A+A = 14; 10+9+A = 20; 5+6+A = 12.
- `isBlackjack`: [A, K] true; [A, 5, 5] false; [K, A] true (order-independent).
- `softTotal`: [A,7] = 18; [A,7,10] = null; [A,A] = 12.
- `isPair`: [8,8] true; [8,9] false; [K,Q] false (rank differs).
- `hiLo`: 2→1, 6→1, 7→0, 9→0, 10→-1, J→-1, A→-1.
- `buildShoe`: 312 cards; 24 of each rank; deterministic with seeded rng.

**Steps:** write tests → fail → implement → pass → commit `feat: blackjack core — shoe, counting, hand`.

### Task 6: Blackjack strategy engine + chart + scenarios

**Files:**
- Create: `src/lib/games/blackjack/strategy.ts`, `chart.ts`, `scenarios.ts`
- Test: `strategy.test.ts`

**Rule set (single source of truth, 6-deck S17, standard basic strategy):** Implement `getOptimalMove(playerCards: Card[], upcard: Card): { move: Move; reason: string }`:
- Pairs (exactly 2 cards, same rank): A/A → Split always; 8/8 → Split always; 10-value pairs → Stand; 5/5 → treat as hard 10 (never split); 9/9 → Split vs 2–9 except 7, Stand vs 7/10/A; 7/7 → Split vs 2–7, Hit vs 8+; 6/6 → Split vs 2–6, Hit vs 7+; 4/4 → Split vs 5–6, Hit otherwise; 2/2, 3/3 → Split vs 2–7, Hit vs 8+.
- Soft totals (softTotal !== null, ≥ 2 cards): 20/21 → Stand; 19 → Stand; 18 → Stand vs 2/7/8, Double vs 3–6, Hit vs 9/10/A; 17 → Double vs 3–6, Hit otherwise; 16/15 → Double vs 4–6, Hit otherwise; 14/13 → Double vs 5–6, Hit otherwise.
- Hard totals: ≥17 Stand; ≤8 Hit; 11 → Double vs 2–10, Hit vs A; 10 → Double vs 2–9, Hit vs 10/A; 9 → Double vs 3–6, Hit otherwise; 12 → Stand vs 4–6, Hit otherwise; 13–16 → Stand vs 2–6, Hit vs 7+.
- Reasons: one-sentence strings in the prototype's voice (e.g. `'Always split Aces — each Ace can become a strong 21.'`).

chart.ts — data matching the SAME rule set (so the consistency test passes):

```ts
export type Cell = 'H' | 'S' | 'D' | 'P'
export interface StrategyTable { heading: string; rows: { label: string; cells: Cell[] }[] }
// columns: 2 3 4 5 6 7 8 9 10 A  (10 col covers J/Q/K)
export const HARD_TABLE: StrategyTable = { heading: 'Hard totals (no Ace)', rows: [
  { label: '8',  cells: ['H','H','H','H','H','H','H','H','H','H'] },
  { label: '9',  cells: ['H','D','D','D','D','H','H','H','H','H'] },
  { label: '10', cells: ['D','D','D','D','D','D','D','D','H','H'] },
  { label: '11', cells: ['D','D','D','D','D','D','D','D','D','H'] },
  { label: '12', cells: ['H','H','S','S','S','H','H','H','H','H'] },
  { label: '13', cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '14', cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '15', cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '16', cells: ['S','S','S','S','S','H','H','H','H','H'] },
  { label: '17+',cells: ['S','S','S','S','S','S','S','S','S','S'] },
]}
export const SOFT_TABLE: StrategyTable = { heading: 'Soft totals (with Ace)', rows: [
  { label: 'A2', cells: ['H','H','H','D','D','H','H','H','H','H'] },
  { label: 'A3', cells: ['H','H','H','D','D','H','H','H','H','H'] },
  { label: 'A4', cells: ['H','H','D','D','D','H','H','H','H','H'] },
  { label: 'A5', cells: ['H','H','D','D','D','H','H','H','H','H'] },
  { label: 'A6', cells: ['H','D','D','D','D','H','H','H','H','H'] },
  { label: 'A7', cells: ['S','D','D','D','D','S','S','H','H','H'] },
  { label: 'A8', cells: ['S','S','S','S','S','S','S','S','S','S'] },
  { label: 'A9', cells: ['S','S','S','S','S','S','S','S','S','S'] },
]}
export const PAIR_TABLE: StrategyTable = { heading: 'Pairs', rows: [
  { label: 'A-A',   cells: ['P','P','P','P','P','P','P','P','P','P'] },
  { label: '10-10', cells: ['S','S','S','S','S','S','S','S','S','S'] },
  { label: '9-9',   cells: ['P','P','P','P','P','S','P','P','S','S'] },
  { label: '8-8',   cells: ['P','P','P','P','P','P','P','P','P','P'] },
  { label: '7-7',   cells: ['P','P','P','P','P','P','H','H','H','H'] },
  { label: '6-6',   cells: ['P','P','P','P','P','H','H','H','H','H'] },
  { label: '5-5',   cells: ['D','D','D','D','D','D','D','D','H','H'] },
  { label: '4-4',   cells: ['H','H','H','P','P','H','H','H','H','H'] },
  { label: '3-3',   cells: ['P','P','P','P','P','P','H','H','H','H'] },
  { label: '2-2',   cells: ['P','P','P','P','P','P','H','H','H','H'] },
]}
export const UPCOLS = ['2','3','4','5','6','7','8','9','10','A'] as const
```

NOTE (prototype bug fix): the prototype's engine and its own charts disagreed in several soft-total cells (A2/A3 vs 4, A6 vs 3, A7 vs 2). The tables above are standard 6-deck S17 strategy and the engine is implemented to match them exactly; the consistency test below locks this down.

scenarios.ts: port the 8 scenarios from the prototype verbatim as typed data:

```ts
export interface Scenario { q: string; player: Card[]; dealer: Card; correct: Move; opts: Move[]; explain: string }
export const SCENARIOS: Scenario[] = [ /* 8 entries ported from blackjack-trainer.html lines 1084-1149 */ ]
```

Tests (`strategy.test.ts`), written first:
1. **Chart–engine consistency:** for every table row × upcard column, build the corresponding hand and assert `getOptimalMove(...).move` equals the table cell (map D→Double, H→Hit, S→Stand, P→Split). Hands: hard `n` → representative two cards summing to n with no ace (e.g. 12 → [7,5]); soft `An` → [A, n−11]; pairs → [n,n] (face cards for 10-10 use [K,Q] — engine treats any 10-value pair as pair of 10s).
2. Spot checks: 16 vs 7 → Hit; 16 vs 6 → Stand; 11 vs A → Hit; A7 vs 2 → Stand; A7 vs 5 → Double; 88 vs A → Split; 99 vs 7 → Stand; 55 vs 4 → Double; A2 vs 4 → Hit; A6 vs 3 → Double.
3. Every reason string is non-empty.

**Steps:** write tests → fail → implement strategy.ts + chart.ts + scenarios.ts → pass → commit `feat: blackjack strategy engine, charts, scenarios`.

### Task 7: Blackjack reducer (game state machine)

**Files:**
- Create: `src/lib/games/blackjack/reducer.ts`
- Test: `reducer.test.ts`

Reducer signature: `createBlackjackReducer(rng: Rng) => (state, action) => state` (rng injected for determinism; the app passes `rngFrom(seed, 'blackjack')` from GameShell's seed).

`initialState(rng): BlackjackState` — bank 500, bet 0, fresh shoe, phase 'betting', message 'Place your bet and deal!'.

Reducer rules (pure, deterministic given rng):
- `ADD_BET`: only in 'betting'; cap `bet + amount ≤ bank`; if bank ≤ 0 → message 'Bankrupt — reset to restart.', tone lose.
- `CLEAR_BET`: betting only; bet = 0.
- `DEAL`: require bet > 0. If `shoe.length < RESHUFFLE_AT` → rebuild shoe, `runningCount = 0`, `cardsSeen = 0`, `newShoe = true` (else false). Draw 2 player, 2 dealer. Update runningCount by hiLo of each drawn card, cardsSeen += 4, decksRemaining = (TOTAL_CARDS − cardsSeen)/52. If player natural 21: reveal — dealer 21 → push; else win 3:2 → `bank += floor(bet * 1.5)`, settle (phase 'settled', hands[0].status 'blackjack', message accordingly). Else phase 'player', set `lastOptimal = getOptimalMove(hands[0].cards, dealer[0])`, message 'Your move.', hintShown false, coachFeedback null.
- `HIT`: phase 'player'; draw to active hand. Bust → status 'bust', coach compare vs optimal (see coach below), advance to next hand or dealer. Else update lastOptimal for the active hand, coach compare. 21 → auto-stand.
- `STAND`: mark 'stood', coach compare, advance (next hand or dealer).
- `DOUBLE`: only active hand has 2 cards and `bank ≥ hand.bet`; `bank −= hand.bet`, `hand.bet *= 2`, draw one card, `doubled = true`, coach compare; bust → settle path; else treat as stand.
- `SPLIT`: exactly 1 hand, 2 cards, same rank, `bank ≥ bet`. `bank −= bet` (stake second hand). Draw one card for each: `hands = [{cards:[c0, d0], bet, …}, {cards:[c1, d1], bet, …}]`, activeHand 0. Split aces: each hand gets one card only — mark both 'stood' immediately (advance to dealer). Update lastOptimal for the new active hand. message 'Split! Playing first hand.'
- Dealer play (in `advanceToDealer` internal helper): reveal, hit while total < 17 (S17). Settle each hand sequentially: bust → lose bet; dealer bust → win bet; totals compare → win/lose/push. Sum bank. Set message ('You win $X' / 'Dealer wins. You lose $X' / 'Push! Bet returned.'), tone. phase 'settled'.
- `NEW_ROUND`: phase 'betting', bet 0, hands/dealer cleared, message 'Place your bet and deal!'.
- `SHOW_HINT`: hintShown = true.
- `RESET_BANK`: bank = 500 (message 'Bankroll reset to $500.').
- **Coach mode:** on every HIT/STAND/DOUBLE/SPLIT action, before applying, capture the optimal move for the active hand (`lastOptimal`); after applying, if the chosen move ≠ optimal and phase still 'player', set `coachFeedback = 'You hit. Optimal: Stand — hard 12 vs 4.'`-style string (reuse the reason). Increment `totalPlays`; increment `optimalPlays` when match. Note: Double is optimal "Double" — matching is exact on the Move string; Split optimal implies the pair rule.
- All hiLo/cardsSeen updates go through one internal `draw(state): Card` helper that mutates a draft and returns the card.

Tests (seeded rng `rngFrom('1729', 'blackjack')`), written first:
1. Deal from betting with bet 0 → message 'Place a bet first!', phase stays betting.
2. Deal draws 2+2 cards, runningCount = sum of hiLo of the 4 cards, phase 'player' (unless natural — with seeded rng, first deal is deterministic; assert on the actual state: `cardsSeen === 4`).
3. HIT adds a card to active hand and updates count/cardsSeen.
4. Bust path: construct state directly (don't rely on rng): `{...initial, phase:'player', hands:[{cards:[K,6,9],…}]}` → HIT that draws 10... simpler: build a hand at 21 risk: HIT action on hand [K,6] with seeded shoe — deterministic; assert eventual bust settles with bank reduced by bet.
5. Split flow: hand [8♠,8♥], bet 100, bank 500: SPLIT → 2 hands, bank 400, each hand has 2 cards; playing first hand HIT/STAND advances to second; after both, dealer plays and both settle. Assert bank delta equals sum of per-hand results (recompute independently in the test from the final cards).
6. Split aces auto-stand: [A♠,A♥] SPLIT → both hands status 'stood' immediately.
7. Double: hand [5,6], bet 100, bank 500: DOUBLE → bank 400, hand.bet 200, 3 cards, then dealer settles; net result = ±200 or 0 (recompute).
8. Natural blackjack pays 3:2 (bank +150 on bet 100) and round settles.
9. Reshuffle: state with shoe.length < 52, phase 'betting' → DEAL → newShoe true, runningCount reset to count of the 4 new cards, cardsSeen 4.
10. Dealer stands on soft 17: dealer [A,6] → dealer total stays 17 (dealer does not hit).

**Steps:** write tests → fail → implement → pass → commit `feat: blackjack reducer — full game flow with working split`.

### Task 8: Blackjack UI

**Files:**
- Create: `src/components/games/blackjack/{BlackjackGame,PlayTable,PlayingCard,ChipRow,ActionBar,CountHUD,MessageBox,HintBox,ScenarioPanel,CountTrainerPanel,StrategyChartPanel,StrategyTable}.tsx`
- Create: `src/app/games/blackjack-trainer/page.tsx`
- Create: `src/hooks/useBlackjackGame.ts` (in hooks dir alongside existing hooks)

`useBlackjackGame(seed)`: `useReducer(reducer, initialState)` where the reducer is built once per seed with `useMemo(() => createBlackjackReducer(rngFrom(seed, 'blackjack')), [seed])`; exposes `{ state, dispatch }`; persists bank to localStorage (load on mount via lazy initializer that reads localStorage if `typeof window !== 'undefined'`, save on bank change via effect); persists count-trainer stats + scenario best likewise.

UI specs:
- **BlackjackGame** ('use client'): tab bar via SegmentedControl — Play / Scenarios / Count / Chart. Renders the active panel. Felt colors are game-scoped constants (dark in both themes): `--felt: #0d3d2b; --felt-light: #145038; --felt-rim: #0a2e1f; --gold: #c9a84c` in a local stylesheet `felt.css`. Tabs + non-table UI use site tokens (theme-aware).
- **PlayTable**: the felt — `rounded-xl` felt gradient radial, inner gold hairline border (1px, `border-radius: inherit`-ish inset), dealer zone top (label `DEALER` mono gold/50, hidden card = site-styled card-back with a brass diamond pattern — NOT the prototype's blue), center: CountHUD (running/true/decks as 3 mono cells on translucent dark), MessageBox (`aria-live="polite"`, tone colors: win=green `#27ae60`, lose=red, push=gold), HintBox (coach feedback + optional "Optimal: X — reason" when hintShown). Player zone: two hands when split (active hand gets a brass underline indicator), bet area (ChipRow: $5/$10/$25/$100 — circular buttons, colors: rust/steel-blue/patina/ink with gold dashed border; `addBet`), ActionBar (Deal primary, Hit/Stand ghost, Double/Split ghost (disabled unless legal), Clear danger, Reset bank ghost sm, Hint ghost). Card values via CountHUD.
- **PlayingCard**: 60×86 white card, Newsreader rank + suit glyph, red suits rust-red; `motion.div` initial `{ opacity: 0, y: -24, rotate: -8 }` animate to settle, `layout` for reflow; respects `useReducedMotion` (site has the hook — verify name; framer-motion's `useReducedMotion` if not).
- **ChipRow/CountHUD/MessageBox/HintBox/ActionBar**: as above, all real `<button>`s with aria-labels ("Bet $5", "Hit — H").
- **Keyboard shortcuts:** window keydown listener: h→HIT, s→STAND, d→DOUBLE, p→SPLIT (only when legal/enabled); guard `e.target instanceof HTMLInputElement`.
- **ScenarioPanel**: port of prototype scenarios: card per scenario (question, mini cards vs dealer card, option buttons), correct/wrong states (patina border vs rust border), explanation reveal, score `X / Y` mono readout; reshuffle button.
- **CountTrainerPanel**: port: deals 4–8 cards (uses its own seeded rng), input for running count of the batch, check → per-card +1/0/−1 tags, correct/wrong/streak stats, Hi-Lo reference row. Auto-advance after 2s (clear timeout on unmount).
- **StrategyChartPanel**: renders HARD/SOFT/PAIR tables from chart.ts via generic **StrategyTable** — mono 11px cells, H=rust, S=green `#27ae60`, D=amber `#f39c12`, P=purple `#8e44ad` (prototype palette is fine on white cells), header row dark, row-label column dark with gold text; `overflow-x-auto` wrapper; legend row of dots. Cells tooltip the reason via `title` attr.
- **page.tsx**: metadata (`title: 'Blackjack Trainer — Games'`, description), header per GameShell, `<BlackjackGame />` with `'use client'` boundary inside.

**Steps:** implement components + hook + page → `npx tsc --noEmit` PASS → manual sanity via `npm run dev` + browser check later (defer to final verification phase) → commit `feat: blackjack trainer UI — felt table, coach mode, scenarios, count trainer, charts`.

---

## Phase 3 — The seven Bench games

Common pattern per game: pure engine module + tests first, then a single `'use client'` game component using GameShell pieces + page wrapper with metadata. Every page gets: eyebrow `GAME 0N · CATEGORY · measures: X`, seed bar (GameShell), Readout, CalibratedGauge where the prototype had one, and a How-it-works details block (prototype copy, lightly edited for the site's voice).

### Task 9: Tokenizer Golf

**Files:**
- Create: `src/lib/games/tokenizer-golf/tokenizer.ts` (port COMMON/SUB/PRE/splitWord/chunkDigits/tokenize/count verbatim, typed), `data.ts` (CORPUS + GOLF arrays)
- Test: `tokenizer.test.ts`
- Create: `src/components/games/tokenizer-golf/TokenGolfGame.tsx`, `src/app/games/tokenizer-golf/page.tsx`

Tests (write first):
- `tokenize('The quick brown fox jumps over the lazy dog.', 'bpe')` — snapshot count from the ported code after a hand-run: assert exact length and that first token is `'The'`, and tokens for `'lazy'` stay one token (common word).
- Digits: `tokenize('123456789', 'bpe')` → 3 tokens (chunk 3); `'sp'` → 9 tokens (1 digit each); leading-space binding: `tokenize(' foo', 'bpe')` first token `' foo'` vs `'sp'` → `'▁foo'`.
- URL/punctuation: `'https://vnykzhub.com/blog'` token count > 5 (shatters).
- Golf par check: `count(GOLF[0].text, 'bpe') > GOLF[0].par` (par is beatable by editing — the original text is over par; if it isn't, adjust data, but verify behavior: assert `count(original) >= par` to keep the game honest — during implementation, if the ported count comes out under par, bump the par in data to `count − 1` and note it).
- Determinism: same input twice → same output.

UI (build upon): SegmentedControl for the three modes (Guess / Golf / Compare) with per-mode content:
- Guess: current string in a panel (`bg-[var(--panel)] mono text-sm rounded-sm p-4`), number input + "Lock in" (GameButton primary); after answer: token chips row (alternating `bg-[var(--accent-1)]/10` and `bg-[var(--accent-2)]/10` rounded mono chips with `·` for spaces), verdict line `actual N · you M · chars÷4 K` with brass/patina coloring, Next button; progress "round 3/6" in Readout; MAE numbers + gauge (you vs ÷4: `1 − min(mae,25)/25`).
- Golf: prompt select (GameSelect), textarea (site-styled), live meter `N / par P — under par` (patina when under), chip view live; Readout: par/yours/original/saved %.
- Compare: textarea; two columns (bpe vs sp) with chip views and token counts; Readout: both counts, divergence, chars; gauge bpe vs sp.
- Readout + gauge from shared components. How-it-works: the prototype's approximation explanation, lightly edited.

**Steps:** tests → fail → port engine → pass → UI + page → typecheck → commit `feat: tokenizer golf — segmentation instrument`.

### Task 10: Next-Token Duel

**Files:**
- Create: `src/lib/games/next-token-duel/data.ts` (port P array verbatim, typed), `scoring.ts`
- Test: `scoring.test.ts`
- Create: `src/components/games/next-token-duel/DuelGame.tsx`, `src/app/games/next-token-duel/page.tsx`

scoring.ts:

```ts
export const PICK_CONF = 0.70
export const bits = (q: number) => -Math.log2(q)
export const pickQ = (correct: boolean, numOptions: number) => correct ? PICK_CONF : (1 - PICK_CONF) / (numOptions - 1)
export const perplexity = (avgBits: number) => Math.pow(2, avgBits)
```

Tests: `bits(0.7) ≈ 0.5146` (±1e-4); `bits(0.075) ≈ 3.7370`; `pickQ(true, 5) === 0.7`, `pickQ(false, 5) === 0.075`; every step in data: 5 options, probs sum ≈ 1 (±0.02 — prototype probs are rounded), correct index in range; all 7 passages have 4 steps.

UI: passage flow with genre eyebrow (`contract boilerplate · passage 1 of 4`), context text in a mono panel with `⏎`/`·` shown as subtle marks, 5 choice buttons (GameButton ghost, mono, keyboard 1–5 shortcuts); reveal: horizontal distribution bars — truth bar patina, your wrong pick bar brass, others rule; verdict line `hit/miss · you paid X bits · model paid Y bits`; Continue; Readout: token n/16, your bits/tok (brass), model bits/tok (patina), your perplexity, hit rate; gauge: `1 − min(bits,4)/4` each side; final screen: winner sentence + both perplexities + reseed hint.

**Steps:** tests → fail → implement → pass → UI + page → typecheck → commit `feat: next-token duel — perplexity instrument`.

### Task 11: Kelly Run

**Files:**
- Create: `src/lib/games/kelly-run/kelly.ts`
- Test: `kelly.test.ts`
- Create: `src/components/games/kelly-run/{KellyGame,LogChart}.tsx`, `src/app/games/kelly-run/page.tsx`

kelly.ts:

```ts
export const ROUNDS = 20, START = 100, CAP = 0.60
export const posterior = (heads: number, tails: number) => (heads + 1) / (heads + tails + 2)
export const kellyFraction = (p: number) => Math.max(0, Math.abs(2 * p - 1))
export const kellySide = (p: number): 'H' | 'T' => (p >= 0.5 ? 'H' : 'T')
export const capFraction = (f: number) => Math.min(CAP, f)
```

Tests: `posterior(0,0)=0.5`, `posterior(3,1)=2/3`, `posterior(0,3)=1/3`; `kellyFraction(0.5)=0`, `(0.6)=0.2`, `(0.75)=0.5`; `capFraction(0.9)=0.6`; `kellySide` at 0.5 → 'H'.

UI: left card = LogChart (**SVG, theme-aware**, replacing the prototype's hardcoded canvas colors): props `{ you: number[], bot: number[], start: number }` — log-scaled y, you=brass line, bot=patina line, dashed `var(--rule)` line at start, y-axis "log bankroll" mono 9px label, `viewBox` responsive via `preserveAspectRatio="none"` + vector-effect non-scaling-stroke (or fixed internal coordinates w/ width 100%); stake GameSlider 0–60% with mono % readout; buttons: "Bet on heads" (primary), "Bet on tails" (ghost), "Sit out" (ghost); right card = ledger (mono 12px log, newest first, brass lines for your winning flips). Readout: flip n/20, your bankroll (brass/bad), kelly bot (patina), posterior p̂, kelly stake; gauge: your bankroll vs bot (normalized vs max). Finish screen: verdict box (rust/patina border) — "The coin was 0.612 heads. You finished at 214, the bot at 331." + "Run again" button. Betting works even after you know — the run ends at 20 flips or ruin.

**Steps:** tests → fail → implement → pass → UI + page → typecheck → commit `feat: kelly run — bet-sizing instrument`.

### Task 12: Descent Golf

**Files:**
- Create: `src/lib/games/descent-golf/surfaces.ts`
- Test: `surfaces.test.ts`
- Create: `src/components/games/descent-golf/{DescentGame,Heatmap}.tsx`, `src/app/games/descent-golf/page.tsx`

surfaces.ts — port LEVELS verbatim (4 surfaces with f, g, start, target, par, budget, dom) + optimizer step functions pure:

```ts
export interface Surface { name: string; par: number; budget: number; dom: [number, number, number, number]; target: number; f: (x: number, y: number) => number; g: (x: number, y: number) => [number, number]; start: [number, number] }
export interface OptState { x: number; y: number; vx: number; vy: number; mx: number; my: number; sx: number; sy: number; t: number }
export function stepSGD(s: OptState, lr: number, gx: number, gy: number): OptState
export function stepMomentum(s, lr, gx, gy): OptState   // v = 0.9v + g; x -= lr·v
export function stepAdam(s, lr, gx, gy): OptState       // β1 .9, β2 .999, ε 1e-8, bias-corrected
```

Tests (write first): finite-difference gradient check — for each surface, at 5 pseudo-random points (seeded rng), `|g_i − (f(x+ε)−f(x−ε))/2ε| < 1e-3` for ε=1e-6; Adam one-step math: after 2 steps on the ravine, `s.t === 2` and `x < start.x` at lr 0.01; momentum: `vx` accumulates `gx` then `0.9v+g`; SGD with lr 0.05 on ravine from its start stays finite (bounded iteration test: 100 steps, |x|,|y| < 1e4).

UI: controls row (GameSelect surface with pathology names; GameSelect optimizer; GameSlider lr 10^[−4..0] log steps, mono readout; Run primary / Reset ghost / **Step** ghost — NEW: single-step study mode, the prototype only runs continuously); Heatmap canvas (port `buildField`/`draw` verbatim — the heatmap math is correct; restyle: brass path, patina target marker, mono labels; DPR-capped at 2 like the site's 3D canvas); message line; Readout: steps/par/loss/lr/status; gauge: you vs par (`1 − min(steps,budget)/budget`). How-it-works: condition-number explanation.

**Steps:** tests → fail → implement → pass → UI + page → typecheck → commit `feat: descent golf — optimizer instrument`.

### Task 13: Connect Four

**Files:**
- Create: `src/lib/games/connect-four/engine.ts`
- Test: `engine.test.ts`
- Create: `src/components/games/connect-four/{ConnectFourGame,Board}.tsx`, `src/app/games/connect-four/page.tsx`

engine.ts — port board/play/undo/wins/evaluate/negamax/think verbatim (typed, `Int8Array` board, ORDER center-outward), plus:
- `export function findWinLine(b: Int8Array, r: number, c: number, p: number): [number, number][] | null` — NEW: returns the 4 winning cells or null (for the win-line highlight).

Tests (write first):
1. `wins` detects horizontal/vertical/diagonal 4s; no false positive on 3.
2. Engine finds the immediate winning move (board with 3 AI in a column + human elsewhere): `think()` at depth 3 returns the winning column.
3. Engine blocks an immediate human threat (3 humans in a row with one empty): best column = the blocking column (evaluate's −70 weight guarantees this at depth ≥ 3; assert at depth 3).
4. Pruning efficiency: same position, depth 4, `think` with prune vs without → both return a legal column and pruned `nodes ≤` unpruned `nodes` (strictly less expected; assert `≤`).
5. `findWinLine` returns exactly 4 cells for a win, null for non-win.
6. Full column: `canPlay` false; `play` returns −1.

UI: Board component — 7 column buttons with hover drop-preview (render a faint brass circle in the lowest empty row of the hovered column via onMouseEnter state; keyboard focus shows same), 42 circles (human brass, AI patina, empty `var(--panel-2)`), last-move ring, win-line cells get a ring + slight scale (framer-motion). Controls: depth GameSlider 1–7 (mono readout), pruning checkbox (site-styled, brass accent), "New game" (GameButton). Right card: per-column evaluation bars (site-styled, best column patina) + node count; message line. Readout: depth / nodes searched (patina) / search time / pruning on|off / to move. How-it-works: the alpha-beta + node-count explanation.

**Steps:** tests → fail → implement → pass → UI + page → typecheck → commit `feat: connect four — search instrument`.

### Task 14: Entropy Wordle

**Files:**
- Create: `src/lib/games/entropy-wordle/engine.ts` (WORDS list + pattern + entropyOf + bestGuess, ported verbatim, typed)
- Test: `engine.test.ts`
- Create: `src/components/games/entropy-wordle/WordleGame.tsx`, `src/app/games/entropy-wordle/page.tsx`

Tests (write first):
1. `pattern('crane', 'crane')` → code 242 (all green), `res` all 2.
2. Duplicate-letter correctness: `pattern('speed', 'sleep')` → s→green, p→grey, e→green (pos 3), e→yellow (pos 4), d→grey → `res = [2,0,2,1,0]`.
3. `pattern('abbey', 'babes')` style multi-letter: hand-check one more and snapshot.
4. `entropyOf` of a constant-candidate set is 0; entropy of a guess that splits n candidates into k buckets equals −Σ(nᵢ/n)log₂(nᵢ/n) (recompute in test from `pattern` directly for a 10-word subset).
5. `bestGuess` returns a word from the pool with max-or-near-max entropy; when ≤2 candidates remain, returns a candidate word.
6. `WORDS` has ≥ 200 entries, all length 5, all lowercase unique.

UI: tile rows (38px→ site-styled 44px tiles, framer-motion flip: `initial rotateX 90 → animate 0`, color: green→patina, yellow→brass, grey→panel, border rule, mono bold), input + Guess primary + "Play the optimal guess" ghost (calls submit(bestGuess)), message line; Information ledger (mono log: `CRANE → 3.21 bits · best was SLATE 5.87 · 1298 → 118 left`); Readout: guess n/6, candidates left, bits you got (brass), solver expected (patina), vs solver; gauge: you vs solver over cap; win/lose message with the luck line. How-it-works: entropy explanation.

**Steps:** tests → fail → implement → pass → UI + page → typecheck → commit `feat: entropy wordle — information instrument`.

### Task 15: Interrogation Room

**Files:**
- Create: `src/lib/games/interrogation-room/case.ts` (port generator + question/answer logic pure, no DOM; inject rng)
- Test: `case.test.ts`
- Create: `src/components/games/interrogation-room/InterrogationGame.tsx`, `src/app/games/interrogation-room/page.tsx`

case.ts — port from the prototype: CAST, SCENE, ELSEWHERE, TURNS=8; `generateCase(rng) → Case` (people with name/role/guilty/loc/cover/saw; witness anchor guaranteed), and pure answer logic: `ask(c: Case, who: number, q: 'where'|'saw'|'vouch'|'confront', other?: number, rng) → { line, tone, revealed: KnownFact[], broken?: boolean }` returning the template string exactly as the prototype (templates ported verbatim — the phrasing layer is the prototype's; no LLM in V1 per its own note).

Tests (write first, seeded rng):
1. `generateCase` invariants over 50 seeds: 3 people, exactly 1 guilty, guilty has non-null cover ≠ loc, every person's loc defined, at least one innocent saw the guilty at SCENE (solvable), all names/roles distinct.
2. `ask 'where'` on the guilty returns their cover (not SCENE); on innocents returns their loc.
3. `ask 'saw'` on an innocent with a sight reveals it; on the guilty with a harmless sight reveals the harmless one only (never the SCENE sight... verify against ported logic — assert the returned line doesn't contain the culprit's real location for the guilty's answer).
4. `confront` without an on-record SCENE sight → no break, line is a deflection; with one on the guilty → `broken: true`; with one on an innocent → denial, no break.
5. `vouch` on someone the speaker saw → confirmation line; otherwise "can't place them".

UI: left card — suspect cards (site-styled: name strong, role muted, claims chip: `no statement on record` → after asking, their claimed location in mono; selected = brass border), question GameSelect, target select for vouch, Ask (primary), accuse row (one GameButton per suspect, ghost; rust when game over); question dots: 8 dots (filled = used; last 2 rust). Right card — transcript log (mono, speaker names colored: suspect statements `text-[var(--ink-soft)]`, machine-toned truths patina, verdicts rust, BRIEF entry patina); "Open the ledger (ends the case)" ghost button; ledger render = dossier block (`bg-[var(--panel)] border-[var(--rule)] mono text-xs`). Readout: questions left / suspects / claims on record / case status. Message line for state hints. How-it-works: the truth-firewall explanation (edited).

**Steps:** tests → fail → implement → pass → UI + page → typecheck → commit `feat: interrogation room — deduction instrument`.

---

## Phase 4 — Verification & polish

### Task 16: Full verification pass

- [ ] **Step 1:** `npx tsc --noEmit` → PASS
- [ ] **Step 2:** `npx vitest run` → all tests PASS
- [ ] **Step 3:** `npm run lint` → fix any new lint errors (only in our files)
- [ ] **Step 4:** `npm run build` → PASS (production build catches SSR/hydration issues; every game page is a client component inside a server page)
- [ ] **Step 5:** Browser smoke test via `npm run dev` + playwright MCP: visit `/games`, each of the 9 game pages; verify: header/footer render, no console errors, each game's primary interaction works (deal a hand, guess a token count, answer a duel question, flip a kelly coin, run descent, play a c4 move, guess a wordle word, ask an interrogation question, KC loads), light/dark toggle doesn't break games, mobile viewport (375px) scrolls and plays.
- [ ] **Step 6:** a11y quick pass: all interactive elements are buttons with accessible names; gauges aria-hidden; message boxes aria-live.
- [ ] **Step 7:** Final commit:

```bash
git add src/app/games src/components/games src/lib/games src/screens/GamesHub.tsx src/hooks/useBlackjackGame.ts src/data/navigation.ts src/app/lab/page.tsx public/sitemap.xml
git commit -m "feat: games section — 9 live games with pure tested engines"
```

- [ ] **Step 8:** Report to the user: what shipped, what was improved per game, what was left uncommitted (their lab work), test/build status.

---

## Self-review notes (executor readme)

- **Spec coverage:** blackjack spec sections 1–6 → Tasks 4–8 (+16); game_ideas analysis → Tasks 9–15; KC move + hub → Task 4; testing/CI → Tasks 1, 5–7, 9–15.
- **Consistency:** `CalibratedGauge` props (`human/machine` 0–1) used identically in Tasks 9–15; `GameShell` props fixed in Task 3; reducer action names match `useBlackjackGame` dispatch in Task 8; `findWinLine` added in Task 13 and consumed by Board in the same task.
- **Known deliberate changes from prototypes (documented):** strategy tables/engine made mutually consistent per standard 6-deck S17 (prototype disagreed with itself in 3 soft cells); Duel passage count: game uses 4 passages per run as the prototype does; Kelly chart canvas→SVG for theming; Descent gains a Step button; C4 gains win-line highlight; Wordle gains tile flip animation; Interrogation keeps template phrasing (LLM phrasing layer explicitly out of scope, per its own note).
- **Uncommitted lab work:** never stage `src/app/lab/**` beyond the lab/page.tsx edit, `src/game/` (moved by us — intentional), `package.json` only for vitest additions (careful: `npm i -D vitest` will also touch the already-modified package.json/lock — acceptable, they already contain the pixi/web-llm modifications and we're adding to them; the commit message must mention only vitest).
