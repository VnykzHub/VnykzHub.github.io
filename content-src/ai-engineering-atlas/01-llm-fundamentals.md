---
id: llm-fundamentals
label: LLM Fundamentals
title: LLM Fundamentals
slug: llm-fundamentals
icon: zap
color: "#F0B84C"
dek: The floor everything else stands on. What the model actually is, what it costs, what it cannot do. The thing that explains why your token budget matters more than your parameter count.
---

## How LLMs Work

An LLM is a probability distribution over sequences. You give it a sequence of tokens, and it outputs a probability distribution over the next token. That is the entire mechanism. You sample from that distribution, add the result to the sequence, and repeat.

This next-token prediction framing is not a simplification — it is the actual behaviour you are buying. Every capability, every limitation, every weird failure mode traces back to that objective. The model was trained to predict what comes next. It was not trained to tell the truth, to be helpful, or to refuse harmful requests. Those are overlaid afterwards, and only as well as your alignment procedure can manage.

Most of what appears to be "reasoning" in an LLM is actually search through the space of plausible continuations. Given a prompt, the model is not solving the problem; it is finding a sequence of tokens that looks like a solution. Sometimes that is indistinguishable from solving it. Sometimes it is catastrophically wrong in ways that look locally coherent.

The implication is specific: intelligence in an LLM comes from training data and scale, not from the architecture. A transformer is not doing anything mysterious. It is a sequence-to-sequence model with attention that is remarkably good at learning the patterns in your training data. All the real work — the capability, the knowledge, the intuitions — lives in the weights. Change the weights and you change what the model predicts. Change nothing else and behaviour is deterministic: same input, same weights, same output logits.

:::figure next-token-prediction-loop
The decode loop: input tokens → transformer → logits → sample → output token. The sampled token feeds back as input. Repeat until stop token or length limit.
:::

Temperature and other sampling parameters change which part of the probability distribution you sample from, but they do not change the distribution itself. A model cannot "think harder" in ways that scale non-linearly. It can only produce a more likely or more creative continuation of what came before. The entire model output is one forward pass. There is no deliberation, no search, no backtracking except what you add explicitly through agentic loops.

This is why test-time compute is a real lever. If the model's own output is your only tool for extending capability, then you need multiple paths: samples that explore different possibilities, or longer contexts where the model can "show its work" because showing work is just predicting what comes next. Constitutional AI, chain-of-thought, and all the prompting techniques that work are really just ways of shaping what the model considers a plausible continuation.

## Tokens and Tokenization

Tokens are the unit of billing and context. They are not words. A word like "running" might be one token, or two, or four depending on the tokenizer. Non-English text fragments into more tokens per word. Numbers fragment badly. Code fragments depending on whitespace and brackets.

As a rule of thumb on OpenAI-family tokenizers, English prose runs about 1.3 tokens per word, French, Spanish and German about 2, Russian about 3.3, and Chinese around one token per character. Code lands near 4–5 characters per token, and varies sharply with whitespace and bracket density.

The tokenizer is usually a learned vocabulary built with byte-pair encoding or similar. You cannot control it after the model is shipped. That means you cannot control what the model actually sees. A tokenizer that fragments your numeric IDs across four tokens means the model learns no useful representation of them; the tokens end up adjacent in the sequence but semantically unrelated from the model's perspective.

| Text type | Typical tokens per word | Implication |
|---|---|---|
| English prose | 1.0–1.3 | Close to word count in context estimates |
| Code | 2–4 | Braces, indentation, operators each cost |
| Non-Latin scripts | 3–5+ | Asian languages particularly expensive |
| Numbers | 1–2 per digit | Long numbers fragment into many tokens |
| JSON keys | Varies | Familiar patterns are one token; rare strings are many |

Tokenization is the least glamorous component and quietly decides what a model can never represent. A fact split across ten tokens lands differently than one that lands in one. The model learns distributed representations of meaning across token boundaries, but the boundaries themselves are not negotiable. You cannot make a model care about internal structure within a token; tokens are atomic from the model's perspective.

:::code python
import tiktoken

enc = tiktoken.get_encoding("cl100k_base")  # GPT-4 tokenizer
text = "The quick brown fox"
tokens = enc.encode(text)
print(f"Text: {text}")
print(f"Tokens: {tokens}")
print(f"Token count: {len(tokens)}")

# Common surprise: unicode and newlines
text2 = "Café\nbar\t123"
tokens2 = enc.encode(text2)
print(f"Text: {text2}")
print(f"Token count: {len(tokens2)}")  # Often 6+ tokens for this short string
:::

