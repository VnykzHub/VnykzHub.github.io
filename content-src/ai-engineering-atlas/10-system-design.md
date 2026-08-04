---
id: system-design
label: System Design
title: System Design
slug: system-design
icon: network
color: "#F0B84C"
dek: Everything above, assembled into one system, under constraints that conflict. The AI-system-design interview, and the section that proves the rest was understood rather than collected.
---

## Framing the Problem

Every AI system design starts with someone saying "build a chatbot for our docs" or "add search over our tickets," and every one of those sentences is underspecified in the same five places. Get the five answers before opening a diagramming tool, because each one changes a different part of the architecture, and none of them can be inferred from the request itself.

**Who asks, and how many of them are there.** A tool used by twelve engineers on your own team tolerates a rough edge that a feature shipped to every customer cannot. The audience size sets the floor for how much polish, rate limiting, and abuse-handling the system needs before it can go live at all.

**How often.** Ten queries a day and ten thousand a minute are different systems wearing the same architecture diagram. The first tolerates a slow, expensive, manually-reviewed pipeline. The second needs caching, batching, and a retrieval layer that does not fall over when three requests arrive in the same second.

**How wrong can it be, and does a human see the answer before it is acted on.** A code-completion suggestion that a developer reviews before committing has a different error budget than a support macro that auto-sends to a customer, which has a different error budget again from a clinical or legal answer nobody double-checks. This single answer decides whether the system is allowed to guess or is required to abstain — and it decides it long before anyone writes a prompt.

**Who pays, and for what.** A research prototype absorbs its inference cost as engineering overhead nobody itemises. A per-seat product has to keep the retrieval-plus-generation cost per query below whatever margin the pricing model leaves. These are not the same budget, and building the first when the business case requires the second is the most common reason a working prototype cannot ship.

**What happens when it fails.** Failure has at least three different shapes, and a design that handles one silently ignores the others: no answer at all (safe, if visible), a confidently wrong answer (the dangerous default), or a stale answer that was correct last week. Which of these the business can tolerate determines whether the system needs an abstention path, a confidence threshold, or a staleness alarm — none of which show up in a demo, all of which show up in an incident review.

Read the five in sequence and they stop looking like a checklist and start looking like a tree: each answer forks the next question, and every leaf points at a different part of the architecture below.

:::figure framing-question-tree
A tree with the request at the root ("build a chatbot for our docs") and five branches — who asks and how many, how often, how wrong the answer can be, who pays, what happens on failure — each branch ending at the architecture piece it constrains (auth and rate limits, caching and infra sizing, the abstention path, the cost ceiling, the fallback and kill switch), showing the five questions as gates that fork the design rather than a flat list answered in isolation.
:::

| Question | What it decides | What happens if you skip it |
|---|---|---|
| Who asks, how many | UI polish, auth, abuse handling | An internal tool ships without rate limits and takes down the index on day one |
| How often | Caching, batching, infra sizing | A design proven at ten queries a day falls over at ten thousand |
| How wrong can it be | Whether abstention is mandatory | A system that always answers gets trusted for questions it cannot support |
| Who pays | The cost ceiling per query | Reranking and long-context calls quietly erode a margin nobody was tracking |
| What happens on failure | Fallback path, alerting, kill switch | The first production failure is also the first time anyone thought about one |

None of these five questions require an architecture diagram to answer. They require a conversation with whoever owns the outcome, held before the first line of infrastructure is chosen — because every answer above changes a different box in the reference architecture that follows, and getting one wrong does not fail loudly. It fails as an incident, months later, when the traffic or the stakes finally arrive.

## Requirements That Actually Constrain

"It should be fast and accurate" is not a requirement. It is a wish, and a wish cannot be tested, budgeted, or violated — which is exactly why it survives unchallenged into a design review and then reappears as an incident. A requirement has to be a number, attached to a percentile, a floor, a ceiling, or a bound, because only a number can be checked against reality and only a number tells an engineer what to cut when two goals compete.

Take "fast." A single average-latency number hides the number that actually matters: the tail. A system with a 400ms average and a 6-second P99 feels fast in a demo and pages someone at 2 a.m. when concurrent load pushes a chunk of traffic into that tail. The requirement is not "fast" — it is a P50 target for the typical case and a P99 ceiling that triggers a hard timeout, because without the ceiling, "slow" has no definition and nothing ever fires an alert.

