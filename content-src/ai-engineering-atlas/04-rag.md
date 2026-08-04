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

A MiniLM-scale cross-encoder costs roughly 35 ms per document on a T4 GPU, under a millisecond on an A100, and five to ten times the GPU figure on CPU — so reranking 50 candidates lands around 50–200 ms on a GPU and well over a second on CPU.

## The Query Is Not the Question

A user types "why does this keep failing" into a search box sitting on top of a knowledge base of postmortems. Embedded as written, that string sits nowhere near "root cause: connection pool exhaustion under burst traffic" in vector space — the two share no vocabulary, and a bi-encoder has nothing to bridge them with. The query was phrased for a colleague who already has context. The retriever has none of that context, and never will unless something intervenes between the user's keyboard and the embedding call.

Query rewriting is the cheapest intervention. An LLM pass turns the raw query into something closer to how the corpus itself talks — trading "keeps failing" for the failure-mode vocabulary the system can infer from surrounding conversation, expanding an acronym the user assumed was obvious. It costs one extra generation call, typically tens to a couple hundred milliseconds, before retrieval even starts.

HyDE — Hypothetical Document Embeddings — pushes the same idea further. Instead of rewriting the query, generate a plausible *answer* to it, and embed that instead. A fabricated paragraph that reads like a postmortem embeds closer to a real postmortem than the four-word question ever will, because it is written in the same register as what you are searching for. The cost is a second model call sitting in the critical path before search begins, plus a real risk: if the hypothetical answer is confidently wrong, it steers retrieval toward a plausible-sounding but incorrect neighbourhood of the index, and everything downstream inherits that error.

Multi-query expansion avoids betting everything on one rewrite. Generate three to five paraphrases, retrieve for each independently, then merge and deduplicate the results. It hedges against any single rewrite missing the intended sense of the question, at the cost of multiplying embedding calls and index lookups by the number of variants — a linear cost increase for a probabilistic gain.

Decomposition solves a different failure. A compound question is not one retrieval, it is several wearing a trench coat: "How does our retry policy compare to what the vendor recommends, and did last month's incident violate either one?" contains three retrievable questions in a single sentence. Embedded whole, the query vector is an average that resembles no single sub-topic well. Split first, retrieve each sub-question against its own slice of the corpus, then hand the generator all three sets of chunks together.

| Technique | What it does | Latency cost |
|---|---|---|
| Query rewriting | Rephrases into corpus vocabulary | One extra generation call |
| HyDE | Embeds a hypothetical answer instead of the question | One extra generation, plus drift risk if the hypothesis is wrong |
| Multi-query expansion | Retrieves for several paraphrases, merges results | N retrieval passes instead of one |
| Decomposition | Splits a compound question into sub-questions | One extra generation, then N retrieval passes |

None of this is free, and none of it is safe by default. The failure case that costs teams the most: rewriting away the one distinctive term that would have matched. A query like "ETIMEDOUT after upgrading to libpq 15.4" contains an exact error code and a version string — tokens that would have matched a chunk directly, or landed unusually close to it in embedding space precisely because they are rare. A rewrite step tuned to produce fluent, general prose turns that into "connection timeout after a library upgrade," and the one token doing all the retrieval work is gone. Generic rewriting optimises for readability, and readability is often the opposite of specificity.

The mitigation is to never let the rewrite fully replace the original. Retrieve on both the raw query and the rewritten one, keep quoted strings, error codes and identifiers untouched during rewriting, and pair the vector search with a keyword or BM25 pass that exact-matches on tokens embeddings tend to blur.

:::figure query-expansion-paths
One raw query branching into rewrite, HyDE, multi-query and decomposition paths, each producing its own retrieval, converging into a single merged candidate set before reranking.
:::

## Generation, and Making It Cite

> A citation the model can produce without evidence is not grounding. It's decoration.

Once retrieval hands over a set of chunks, the generator's job shrinks to something narrower than "answer the question": answer using only what is in front of it, and show which part of what is in front of it supports each claim. Most RAG prompts never actually constrain the model to that narrower job, which is why a generator with perfect context still occasionally answers from parametric memory instead.

The instruction "use the context above" is too weak to hold. It reads as a suggestion, and a model with strong priors about the topic will blend retrieved context with what it already believes, producing an answer that is right for the wrong reason often enough that nobody notices until the one time it is not right at all. What holds is structural: number every retrieved chunk, require every factual claim in the response to end with a citation keyed to one of those numbers, and state explicitly that claims without support in the numbered chunks should not be made.

Citation specificity is the part that turns this from a nice-to-have into something a reader can act on. "According to the documentation" is unfalsifiable — it names nothing, and a model can produce it whether or not any document actually supports the claim. A citation to chunk `[3]`, where chunk 3 is a specific paragraph from a specific source the reader can open, is a claim that can be checked in five seconds. That difference is most of what separates a RAG system a team trusts from one they quietly stop using after the third wrong answer nobody could trace back to its source.

