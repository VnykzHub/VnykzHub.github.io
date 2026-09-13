# ApiaryApex — Research, Full-Scale Plan, and What Shipped

**Origin:** the user ideated an "endless 3D Predator vs. Prey" simulation (2 hunter bees, 1 survivor bee, procedurally infinite terrain, daily self-play retraining loop) and supplied a technical spec (architecture diagram, agent sensory/reward design, terrain streaming pseudocode, a client-side `TelemetryHarvester`). This doc records the feasibility research against *this* repo's actual stack, the full-scale architecture that spec implies, the minimal version proposed and built instead, and the upgrade path from one to the other.

**Repo reality check that shapes everything below:** despite the `.github.io` repo name, this is a Next.js 15 App Router site deployed on **Vercel**, with **Supabase** already wired in (contact form, newsletter). That matters: the original spec hedges on "static host vs. real backend" — here there already *is* a real backend, so the telemetry-sync and nightly-retrain phases are things this project could plausibly grow into, not hypothetical.

---

## 1. Research: is the spec's stack real, and does it fit here?

| Component (spec) | Verdict | Notes |
|---|---|---|
| Three.js rendering | ✅ already a dependency (`three@0.179`), plus `@react-three/fiber` + `@react-three/drei` + `@react-three/postprocessing` — the site's Hero canvas already uses this exact stack. | Zero new deps for rendering. |
| Rapier.js (WASM) physics | ⚠️ plausible, not present | `@react-three/rapier` is a thin, well-maintained wrapper (~2 MB gzipped WASM). Real joint torques/collision are a genuine upgrade over hand-rolled kinematics, but v1 doesn't need it — steering behaviors over simple circle-obstacle math get 90% of the *visual* payoff at 0% of the integration risk. Deferred to Phase 3. |
| WebGPU + ONNX Runtime Web (in-browser inference) | ⚠️ real, but non-trivial | The site already ships one WebGPU feature (`/lab`'s WebLLM chat), so the capability and the fallback story (WASM EP when WebGPU is unavailable — Safari, older mobile) are proven patterns here. Running a small PPO policy network through `onnxruntime-web` is realistic; running *training* client-side is not attempted anywhere in the spec and shouldn't be — inference only. Deferred to Phase 2/3. |
| Procedural Perlin/simplex terrain | ⚠️ spec says noise, v1 uses hashed scatter | True Perlin/simplex buys smooth elevation; for "obstacles scattered endlessly, deterministic per chunk," a seeded hash per chunk (this repo's existing `rngFrom` — already used by 9 other games) is simpler, dependency-free, and just as deterministic. Real heightmap noise is a Phase 3 terrain upgrade once Rapier gives agents something to climb. |
| Stable-Baselines3 self-play (nightly retrain) | ⚠️ real, but not a Vercel job | A Vercel serverless function cannot run a multi-minute Python PPO loop (no GPU, hard execution-time ceilings). The spec's own diagram is honest about this — "Backend & MLOps" is drawn as a separate box. Realistic home: a scheduled GitHub Actions run (free compute minutes, generous time budget) or a small external worker (Fly.io/Railway/Modal) triggered by a Vercel Cron hitting a webhook, with **Supabase as the shared handoff**: telemetry lands in a table, trained weights land in Supabase Storage. Deferred to Phase 4/5. |
| Client `TelemetryHarvester` → server ingest | ⚠️ real, deferred deliberately | The class in the spec is easy to build (it's in this repo now, see §4) — the part that's *not* trivial is the server side: an ingest endpoint needs rate limiting, payload validation, and an abuse story before it's safe to expose publicly, and every other game on this site advertises "no server, no inference calls" as a trust property. Shipping a live upload endpoint wasn't part of "build a minimal starting point" and would be a scope decision worth its own conversation, not something to slip in silently. v1's harvester buffers locally and never dials out. |

**Bottom line:** every piece of the spec is buildable in this repo. None of it requires new infrastructure decisions to *start* (Phase 1, this PR), and the parts that need real infrastructure decisions (a public ingest endpoint, a scheduled training job, a model-versioning story) are exactly the parts deferred to later phases rather than guessed at now.

---

## 2. Full-scale target architecture

```
CLIENT (Vercel-hosted Next.js page, runs 100% in the visitor's browser)
  Endless Chunk Loader  ──sync──  3D Physics (Rapier/WASM, Phase 3)
         │                              │  leg/wing torques
         ▼                              ▼
  Experience Replay (local)  ◄──►  WebGPU Brain (ONNX Runtime Web, Phase 2/3)
         │ batched telemetry (Phase 4)
         ▼
BACKEND (Supabase, already provisioned)
  telemetry table  ──nightly──►  external worker (GH Actions / Fly.io)
                                     runs Stable-Baselines3 PPO self-play
                                     exports ONNX weights
       ◄── versioned weights ────────────┘  (Supabase Storage)
CLIENT fetches latest weight version tag on load (Phase 5)
```

### Phasing

- **Phase 1 — Scripted spectacle (this PR).** Steering-behavior agents (pursuit-with-prediction, inverse-square flee, mutual separation, whisker-raycast obstacle avoidance), deterministic seeded chunk-streamed terrain, capture/respawn loop, chase camera. No backend, no learning, no network calls — matches every other game on this site. The reward formulas from the spec are computed every frame and fed into a local-only `TelemetryHarvester`, so the *shape* of Phase 2–5 already exists as a seam, not a rewrite.
- **Phase 2 — Swappable brains.** Introduce a `Brain` interface (`decide(observation) → action`) that the scripted steering already implicitly implements; add a `LearnedBrain` backed by `onnxruntime-web` (WebGPU EP, WASM fallback) that can run *any* exported policy net side-by-side with the scripted one (e.g. predators learned, prey scripted, for a controlled comparison). No training yet — just inference plumbing and a model-loading/caching story (versioned URL, `IndexedDB` cache).
- **Phase 3 — Real physics and richer terrain.** Swap hand-rolled circle-collision kinematics for `@react-three/rapier`: real joint torques for wings/legs (matches the spec's proprioception sensory input), ramps/tunnels/moving hazards agents must navigate physically, and upgrade terrain generation from hashed scatter to actual simplex-noise heightmaps now that there's a physics engine to walk on them.
- **Phase 4 — Telemetry leaves the browser.** A Supabase table (`apiary_telemetry`) behind a Vercel API route with schema validation, per-IP rate limiting, and an explicit opt-in/anonymity story (this is a genuine product decision, not just an engineering one — flagging it here rather than deciding it unilaterally). The existing `TelemetryHarvester.dispatch()` gets a real fetch call with `keepalive: true`, exactly as spec'd.
- **Phase 5 — The nightly loop.** A scheduled external job (GitHub Actions cron, most likely — free, generous timeout, easy to audit in-repo) pulls the day's batched telemetry from Supabase, runs bounded PPO fine-tuning rounds (Stable-Baselines3, self-play against a frozen snapshot of the current policy so it can't collapse against itself), exports the new policy to ONNX, and uploads it to Supabase Storage with a version tag. Clients fetch the latest tag on load — "wake up to a smarter bee" becomes literally true, on a schedule this repo's own tooling (not a hand-run script) drives.
- **Phase 6 — "Entertaining, not just correct."** This is the phase most likely to actually determine whether anyone watches for more than 10 seconds, and it's mostly not ML: a cinematic camera director that cuts between chase-cam/overhead/slow-mo on near-misses instead of one fixed follow-cam; proximity-driven ambient audio (tension rises as the gap closes); a day/night cycle; a live "today's captures / longest survival" ticker (cheap Supabase read, big perceived-liveness payoff); a "replay that near-miss" clip capture. Variable-ratio reinforcement (occasional spectacular near-escapes) is what makes chase footage compelling on its own merits — the RL loop makes the bees *better*, but pacing and camera are what make them *watchable*, and are worth investing in independently of how far the ML phases get.

---

## 3. Why Phase 1 is the right minimal version (not Phase 4 or 5)

The user's brief asked for "a starting point," and separately confirmed the intended shape: **all compute-heavy work stays client-side; the backend's only job is aggregating telemetry and syncing back improved weights.** Given that, the minimal version that's actually useful to build first is the one everything else plugs into:

- It's the only phase with zero new infrastructure decisions (no public endpoint to secure, no scheduled compute to provision, no model file to version) — so it ships in one session instead of being blocked on decisions about rate limits, storage costs, or training compute budget.
- It's immediately the actual deliverable: a genuinely endless, genuinely entertaining-to-glance-at 3D chase runs today, on the existing Vercel deploy, at zero marginal infra cost.
- It respects this site's existing trust line ("no server, no inference calls" — stated once for all 9 prior games, now true for the 10th too) rather than quietly breaking it to get a demo of telemetry upload working.
- Every later phase is additive to it: `Brain` swap-in (Phase 2) doesn't touch the terrain/camera/capture loop; Rapier (Phase 3) doesn't touch the reward math; a real ingest endpoint (Phase 4) is a `dispatch()` implementation swap, not a rewrite of the harvester.

---

## 4. What's implemented (this PR)

**New game:** `/games/apiary-apex`, registered in the Games hub under a new "Field" category ("agents against each other — you just watch").

```
src/lib/games/apiary-apex/
  vec2.ts           — 2D vector math (the world is x/z; y is terrain elevation + hover)
  config.ts         — all tunables: reward weights, pacing ramps, terrain/rivalry/
                       milestone constants, flight-animation gains
  terrainField.ts   — elevationAt/temperatureAt (deterministic value noise, no
                       library), elevationGradient, terrain speed multipliers,
                       temperatureColor
  terrain.ts        — chunkAt/buildChunk/chunksAround: seeded, cached, deterministic;
                       10 OBSTACLE_TYPES, each obstacle carries groundY from terrainField
  steering.ts       — fleeForce, pursueForce (lead prediction), separationForce,
                       obstacleAvoidForce (whisker raycasting), stepWander,
                       resolveObstacleCollisions (hard post-integration backstop)
  rewards.ts        — computeRewards() (per-catcher attribution) + applyMilestoneTick()
  simulation.ts     — createSimState/stepSimulation: fixed-timestep core; hunter
                       rivalry, terrain speed multipliers, collision resolution,
                       per-agent AgentStats, overtakes tracking, capture metadata
  telemetry.ts      — TelemetryHarvester (local ring buffer; dispatch() is a
                       documented no-op — see §1's table for why)
  *.test.ts         — 43 vitest cases: determinism, cross-seed variance, numerical
                       stability, reward/milestone correctness, respawn immunity,
                       obstacle-type variety, terrain field range/continuity, hard
                       collision resolution, zero-penetration over a 4000-step run
src/components/games/apiary-apex/
  Bee.tsx            — R3F bee mesh: role-colored, stripe band, antennae, a rear
                        stinger on hunters, danger-glow + capture-pulse handle
  ObstacleField.tsx  — 10 distinct obstacle geometries (boulder, pine, flower
                        cluster, mushroom, log, reeds, crystal, stump, bush,
                        honeycomb), each positioned at its terrain groundY
  TerrainField.tsx   — streamed per-chunk ground mesh, vertex-displaced by
                        elevation and vertex-colored by temperature, geometry
                        cached and disposed like terrain.ts's chunk cache
  AgentStatsTable.tsx — per-agent (Hunter A / Hunter B / Survivor) reward,
                        distance, and top-speed breakdown
  Scene.tsx          — Canvas, fixed-timestep loop driving the sim from a ref
                        (not React state — 60Hz physics stays off the render path),
                        turn-rate-limited yaw with bank/pitch flight animation,
                        spread-aware auto-framing chase camera (terrain-aware),
                        chunk-streaming trigger, capture flash + hunter pulse,
                        a Trail on the survivor, ambient Sparkles
  ApiaryApexGame.tsx — GameShell integration, HUD readout, pause control,
                       localStorage-persisted all-time best-survival/captures
src/app/games/apiary-apex/page.tsx
```

**Verified:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` (402 tests, repo-wide), `npm run build` all pass. Browser-checked via Playwright against the dev server: scene renders (bees, streaming obstacles, working chase camera), pause/resume freezes and resumes the sim clock, reseeding regenerates a visibly different — but for a repeat of the same seed, identical — terrain, telemetry buffer counter climbs and caps at 500, mobile viewport (390px) has no horizontal overflow, all-time records correctly persist across page reloads.

**Deliberately not done in v1** (all captured as later phases above, not forgotten): no Rapier physics, no ONNX/learned brain, no telemetry upload, no nightly retraining, no cinematic camera director or sound. The in-browser experience is honest about this — the "How it works" copy on the page itself says none of this is learned yet.

### Post-ship tuning pass (same session, iterating on user feedback loop)

Before any user testing, an empirical pass caught and fixed a real pacing problem: measured over long simulated runs, capture-to-capture gaps ranged from 2.8s (an instant re-catch right after a respawn) to 162s (a long dead stretch). Two self-resetting linear ramps fixed both tails — see `config.ts`'s `POST_CAPTURE_CONFUSION_*`, `TENSION_RAMP_*`, and `POST_RESPAWN_IMMUNITY` constants and their doc comments — bringing gaps to a consistent ~26-40s average with a ~50-100s worst case. Re-measured after the change, not just asserted.

Also shipped, all browser-verified:
- **Bee silhouettes.** Elongated bodies, a banding stripe, antennae, and a rear stinger cone on hunters only — reads as "bee" and as predator-vs-prey at a glance instead of plain colored spheres.
- **Auto-framing camera.** Distance and height now scale with how spread out the three agents are, so a fresh respawn (everyone far apart) pulls the camera back to keep the whole chase in frame, and a tight chase pushes in closer.
- **Persisted all-time records.** Best survival ever and total captures ever live in `localStorage` (same convention as the Blackjack Trainer's bankroll persistence) and show in the readout alongside the current session's numbers.
- **Motion trail + ambient pollen.** A fading trail follows the survivor (drei's `Trail`, driven by a ref updated in the physics loop rather than React state, so it's free of extra re-renders); `Sparkles` recentered on the pack's centroid each frame add atmosphere without ever drifting out of view as the world streams past.

None of this touches the phase boundaries above — it's all still Phase 1 (scripted, client-only, no network calls), just a materially more polished version of it.

### Gap analysis + feature pass (user playtest questions, same session)

Before the user could test locally, they asked direct questions about the running build — a useful gap analysis, since some answers exposed real bugs rather than just missing features:

- **Predators didn't chase each other** — confirmed correct: hunters only pursue the prey; the force between them is pure separation (no clustering), not mutual pursuit. Unchanged, but the user then asked for a *race* dynamic between them (see rivalry below).
- **Only one obstacle type existed** (a hex pillar) — confirmed gap, fixed: 10 types now (`terrain.ts`'s `OBSTACLE_TYPES`).
- **No terrain elevation or temperature** — confirmed gap, fixed: a full terrain field (below).
- **Obstacle avoidance was soft-only** — confirmed real bug: `obstacleAvoidForce` is a predictive nudge, not a hard boundary, so a sharp turn or two competing forces could shove an agent visibly into geometry with zero consequence. Fixed with `resolveObstacleCollisions` (steering.ts) — a post-integration penetration check that pushes the agent back to the surface and kills only the inward velocity component (a slide, not a stop). Verified with a 4000-step test asserting zero penetration against real chunk obstacles, not just a unit-level check of the function in isolation.
- **No capture visual feedback** — confirmed gap, fixed: a decaying point-light flash at the catch site plus a "gulp" scale-bounce on the catching hunter.
- **Reward model was too coarse** for the user's actual theory (catcher-only credit, periodic time-based reinforcement, per-agent stat tracking) — all three implemented (below).

**Terrain field** (`terrainField.ts`, new): deterministic 2-octave value noise (hashed lattice + bilinear smoothstep interpolation — no library) drives both elevation and temperature, seeded identically to the obstacle scatter so the same seed always regrows the same field.
- *Elevation* has a real gradient (`elevationGradient`) that agents feel: climbing costs speed, descending gives it back, both capped (`SLOPE_MAX_EFFECT`). Ground meshes, obstacle placement, and bee hover height all read the same `elevationAt()`, so what's on screen matches what agents feel underfoot.
- *Temperature* imposes a comfort band (`TEMPERATURE_COMFORT_LOW/HIGH`) outside of which everyone — hunters and prey alike, deliberately symmetric so it never secretly favors a side — slows down, and drives a cold→green→hot color ramp on the ground mesh itself (`TerrainField.tsx`, a per-chunk displaced + vertex-colored mesh replacing the old flat `<Grid>`).

**Hunter rivalry** (`rivalryMultipliers` in `simulation.ts`): whichever hunter is currently farther from the prey gets a speed bonus proportional to the gap, capped at `RIVALRY_MAX_BOOST` once the gap reaches `RIVALRY_MAX_DIFF`. The lead visibly swaps back and forth instead of settling; each swap increments `state.overtakes`, shown in the readout and confirmed happening in every long test run.

**Reward model refinement** (`rewards.ts`): `computeRewards` now takes `catchers: [boolean, boolean]` instead of one shared `captured` flag, so the capture bonus goes only to the hunter that actually made contact (both, if simultaneous) — confirmed live in a browser run where one hunter's cumulative reward jumped to 1000+ on a catch while the other's stayed near zero. `applyMilestoneTick` layers a periodic tick on top: every `MILESTONE_INTERVAL` (60s) the prey survives uninterrupted, it banks a bonus and both hunters take a penalty, independent of the continuous distance-based reward. Per-agent running totals (`AgentStats`: cumulative reward, distance traveled, top speed) now accumulate for all three agents for the life of a run and render in a new `AgentStatsTable.tsx` below the canvas.

**Flight character**: yaw is now turn-rate-limited (`FLIGHT_MAX_TURN_RATE`) rather than snapped instantly, which gives a well-defined turn rate to bank into (`FLIGHT_BANK_GAIN`/`FLIGHT_MAX_BANK`); pitch follows the ground slope under the current heading (`FLIGHT_PITCH_GAIN`/`FLIGHT_MAX_PITCH`). Answers the user's flight-quality question directly: bees now visibly bank into turns and pitch with terrain instead of staying flat and only yawing.

**Pacing re-tuned again**: the terrain drag, real obstacle collision, and hunter rivalry all made evasion genuinely more effective, which pushed capture gaps back up (measured avg ~41-50s, worst case ~134s — worse than the earlier tuned baseline). Rather than leave that regressed, `TENSION_RAMP_TIME`/`TENSION_RAMP_MAX_BONUS` were retuned and re-measured, landing back at avg ~28-36s, worst case ~80-96s, with overtakes and close-calls both healthy.

**Verified**: full suite now 425 tests (43 new/changed in `apiary-apex`, covering the terrain field, obstacle variety, per-catcher rewards, milestone ticks, rivalry/overtakes, per-agent stats, and — the important one — a long-run test asserting no agent ever ends a step penetrating a real obstacle). `tsc`/`lint`/`build` all clean. Browser-verified via Playwright screenshots across multiple seeds: terrain color visibly shifts from cold to hot across the field, 7+ distinct obstacle shapes visible in single frames, a real capture correctly attributed reward to only the catching hunter (1016 vs 5 in one observed run), and the per-agent stats table populates live. The capture flash/pulse effects are code-verified and exercised by the capture-attribution test but weren't caught on camera — they decay in well under a second, faster than a screenshot-polling loop can reliably sample.