Take "accurate." Accuracy without a floor and a failure mode is unmeasurable and unenforceable. The real requirement is a quality floor measured against a labelled evaluation set — some minimum faithfulness or correctness score below which the system does not ship — paired with an explicit answer for what happens under the floor: abstain, escalate to a human, or answer anyway with a lower confidence disclosed. Skip the floor and regressions get caught by a customer instead of a test suite; skip the failure mode and the system always answers, including for the exact questions it should have refused.

Take "affordable." A cost ceiling only means something tied to a specific request volume — dollars per 1,000 queries, not dollars in the abstract — because cost is where a design choice made for quality quietly becomes a design choice nobody signed off on. A reranker that adds real accuracy also adds a call on every request; a wider top-k adds tokens on every request; both are invisible in a demo run twenty times and very visible in a monthly bill run twenty million times.

Take "up to date." Freshness is a staleness bound, not an adjective: how many minutes or hours between a source document changing and the index reflecting it, and what the system does with a query that lands inside that window. An unstated freshness requirement is the quietest way to ship an incident, because a stale index does not look broken. It looks like a perfectly formed, confidently cited, wrong answer to exactly the question a customer needed today's number for.

| Dimension | Vague version | Concrete version | Cost of leaving it unstated |
|---|---|---|---|
| Latency | "Fast" | P50 target, P99 ceiling, hard timeout per stage | Team optimises the average, gets paged for the tail |
| Quality | "Accurate" | Faithfulness floor against a labelled set, plus an abstain rule | Regression ships silently until a customer notices |
| Cost | "Affordable" | $ per 1,000 queries, tied to a stated traffic estimate | Reranking or long-context calls erode margin unnoticed |
| Freshness | "Up to date" | Staleness bound in minutes/hours, defined behaviour inside that window | A stale index looks correct and answers the one question it shouldn't |

Each of these numbers constrains a different part of the system that follows. The latency ceiling decides how much of the budget retrieval and generation are allowed to spend. The quality floor decides whether reranking is optional or load-bearing. The cost ceiling decides which model tier is even affordable at the stated volume. Write the wish first if that is where the conversation starts, but do not start building until the wish has become four numbers someone is willing to be held to.

## A Reference Architecture

A production AI system is not one box that takes a question and returns an answer. It is seven boxes, most of them recognisable from any search or data system, one of them new, and none of them optional once the system is handling real traffic — though at small scale, several of them shrink down to almost nothing.

**Ingestion** turns source material into retrievable units: it chunks documents, attaches metadata, and pushes vectors into the index. It runs on a schedule or a webhook, and it has to be idempotent, because reprocessing a document that already succeeded is cheap and debugging a partial failure that silently skipped one is not.

**Index** is where the retrievable units live — a vector store, a lexical index, or both combined in a hybrid setup. It is the thing ingestion writes to and retrieval reads from, and its shape (single-node, sharded, quantised) is the first thing that changes as the corpus grows.

**Retrieval** turns a query into candidates: embed the query, search the index, optionally rerank. This is the stage where most answer-quality problems actually live, and the stage most systems under-invest in relative to the generation step everyone notices.

**Orchestration** is the layer deciding what happens in what order — a single retrieve-then-generate call for a simple system, a graph of retrieval, tool calls, and retries for an agentic one. It is also where a timeout budget gets enforced and where a failure in one step is caught before it becomes a failure of the whole request.

**Serving** is the externally facing surface: auth, rate limiting, request queueing, and streaming the response back. It is the box most people picture when they hear "the API," and the one that matters least to answer quality and most to whether the system survives contact with real traffic.

**Evaluation** is the offline test set that runs against every change before it ships — the harness that answers "did this get better or worse" without waiting for a user to answer it instead.

**Observability** is per-request tracing of what was retrieved, what was generated, at what latency and cost, so a bad answer is diagnosable after the fact rather than merely visible as a low rating with no way to say why.

:::figure system-design-reference-architecture
The seven boxes — ingestion, index, retrieval, orchestration, serving, evaluation, observability — with the corpus flowing in through ingestion into the index, a query flowing through retrieval and orchestration to serving, and evaluation and observability drawn alongside the whole pipeline rather than inside it, feeding back into both.
:::

At small scale, four of these are load-bearing from day one and three can be a placeholder. Ingestion, index, retrieval, and serving make the core loop work at all — without them there is no system. Orchestration can be a single function call rather than a graph until there is more than one step to sequence. Evaluation can be a spreadsheet a human checks before each deploy rather than an automated harness, right up until the team is too large or the deploy cadence too fast for a human to be the regression check. Observability can be structured logs rather than a tracing system, until a bad answer needs explaining and the logs turn out not to say which chunk was retrieved. None of the three are wrong to skip early. All three are wrong to keep skipping once the failure they would have caught actually happens.

