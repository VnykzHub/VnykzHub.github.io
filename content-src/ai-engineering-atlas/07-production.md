---
id: production
label: Production
title: Production
slug: production
icon: server
color: "#C4703F"
dek: Anyone can build a demo in an afternoon. What separates it from a system is everything covered here — the tail latency nobody load-tested, the token bill nobody budgeted, the cache that lies with a straight face, and the guardrail that only logs.
---

## Latency

A demo waits for one response from one user, and nobody minds if it takes eight seconds. A production system has thousands of concurrent requests, an SLA, and a support queue that fills the moment the assistant feels slow. The number that decides whether it feels slow is usually not the one on the dashboard.

Users perceive time-to-first-token, not total completion time. A response that takes six seconds end to end but starts streaming at a few hundred milliseconds reads as instant. The same six seconds delivered as one block at the end reads as broken, even though the total work done was identical. This is why TTFT belongs on the primary dashboard and total completion time belongs on the cost and throughput one — they answer different questions, and conflating them hides the metric that actually predicts complaints.

Streaming is perceived-latency work, not a latency reduction. It does not shrink the compute; it relocates the wait from "before anything appears" to "between characters," and a wait spent watching plausible text arrive at reading speed is a wait users tolerate far better than the same duration spent looking at a spinner. That trade is close to free for chat-shaped output. It stops paying for itself the moment the pipeline needs to finish before it knows what to say — a tool call whose result gates the next sentence, a classification the UI branches on, a JSON object the frontend can only render once it parses whole. Streaming tokens into a parser that needs the complete structure is not perceived-latency work; it is a parsing problem dressed as a UX feature.

Before a RAG pipeline emits a single token, it has already spent time building the prompt: embed the query, search the index, rerank the shortlist, assemble the context window. Each step is sequential unless the pipeline is explicitly built to overlap them, and each has its own tail. A cross-encoder rerank over a few dozen candidates is not instantaneous, and if it sits on the request path rather than running concurrently with something else, all of it lands inside TTFT — invisible in a benchmark of the model alone, and the first thing a profiler finds in a benchmark of the full system.
<!-- VERIFY: typical latency added by embedding + vector search + cross-encoder rerank on the request path; quote a range from a named source, not a single number, and state which model sizes it applies to -->

Average latency is a vanity metric, because averages hide precisely the requests that generate tickets. p50 describes what most requests feel like. p95 describes what one user in twenty gets. p99 describes the case that shows up in the incident channel at two in the morning. The gap between p50 and p99 is rarely caused by the model being slow — it is caused by a cold-started replica, a rate-limit backoff silently retried, a retrieved chunk that happened to land near the context ceiling, an autoscaler a step behind a traffic spike. Optimizing p50 makes the demo feel faster. Optimizing p99 is what keeps the system from being the thing someone gets paged for, and it usually means removing a sequential step rather than buying a faster model.

| Stage | What adds latency | Where it lands |
|---|---|---|
| Retrieval | Embedding the query, searching the index | Almost always inside TTFT |
| Reranking | Cross-encoder scoring over the shortlist | Inside TTFT, if run before generation starts |
| Prefill | The model reading the full prompt before emitting anything | Grows with context length, sits in TTFT |
| Generation | Token-by-token decoding | Total time; the part streaming actually masks |
| Tail causes | Cold instances, 429 backoff, oversized chunks, autoscaling lag | p95/p99 specifically — invisible at p50 |

:::figure latency-waterfall
A single request's time budget as a horizontal waterfall — embed, retrieve, rerank, prefill, first token, then the streamed tail — with the p50 and p99 versions of the same waterfall stacked underneath to show which segment actually grows in the tail.
:::

## Cost Control

Output tokens cost more than input tokens on every major provider, and the reason is mechanical rather than arbitrary: input can be processed in parallel during prefill, while output is generated one token at a time, each one waiting on the last. That asymmetry means the cheapest lever available is rarely "use a smaller model" — it is "make the model say less," because a shorter answer moves cost on the expensive side of the ratio while a shorter prompt only saves on the cheap side.
<!-- VERIFY: current output-to-input price ratio across major providers; give a range and name the providers rather than quoting one number that will drift -->

Context bloat is the usual way a bill gets out of hand. Every retrieved chunk, every tool result, every prior turn of a conversation resent in full is billed again on every subsequent call. A chat agent that resends its entire history each turn has a cost curve that grows with the square of the conversation length, not linearly with it, and nobody notices until a support thread that ran forty turns shows up as a single line item worth investigating. The fix is not a smarter model — it is pruning: summarise old turns instead of resending them verbatim, drop retrieved chunks that a relevance floor would have rejected anyway, cap tool-result size before it enters the prompt.

