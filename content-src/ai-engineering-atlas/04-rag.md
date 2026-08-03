---
id: rag
label: RAG
title: Retrieval-Augmented Generation
slug: rag
icon: layers
color: "#F0B84C"
dek: The most-built system in applied AI, and the one most often described too shallowly. Chunking, retrieval, generation, and the evaluation that tells you which half is broken.
---

## Why Retrieval Exists

A model's weights are frozen at training time. Everything it knows, it knew before you met it — which means it cannot answer a question about your contract, your codebase, or last Tuesday's incident.

There are only three ways out of that, and two of them are usually wrong.

| Approach | What it costs | Where it loses |
|---|---|---|
| Fine-tune on your data | A training run per update, plus a held-out set you probably do not have | Facts go stale the moment the source changes, and you cannot cite anything |
| Put everything in the prompt | Linear cost in tokens, quadratic attention cost | Falls over once the corpus exceeds the context window, and degrades well before that |
| Retrieve the relevant part, then generate | An index, and a retrieval step you now have to be good at | Retrieval quality becomes the ceiling on answer quality |

Retrieval wins because it decouples what the model knows from when it was trained. Update the index and the answer changes. No gradient step, no evaluation run, no deployment.

:::figure rag-pipeline-overview
The four stages — ingest, index, retrieve, generate — with the corpus updating independently of the model, and the retrieved chunks flowing into the prompt.
:::

The cost is that you have inherited a search problem. That trade is almost always worth making, and almost always underestimated.

## The Part Everyone Gets Wrong

> Almost every RAG failure is a retrieval failure. The generator was fine. It was handed the wrong context and did exactly what was asked of it.

This is the most useful thing to internalise, because it redirects effort. When an answer is wrong the instinct is to change the prompt or swap the model. Both are cheap, both feel productive, and neither touches the actual fault most of the time.

The diagnostic is simple. Take the failing question, look at what the retriever actually returned, and ask whether a competent human could have answered correctly from those chunks alone. If not, the generator was never in play.

- **The right chunk was never retrieved** — the fault is upstream: chunking, embeddings, or the query itself.
- **The right chunk was retrieved but ranked tenth** — the fault is ranking, and a reranker is the cheapest fix available.
- **The right chunk was in position one and the answer is still wrong** — now, and only now, is this a generation problem.

## Chunking Decides What Can Ever Be Found

Chunking is the least glamorous stage and it sets a hard ceiling on everything downstream. A fact split across two chunks is a fact the system cannot retrieve, however good the embedding model is.

The tension runs between two failure modes. Chunks that are too small lose the context that made them meaningful — a paragraph reading "this threshold should be raised" is useless when the sentence naming the threshold landed in the previous chunk. Chunks that are too large dilute the embedding: one vector has to represent several ideas at once, and ends up close to none of them.

| Strategy | How it splits | Fails when |
|---|---|---|
| Fixed-size | Every N tokens, with overlap | A sentence, table or code block spans the boundary |
| Recursive | On structural separators, largest first | Documents with no reliable structure — scanned PDFs, transcripts |
| Semantic | On embedding-similarity shifts between sentences | Cost: it needs an embedding pass over every sentence before anything can be indexed |
| Document-aware | On real headings, tables or function bodies | Requires a parser per format, and most real corpora are mixed |

Overlap is the standard mitigation for boundary loss, and it is a genuine trade rather than a free win. Overlapping by a fifth means storing and searching roughly a fifth more vectors, and it means near-duplicate chunks competing for the same top-k slots.

:::figure chunking-boundary-loss
The same paragraph under fixed-size and document-aware chunking, with the retrievable unit highlighted — showing a definition severed from its term by the naive split.
:::

The honest default is recursive splitting on structure with modest overlap, then measuring. Semantic chunking is defensible once an evaluation set proves it earns its ingestion cost. Without that set it is an expensive guess.

## Top-k Is a Budget, Not a Setting

Retrieval returns the k nearest chunks. Choosing k looks like tuning and is actually budgeting: every retrieved chunk costs input tokens on every request, forever.

:::math Cosine similarity between query and document
\mathrm{score}(q, d) = \frac{q \cdot d}{\lVert q \rVert \, \lVert d \rVert}
:::

Raising k monotonically increases the chance the right chunk is present, and monotonically increases both cost and the volume of irrelevant text the generator must ignore. Those curves cross earlier than most teams expect, because the failure it causes is quiet: the model attends to a plausible-looking wrong chunk and produces a confident answer nobody flags.

:::code python
# Retrieve wide, rerank, then keep only what earns its tokens.
# The reranker is a cross-encoder: slower per pair, far better at
# relevance than the bi-encoder that produced the candidates.

candidates = vector_store.search(embed(query), k=50)
ranked = reranker.score(query, candidates)      # cross-encoder, query-aware
context = [c for c in ranked[:5] if c.score > RELEVANCE_FLOOR]

if not context:
    return "I do not have anything relevant to that."   # abstain, do not guess
:::

Two details there carry most of the value. The **relevance floor** makes an empty result set a legitimate outcome — a system that always returns five chunks will always produce an answer, including for questions the corpus cannot address. And **retrieving wide before reranking** exploits the asymmetry between the two model types: the bi-encoder is cheap enough to run across the whole index but scores query and document independently, while the cross-encoder sees both together and is markedly more accurate over a shortlist.

<!-- VERIFY: typical latency added by a cross-encoder rerank over ~50 candidates. Quote a range from a named source rather than a single number, and say which model class it applies to. -->
