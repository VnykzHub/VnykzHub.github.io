---
id: rapid-fire
label: Rapid Fire
title: Rapid Fire
slug: rapid-fire
icon: zap
color: "#C4703F"
dek: Ten sections compressed to their load-bearing claims, plus the fifteen questions an interview actually probes and the one-line answers that show you shipped rather than read.
---

## Fundamentals, Compressed

Every property below traces back to one fact: an LLM is a probability distribution over next tokens, trained to predict plausible continuations, not true or correct ones. Everything downstream — the prompting, the retrieval, the guardrails — is a mitigation for that one training objective, not a fix to it.

:::figure rapid-fire-dependency-map
The eleven sections as a dependency graph: Fundamentals and Embeddings & Search feeding into both RAG and Vector Databases, which feed Agents and MCP, all four feeding Production and Model Choice, with System Design drawing on everything above it and Multimodal sitting alongside RAG as a parallel retrieval concern.
:::

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| Fluency is not correctness | The training objective rewards plausible continuations, not verified facts | A confident answer gets treated as a checked one |
| Tokens are atomic and non-negotiable | The tokenizer is fixed at ship time; a fragmented ID has no useful internal representation | "Roughly one token per word" blows the context budget on code or non-English text |
| Temperature 0 is not determinism | Batching, floating-point accumulation order and hardware all drift, even at a fixed seed | A reproducibility guarantee gets built on top of one the API never made |
| Context windows degrade before they fill | Attention is quadratic and dilutes with distance; recall is U-shaped, not flat | The window gets stuffed instead of retrieved, and the middle goes missing silently |
| Hallucination is a baseline property, not a bug | The same mechanism that produces fluent, correct text produces fluent, false text | Effort goes into prompting it away instead of designing verification and abstention around it |
| Sampling parameters reshape the distribution you draw from, not the distribution itself | Temperature scales logits; top-k and top-p truncate the tail; none of them add reasoning | "Lower temperature" gets read as "better output" instead of "lower variance, lower ceiling on creativity" |

## Embeddings and Search, Compressed

An embedding is a lossy projection chosen by someone else's training run, not meaning itself — search is only as good as how well that projection matches your domain, and a model trained on someone else's text carries someone else's blind spots into yours.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| Cosine and dot product diverge without normalisation | Dot product carries magnitude; cosine does not | Longer documents rank higher for reasons unconnected to relevance |
| ANN indexes trade recall, latency and memory against each other | Approximate search only returns *probably* the nearest neighbours | One axis gets tuned and another moves for no apparent reason |
| ef_search and nprobe are search-time knobs, not index properties | They control how many candidates get examined per query, set at query time | The index gets blamed for low recall instead of the default parameter |
| Dense embeddings miss exact terms; BM25 misses paraphrase | Each retrieval mode was built for one kind of match | A product ID or version number never surfaces in dense-only retrieval |
| A cross-encoder reranker beats retrieval ranking at roughly 100x the cost per pair | It scores query and document together instead of independently | Either reranking is skipped and relevant results stay buried mid-list, or the whole index gets reranked and the bill follows |
| Embeddings have uses past retrieval: clustering, deduplication, drift detection | The geometry a model learned for one purpose still encodes usable structure for others | Drift in a production corpus goes unnoticed until a classifier or a support macro quietly stops matching reality |

## Vector Databases, Compressed

A library gives you fast approximate search; a database gives you concurrent writers, durability, and someone else's on-call rotation — pay for the second only once you need it, because crossing a process boundary costs latency no in-memory lookup ever pays.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| A library (FAISS, Annoy) is a single-process, single-writer structure | It optimises for one thing: fast ANN in memory | Sharing it across services rediscovers file locking from first principles |
| Post-filtering silently returns fewer than k results | The k-nearest-neighbours guarantee only holds pre-filter; filtering afterward discards survivors, not the true top-k' | Four results reads as "only four relevant documents exist," not "six got filtered out" |
| Deletes should be tombstones, not immediate reindexes | The index structure is built for near-immutability; removing an element means rebuilding | Every delete becomes an expensive reindex instead of an O(1) flag |
| Memory, not compute, is the binding operational cost | float32 storage is N × D × 4 bytes; 100M vectors at 1536 dimensions is roughly 600GB | The instance gets sized for compute and pages out on memory instead |
| Quantization buys 4–16x memory at a few points of recall | int8 and int4 shrink storage; the top-k set shifts slightly | Quantization ships blind, and the recall actually given up is never measured |
| A library is enough below roughly a million vectors with no concurrent writers | A sub-millisecond in-memory lookup beats any network hop a database adds | A database gets adopted early and pays a latency and cost premium nothing in the workload needed yet |