Counting tokens accurately is not optional. Your context budget is finite. Saying "this prompt is probably under 4k tokens" is how you hit the limit. Use the real tokenizer for the model you are calling. Libraries lie, rough estimates lie, character counts lie. Count tokens.

## Sampling and Determinism

Temperature, top-p, and top-k are sampling parameters that change which part of the probability distribution you draw from. Temperature scales logits: higher temperature makes all tokens more equal in probability, lower temperature concentrates probability on the most likely token. Top-k keeps only the k most likely tokens and renormalises. Top-p keeps tokens until cumulative probability reaches p.

The default in most APIs is temperature 1.0, which means you get the raw model probabilities. Lower temperatures (0.5–0.7) make output more deterministic and coherent. Higher temperatures (1.2–2.0) make output more creative and diverse. At temperature 0, you would take the argmax every time, which is actually often not what you want — it gives you the most likely token at each step, but that is not the same as the most likely sequence.

In theory. In practice no major API guarantees determinism even at temperature 0 — floating-point accumulation order, batching, and heterogeneous hardware all introduce drift. Pair temperature 0 with a fixed seed if you need reproducibility, and design on the assumption that exact reproduction is not promised.

"Determinism" is the critical word here. Temperature 0 is not deterministic. The model's weights are deterministic, and the logits from a forward pass are deterministic, but most API implementations still apply a small amount of sampling or noise for numerical stability. Different API versions, different hardware, different batch settings — all can produce slightly different output even at temperature 0. If you need true determinism, you are out of luck with modern APIs. You need a local model, a specific seed control, and reproducible hardware.

The practical implication: do not rely on temperature 0 for output stability in production. Use structured output instead, where the tokenizer is forced to stay in a constrained space. Use reranking. Use verification. Temperature is about exploration; it does not actually give you control.

Top-k and top-p are more exotic. Most practitioners stay with temperature. Top-k is cheap to implement and eliminates the long tail of very unlikely tokens. Top-p is more adaptive — it keeps tokens until they add up to p probability mass, so more diverse responses keep more tokens and more constrained responses keep fewer. Neither is a magic dial for "better output". They are useful when a particular model or dataset produces bad long-tail samples, and almost never otherwise.

:::figure sampling-parameter-effects
A probability distribution over tokens: showing how temperature 0.5, 1.0, and 2.0 reshape the same logits, and how top-k (k=5) and top-p (p=0.9) differ in what they keep.
:::

The wrong intuition is "lower temperature = better output". The right intuition is "sample space shrinking = lower variance and lower ceiling on creativity". You are making a tradeoff. High temperature can produce garbage, but it can also produce novel and correct completions that a lower-temperature model would never reach.

## Prompt Engineering

Instructions and data are different things. Instructions tell the model what to do. Data is what it should do it on. Confusing the two is the most common failure mode.

A prompt like "You are a helpful assistant that translates English to French. Translate this: hello" is mixing instructions and data. The instruction is the preamble; the data is "hello". Separating them is better: "Translate to French." then a data block. Separating them lets you vary one without retraining and run the same instruction on different data without rewriting the prompt each time.

What moves quality? Specificity, examples, and clarity about the output format. The best prompt engineering is not clever phrasing. It is removing ambiguity. "Write a poem" is ambiguous. "Write a four-line rhyming poem about a cat" is specific. "Here are three examples: [examples]" teaches the model the style by example, which is better than any adverb you can add to the instructions.

| Technique | What it does | When it helps |
|---|---|---|
| Chain-of-thought | Asks model to show reasoning before answer | When the answer requires multiple steps or the output is counterintuitive |
| Few-shot examples | Shows examples in the prompt | When the style or format is unusual for the model |
| Structured format | Specifies exact output schema | When you need to parse the output programmatically |
| Role-playing | "You are a X" | Almost never necessary; usually noise |
| Repetition and emphasis | Repeating instructions | When instructions are complex; usually just adds tokens |

Cargo cult prompt engineering is real. Saying "think step by step" or "take a deep breath" or including emojis in the prompt can move a benchmark by 1–2 points. That is not because the model is emotionally affected. It is because those phrases correlate with thinking-hard instructions in the training data, so they slightly shift the distribution toward longer, more detailed responses. Correlation is not causation, and benchmarks are not production.

:::code python
# Good: explicit structure
prompt = """Classify this review as positive or negative.

Review: {review}

Answer with one word: POSITIVE or NEGATIVE."""