## Where the Latency Budget Goes

A latency budget is not a target to hit — it is a fixed amount of time that has to be divided among stages that all want more of it, and the division is a real design decision with real consequences, not an afterthought left to whatever each stage happens to take.

Assume, for a worked example, a 3-second P95 budget for a chat-style interface — a number chosen for this illustration, not a claim about any real system. That budget has to cover embedding the query, searching the index, optionally reranking, generating the answer, and the network and serialisation overhead between each hop. A plausible split for that assumed budget: roughly 50ms for query embedding, 100ms for vector search, 400ms for a rerank pass, 2000ms for generation (offset by streaming tokens back as they are produced, so perceived latency runs lower than the raw total), and the remaining budget as overhead and margin. The arithmetic has to close before the system ships, not after a user notices it does not.

Laid out as a bar, that split — and the same stages left unconstrained — makes the arithmetic legible at a glance instead of buried in a sentence of numbers.

:::figure latency-budget-allocation
A single horizontal bar for the 3-second P95 budget, segmented into query embedding (50ms), vector search (100ms), rerank (400ms), generation (2000ms), and remaining overhead/margin, drawn to scale. Beneath it, a second bar shows the same five stages running at their unconstrained cost — no top-k narrowing, no rerank skip, a slower model — extending past the 3-second line to show exactly which stages caused the overrun and by how much.
:::

As a rough anchor, a production retrieval pipeline might spend tens of milliseconds on retrieval and low hundreds on reranking, with generation dominating the remainder — but those figures move by an order of magnitude across hardware and model choices, which is why the budget matters more than any single number.

When the budget is tight, stages get cut in a fairly consistent order, because they differ in how removable they are. Reranking goes first — it is a discrete, separable stage, and removing it degrades quality gracefully rather than breaking anything. Top-k narrows next, trading a small chance of missing the right chunk for a shorter context to generate over. Generation itself is the next lever: a smaller or faster model produces a worse answer, but a bounded one, in bounded time. Streaming the response is the last resort that does not remove any quality at all — it does not reduce total latency, but it reduces the time until the user sees the first token, which is often the number that actually determines whether the system feels slow.

:::code python
# Enforce the budget at each stage rather than hoping the sum works out.
# Skip the optional stage first, and always leave room for generation —
# it is the one stage the request cannot complete without.

import time

def answer(query, budget_s=3.0):
    start = time.monotonic()
    elapsed = lambda: time.monotonic() - start

    q_vec = embed(query)                       # ~50ms
    candidates = vector_store.search(q_vec, k=50)   # ~100ms

    remaining = budget_s - elapsed()
    if remaining > 1.2:                        # rerank only if there's room
        candidates = reranker.score(query, candidates)
    context = candidates[:5]

    remaining = budget_s - elapsed()
    if remaining <= 0.3:
        return "Over budget before generation — degrade to a shorter answer."

    return generate(query, context, timeout_s=remaining)
:::

The budget also has to account for variance, not just the typical case: a P95 target means 5% of requests are allowed to run long, and a hard timeout below the budget is what stops a slow tail from becoming an unbounded one. A system with no per-stage timeout does not fail at the budget — it fails well past it, silently, on exactly the request where the vector store had a slow day.

## Scaling

Scale does not break a system evenly. Some parts absorb ten times the load by adding hardware; others hit a wall that no amount of hardware moves, because the wall belongs to someone else's rate limit or someone else's bill. Knowing which is which before it happens is the difference between a capacity plan and a fire drill.

**Index size.** At 10x the corpus, a larger machine or a slightly bigger cluster usually absorbs it — the index still fits, search still returns in roughly the same time. At 100x, memory becomes the binding constraint: the full vector set no longer fits comfortably in RAM, and the fix is either quantisation (accepting a small recall loss to shrink each vector) or sharding across nodes, which turns retrieval into a fan-out-and-merge problem instead of a single lookup. This scales horizontally, but the retrieval logic on the other side of that scaling is genuinely more complex than it was at 10x.

**Ingestion throughput.** At 10x, a queue in front of the pipeline absorbs the burst — ingestion just takes longer to catch up, nothing changes structurally. At 100x, the embedding call itself becomes the bottleneck, because it is usually an external, rate-limited API rather than something the team controls. The fix is batching requests, adding backpressure, and at some point self-hosting an embedding model to remove the external ceiling entirely. Horizontal scaling here runs out exactly where a third party's limits begin.

