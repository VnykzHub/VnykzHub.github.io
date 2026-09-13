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
  vec2.ts          — 2D vector math (the world is x/z; y is a fixed hover height)
  config.ts        — all tunables, incl. the spec's reward-formula weights
  terrain.ts        — chunkAt/buildChunk/chunksAround: seeded, cached, deterministic
  steering.ts       — fleeForce, pursueForce (lead prediction), separationForce,
                       obstacleAvoidForce (whisker raycasting), stepWander
  rewards.ts        — computeRewards() implementing the spec's two reward formulas
  simulation.ts     — createSimState/stepSimulation: the fixed-timestep sim core
  telemetry.ts      — TelemetryHarvester (local ring buffer; dispatch() is a
                       documented no-op — see §1's table for why)
  *.test.ts         — 19 vitest cases: determinism, cross-seed variance,
                       numerical stability over 5000+ steps, reward correctness
src/components/games/apiary-apex/
  Bee.tsx           — R3F bee mesh (role-colored, imperative danger-glow handle)
  ObstacleField.tsx — honeycomb-pillar obstacle rendering
  Scene.tsx         — Canvas, fixed-timestep loop driving the sim from a ref
                       (not React state — 60Hz physics stays off the render path),
                       chase camera, chunk-streaming trigger
  ApiaryApexGame.tsx — GameShell integration, HUD readout, pause control
src/app/games/apiary-apex/page.tsx
```

**Verified:** `npx tsc --noEmit`, `npm run lint`, `npx vitest run` (401 tests, repo-wide), `npm run build` all pass. Browser-checked via Playwright against the dev server: scene renders (bees, streaming obstacles, working chase camera), pause/resume freezes and resumes the sim clock, reseeding regenerates a visibly different — but for a repeat of the same seed, identical — terrain, telemetry buffer counter climbs and caps at 500, mobile viewport (390px) has no horizontal overflow.

**Deliberately not done in v1** (all captured as later phases above, not forgotten): no Rapier physics, no ONNX/learned brain, no telemetry upload, no nightly retraining, no cinematic camera director/audio. The in-browser experience is honest about this — the "How it works" copy on the page itself says "none of this is learned yet."