# Cargo cult: unclear what helps
prompt = """You are an expert sentiment analyst with years of experience.
Please take a deep breath and analyze this review carefully.
Think step by step about the sentiment.

Review: {review}

Output:"""
:::

What actually moves quality in production is knowing your data. If your model is consistently wrong on edge cases, prompt engineering is probably not the lever — you need more data, or a better model, or both. If the model is right 90% of the time but verbose, a format instruction might help. But the instinct to prompt-engineer your way out of a problem usually produces overfitted prompts that work on your test set and break in production.

## Structured Output

"JSON mode" in most APIs means the model is constrained to emit valid JSON. That is a guarantee about syntax, not about schema. A model in JSON mode will not emit invalid JSON braces or missing quotes, but it can emit `{"name": "Alice", "age": "not a number"}` without hesitation if that is what the probability distribution favours.

Constrained decoding is stronger: you specify a schema, and the tokenizer is forced to stay within tokens that produce valid output according to that schema. This is slow — the model cannot just emit whatever token it wants, it has to compute which tokens are legal before sampling — but it actually enforces the schema.

How slow depends entirely on the implementation: an optimised one adds tens of microseconds of CPU time per token, while a Python-side enforcer computing the legal set on the fly can add tens of percent per token.

Neither approach actually validates the *content*. A model cannot be forced to understand that a birthday is a valid date or that a phone number has the right format. It can only be forced to emit the right type of token. Validation is downstream.

The practical strategy is: use JSON mode for structure, add a schema validator downstream, and include a repair loop. If the model produces unparseable output, take it back to the model with the error and ask it to fix it. Most models are good at repair once they see the specific error.

:::figure constrained-decoding-flow
Input → Model → Is output valid JSON? → If no, feed back the error with "Please fix this:" → Model generates correction.
:::

Structured output buys you unambiguous parsing. It does not buy you correct data inside those structures. A common mistake is treating JSON mode as validation. It is not. It is just token constraint. The harder problem — making sure the model outputs correct, schema-valid, semantically meaningful JSON — is still yours.

:::code python
import anthropic

client = anthropic.Anthropic()

message = client.messages.create(
    model="claude-3-5-sonnet-20241022",
    max_tokens=1024,
    messages=[
        {
            "role": "user",
            "content": "Extract name, age, and email from: Alice is 30 and can be reached at alice@example.com"
        }
    ]
)

# With structured output (via schema or JSON mode), the API enforces
# that the response is valid JSON matching the specified structure.
# The model still cannot be forced to extract correct data — only to
# format it correctly.
:::

## LLM APIs

Request-response loops follow a standard shape: you send tokens, the API returns logits or samples, you handle errors, and you stream or batch. The shape matters because most of the real cost is in error handling and retry logic, not in the forward pass itself.

Most APIs return either logits (raw probabilities) or samples (already drawn from the distribution). You cannot sample from logits on the server side and get different results; logits are deterministic given weights. Sampling adds randomness. If you want reproducibility, ask for logits and sample client-side. If you want simplicity, ask for samples and accept the small randomness.

Streaming changes the shape substantially. Instead of getting one response, you get a sequence of deltas. This is lower latency (you see output while the model is still thinking) but higher overhead (you are receiving many HTTP chunks instead of one). Streaming is better for interactive use, batching is better for throughput.

| HTTP Status | Retry? | Action |
|---|---|---|
| 200 | No | Success, process response |
| 429 | Yes | Rate limited; back off exponentially |
| 500, 502, 503 | Yes | Server error; retry with backoff |
| 400, 401, 404 | No | Client error; fix the request or credentials |
| 408, 409 | Yes | Timeout or conflict; usually safe to retry |

Never retry on 400 (bad request), 401 (auth failure), or 404 (model not found). These indicate a problem in your code or credentials. Retrying burns tokens and time. Retry on 429 (rate limit) and 5xx (server error). A real system has exponential backoff: wait 1s, then 2s, then 4s. Most naïve retry logic just hammers the server.

:::code python
import anthropic
import time

def call_with_retry(prompt, max_retries=3):
    client = anthropic.Anthropic()
    
    for attempt in range(max_retries):
        try:
            response = client.messages.create(
                model="claude-3-5-sonnet-20241022",
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}]
            )
            return response.content[0].text
        except anthropic.RateLimitError:
            if attempt < max_retries - 1:
                backoff = 2 ** attempt
                time.sleep(backoff)
            else:
                raise
        except anthropic.APIError as e:
            # Do not retry client errors
            if e.status_code < 500:
                raise
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise
:::

