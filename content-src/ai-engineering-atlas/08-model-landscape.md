---
id: model-landscape
label: Model Landscape
title: Choosing a Model
slug: model-landscape
icon: cpu
color: "#F0B84C"
dek: Buy, host, or adapt — and how to defend the choice. API tradeoffs, open weights, and why fine-tuning is almost never the first move.
---

## API or Self-Hosted

The choice between calling a hosted model and running weights on your own infrastructure looks like it is about cost. It almost never is.

Cost is real, and worth working out honestly before anything else, but the naive version of that comparison is usually wrong. A team convinced self-hosting is cheaper often builds the case on list price per token and skips the denominator: idle GPU time. A card reserved for inference sits fully loaded during a product launch and mostly idle at three in the morning on a Tuesday. Averaged over a quarter, utilisation on a self-managed cluster is rarely as high as the spreadsheet assumed, which erases most of the per-token saving that made self-hosting look attractive. API pricing already has that idle time priced in, spread across every other customer sharing the same fleet.

The reasons teams actually reach for self-hosting run deeper than the token bill. Data residency: a hospital system or a bank may be contractually or legally barred from letting patient records or account data leave a jurisdiction, and a hosted API call is data leaving your perimeter by definition, whatever the provider's retention policy claims. Latency floor: a fraud check sitting in the path of a card swipe has a budget a network round trip to someone else's data centre eats before the model has even started generating. Rate limits: a provider's contract caps requests per minute, and a team that plans a launch around a fixed quota discovers the ceiling exactly when traffic peaks and the pressure to scale is loudest. And the one that decides things at 3am: who is on the hook when the system fails.

API providers own the uptime SLA. If a request times out, they have paging, incident response, and a status page that tells you whether the bug is yours or theirs. Self-host, and you own the mean time to recovery yourself. That is not a small thing. It means on-call staffing for a system that did not exist as a staffing line before, hardware failure modes nobody on the team has debugged, GPU memory pressure that degrades output quality before it throws a clean error, and inference kernels that fail silently under a production traffic shape no load test reproduced.

| Axis | API | Self-Hosted |
|---|---|---|
| Latency floor | Provider's routing; a network hop you do not control | Your infrastructure; hops you can measure and cut |
| Rate limits | Fixed by contract; scaling means a bigger contract | Bounded by cluster size and power budget, not a vendor |
| Data residency | Leaves your network by design | Stays in your VPC or on-prem |
| Operational cost | Predictable per token; grows linearly with usage | Capital upfront, labour ongoing; cheaper per token only at real volume |
| Incident response | Provider's SLA and escalation path | Your on-call rotation, your postmortem |

:::figure api-vs-self-hosted-decision
A decision tree walking the axes that actually decide this — throughput volume, latency budget, data residency constraints, and whether an infrastructure team already exists — ending at API or self-hosted rather than at a cost comparison.
:::

The honest default is API. It buys a working system tomorrow, and the margin by which you lose that bet is your own operations team's unfamiliarity with a new failure surface.

Self-hosting genuinely wins when one or more of these is unambiguously true: throughput is high enough that per-token cost dominates the budget line rather than just appearing on it; the latency budget is tight enough that a provider's network hop is the difference between shipping a feature and not; or data cannot leave the firewall for a reason a lawyer, not an engineer, signed off on. Outside those cases, self-hosting is usually a productivity trade a small team cannot afford to make twice.

The trap that catches teams who got the first decision right is assuming they can start on API and move to self-hosted later "if it comes to that." They can, but production traffic does not move architecture-free. Error handling built around a hosted API assumes synchronous remote calls with provider-side retries and backoff baked in. Moving inference in-house means rebuilding timeouts, circuit breakers, and batching from scratch, usually under load, usually during the same quarter the team is trying to hit a growth number. Decide the shape of the system once, even if the vendor behind it changes later.

## Open Weights

"Open" does not mean free, and it does not mean transparent.

Open weights means the trained parameters are published: you can download them, inspect them at byte level, run them on hardware you control. That is a narrower claim than open source, where the training pipeline, data, and code are also published, a bar almost nothing at frontier scale actually clears, and a different claim again from open access, where you can call a provider's API but cannot touch the weights underneath it. Conflating the three matters, because a licence attached to "open weights" tells you almost nothing on its own about what you are permitted to do with the output.

