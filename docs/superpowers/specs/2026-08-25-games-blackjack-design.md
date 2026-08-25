# Design: Games Section + Blackjack Trainer

**Date:** 2026-08-25
**Status:** Approved by user ("ok proceed.")
**Source material:** `pending integration/games/blackjack-trainer.html` (1,295-line vanilla JS prototype) — treated as an idea to build upon, not a spec to copy.

---

## Context

vnykzhub.com is a Next.js 15 portfolio site (App Router, `src/` layout, Tailwind 3.4, framer-motion, `data-theme` theming via next-themes).

**Working tree:** `VnykzHub.github.io/` — the git repo (`main`, origin `VnykzHub/VnykzHub.github.io`) and what CI deploys from. `VnykzHub-next/` is a stale non-git copy; do not build there.

**Repo state caveat:** the repo contains uncommitted work from a previous session — a full `/lab` section (`src/app/lab/`, engine at `src/game/`), a Lab nav item, and `pixi.js`/`@mlc-ai/web-llm` deps. We build on top of this state and commit only what we create; the unrelated uncommitted lab work stays untouched (not swept into our commits).

**Constraint (user decision):** games do NOT live under `/lab` — the lab is a separate, future-redefined section. Games get their own `/games` section. Kindergarten Chaos, currently a game inside the lab, moves to `/games` as part of this work.

The blackjack prototype has 4 tabs — Play (full game with Hi-Lo count display and an optimal-move hint engine), Scenarios (8 strategy quizzes), Count (Hi-Lo trainer), Chart (basic strategy tables). Known defect in the prototype: `playerSplit()` is a broken stub (second hand never played, extra bet silently lost). Google Fonts `@import` must not carry over — the site uses @fontsource.

## Decisions (already made with the user)

| Decision | Choice |
|---|---|
| Working tree | `VnykzHub.github.io` (the git repo) |
| Kindergarten Chaos | Move from `/lab/kindergarten-chaos` to `/games/kindergarten-chaos` |
| Integration approach | Full React/TypeScript rewrite (no iframe, no inline HTML) |
| Scope | Full games hub + complete blackjack trainer (all 4 tabs) |
| Split | Implement properly: single split, two hands sequentially, one card per split Ace, DAS allowed, no resplitting |
| Route naming | `/games` hub, `/games/blackjack-trainer` game |

## 1. Routes & site integration

- **`src/app/games/page.tsx`** — Games hub. Grid of game cards (title, tagline, tech tags, Play CTA), following the lab hub's card design language. Contents:
  - **Live:** Blackjack Trainer (new), Kindergarten Chaos (moved).
  - **Planned** ("Soon" badge, non-link): Context Window Tetris, Prompt Telephone — entries carried over from the lab's GAMES array.
- **`src/app/games/blackjack-trainer/page.tsx`** — the blackjack game. Client component; follows the page → screen/component pattern.
- **Kindergarten Chaos move:**
  - `src/app/lab/kindergarten-chaos/` → `src/app/games/kindergarten-chaos/`
  - `src/game/` (GameEngine.js, config.js, placeholders.js) → `src/lib/games/kindergarten-chaos/`; update GameClient's dynamic import (`@/game/GameEngine` → `@/lib/games/kindergarten-chaos/GameEngine`)
  - Update KC page metadata: title `… — Games`, eyebrow `Games / Arcade`
- **Lab page cleanup:** remove the GAMES array and Games section from `src/app/lab/page.tsx` (plus now-unused imports: `Swords`, `Gamepad2` — `Brain` stays if still used by Demos). Demos section untouched. Lab's future redefinition is out of scope here.
- **Nav:** add `Games` item to `src/data/navigation.ts` (`kind: 'route'`, `href: '/games'`, `Gamepad2` icon). Note the file already has an uncommitted Lab item — we edit on top.
- **Metadata:** both new pages export `metadata` (title/description) using the site template (`%s — Vinayak Mathur`).

## 2. Pure engine — `src/lib/games/blackjack/` (no DOM, no React)