Format compliance is not the same as grounding, and this is the trap. A model can learn to emit `[2]` at the end of every sentence because the prompt asked for it, without the claim in that sentence actually appearing in chunk 2. The citation looks right, satisfies a naive check, and is fabricated exactly like the claim it is attached to would have been without any citation instruction at all. Catching this needs a second pass — not asking the generator whether it is grounded, since that is the same model that may have just hallucinated the citation, but checking, mechanically or with a separate model call, whether the cited chunk's text actually contains or entails the claim next to it.

Abstention closes the last gap. A system that always receives five chunks of context and always produces an answer will produce a fluent, confident answer to questions the corpus cannot address — the same failure the relevance floor guards against on the retrieval side, mirrored on the generation side. The instruction has to make "I do not have enough information to answer that" a legitimate, unpenalised output, not a fallback the model reaches for only once everything else fails. Systems that only test the happy path never notice this instruction is not holding until abstention is the correct answer and the model guesses anyway.

:::code python
SYSTEM_PROMPT = """Answer using only the numbered sources below.
Every factual claim must end with a citation like [2].
If the sources do not support an answer, say so directly —
do not draw on anything outside them."""

prompt = SYSTEM_PROMPT + "\n\n" + render_numbered(context) + "\n\nQ: " + query
answer = generate(prompt)

# Format compliance isn't grounding: check the cited chunk actually
# supports the claim, don't just check that a citation is present.
for claim, chunk_id in extract_citations(answer):
    if chunk_id not in {c.id for c in context}:
        flag_unverifiable(claim)          # cited a source that wasn't retrieved
    elif not supports(context[chunk_id], claim):
        flag_ungrounded(claim)            # citation present, claim not actually backed
:::

## Evaluating RAG Without Fooling Yourself

An end-to-end RAG score is one number produced by two failure-prone stages, and that number cannot tell you which stage failed. If retrieval returns nothing useful and the generator correctly abstains, an end-to-end "did this answer the question" check can mark that as a pass — technically true, uninformative about the fact that the retriever is broken. If retrieval returns exactly the right chunk and the generator ignores it and answers from memory, an end-to-end accuracy metric might still score it correct by coincidence, hiding a generator that is not actually reading its context. Debugging off a single blended number means guessing which half moved it, every time.

Retrieval quality gets measured against a golden set of query-to-expected-chunk mappings, independent of anything the generator does.

| Metric | What it measures | Where it's blind |
|---|---|---|
| Recall@k | Whether a relevant chunk appears anywhere in the top k | Ignores rank — a relevant chunk at position k counts the same as position 1 |
| MRR | The rank of the first relevant result, averaged across queries | Only rewards the first hit; ignores whether other relevant chunks were also retrieved |
| nDCG | Rank-weighted relevance across the whole result list, with graded rather than binary relevance | Needs graded relevance judgements per chunk, which are expensive to collect honestly |

:::math Recall at k
\mathrm{recall@k} = \frac{|\text{relevant} \cap \text{retrieved}_k|}{|\text{relevant}|}
:::

Generation quality is a separate measurement, run against the generator's output and the context it was actually given, not against ground truth directly. Faithfulness checks whether every claim in the answer is supported by the retrieved context — it says nothing about whether that context was the right context, only whether the generator respected what it was handed. Answer relevance checks whether the response actually addresses the question asked, independent of whether it is grounded. The two move independently: a faithful, irrelevant answer is grounded in the right facts about the wrong question; a relevant, unfaithful answer sounds like it is answering correctly while inventing its support. Neither failure looks like the other in a transcript, and a single blended score erases the distinction that would tell you which one you are looking at.

A golden set built from real production queries earns its keep in a way a synthetically generated one does not — synthetic questions tend to be phrased the way a model expects questions to be phrased, which is exactly the gap query rewriting exists to close, and testing against it under-samples the messy, compound, badly worded queries that actually show up. Seed the set from logged queries, label expected chunks and, where feasible, a reference answer, and revisit it as the corpus changes — a golden set built against last year's document set quietly stops testing anything once half the index has turned over.

LLM-as-judge is the only way to score faithfulness and relevance at the volume a golden set of any real size requires, and it comes with failure modes worth naming rather than assuming away: position bias toward whichever answer is presented first or is longer, a preference for outputs from a model in the same family as the judge, and blindness to factual errors the judge was not specifically prompted to check for. A rubric with explicit pass/fail criteria per claim scores more reliably than an open "is this answer good" prompt, and spot-checking judge output against human labels on a rolling sample is what catches drift before it compounds silently across a hundred releases.

Regression detection is what turns these metrics from a report into a gate. Run both metric families against the golden set on every change — a new embedding model, a chunking parameter, a prompt edit — and diff against the previous run.

:::figure eval-metric-split
A golden-set query flowing into two separate scoring branches — retrieval metrics computed against expected chunk IDs, generation metrics computed against the generated answer — meeting only at the reporting stage, never merged into one number.
:::

A drop in recall@k should block a merge the same way a failing unit test does, because the change that improved the top-line number reviewers were watching is exactly the kind of change that can silently regress the one nobody was.