The licence spectrum this spans is wide, and where a given release sits on it decides real engineering questions before a line of inference code gets written. At the permissive end, a licence imposes no restriction beyond attribution — fine-tune it, redistribute it, sell a product built on it, no obligation flows back to anyone. Further along, a licence turns "source-available" rather than open: free to inspect and run, restricted from certain commercial uses, or gated behind an acceptable-use policy that bans specific downstream applications outright. At the far end, a licence permits research use only, and shipping a paid product on those weights is a contract breach regardless of what a README implies is technically possible. A legal review that treats every open-weights release as interchangeable will eventually sign off on something it should not have.

:::figure open-weights-licence-spectrum
The licence spectrum from permissive (no restriction beyond attribution) through source-available-with-use-restrictions to research-only, with what each band actually permits for a commercial product.
:::

What you get for taking on a set of weights: independence from a provider's outage, since the model keeps answering even when someone else's status page turns red. Reproducibility, too — the same weights, given the same inputs, produce the same outputs indefinitely, which a hosted model sitting behind a version alias does not promise. And the ability to shape inference itself: quantise it down to fit cheaper hardware, distil it into something smaller, or fine-tune on top without asking anyone's permission or sending them your data.

What you take on in exchange: the inference cost is now entirely your problem, not amortised across a provider's fleet. Safety and misuse are yours to certify — nobody else is watching what the model outputs inside your product. Keeping the weights current as vulnerabilities surface in the surrounding stack, serving frameworks, quantisation libraries, tokenizers, is a maintenance burden with no vendor patch to wait on. And the licence's restrictions, whatever they turn out to be, are now baked into your product's legal exposure rather than someone else's.

The capability gap between open-weights and closed-weights models still exists, but it keeps narrowing, and the more useful question is not how wide the gap is today but whether your task sits above or below it. A small open-weights model, in the size range that fits comfortably on a single consumer-grade accelerator, now solves problems that needed a frontier model only a few years back. For classification, structured extraction, semantic search, and plenty of constrained reasoning, that gap has already stopped mattering — the bottleneck has moved to latency, cost, or how carefully the prompt is structured, not to what the model is capable of in principle.

So the question worth asking before reaching for a frontier hosted model by default: does this task require frontier capability, or does it just require an integration that does not fall over? In the second case, an open-weights model usually wins — inference stays local, no rate limit throttles a launch, no billing dashboard needs an audit before a demo ships. But the infrastructure cost is real and routinely underestimated. Running inference at any real scale means GPU provisioning, power and cooling considerations most software teams have never owned, and network bandwidth for serving traffic that behaves nothing like a web app's. It is not the same job as running a quantised model on a laptop for a demo, and treating it as such is how a proof of concept quietly becomes a production incident.

## Prompting, RAG, or Fine-Tuning

There is a decision order here, and it is not the order most teams follow.

Start with prompting. It is the highest-leverage change available in the first week, and the cheapest to test — no infrastructure, no training run, just a different string sent to the same endpoint. Better context, clearer instructions, and a handful of worked examples in the prompt (few-shot learning) solve more production problems than teams expect, precisely because most "the model got it wrong" bugs are actually "the model was never told what right looks like" bugs. The cost is close to zero, and the latency cost of a slightly longer prompt is negligible next to a training run.

Once prompting stops moving the accuracy number, and only then, retrieval-augmented generation is the next rung. RAG decouples what the model can answer from what it was trained on: it lets you ground answers in data that changes after the model shipped, cite a source, and update the corpus without touching the model at all. It is harder to build than a better prompt, since you have inherited a search problem with its own failure modes around chunking and ranking, but it solves a genuinely different problem than prompting does. Prompting cannot teach a model about your Tuesday incident report. Retrieval can hand the model the report directly.

:::figure prompting-rag-fine-tuning-ladder
The three rungs in order — prompting, retrieval, fine-tuning — each labelled with what it buys, what it costs to build and to iterate on, and the point at which the rung below it stops being enough.
:::

Fine-tuning is almost always the wrong second move, and it is the default move most teams reach for anyway, because it sounds like the correct lever: "just teach the model the right format," or "train the hallucination out of it." Both read as intuitive. Both are usually wrong, for the same underlying reason — a training run changes weights, and weights encode statistical patterns, not facts filed away for retrieval.

Fine-tuning genuinely buys three things, and it is worth being precise about which three, because outside of them the training run is wasted effort. First: an output format or tone that prompting cannot reliably enforce, every response in a strict schema, or a voice that has to survive across thousands of unscripted queries where a system prompt alone drifts. Second: a smaller model that holds a larger model's quality on a narrow task, because a frontier model's outputs on your exact distribution can be distilled down into a model a fraction of the size, which then costs and runs a fraction as much. Third: latency gained from a model that has learned to be terse on your task, skipping the throat-clearing a general-purpose model defaults to.