| Module | Contents |
|---|---|
| `types.ts` | `Card { rank, suit }`, `Hand`, `Move`, `GamePhase`, split-hand types |
| `shoe.ts` | `buildShoe(numDecks = 6)`, Fisher–Yates shuffle, `draw()`, `decksRemaining`. Reshuffle only **between rounds** when fewer than 52 cards remain; resets running count; exposes a `newShoe` flag for the UI to announce. |
| `counting.ts` | `hiLo(rank)`: 2–6 → +1, 7–9 → 0, 10/J/Q/K/A → −1 |
| `hand.ts` | `cardValue`, `handTotal` (ace-softening loop), `isBlackjack`, `isPair`, `isSoft`, `handLabel` |
| `strategy.ts` | `getOptimalMove(hand, upcard) → { move, reason }` — ported from the prototype's engine and verified against `chart.ts` by tests |
| `reducer.ts` | Pure state machine: `betting → dealing → playerTurn → dealerTurn → settling`. Implements the working split (single split, two hands played sequentially, split Aces get one card each, DAS allowed, no resplit, split 21s are 21 not blackjack). Dealer stands on all 17s (S17), blackjack pays 3:2. |
| `scenarios.ts` | The 8 quiz scenarios + explanations as typed data |
| `chart.ts` | Hard / soft / pair strategy tables as data, rendered by a generic table component |

## 3. React layer

- **`src/components/games/blackjack/`**: `GameShell` (tabs), `PlayTable` (felt + dealer/player zones), `PlayingCard` (framer-motion deal animation), `ChipRow`, `ActionBar`, `CountHUD`, `MessageBox`, `HintBox`, `ScenarioPanel`, `CountTrainerPanel`, `StrategyChartPanel`, plus a generic `StrategyTable`.
- **`src/screens/GamesHub.tsx`** — hub screen following existing `src/screens/` conventions (uses `Container`, `Section`, `Eyebrow`, `Heading`, `Card` primitives where they fit).
- **State:** one `useBlackjackGame` hook on `useReducer` (reducer imported from the engine). No zustand — single page doesn't need cross-component stores.
- **Betting:** chips $5 / $10 / $25 / $100, starting bankroll $500 (both carried over from the prototype). Double/Split require bankroll to cover the extra stake.
- **Count HUD:** the Play tab keeps the running count / decks left / true count display from the prototype — it's the trainer's core gimmick.
- **Persistence:** bankroll, count-trainer stats (correct/wrong/streak), scenario best score in `localStorage`; SSR-safe (load in `useEffect` after mount). Reset bankroll button.
- **Theming:** felt table stays dark in both site themes (same rationale as the dark-mode-only 3D canvas — it's a physical casino table). Page chrome (nav/footer) follows the site theme. Felt/gold/chip colors are game-scoped CSS variables in the component stylesheet, not global tokens.
- **Fonts:** Playfair Display → Newsreader (card ranks), Inter → Space Grotesk (UI), JetBrains Mono → IBM Plex Mono (numbers). No external font import.
- **a11y:** real `<button>` elements (prototype uses div-onclick chips), `aria-live` on the message box, keyboard shortcuts H/S/D/P, visible focus states.

## 4. Improvements over the prototype

1. Working split (see reducer).
2. **Coach mode:** hint only on demand via a **Hint** button; post-action feedback when the player deviates from optimal ("You hit. Optimal: Stand — hard 12 vs 4"); strategy-accuracy counter. (Prototype always shows the hint, defeating training.)
3. Deal animations via framer-motion; subtle win/lose styling on the message box.
4. Reset bankroll button instead of "refresh to restart".
5. New-shoe indicator when the count resets.
6. Chart–engine consistency: tests assert every (hand, upcard) cell of the strategy tables agrees with `getOptimalMove`.

## 5. Testing & CI

- Add **vitest** as a dev dependency (repo currently has no test runner) for the pure engine:
  - shoe: build, shuffle distribution sanity, reshuffle-at-threshold, count reset
  - hand: totals with multiple aces, soft totals, blackjack detection
  - counting: hiLo values
  - strategy: `getOptimalMove` vs the full chart for every (hand, upcard) cell
  - reducer: full game flows, split flow (both hands), double, blackjack payouts, dealer S17
- Add a `test` job to the existing GitHub workflow (currently typecheck + build).

## 6. Out of scope (V1)

Insurance, surrender, resplitting, sound effects, multi-hand beyond single split, more scenarios, continuous/speed count mode, analytics events. Scenario data file makes extending easy later. Lab redefinition beyond removing its Games section.

## File map (planned)

```
src/app/games/page.tsx                       # hub (new)
src/app/games/blackjack-trainer/page.tsx     # game route (new)
src/app/games/kindergarten-chaos/            # moved from lab
src/screens/GamesHub.tsx                     # hub screen (new)
src/components/games/blackjack/*.tsx         # game UI components (new)
src/lib/games/blackjack/*.ts                 # pure engine (new)
src/lib/games/kindergarten-chaos/*           # moved from src/game/
src/app/lab/page.tsx                         # remove GAMES section (edit)
src/data/navigation.ts                       # + Games nav item (edit)
```