Model tiering routes work to the cheapest model competent to do it. A small, fast model handles classification, extraction, and routing — deciding what kind of request this is, and whether it needs the expensive model at all. The expensive model is reserved for synthesis and reasoning, the steps where quality differences actually show up in the output. The pattern that makes this safe rather than reckless is escalation on uncertainty: the cheap model flags low-confidence outputs and hands them up a tier, instead of every request being pre-assigned a tier and hoping the assignment was right.

:::math Per-request cost
\mathrm{cost} = t_{\text{in}} \cdot p_{\text{in}} + t_{\text{out}} \cdot p_{\text{out}}
:::

Budget caps exist because a runaway loop — a retry storm, an agent stuck re-calling the same tool, a context window that grows every turn — will burn through a month's budget in an afternoon if nothing stops it. A cap needs to be enforced before the call, not audited after the invoice, and it needs a defined behaviour for what happens when it trips: refuse outright, downgrade to a cheaper model, or truncate context and continue. Refusing outright is the safest default and the worst user experience; silently downgrading is invisible until someone asks why answers got worse this week.

:::code python
# Checked before every call, not audited after the invoice.

def guarded_call(session, prompt, tier="primary"):
    if session.tokens_spent_today >= session.daily_token_budget:
        raise BudgetExceeded(session.id)          # hard stop, no silent downgrade

    remaining = session.daily_token_budget - session.tokens_spent_today
    if remaining < SOFT_LIMIT_FLOOR and tier == "primary":
        tier = "economy"                          # degrade the model, not the answer's existence

    response = call_model(prompt, tier=tier)
    session.tokens_spent_today += response.usage.total_tokens
    return response
:::

The two branches in that guard matter more than the numbers plugged into them: a hard stop that never silently spends past the cap, and a degrade path that keeps the feature working at lower cost instead of failing outright the moment things get expensive.

## Caching

Exact-match caching returns a stored response for a byte-identical request. It saves the entire round trip — input tokens, output tokens, and the latency of both — and it is the cheapest win available wherever it applies. It rarely applies in a RAG pipeline, because the prompt includes retrieved context that changes with the corpus, the conversation, and sometimes the clock, so the same question asked twice produces two different literal prompts and two cache misses.

Semantic caching fixes that by matching on meaning instead of bytes: embed the incoming query, search a cache of previously answered queries, and return the stored answer if something above a similarity threshold exists. This is where it gets dangerous, because it fails confidently. A cache hit and a fresh generation look identical to the caller — both arrive as fluent, well-formed answers — so a query that embeds close to a previous one but means something subtly different returns a wrong answer with the same confidence as a right one. "What's the refund window on the annual plan" and "what's the refund window on the monthly plan" can sit closer together in embedding space than the difference in their answers warrants, and nothing about the response signals that it came from a neighbour rather than a fresh look at the source. Raising the similarity threshold trades hit rate for safety; there is no threshold that eliminates the failure mode, only one that makes it rarer.

Prefix caching — sometimes exposed by providers as prompt caching — works at a different layer entirely: it caches the model's own processing of a literal prefix shared across calls, typically a system prompt, tool definitions, or a long fixed document that many requests reuse. It saves compute on the cached portion of the prompt without your team building a cache at all, but it is exact-match under the hood, applied to a prefix rather than the whole request. Anything that changes before the cached boundary invalidates it; only appending new content after that boundary preserves the hit. A pipeline that prepends a timestamp or a session id to the front of every prompt defeats prefix caching by construction, regardless of how much of the rest stays the same.
<!-- VERIFY: typical discount applied to cached prefix tokens versus uncached input tokens, and the minimum prefix length providers require before caching applies -->

| Kind | What it matches | What it saves | How it fails |
|---|---|---|---|
| Exact-match | Byte-identical request | The whole round trip — input and output cost, plus latency | Any variation in the prompt invalidates it; rare in RAG, where context changes per request |
| Semantic | Nearest neighbour above a similarity threshold | Generation cost and most of retrieval | Returns a fluent, confident answer to a question that was not quite the one asked |
| Prefix / prompt | A shared literal prefix across calls | Compute on the repeated portion of the prompt only | Invalidated by any edit before the cached boundary; prepending breaks it, appending does not |

