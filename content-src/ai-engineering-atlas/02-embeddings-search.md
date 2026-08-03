---
id: embeddings-search
label: Embeddings & Search
title: Embeddings & Search
slug: embeddings-search
icon: search
color: "#4A9E93"
dek: Turning meaning into geometry, then searching that geometry fast enough to matter. The compression, the metrics, and the real cost of approximate nearest neighbour.
---

## What an Embedding Is

A model encodes text as a vector — a point in high-dimensional space. The claim is that meaning lives in geometry: texts with similar meaning land near each other, dissimilar ones far apart. Embeddings make that claim concrete enough to search.

What an embedding captures depends entirely on the model that made it. A model trained on vector similarity will put paraphrases next to each other; one trained on code semantics will cluster functions by behaviour. But there is one thing no embedding captures cleanly: exact lexical match. The phrase "apple tree" and "tree apple" are neighbours in the embedding space even though a lexical search would fail. Conversely, a search for "fruit" will miss "apple" unless the model learned that semantic relationship during training.

The geometry is not the meaning — it is a lossy projection of meaning chosen by whoever trained the model. Understand that loss explicitly. A text compressed to 1536 dimensions has had information deleted. The embedding is what remains after that deletion has been applied.

:::figure embedding-geometry-projection
Two texts ("a dog barks" and "a cat meows") projected into a 2D subspace of embedding space, with a third text ("an animal makes noise") positioned between them. The proximity is semantic, not exact. A lexical search for "animal" would miss all three until queried.
:::

The embedding model is trained once and fixed. It does not learn from your data; it cannot update to reflect your domain. If your corpus uses "velocity" to mean something domain-specific and the model was trained on physics textbooks, the vector will point in the physics direction. You inherit the model's priors wholesale.

This matters. Document retrieval with embeddings is document retrieval through the lens of a model trained on someone else's text. That lens will have blind spots and distortions specific to your domain. Start from that fact.

## Similarity Metrics

You have three vectors: a query embedding, document embeddings. You need to score how close they are. Three metrics appear in every vector database and they do not agree on what "close" means.

**Cosine similarity** measures the angle between vectors, independent of magnitude:

:::math cosine-similarity
\cos(q, d) = \frac{q \cdot d}{\lVert q \rVert \, \lVert d \rVert}
:::

It ranges from -1 (opposite) to 1 (aligned). Cosine is scale-invariant: a vector and its double have the same cosine distance to a third vector.

**Dot product** is the numerator alone:

:::math dot-product
\mathrm{dot}(q, d) = q \cdot d
:::

If vectors are normalised (length 1), dot product and cosine are identical. If they are not normalised, dot product favours longer vectors — a document vector that happens to be twice as long looks twice as close by dot product alone, but identical by cosine.

**Euclidean distance** is the straight-line distance:

:::math euclidean-distance
d_E(q, d) = \sqrt{\sum_i (q_i - d_i)^2}
:::

It prefers vectors that are close in the coordinate space, regardless of angle. A vector at (1, 1) is closer to (1.1, 1.1) by Euclidean distance than by angle.

The choice matters less than you might think, because most embedding models train by optimising cosine similarity, which means their geometry has cosine built in. But normalisation is the fulcrum. If your vectors are normalised to unit length, dot product and cosine collapse to the same calculation. If they are not, they diverge: dot product will rank longer vectors higher, cosine will not care about length.

| Metric | Scale-invariant | Requires normalisation | Common use |
|---|---|---|---|
| Cosine | Yes | No (but identical to dot product if normalised) | Semantic search, embedding similarity |
| Dot product | No | Usually requires it | Some vector databases default to this |
| Euclidean | No | No | Clustering, but less common for retrieval |

The practical rule: if your vector database supports normalisation at index time, turn it on. If you normalise, dot product and cosine are the same. If you do not normalise and your database uses dot product, longer documents will rank higher, and you have introduced a bias that is hard to debug.

<!-- VERIFY: check whether most embedding APIs (OpenAI, Cohere, others) return normalised vectors by default; confirm whether this varies by provider -->

## ANN Indexes

Exact nearest-neighbour search — comparing the query vector to every document vector — is O(n) and does not scale. A corpus of 1 million vectors means 1 million similarity calculations per query. A corpus of 1 billion means 1 billion. The latency becomes unacceptable quickly.