**Concurrent requests.** At 10x, a bigger connection pool and more serving replicas cover it. At 100x, the generation model's own rate limit is usually the ceiling, not the serving layer — and that ceiling often sits at the account level, so it is not fixed by adding more servers at all. The real levers are request queueing, multiple provider accounts, or reducing tokens per request so more requests fit under the same cap.

Published limits scale with cumulative spend rather than time, so a mid-tier account typically sits in the low thousands of requests per minute and single-digit millions of tokens per minute — orders of magnitude below the top tier, and reached sooner than most capacity plans assume.

**Cost per request.** This one does not fall with scale by default. A per-token-billed system costs linearly more as volume grows, full stop — there is no economy of scale in the bill itself. The only way cost per request drops is by spending engineering effort on it directly: shorter context, a smaller model for the easy majority of queries, caching repeated queries, batching where the provider prices it cheaper. Cost is the one row in this table that horizontal infrastructure does not touch at all.

Lay the four rows side by side at 1x, 10x, and 100x, and the pattern separates cleanly: three of them scale horizontally, if with growing complexity; one does not scale down at all, regardless of infrastructure.

:::figure scaling-breakpoints
Four rows — index size, ingestion throughput, concurrent requests, cost per request — each plotted across 1x, 10x, and 100x load. The 10x column for the first three is marked "absorbed by more hardware." The 100x column marks where each one actually breaks: memory for the index (fixed by quantisation or sharding), the embedding API's rate limit for ingestion (fixed by batching or self-hosting), the generation model's account-level rate limit for concurrency (fixed by queueing or multiple accounts, not more servers). The cost-per-request row carries no 100x break at all — it is drawn as a straight line climbing through every column, the one row infrastructure does not touch.
:::

:::math Little's Law — the queueing identity that governs concurrency
L = \lambda W
:::

Little's Law ties the three infrastructure rows together: the number of requests in flight at any moment (L) equals the arrival rate (λ) times the average time each request spends in the system (W). It is why a latency regression is also a capacity regression — if generation gets 30% slower and arrival rate stays fixed, the number of concurrent in-flight requests rises by the same 30%, and every queue, connection pool, and rate limit sized for the old W is now undersized for the new one. Scaling load and scaling latency are the same problem looked at from two ends.

## Conflicting Constraints

This is the actual skill in system design, and the reason the earlier sections existed: every real system reaches a point where two requirements cannot both be maximised, and the job is not picking a universal winner. It is choosing a resolution for this system, stating what it costs, and being honest that a different system with different stakes would resolve it the other way.

Three of these constraints sit at the corners of one triangle, and the three tensions below are what it looks like when a design pulls on any one of them.

:::figure conflicting-constraints-triangle
A triangle with accuracy, latency, and cost at the three corners. An arrow along one edge shows that pulling a corner further out — more reranking for accuracy, a bigger model for quality, a shorter timeout for latency — drags the opposite two corners inward. The two resolutions that live on this triangle (conditional rerank, difficulty-based routing) are marked as points pulled inside it rather than sitting at any single corner — each a specific, named compromise rather than a maximum on any one axis. Freshness vs stability sits outside this particular triangle, on its own separate axis.
:::

**Accuracy vs latency.** Reranking measurably improves which chunks reach the generator, and it costs a discrete chunk of the latency budget on every single request, whether or not that request needed it. One resolution: rerank conditionally — skip it when the top retrieval result is decisively ahead of the rest by similarity score, and run it only when the top few candidates are close enough that the ranking is actually ambiguous. This buys most of the accuracy gain on the queries that need it, at the cost of an extra heuristic — a confidence threshold that itself has to be tuned and can silently drift as the corpus or query mix changes.

**Cost vs quality.** A larger model produces better answers and costs more per call, and that relationship does not bend. One resolution: route by difficulty — a cheap, fast model handles the routine majority of queries, and a signal of low confidence or an explicit escalation routes the rest to a more expensive model. This buys a lower blended cost per query at the price of a routing decision that is itself a model, with its own failure mode (misrouting a hard query to the cheap path) and its own evaluation burden, because a routing bug is now invisible inside an average that still looks fine.

**Freshness vs stability.** An index that reindexes continuously is never more than moments stale, and continuous reindexing means the corpus a user's query sees can shift mid-session — a document re-embedded between two turns of the same conversation can knock a previously top-ranked chunk out of the running with no warning. One resolution: batch reindexing on a fixed cadence with a versioned index and an atomic swap, so any given request sees one consistent snapshot rather than a corpus mutating under it. This buys predictability and reproducible debugging at the cost of staleness bounded by the batch interval rather than zero — a support answer can lag a source update by exactly as long as the batch window, and that lag is now a number someone has to be willing to accept.

