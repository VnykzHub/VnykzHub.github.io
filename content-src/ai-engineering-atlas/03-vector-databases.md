---
id: vector-databases
label: Vector Databases
title: Vector Databases
slug: vector-databases
icon: database
color: "#C4703F"
dek: Where the vectors live, and everything that gets hard once they do. Persistence, filtering, replication, and the operational constraints that library users never touch.
---

## What a Vector Database Actually Adds

Embeddings from FAISS or Annoy solve the static retrieval problem: given a corpus and a query, find the k nearest neighbours in milliseconds. A library does this. The moment you need to share that index across multiple services, update it without rebuilding, query it concurrently, or filter results by metadata, you discover that a library is not a database.

A library is an in-memory structure optimised for a single purpose: fast approximate search. It persists to disk as a file, and reloading is a restart. A database is a system designed for persistence, recovery, concurrent serving, and maintaining invariants under concurrent writes.

The trade is real. Querying an in-memory index costs one memory access and a few CPU cycles. Querying a database crosses a process boundary, talks to disk, acquires locks, and enforces consistency. This adds latency. In a production serving scenario, that latency matters more than most benchmarks admit.

| System | Latency per query | Throughput | Supports | Cost model |
|---|---|---|---|---|
| In-memory library (FAISS) | Sub-millisecond | Limited by one process | Single writer, multiple readers | Free once loaded |
| Vector database (networked) | Milliseconds | Multiplied by connection pool | Concurrent reads and writes, replication | Per-query or per-month |

When a library is enough: experiments, offline batch processing, corpus under 1M vectors, single-machine workloads, acceptable rebuild time measured in minutes. You index once, ship the file, query it in prod without a network hop.

When it is not: production serving to multiple consumers, frequent updates, sub-millisecond SLA, geographic distribution, compliance requirements (audit trails, encryption at rest). The moment concurrent writers enter the picture, or the corpus changes multiple times a day, or serving latency is the binding constraint, the database pays for itself.

:::figure vector-db-vs-library
Side-by-side: a library running in a Python process with vectors in RAM, versus a dedicated database service accepting network queries from multiple clients, with persistence and replication to standby nodes.
:::

The architectural shift is also a shift in ownership. A library is your responsibility: you manage the file, versioning, rollback, testing. A database is a service: someone else manages the fault tolerance, redundancy, and upgrades. That handoff comes with a bill, and choosing a vendor locks you into their query language and data model.

## Metadata Filtering

Searching the full index works when you want the global k nearest neighbours. The moment you constrain by metadata—"find similar documents, but only those created after June"—the simple approach breaks.

Two strategies exist, and neither is free.

**Pre-filter then search**: Filter the index down to documents matching your predicate, then run ANN on that subset. This gives exact top-k within the filtered set. The cost is high: you either build a separate index per filter combination (wasteful) or search serially for each predicate (slow). Most systems make pre-filtering prohibitively expensive.

**Search then filter**: Run ANN over the full index, then remove results that fail the predicate. This is cheap—one ANN pass over everything. The trap: if your top-10 results include 6 filtered-out documents, you get 4 results, not 10. The system returns fewer than k results silently, which most callers misinterpret as "we have fewer than k relevant documents" rather than "we filtered some out."

Filtered ANN also degrades recall. The k-nearest-neighbours guarantee is only valid for unfiltered search. Filtering after the fact makes no guarantees: you have found the k nearest unfiltered vectors, then thrown some away. The remaining k' < k are not the k' nearest within the filtered set—they are whatever survived the filter.

Most production systems use hybrid: a soft pre-filter that narrows the search space (e.g., "only consider vectors added in the last year") combined with hard post-filters for other predicates. The post-filter must come with a contract: "if the filtered result set is small, you may get fewer than k results, which is correct." Silently truncating results without surfacing this fact is a common bug.

| Approach | Accuracy | Cost | Failure mode |
|---|---|---|---|
| Pre-filter only | Exact top-k within filtered set | Very high (index-per-filter or serial search) | Infeasible at scale |
| Post-filter only | Lossy (throws away valid neighbours) | Low (one search) | Silent truncation to fewer than k |
| Hybrid (soft pre + hard post) | Best-effort top-k within filtered set | Moderate | Trade-off between precision and cost |