## RAG, Compressed

Almost every RAG failure is a retrieval failure — check what was actually retrieved before touching the prompt or swapping the model, because the generator is usually doing exactly what it was asked to do with the wrong material.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| Diagnose by asking whether a human could answer from the retrieved chunks alone | It separates retrieval, ranking and generation into three distinct failure points | The prompt gets rewritten to fix a chunking bug, and nothing changes |
| Chunking sets a hard ceiling on what can ever be found | A fact split across a chunk boundary cannot be retrieved whole, whatever the embedding model | The embedding model gets blamed for a chunking problem |
| Top-k is a token budget, not a recall dial | Every retrieved chunk is billed on every request, forever | Raising k "to be safe" quietly doubles cost and dilutes context with noise |
| A relevance floor makes "no answer" a legitimate outcome | Without one, the system always returns k chunks, including for questions the corpus cannot address | The model attends to a plausible wrong chunk and answers confidently anyway |
| Retrieve wide, then rerank narrow | Bi-encoders are cheap and index-wide; cross-encoders are accurate but affordable only over a shortlist | The system is either cheap-but-coarse or accurate-but-unaffordable, never both |
| Overlap between chunks is a real trade, not a free win | It mitigates boundary loss but stores and searches roughly a fifth more vectors, competing near-duplicates for the same top-k slots | Overlap gets raised indefinitely as a fix, and cost climbs faster than recall does |

## Agents, Compressed

An agent is any system where the model, not your code, decides what happens next — everything else here follows from that one handoff.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| Fewer, sharper tools beat more, overlapping ones | The tool description is the model's entire specification; near-duplicates force it to guess | Accuracy drops as the toolset grows, independent of model quality |
| Error compounds multiplicatively across dependent steps: p^n | Each step's output feeds the next unchanged; one failure anywhere propagates | A model correct 95% of the time per step completes a 20-step chain roughly a third of the time |
| Tool failures split into four categories, each needing different handling | Malformed args self-correct; tool errors retry only if transient; wrong tool throws no exception; loops need repeat detection | Treating all four as "retry" produces an agent that gives up too early or loops forever |
| Gate placement follows reversibility, not perceived risk | A cheap-to-undo action costs a review cycle if wrong; an irreversible one costs an incident | Everything gets gated and the human stops reading, or nothing does and something unrecoverable ships |
| Resent transcripts make agent cost quadratic in step count | Every step bills the full growing history, not just its own new content | A loop that runs twice as long costs closer to four times as much, not twice |
| A genuine multi-agent split reduces what each agent holds in context; a cosmetic one just relabels the same prompt | Splitting only helps when each agent's tools and context are a strict subset of the combined whole | Two "agents" pass the full transcript back and forth, adding round trips and cost with no reliability gain |

## MCP, Compressed

MCP standardises the socket between a model and its tools — N×M integrations become N+M — and says nothing about whether the model picks the right tool or calls it well.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| It solves reuse, not judgement | The protocol standardises discovery and transport, not tool selection or argument quality | Adopting MCP is expected to fix a badly-described tool, and it doesn't |
| Tools, resources and prompts differ by who decides to invoke them | The model triggers tools; the host pulls in resources; the user selects prompts | A resource gets designed as if the model would reach for it unprompted |
| A local stdio server inherits the host's trust level | Credentials come from the host process's own environment, not a scoped grant | A tool call becomes an unreviewed RPC into your infrastructure |
| Sessions are stateful; a dropped connection can lose the whole toolset | Reconnection is the runtime's responsibility, not the protocol's | Tools vanish from the model's options mid-conversation with nothing in the transcript to explain why |
| Skipping MCP is correct if you own both ends | One app, one model, a handful of internal functions is fewer moving parts without a server, transport and handshake | A subprocess and a versioning story get added for a reuse benefit that never materialises |
| Versioning a tool's name or schema breaks every caller's implicit understanding of it | A deployed agent has learned to call a tool a specific way, through prompting or its own priors | Renaming a parameter surfaces later as malformed calls with no obvious cause, not as a type error at deploy time |