Approximate Nearest Neighbour (ANN) indexes solve this by accepting a recall loss: they return *probably* the nearest neighbours, not always the true nearest ones. The trade happens across three axes.

**Hierarchical Navigable Small World (HNSW)** builds a graph where each vector is a node and edges connect it to its approximate neighbours. Search starts at a random node and navigates greedily to closer neighbours, jumping between layers until reaching a local minimum. It has no training phase — vectors can be inserted online. Recall typically stays above 90% for practical parameters, and latency is sublinear: roughly O(log n).

**Inverted File (IVF)** partitions the vector space into clusters, typically with k-means. At index time, each vector is assigned to its nearest cluster. At search time, only a subset of clusters are searched. Recall depends on how many clusters you search: searching one cluster is very fast but low recall; searching all is exact search again. IVF is cheaper to build initially but slower to update.

:::figure ann-index-tradeoff
Two indexes searching the same 100-vector corpus. HNSW navigates a graph layer-by-layer; IVF partitions space into k clusters and searches the closest ones. HNSW explores more vectors to get higher recall. IVF gets lower recall faster but cannot easily be updated.
:::

The recall/latency/memory triangle is real. High recall demands seeing more vectors, which adds latency. Low latency demands small indexes, which uses less memory but misses neighbours. Every parameter is a point on this surface.

Most vector databases offer both, and choice depends on your corpus size, update frequency, and acceptable latency. HNSW is safer for small corpora (thousands to tens of millions of vectors) and online insertion. IVF is cheaper at very large scale but assumes a mostly-static index.

<!-- VERIFY: typical latency figures for HNSW vs IVF at 1M vectors; cite a source with measured numbers and the hardware/embedding model used -->

## Tuning the Index

Each index type exposes knobs. Understanding what each one trades away prevents tuning blind.

**HNSW parameters:**

- `M`: maximum number of connections per node. Higher M means richer graph, higher recall, more memory. Typically 4–48. A value of 16 is a reasonable default.
- `ef_construction`: how many candidate neighbours to consider when inserting a new node. Higher value makes insertion slower but produces a better graph. Typical range 200–2000.
- `ef_search`: how many candidates to track during search. Higher ef_search increases recall at the cost of latency. Affects only search, not index size.

**IVF parameters:**

- `nlist`: number of clusters. More clusters make index construction faster and memory cheaper per query, but lower recall because the search space is partitioned more finely. Typical range 100–10,000.
- `nprobe`: how many clusters to search. Searching more clusters increases recall and latency. Typical range 1–100. Setting nprobe equal to nlist recovers exact search.

| Parameter | Effect on recall | Effect on latency | Effect on memory |
|---|---|---|---|
| HNSW M | Increases | Increases slightly | Increases linearly |
| HNSW ef_construction | (affects index quality, not search) | — | Increases slightly |
| HNSW ef_search | Increases | Increases | No change |
| IVF nlist | Decreases (finer partitioning) | Decreases | Decreases |
| IVF nprobe | Increases | Increases | No change |

The most common mistake is leaving ef_search or nprobe at the default, then blaming the index for low recall. These are not index properties — they are search parameters you can adjust per query. Raise them to 10–20 times the default and observe the latency/recall curve. That curve is the real cost of your choice.

:::code python
# HNSW tuning example: trade latency for recall dynamically
def search_with_tuning(query_vector, ef_search_low, ef_search_high, latency_budget_ms):
    # Start with low ef_search (fast)
    candidates = index.search(query_vector, ef_search=ef_search_low, k=10)
    
    # If results look weak (e.g., scores too low), raise ef_search
    if candidates[-1].score < CONFIDENCE_THRESHOLD:
        candidates = index.search(query_vector, ef_search=ef_search_high, k=10)
    
    return candidates
:::

Tuning is not a one-time activity. Run periodic queries and measure their latency and recall against a held-out set of ground-truth neighbours. Adjust parameters to stay in the valid region of the tradeoff surface. One corpus with stable vectors may need different tuning than another with frequent updates.

## Hybrid Search

Dense embeddings miss exact terms. A query for "Python 3.11 release date" will not find a document that says "Python 3.11 was released on October 24, 2022" unless the embedding model learned to associate the date with that specific version — and it might not have, if training data was sparse.

Sparse retrieval (typically BM25, a lexical ranking algorithm) solves the opposite problem: it excels at exact term matches but misses paraphrases. A query for "how to train a machine learning model" will not rank a document titled "teaching a neural network" highly, even though they are semantically identical.