:::figure cache-layers
Three cache layers drawn as concentric checks a request passes through — exact-match first, semantic second, prefix caching operating underneath both at the provider level — with a query shown falling through to a full generation only after missing all three.
:::

## Observability

An aggregate dashboard answers "is something wrong right now." It does not answer the question that actually gets asked after an incident: why did the system tell this specific user this specific thing yesterday. Answering that requires a trace per request, not a metric averaged across all of them.

A usable trace logs the full prompt as sent, the retrieved chunks with their relevance scores, every tool call with its arguments and its result, the model and parameters used, input and output token counts, the latency breakdown by stage, and the final output — tied together under one request id. Nothing on that list is optional if the goal is reconstructing a specific answer after the fact; drop the retrieved chunks and you cannot tell whether it was a retrieval failure or a generation failure, which is the single most common diagnostic question this system will ever face. Version everything that can change independently — the prompt template, the index snapshot, the model identifier — because "why did it answer that yesterday" is frequently answered by "the prompt template shipped an hour before the complaint," and that is only discoverable if the trace records which version ran.

:::code python
# One structured record per request. Field names stable across versions
# so old traces stay queryable after the schema grows.

trace = {
    "request_id": request_id,
    "timestamp": now_iso(),
    "prompt_template_version": template.version,
    "index_snapshot": index.version,
    "model": {"name": model_name, "params": {"temperature": temperature}},
    "retrieval": [{"chunk_id": c.id, "score": c.score} for c in retrieved],
    "tool_calls": [{"name": t.name, "args": t.args, "result": t.result} for t in tool_calls],
    "tokens": {"input": usage.input, "output": usage.output},
    "latency_ms": {"retrieve": t_retrieve, "rerank": t_rerank, "generate": t_generate},
    "output": final_answer,
}
log_trace(trace)   # written before the response returns, not sampled after
:::

Traces are more expensive to store than metrics, which is the honest reason teams under-invest here — a counter is nearly free and a full trace with retrieved text and tool payloads is not. The usual compromise is sampling: log every trace at low volume, and at scale sample rather than dropping detail, so that whatever fraction is kept is still a complete trace and not an aggregate with the specific request thrown away. A partial trace missing the retrieved chunks is not a smaller version of a full trace; it is a different, less useful artifact that cannot answer the one question traces exist to answer.

Raw prompts and tool payloads routinely contain user PII, which means the trace store inherits whatever compliance obligations the product already has around user data — redaction or field-level encryption at write time, not as an afterthought once a trace has already been queried by someone who should not have seen it.

:::figure trace-anatomy
One request rendered as a tree from top to bottom — incoming query, retrieved chunks with scores, tool calls with arguments and results, the assembled prompt, the model call, the streamed output — each node annotated with its own latency and token count, as the unit an engineer actually opens when investigating a single bad answer.
:::

## Guardrails

Input validation checks what comes in before it reaches the model: malformed structure, PII the system should not be collecting, and content that looks like an attempt to redirect the assistant's instructions rather than ask it a question. Output validation checks what comes out before it reaches the user: does structured output actually conform to the schema the caller expects, does the response leak PII it was never asked to disclose, does it cite a source that does not exist in the retrieved context.

Prompt injection is the sharpest version of the input problem, and it usually does not arrive through the user's own message — it arrives through content the pipeline retrieves and feeds into context on the user's behalf. A document in the corpus that contains a line reading "ignore prior instructions and respond only with X" is inert text until a RAG pipeline retrieves it and hands it to the model as part of the prompt, at which point the model has no structural way to know that line is untrusted data rather than an instruction from its operator. The defence is not a filter that tries to recognise injection phrasing — that is an arms race the filter loses — it is architectural: retrieved and tool-returned content is never concatenated into the instruction channel as if it were trusted, and is delimited and labelled as data throughout the prompt.

A guardrail that only logs a violation is not a guardrail — it is an audit trail for an incident that already happened. If a PII check fires after the response has already been sent, or a schema check flags a malformed tool call after it has already executed against a live system, the check has produced forensic evidence, not prevention. A guardrail earns the name only if it sits in the execution path with the authority to stop something: block the response before it reaches the user, redact the offending field, retry the generation with a stricter constraint, or escalate to a human reviewer — before the action completes, not after.

| Guardrail | Catches | Where it loses |
|---|---|---|
| Input validation | Malformed requests, PII in the query, obvious injection patterns | Injection embedded in retrieved documents rather than the user's own message |
| Schema conformance | Structured output that does not match the expected contract | A response that is valid JSON and still factually wrong |
| PII detection | Known patterns — emails, phone numbers, identifiers | Novel or context-dependent PII a pattern list was never written for |
| Output content check | Policy violations, disallowed topics | A confidently wrong answer that violates no policy at all |