## Production, Compressed

The number that decides whether a system feels slow is time-to-first-token; the number that decides whether it's reliable is p99 — neither is the average, and optimising the average is how a team ships a demo that pages someone in production.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| Streaming relocates the wait, it doesn't shorten it | Total compute is unchanged; only when the user starts seeing tokens moves | Tokens stream into a parser that needs the whole structure anyway, and nothing is gained |
| Output tokens cost roughly 5–6x input tokens | Output is generated one token at a time; input is processed in parallel during prefill | Prompt length gets trimmed to save cost when a shorter answer would have saved more |
| Semantic caching fails confidently | A near-neighbour query returns a fluent answer indistinguishable from a fresh one | "Refund window, annual plan" silently answers as "refund window, monthly plan" |
| A guardrail that only logs isn't a guardrail | It has produced forensic evidence, not prevented anything | A PII leak or a bad tool call still reaches the user before anyone reads the log |
| Degradation should follow an ordered cascade, not retry-until-it-works | Rate limits, timeouts and degraded 200s each need a different response | Every failure becomes the same long wait ending in a spinner or an error page |
| Traces beat aggregate dashboards for answering why one specific answer was wrong | A trace ties the prompt, retrieved chunks, tool calls and versions together under one request id | A dropped retrieved-chunks field makes it impossible to tell a retrieval failure from a generation failure after the fact |

## Model Choice, Compressed

The decision order is prompting, then retrieval, then fine-tuning last — and the model that wins the public leaderboard is not the model that wins your golden set, so the reversible decision matters more than the initial one, since most of these choices get revisited within a year regardless.

:::figure rapid-fire-decision-tree
A decision tree: does better prompting with examples solve it — stop there. Does the answer need live or private data — add retrieval. Does the output need a format, tone or size prompting can't enforce — only then fine-tune. Self-hosting is drawn as a separate branch, gated on throughput, latency floor and data residency rather than on capability.
:::

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| API is the honest default | It buys a working system tomorrow and someone else's on-call rotation | Self-hosting first means owning MTTR before owning the problem it was meant to solve |
| Open weights is not open source or open access | Downloadable parameters say nothing about whether the training pipeline was published | Reproducibility or transparency gets assumed that was never on offer |
| Fine-tuning buys format, tone and size — not knowledge | A model cannot learn facts from a training run unless they appear thousands of times | Fine-tuning gets used to fix hallucination, and the bias in the weights doesn't move |
| The leaderboard is not your task | Public benchmarks are measured on data that isn't yours, solving problems that aren't yours | The model ranked first publicly ranks seventh on your golden set |
| Make the model choice reversible | Providers reprice, models improve, requirements change within a year | A hard-coded model choice becomes a rewrite of the whole pipeline |
| Self-hosting genuinely wins only past a real throughput, latency-floor or residency threshold | Below that threshold it's a productivity trade a team can't afford, not a cost saver | Self-hosting gets adopted for control's sake and the on-call burden it creates goes unbudgeted |

## Multimodal, Compressed

Vision-language models describe images reliably and read exact numbers off them unreliably — never let one be the source of truth for a value.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| Image tokens cost more to process and store than text tokens for equivalent content | A 1024×1024 image tiles into thousands of patches before pooling down to a token budget | Reranking image candidates costs an order of magnitude more than reranking equivalent text chunks |
| VLMs are reliable at description, layout and OCR-adjacent reading | These tasks ground language in visual features the model actually learned during training | The same trust gets extended to tasks the model is weak at, because the strong ones worked |
| VLMs are unreliable at counting, fine spatial relations and chart values | Sub-pixel precision and symbol recognition across every font and chart library was never the training objective | A bar chart returns plausible-sounding, wrong revenue numbers with full confidence |
| Naive text extraction on tables and multi-column PDFs is corruption, not just loss | Reading order crosses column and table boundaries, interleaving unrelated content | The embedding model or reranker gets debugged when the fault was upstream, at extraction |
| Embed images for discovery, extract text for values | The two modalities answer different questions — why a page is relevant, versus what it says | A number gets read off a page image and comes back as a confident hallucination |
| Citations need to point at page regions, not chunks, once documents are visual | Storage has to record the bounding box and page number alongside the extracted text or image | A citation can't be verified because the original page structure was never kept |