| Tension | What each side wants | A resolution | What the resolution costs |
|---|---|---|---|
| Accuracy vs latency | Always rerank vs never spend the time | Rerank only when top candidates are close in score | A tunable threshold that can silently drift |
| Cost vs quality | Best model vs cheapest model | Route by difficulty, escalate on low confidence | A routing step with its own failure mode |
| Freshness vs stability | Reindex continuously vs never mid-session | Batch reindex with versioned, atomic swap | Staleness bounded by the batch interval, not zero |

None of these three resolutions is the "correct" one in the abstract. Each is correct for a system whose stated requirements — the numbers from the second section — make that particular cost acceptable. A system with a tighter freshness requirement would take the mid-session drift instead. The design is not choosing the tradeoff away. It is choosing, on purpose, which side absorbs it.

## A Worked Design

The brief: an internal document assistant over a large corpus of contracts, wiki pages, and support tickets, used by employees who need an answer with a citation they can check, where a wrong contract clause handed to legal is a real liability and "I don't know" is a better answer than a wrong one.

**Framing.** Who asks: roughly 2,000 employees, a handful of queries each per day — internal traffic, not consumer scale. How wrong can it be: a cited answer feeds directly into decisions with legal and compliance weight, so an unsupported guess is worse than a refusal. Who pays: an internal cost centre with a real but not unlimited budget. What happens on failure: a wrong answer is the failure mode to design against, not slowness — an employee will wait an extra second for a right answer far more readily than they will forgive a confidently wrong one.

**Requirements**, stated as assumptions for this scenario: a P95 latency of 4 seconds (an internal tool tolerates more wait than a customer-facing chat surface); a quality floor requiring every answer to cite the exact source paragraph, with a mandatory abstain path below a confidence threshold; a cost ceiling of a few cents per query, set by the internal budget rather than a market price; and a freshness bound of a nightly reindex, accepted because contracts and wiki pages in this organisation are assumed not to change intraday. Each of these is a stated assumption of this scenario, not a general claim.

**Architecture choices.** Hybrid retrieval — lexical plus dense — because contract clause numbers and ticket IDs are exact-match tokens a dense embedding routinely fails to privilege, and a wiki-style prose question needs the dense side. Document-aware chunking on section and clause boundaries, because a contract clause severed from its heading is a chunk that answers nothing. Reranking always on, because the 4-second budget has room for it and the cost of a wrong top-ranked chunk is unacceptable here. A mid-size generation model constrained by a system prompt that requires a citation for every claim, with the abstain path returning "not found in this corpus" rather than an unsupported answer whenever no retrieved chunk clears the confidence floor.

**Rejected alternatives.** Fine-tuning on the corpus was rejected: the corpus changes weekly, and the cost of a training run per meaningful update is not worth it against reindexing, which is far cheaper by comparison. Stuffing the full corpus into context was rejected outright: hundreds of thousands of documents exceed any context window by orders of magnitude, and the cost would scale with every single query rather than once at ingestion. Semantic chunking was rejected for now, not permanently — it is a legitimate option once an evaluation set demonstrates it beats document-aware chunking by enough to justify the extra embedding pass at ingestion, and that evaluation has not been run yet.

**Failure handling.** Retrieval finds nothing relevant: abstain, and log the query to a queue a human reviews to decide whether the corpus is missing that content. The nightly reindex fails silently: a staleness alarm fires if the index age exceeds a set threshold, because a failed nightly job that nobody notices is indistinguishable from a working one until an answer is wrong. Load spikes past provisioned capacity: requests queue rather than fail, with a shorter, non-reranked response mode available as a degraded path rather than an outright rejection.

:::code python
# The assembled pipeline for the worked scenario — hybrid retrieval,
# conditional rerank, mandatory citation, explicit abstain.

def answer_query(query, confidence_floor=0.6):
    lexical = bm25_index.search(query, k=30)
    dense = vector_store.search(embed(query), k=30)
    candidates = merge_hybrid(lexical, dense)

    ranked = reranker.score(query, candidates)     # always on: budget allows it
    top = ranked[:5]

    if not top or top[0].score < confidence_floor:
        log_unanswered(query)                       # feeds the human review queue
        return "Not found in this corpus."

    return generate_with_citations(query, top)       # every claim must cite a chunk
:::

This design resolves the same conflicting-constraints tension from the previous section in one specific direction: reranking stays on unconditionally because the quality floor here is non-negotiable and the latency budget has slack, while a customer-facing system with a 500ms budget and a lower liability ceiling would reasonably make the opposite call. The requirements chose the tradeoff. The architecture just carried it out.