Hybrid search runs both simultaneously: a dense query against the embedding index and a sparse query against an inverted index. Results are then fused using rank fusion (typically reciprocal rank fusion, which weights higher-ranked results more heavily).

:::math reciprocal-rank-fusion
\mathrm{score}(d) = \sum_i \frac{1}{k + r_i(d)}
:::

where r_i(d) is the rank of document d in ranking i, and k is a constant (typically 60). A document ranked 1st in one ranking and 20th in another scores higher than a document ranked 5th in both.

The practical effect: hybrid search catches documents the dense index misses and the sparse index catches documents embeddings find. The fusion step is cheap — it happens in memory after both indexes have returned their top candidates.

Not all query types benefit equally. Factual queries ("who won the 2020 election?") benefit hugely because the exact answer is often just a few tokens. Reasoning queries ("should I use embeddings or exact search?") benefit less because they rely more on semantic understanding. Measure your actual queries before deciding hybrid is necessary — a good embedding model often outperforms hybrid on semantic tasks.

## Rerankers

Retrieval ranks by some signal — embedding similarity or BM25 score. That signal is coarse. A document might be topically relevant but poorly written; another might match the query lexically but be off-topic. The score from the retriever does not capture that nuance.

A **bi-encoder** (the embedding model) scores query and document independently, then compares them:

:::math bi-encoder
\mathrm{score} = \mathrm{embed}(q) \cdot \mathrm{embed}(d)
:::

A **cross-encoder** sees both together and produces a relevance score:

:::math cross-encoder
\mathrm{score} = \mathrm{model}(\text{[CLS]} \, q \, \text{[SEP]} \, d)
:::

The cross-encoder is more expressive — it can learn interactions between query and document — but costs roughly 100x more to compute because it runs a full forward pass per query-document pair. It is also slower: you cannot batch it against an entire index.

The standard pattern is retrieval-then-rerank: use the bi-encoder to retrieve wide (k=50 to 100 candidates), then use a cross-encoder to rerank the top few. The bi-encoder is fast because one embed(q) + many dot products. The cross-encoder is slow but handles only a shortlist, so total latency is often half of doing exact search alone.

:::code python
# Retrieve 50 candidates, rerank to top 5
dense_candidates = vector_index.search(embed(query), k=50)
reranked = cross_encoder.predict(
    [[query, c.text] for c in dense_candidates]
)
# Argsort and take top-5 by cross-encoder score
top_5 = sorted(zip(dense_candidates, reranked), key=lambda x: x[1], reverse=True)[:5]
:::

<!-- VERIFY: typical latency added by a cross-encoder rerank over 50 candidates; name the specific model (e.g., ms-marco-TinyBERT-L-2-v2) and source for measured latency -->

Reranking is not free, but the cost in latency is often justified by the gain in relevance. A cross-encoder that swaps the 10th-ranked correct document into the top 5 is earning its compute cost. Measure this on your own queries: retrieve 50 and rerank to top 5, then ask whether the top 5 actually improved over the top 5 from the retriever alone.

## Embeddings Beyond Retrieval

Embeddings have uses outside retrieval. Any task that needs to compare texts in bulk, or find structure in unstructured data, becomes tractable once vectors exist.

**Clustering** — embed all documents, then cluster the vectors using k-means or DBSCAN. The result partitions your corpus into topic groups. Useful for corpus exploration, finding anomalies (isolated clusters), or breaking a large corpus into smaller chunks for focused search.

**Deduplication** — embed documents, find nearest neighbours within a small distance threshold, and mark pairs as duplicates. Scales better than string matching when the corpus is large.

**Classification** — embed documents and labels, then classify a new document by finding the nearest label vector. Zero-shot classification works this way: you never fine-tune, just embed label names and find the closest one to a new query.

**Drift detection** — in a production system, embed incoming documents and compare them to a baseline embedding (e.g., the centroid of your training data). If documents drift far from that baseline, something in your source data has changed — topic shift, a new kind of spam, language change. Catch that early.

All of these work because the embedding space preserves enough information to be useful beyond its original purpose. A model trained purely for retrieval can still cluster documents or detect drift, because the geometry it learned encodes meaningful structure.

The limitation is model-dependent again: a model trained on English will not cluster non-English texts well. A model trained on product descriptions will not detect drift well in scientific abstracts. Use the embedding model that matches your domain, and verify on a small sample that the geometry makes sense for your task.
