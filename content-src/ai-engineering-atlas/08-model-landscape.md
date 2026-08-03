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

Cost is real. Hosting inference costs money — hardware, power, network, maintenance. But the reasons teams actually reach for self-hosting are deeper. Data residency. Latency floors. Rate limits that prevent you from productionising at scale. Compliance regimes where the model's weights cannot leave your perimeter. And the one that decides things at 3am: who is on the hook when the system fails.

API providers own the uptime SLA. If a request times out, they have paging and incident response. If you self-host, you own the MTTR. That is not a small thing. It means on-call staffing, hardware failure modes, GPU memory pressure you forgot to monitor, inference kernels that fail silently under production workload.

| Axis | API | Self-Hosted |
|---|---|---|
| Latency floor | Paid forward; depends on provider's routing | Your infrastructure; network hops you control |
| Rate limits | Fixed by contract; often a scaling cost | Bounded only by your cluster size and power budget |
| Data residency | Off your network | In your VPC or on-prem; stays where you built it |
| Operational cost | Predictable per-token; quadratic at scale | Capital upfront; labour ongoing; lower per-token at volume |
| Incident response | Provider's SLA and escalation | Your on-call rotation and debugging skills |

The honest default is API. It buys you a working system tomorrow. The margin of defeat is your own operations team understanding the failure modes.

Self-hosting genuinely wins when one or more of these is true: your throughput is high enough that per-token cost becomes material (often millions of tokens per day); your latency budget is sub-100ms and the provider's routing adds unacceptable hops; or your data cannot leave your firewall. Outside those cases, it is usually a productivity trade you cannot afford.

The third trap: assuming you can start on API and "move to self-hosted later if needed". You can, but moving production traffic involves architectural reframing. Your error handling assumes synchronous remote calls. Your retry logic assumes exponential backoff over a network. Moving to local inference requires you to rethink timeouts, circuit breakers, batching. Plan for one or the other upfront.

## Open Weights

"Open" does not mean free, and it does not mean transparent.

Open weights usually means the parameters are publicly available. You can download them, inspect them at byte level, run them locally. That is different from open source (where the training pipeline is also published, which almost never happens), and different from open access (you can call an API but cannot modify the weights).

What you get: independence from provider outages. Reproducibility. The ability to customise inference — quantise, distil, or fine-tune on top. What you take on: the inference costs are entirely your problem. You must certify safety yourself. You are responsible for keeping the weights updated as new vulnerabilities emerge. You inherit the licence's restrictions.

The capability gap between open-weights and closed-weights models still exists, but it is narrowing. A small open-weights model in the 7–8B parameter range now solves tasks a frontier model from three years ago could not. For many applied problems — classification, structured extraction, semantic search, even simple reasoning — that gap stops mattering. Your bottleneck is not capability; it is latency or cost or knowing how to structure the prompt.

The honest question: does the task require a frontier model, or does it just require not screwing up the integration? In the latter case, an open-weights model often wins. You keep inference local. You avoid rate limits. You skip the API provider's billing audit.

But there is a real cost in infrastructure. Hosting inference at scale means GPU cards, power conditioning, network bandwidth for model serving. Most teams underestimate the operational labour. It is not just running a quantised model on a laptop.

## Prompting, RAG, or Fine-Tuning

There is a decision order here, and it is not the order most teams follow.

**Start with prompting.** It is the highest-leverage change you can make in the first week. Better context, clearer instructions, examples in the prompt (few-shot learning) — these often solve the problem before you have built infrastructure. The cost is zero. The latency cost is negligible.

Once prompting stops delivering, and only then, move to retrieval-augmented generation. RAG decouples your knowledge from the model's training data. It lets you ground answers in live data. It is harder to build — you inherit a search problem — but it solves a real, different problem than prompting.

Fine-tuning is almost always the wrong second move. It is the default thing people reach for because it sounds like the right lever: "just teach the model the right format", or "make it stop hallucinating by training on examples". Both are intuitive and both are usually wrong.

Fine-tuning genuinely buys three things. First: changing the output format or tone in a way prompting cannot. If you need every response in YAML, or if the model's voice matters more than the facts, fine-tuning can enforce that. Second: using a smaller model without losing quality. A frontier model fine-tuned on your data can often be distilled down to a tenth the size. Third: latency gains from a model that learned to be terse.

Fine-tuning does not buy knowledge. A model cannot learn facts from a training run unless those facts appear in thousands of examples. It does not cure hallucination at scale — the bias is in the weights, and small datasets do not fix bias. And it is expensive: each iteration means spinning up a training job, waiting for convergence, evaluating the result, then doing it again.

The decision tree: Does prompting with better examples work? Stop there. Do you have live data that changes faster than the model was trained? Use retrieval. Does the model need to sound like a specific person, or follow a format prompting cannot enforce? Only then is fine-tuning the lever.

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

Every major model publishes benchmarks. They excel at reasoning, or code, or following instructions, or processing long context. And every single benchmark is measured on data that is not your data, solving problems that are not your problem. The model that ranks first on a public benchmark may rank seventh on your task.

Evaluate on what you actually do. Build a small golden set — fifty to two hundred examples from your real workload, where the right answer is known. This is not a training set; it is an evaluation set. Run each candidate model against it. Measure accuracy, latency, cost. The winner is the one that solves your problem best.

Then make one more choice: make the decision reversible. If the model is embedded in your product, if customers see the output, if you are paying per token, assume you will need to swap models within a year. Hide the model choice behind an abstraction. Route through a factory. Let a config file decide which endpoint to call. Six months in, when a better model exists, or the provider doubles their price, or your requirements change, you swap a line of config instead of rewriting the pipeline.

The cost of this abstraction is minimal. The cost of not having it is rewriting half your product.

| Decision | Make it reversible by | Cost if you guess wrong |
|---|---|---|
| Hosted vs. self-hosted | Interface to a provider abstraction; swap later | Rewrite error handling, retry logic, timeouts |
| Open vs. closed weights | Model choice in config, not hard-coded | Provisioning new hardware, redeploying inference |
| Model identity (which model, what size) | Pluggable model factory | Rewrite prompts tuned to a specific model's quirks |

Document the tradeoff decision at the time you make it. Write one page: "We chose a small open-weights model because throughput is low and data cannot leave the VPC. If latency becomes critical, we will revisit." Revisit it honestly when circumstances change. Most model choices are not permanent.
