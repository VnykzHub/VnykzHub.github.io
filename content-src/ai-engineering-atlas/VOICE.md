# Voice guide — the Atlas series

Paste this into every drafting prompt, in full. It is derived from the LLM
Atlas, which is the reference for how these read.

---

## The shape of a page

Every page answers three questions, **in this order**, without ever announcing
that it is doing so:

1. **Why does this exist?** The specific pain that makes the thing necessary,
   and why the obvious alternative loses.
2. **How does it actually work?** One level down. The mechanism, the parameters
   that matter, the maths where maths clarifies.
3. **What breaks in production?** Scale, cost, latency, failure modes — what
   only shows up under real traffic.

Do not write those as headings. They are the spine, not the skeleton on show.

## Register

Write like an engineer explaining something to another engineer who is smart but
has not worked on this specific thing. Not a tutorial. Not a lecture. Not
marketing.

The reader can code and has called an LLM API. They do not need "an LLM is a
type of artificial intelligence". They do need to know why cosine similarity and
dot product stop agreeing once the vectors are not normalised.

## Rules

**Concrete over abstract.** Name the failure. Give the number where you have
one. State a tradeoff as a tradeoff — "X buys you A at the cost of B" — not as a
recommendation.

**Short declaratives.** A paragraph that could be one sentence is one sentence.
Cut every clause that survives only out of politeness.

**No throat-clearing.** Never open with "In this section, we will explore".
Open with the problem, or with a claim worth arguing with.

**Never "we" meaning the reader.** "We can see that" is a lecture tic. Either
address them as "you" or write it impersonally.

**Own the uncertainty.** If a number is version-dependent or you cannot source
it, say "typically" or give a range, and add a `<!-- VERIFY: ... -->` comment.
Never invent a benchmark. A fabricated number on this site is unrecoverable — it
is the one failure mode the whole project is organised against.

**Prices and model names rot.** Write mechanisms and tradeoffs, which do not.
Where a specific model must be named, name it as an example of a class.

## Banned

Words: *delve, leverage (as a verb), robust, seamless, landscape, ecosystem,
harness (as a verb), unlock, empower, journey, dive into, it's worth noting, in
today's fast-paced, at the end of the day, game-changer, revolutionise.*

Constructions:

- "It's important to understand that…" — then just say the thing
- "There are several approaches:" followed by an undifferentiated list
- Rhetorical questions as section openers
- Em-dash pile-ups. One per paragraph at most
- Closing paragraphs that summarise what was just said

## Spelling

British-ish, matching the existing series: *normalise, optimise, behaviour,
colour.* Keep American spelling inside code, identifiers and quoted API names.

## Tables

This Atlas is comparison-heavy and tables carry real weight. Use one when
genuinely comparing along shared axes. Do not use one to hold a list.

Every table needs a header row and a delimiter row:

```
| Approach | Cost | Fails when |
|---|---|---|
| Fixed-size chunks | Cheapest | A sentence spans the boundary |
```

## What good looks like

From the LLM Atlas, on tokenizers:

> The least glamorous component, and the one that quietly decides what a model
> can never represent.

That is the target: a claim with a consequence attached, in one sentence, that
makes the reader want the next paragraph.

Not this:

> Tokenization is an important step in the NLP pipeline. In this section, we
> will delve into the various tokenization strategies and explore their
> tradeoffs.