:::figure metadata-filtering-recall
ANN over full index, then post-filtering: showing how removing k=3 results that fail the predicate leaves only 1 neighbour instead of the requested 3, and that neighbour is not the closest in the filtered set.
:::

## Updates, Deletes and Reindexing

Rows in a traditional database have stable IDs and can be updated in place. Vectors are not rows. An update means a new embedding—either the vector itself changed (you re-embedded the text) or the metadata changed (a tag, a timestamp). Deletes present a choice: immediately remove the vector from the index (triggering a reindex) or mark it as dead with a tombstone and clean it up later.

Tombstones are cheap. The vector stays in the index structure; queries skip it at read time. Deletions become O(1). The cost is memory: dead vectors take up space until garbage collection runs. Reindexing on every delete is expensive: the index structure is optimised for immutability, so removing an element requires rebuilding.

The bigger cost is model drift. If you change your embedding model—switching to a newer one or a different dimensionality—you face a choice: re-embed your entire corpus (expensive, requires API calls) or live with a mixed index where old documents use old embeddings and new ones use new embeddings. Querying that mixed index is meaningless: new queries use new embeddings, but old documents use old embeddings, and their similarity scores are garbage.

:::code python
# Tombstone approach: mark deleted, skip at read time.
class VectorStore:
    def delete(self, doc_id: str) -> None:
        self.tombstones.add(doc_id)  # O(1), no index rebuild

    def search(self, query_vec, k: int) -> list[Hit]:
        candidates = self.index.search(query_vec, k * 2)  # retrieve more
        return [c for c in candidates if c.doc_id not in self.tombstones][:k]
:::

Reindexing happens when you accumulate too many tombstones (wasting memory), want to optimise the index structure for a new access pattern, or must re-embed because the model changed. The cost is downtime: during reindexing, either queries serve stale results or the system is unavailable. Most systems choose stale results and accept the inconsistency.

## Operational Cost

Memory is the binding constraint. A vector database instance holds N vectors of D dimensions, stored as float32. Dense storage costs N × D × 4 bytes. At scale:

- 10M vectors × 1536 dimensions = ~60 GB
- 100M vectors × 1536 dimensions = ~600 GB


That is a single instance. Replication multiplies the cost. At typical cloud memory prices, Memory-optimised instances on the major clouds run on the order of a hundred dollars per GB per year, so 600 GB is a four-figure monthly bill before replication. a 600 GB instance costs thousands per month in storage alone.

Quantization is the lever. Instead of storing float32 (4 bytes per dimension), store int8 (1 byte) or int4 (0.5 bytes). Memory drops by 4–16×. The cost is recall: lower precision makes similar vectors slightly less similar, so the top-k set shifts. Quantization typically costs 1–5% absolute recall depending on the corpus and distance metric. Product quantization typically lands in the 1–3% band and int8 nearer 3–4%; more aggressive schemes lose more. Test on your own corpus rather than trusting a published figure.

| Format | Bytes per vector | Relative size | Typical recall loss |
|---|---|---|---|
| float32 (native) | 4D | 1× | 0% |
| float16 | 2D | 0.5× | ~1–2% |
| int8 | D | 0.25× | ~2–4% |
| int4 | 0.5D | 0.125× | ~3–6% |

:::figure quantization-tradeoff
A 2D embedding space showing vectors before and after int8 quantization: original positions, quantised positions, and how top-k shifts when precision is reduced.
:::

The real bill is per-vector-per-day: storage cost divided by the time a vector lives in the database. At 100M vectors queried every second, the query cost dominates. The math: 100M vectors × 1536 dims × 4 bytes = 600 GB; at cloud memory prices, this is a five-figure annual bill. Compressing or deleting old vectors is often cheaper than serving them.

Managed vector services carry roughly a three- to fivefold premium over self-hosting at this scale, which is worth paying right up until it is not.