Fine-tuning does not buy knowledge. A model does not learn a fact from a training run unless that fact appears across enough examples to shift a gradient, which for anything resembling "our latest numbers" or "the API we shipped last month" is not how anyone actually trains. It does not cure hallucination at any scale that matters, either — the tendency lives in the base weights, and a modest fine-tuning set does not out-argue the pretraining corpus. And it is expensive in a way that compounds: each iteration means a training job, a wait for convergence, an evaluation pass, then doing it again once the eval finds the first regression.

The decision order, stated as questions rather than a flowchart: does better prompting, with real examples, close the gap? Stop there — most problems do. Is the missing piece live data the model was never trained on? Retrieval closes that gap; prompting cannot. Does the product need a voice or a structural guarantee that no amount of prompting enforces? Only then does a training run belong on the roadmap.

:::code python
# Start here: structured prompting with few-shot examples.
# Most problems stop here.

system_prompt = """
You are a customer support agent. Extract the issue category and urgency level.
Respond in JSON: {"category": string, "urgency": "low"|"medium"|"high"}
"""

examples = [
    {"input": "I cannot log in", "output": '{"category": "auth", "urgency": "high"}'},
    {"input": "What time do you close?", "output": '{"category": "hours", "urgency": "low"}'},
]

# Add examples to the prompt. This often solves it.
# Only if this plateaus, add retrieval or fine-tuning.
:::

## Choosing and Defending a Model

The leaderboard is not your task.

Every major model publishes benchmarks, and every one of them looks decisive until you check what it measured. A model tops a reasoning benchmark, or a coding benchmark, or a long-instruction-following benchmark, and each of those is real work done on data that is not your data, against problems that are not your problem. A support-ticket classifier does not care that a model can solve competition mathematics; it cares whether "the app crashed after I updated" reliably gets tagged as a bug report and not a feature request. The model ranked first on a public leaderboard can rank well behind a smaller, older one on the task you actually ship, and there is no way to know which side of that line you are on without measuring it yourself.

Evaluate on what you actually do, not on what a provider chose to publish. Build a small golden set: somewhere between fifty and a couple of hundred examples drawn from real production traffic or real support tickets, each with a known correct answer that a domain expert, not an LLM, signed off on. This is not a training set — nothing in it should ever be used to fine-tune anything, its only job is to sit still while candidate models are run against it. Score each candidate on accuracy against the known answers, on latency under conditions that resemble production concurrency rather than a single warm request, and on cost per completed task rather than cost per token, since a verbose model that needs three retries to get the format right can lose to a terser one with a higher sticker price. The winner is whichever model clears your bar on all three, not whichever tops any single one.

Then make one more decision, upstream of the model choice itself: make the choice reversible. If the model sits behind a customer-facing product, if the meter runs per token, or if the task is core enough that a price change would force a real conversation, assume today's model gets swapped within a year. Providers deprecate endpoints, prices move, and a genuinely better option for the task will exist before the current one is fully amortised. Put the model choice behind an interface, not scattered through call sites. Route every call through a factory function or a thin client that reads which model to use from configuration, not from a string embedded in a dozen different prompts. Six months in, when a better model ships, or the current provider raises a price, or a compliance requirement rules an option out, the fix becomes a one-line config change instead of a rewrite of every prompt tuned to one model's particular quirks.

| Decision | Make it reversible by | Cost if you guess wrong |
|---|---|---|
| Hosted vs. self-hosted | Interface behind a provider abstraction, swappable later | Rewriting error handling, retries, timeouts from scratch |
| Open vs. closed weights | Model identity in config, never hard-coded | Reprovisioning hardware, redeploying the inference stack |
| Model identity (which model, what size) | A pluggable model factory, not inline strings | Rewriting every prompt tuned to one model's specific quirks |

The cost of building that abstraction up front is a day, maybe two. The cost of skipping it is discovering, the day a provider announces a deprecation, that the model's name is hard-coded across dozens of call sites, each wrapped in a slightly different prompt written around that one model's quirks.

Document the tradeoff at the moment you make it, in language specific enough to be falsifiable later: "We chose a small open-weights model because throughput is high and data cannot leave the VPC; if latency requirements tighten below what our current hardware supports, revisit." A decision written down that vaguely is not a decision, it is a placeholder for an argument you will have to have again from scratch. Revisit it honestly when the circumstances it names actually change, and treat "we have always used this model" as the weakest possible reason to keep using it.