## System Design, Compressed

Five underspecified questions — who asks, how often, how wrong can it be, who pays, what happens on failure — decide the architecture before anyone opens a diagramming tool.

| Claim | Why it holds | What breaks if ignored |
|---|---|---|
| "Fast" and "accurate" are wishes, not requirements | Only a number attached to a percentile, floor or bound can be tested or violated | The average gets optimised and someone gets paged for a tail nobody defined |
| Seven boxes recur in every real system: ingest, index, retrieve, orchestrate, serve, evaluate, observe | Each is a distinct failure surface, even when several shrink to near nothing at small scale | Observability gets skipped early and stays skipped until a bad answer needs explaining and the logs don't say what was retrieved |
| Little's Law ties latency to capacity: L = λW | In-flight requests equal arrival rate times time spent in the system | A latency regression silently becomes a capacity regression, undersizing every queue sized for the old number |
| Conflicting constraints get resolved, not eliminated | Accuracy vs latency, cost vs quality, freshness vs stability cannot all be maximised at once | A design tries to win every axis and ships something mediocre on all of them instead of a stated tradeoff on one |
| Failure has at least three shapes: no answer, confidently wrong, stale | Each needs a different response — abstention, a confidence threshold, a staleness alarm | One shape gets handled and the other two turn up in an incident review instead |
| The reference architecture is seven boxes, but only four are load-bearing at small scale | Ingestion, index, retrieval and serving make the core loop function; orchestration, evaluation and observability can start as placeholders | A placeholder stays in place past the point the failure it was skipping actually happens |

## The Questions You Will Actually Be Asked

An interviewer testing for shipped experience asks about the failure, not the happy path.

| Question | The answer that shows you've shipped |
|---|---|
| A RAG answer is wrong — what's your first move? | Look at what was actually retrieved; if a competent human couldn't answer from those chunks, it's a retrieval bug, not a generation one |
| How do you choose k for retrieval? | Retrieve wide, rerank, keep only what clears a relevance floor — k is a cost budget, not a recall dial |
| Cosine similarity or dot product — does it matter? | Only when vectors aren't normalised at index time; normalise and the distinction disappears |
| Your agent is stuck in a loop — what do you do? | Detect near-identical repeated calls over a short window and escalate; a step cap alone won't catch a loop that's cheap per turn |
| When do you fine-tune instead of prompting or retrieving? | Only after both plateau, and only for format, tone or size — never to fix hallucination |
| How do you stop an agent's cost from running away? | A hard step cap and a session budget checked before each call, because a resent transcript makes cost grow quadratically in steps |
| Does JSON mode guarantee correct output? | It guarantees syntax, not content — the values still get validated downstream |
| p50 looks fine, users still complain — why? | p50 hides the tail; the ticket-generating requests live in p95/p99, usually a cold start or a backoff, not the model |
| How do you cache LLM responses without risk? | Exact-match wherever prompts repeat verbatim; semantic caching only with a conservative threshold, knowing a near-miss returns a wrong answer at full confidence |
| When do you need a vector database instead of a library? | Once there's more than one writer, the corpus updates faster than a rebuild, or durability becomes someone else's contractual problem |
| Where do you put a human-in-the-loop gate? | On reversibility, not perceived risk — gate what can't be cheaply undone, skip the gate on what can |
| MCP or a hand-written tool schema? | Write it yourself if you own both ends; reach for MCP only when the same tool has to show up in clients you don't control |
| Should you trust a VLM reading numbers off a chart? | No — use it for description and page discovery, and extract numeric values from structured text instead |
| How do you defend a model choice in review? | A 50–200 example golden set from real traffic, scored on accuracy, latency and cost, behind an abstraction that makes swapping it a config change |
| Design a document-QA system in five minutes — where do you start? | Five questions before the diagram: who asks, how often, how wrong can it be, who pays, what happens on failure |

:::figure rapid-fire-question-map
The fifteen questions grouped by which preceding section they draw on, showing System Design and Agents each anchoring several questions while Fundamentals underlies all of them without being asked about directly.
:::