Streaming is not faster; it just feels faster because you see output sooner. Total latency and token consumption are the same. Streaming is useful for chat (you want to show tokens as they arrive) and useless for pure throughput. Choose based on UX, not based on a misconception about speed.

Error handling is where most bugs live. A model returning 500 errors is not the end of the world if your retry logic is solid. A model returning 400 errors because your schema is wrong, and your code retries anyway, is the end of your token budget.

## Context Windows

A context window is the maximum number of tokens the model can process in one request. Going over the limit results in an error. Knowing the window is the first hard constraint on any LLM application.

But there is a second, softer constraint: the model degrades. Not at the limit, but well before it. Retrieval quality drops, the model attends to irrelevant context, and factuality declines. This is not a bug; it is how transformers work. Attention is all you have, and attention is quadratic in sequence length. The further back you go, the harder it is to integrate information from the beginning.

The effect is measurable and U-shaped: the *Lost in the Middle* result (Liu et al., 2023) found material buried mid-context is recalled far less reliably than material at either end. Onset varies by model, but degradation is typically visible well before the window is full rather than at its edge.

| Window size | Practical usable | What it costs |
|---|---|---|
| 4K | ~3K | Low cost per request |
| 32K | ~20K | Moderate cost; attention still tractable |
| 100K+ | ~60K–80K | High cost; quality issues evident |
| 200K | ~150K | Very high cost; diminishing returns |

The usable portion is typically 60–80% of the advertised limit. Beyond that, you are paying for tokens that the model is not effectively using. A 200k window is not 50x the capability of a 4k window; it is maybe 3–4x if you use it perfectly, and degraded if you are naïve about how to fill it.

Filling a context window efficiently is not a given. A naïve RAG system that puts the entire corpus in the prompt burns tokens on irrelevant context. A smarter system retrieves the relevant part. The leverage is in what you include, not in the size of the window.

:::figure context-window-degradation
X-axis: position in context (0 = start, 100% = end). Y-axis: attention weight or retrieval accuracy. Shows accuracy dropping well before the window limit, especially for information at the end of a very long context.
:::

One implication: very long contexts do not give you free memory. A model cannot reliably recall a detail from page 50 of 100 pages. It will confabulate, miss the detail, or find an unrelated detail that looks similar. Treat context like cache: write only what matters, keep it compact, and do not rely on the model to needle-search through pages of less relevant text.

## Hallucination

Hallucination is intrinsic to the objective. The model was trained to predict plausible continuations, not true ones. "Plausible" and "true" are correlated in the training data but not identical. A hallucination is a sequence that is plausible (common in training data, locally coherent) but false.

This cannot be fixed by prompt engineering alone. A model that predicts the next token based on patterns in training data will sometimes predict a plausible falsehood. You cannot tell it hard enough to stop. You can only change the distribution of what counts as plausible.

What reduces hallucinations? Retrieval (giving the model source material to reference), smaller models (less capacity to learn fluent falsehoods), and fine-tuning on truthfulness (making true statements more plausible in the model's distribution). What only hides hallucinations? A confident tone, adding "I am not sure about this" disclaimers, or asking the model to cite sources.

| Strategy | What it does | Cost |
|---|---|---|
| Retrieval | Grounds model in factual sources | Adds retrieval latency and tokens |
| Constitutional AI training | Makes truthfulness more plausible | One-time training cost |
| Smaller models | Reduces fluent confabulation | Reduced capability overall |
| Calibration and abstention | Model learns to say "I do not know" | Requires labelled data and fine-tuning |

The hard truth is that you cannot train away hallucination. A sufficiently powerful model trained only on next-token prediction will hallucinate. You can make it less frequent, but the distribution of the task makes some amount of hallucination inevitable. Building systems that tolerate this is more productive than trying to eliminate it.

:::figure hallucination-sources
Sources of hallucination: (1) training data containing falsehoods, (2) pattern completion favouring plausibility over accuracy, (3) conflicts between retrieved context and learned knowledge, (4) rare or conflicting patterns in training data that blur into one prediction.
:::

The practical approach: assume hallucinations will happen. Build verification into the system. If the output is a claim, check it against a source. If the output is code, run it. If the output is a decision, require human review. Hallucination is not an exceptional case to handle defensively; it is a baseline property of the model. The system design must account for it.