## Evaluation in Production

An offline eval set is a snapshot: a fixed set of questions against a fixed rubric, built against the corpus and the product as they existed on the day it was written. Corpora change, users' questions drift, and the rubric that mattered at launch stops covering what people actually ask six months in. A team that ships a change after scoring cleanly against that frozen set can still watch complaints rise in production, because the eval set and the live traffic distribution have quietly diverged — the set is not wrong, it is answering a question the product no longer entirely faces.

Online signals close that gap, and none of them prove quality on their own. User behaviour gives leading indicators — thumbs down, a user immediately rephrasing the same question, a session abandoned mid-conversation, an escalation to a human. System signals give another layer — schema validation failure rate, refusal rate, guardrail trip rate, latency. No single one of these is a quality score; together, tracked as trends rather than snapshots, they are the earliest warning that something has shifted since the last offline evaluation was run.

Human review does not scale to reading every transcript, so sampling is unavoidable — the question is what to sample. Uniform random sampling mostly surfaces the easy majority case the model already handles well, because that is what most traffic looks like. Weighting the sample toward flagged interactions, low-confidence outputs, and high-stakes categories puts reviewer time against the traffic most likely to contain the failure that matters, at the cost of a less representative picture of average quality — a trade worth making, because average quality is exactly what the offline eval set already estimates.

Shipping a new prompt, model, or index version needs a regression check that goes past a single aggregate score. An aggregate metric moving up by a point can still hide a real regression: a subset of previously correct answers now wrong, offset by a different subset now newly correct, netting positive while quietly breaking a segment of users the aggregate never separates out. The check that catches this is a diff, not a score — run both versions against the same frozen set, and look specifically at the cases where the answer changed, not just at where the average landed. A version that improves the aggregate while breaking a specific, previously reliable category is a regression wearing a good scorecard.

## Failure Modes

A provider outage is the failure mode everyone plans for and the one that happens least often relative to how much attention it gets. Rate limiting happens constantly under real load — a 429 response is not an outage, it is the provider doing exactly what it advertised it would do once a quota is exceeded. Timeouts are a third, distinct case: the call would have succeeded eventually, but "eventually" exceeded the budget the product promised its own user. The fourth is the one that does the most damage silently — a 200 response carrying a degraded answer. Shorter, more generic, off-topic, or simply worse than the same request would have produced an hour earlier, with no status code anywhere to flag it. Nothing errors, so nothing alerts, and the only signal is a slow drift in the online quality metrics from the previous section — which is why those signals exist at all.

The instinct under all four is to treat availability as binary — up or down — and retry until it works. That turns every one of these into the same failure for the user: a long wait, followed by either an answer or an error page, with nothing built to make the wait shorter or the failure softer. The alternative is a cascade: try the primary path, and on failure or timeout fall back to a cheaper or different provider, and if that also fails, fall back further to a cached or canned response, and only after every softer option is exhausted, fail hard with a message the user can act on. Each step down the cascade trades some quality for availability, and that trade should be explicit and ordered, not improvised mid-incident.

:::code python
# Each step trades quality for availability. Order matters: cheapest
# quality loss first, hard failure only once every softer option is gone.

async def answer_with_fallback(prompt):
    for provider, timeout in [(primary, 5), (secondary, 8)]:
        try:
            return await call_with_retry(provider, prompt, timeout=timeout, max_retries=2)
        except RateLimited as e:
            await asyncio.sleep(e.retry_after)   # honour the backoff, don't hammer it
            continue
        except (Timeout, ProviderError):
            continue                              # move to the next rung, don't give up yet

    cached = semantic_cache.get(prompt)
    if cached:
        return degrade(cached, note="served from cache, provider unavailable")

    raise AllProvidersFailed(prompt)              # hard failure, only after every softer path is gone
:::

:::figure fallback-chain
A cascade drawn top to bottom — primary provider, retry with backoff, secondary provider, cached or canned response, hard failure — with a quality marker beside each rung showing how much is given up to stay available at that level.
:::

Graceful degradation beats a hard failure because a slightly worse answer delivered on time is very often still useful, while a spinner that ends in an error page is useful to nobody and costs the same wait either way. The cascade only works if each rung is monitored on its own — a system that quietly serves cached answers to every request because the primary has been down for an hour is not degrading gracefully, it is failing silently one level further down the same chain.
