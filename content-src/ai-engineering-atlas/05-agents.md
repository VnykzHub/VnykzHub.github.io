---
id: agents
label: Agents
title: Agents
slug: agents
icon: bot
color: "#F0B84C"
dek: What happens when the model, not your code, decides what happens next. Tool schemas it can actually use, planning loops that drift, memory that has to be deliberately persisted, and the retries, budgets and step caps that keep the whole loop from running away.
---

## What Makes It an Agent

A chatbot answers a question. A pipeline executes a plan you wrote, in the order you wrote it. An agent is the third thing: at each step, something decides what happens next, and that something is the model, not your code.

This is easy to miss because agent systems are still built from the same primitives as everything else: an API call to a model, some code around it, maybe a database. What changes is where the control flow lives. In an ordinary LLM application, the model produces text and your code decides what to do with it — parse it, template it into a response, write it to a field. The branching happens in your code, at design time, and it is exactly as fixed as any other software you have written. In an agent, the model's output is itself a decision about what your code should do next: call this function, with these arguments, then look at what comes back and decide again. The loop keeps running until the model says it is finished, not until a condition you wrote evaluates true.

That is the whole definition. It is tempting to define an agent by its furniture: it uses tools, it has memory, it runs for multiple steps. But every one of those exists in systems nobody would call an agent. A retrieval pipeline calls a search function on every request. Nobody calls that an agent, because the decision to search was yours, made once, at build time, and it runs the same way for every input. What makes a system an agent is that the sequence of actions is not fixed at build time. It is inferred at inference time, by a process that can be wrong in ways a compiler error never lets a deterministic program be wrong.

| | Deterministic pipeline | Agent |
|---|---|---|
| Where control flow lives | Your code, written once | Model output, generated per request |
| Who decides the next step | You, at design time | The model, at inference time |
| Failure mode | An exception with a stack trace | A plausible, wrong action — nothing throws |
| Behaviour on identical input | Same path, every time | Possibly a different path each run |

Handing control flow to a probabilistic process is not a small implementation detail. It is the reason every other topic in this section exists. Tool design matters this much because the model's only way of acting is through the tools you exposed, described exactly as well or as badly as you described them. Planning matters because a model choosing its own next step, repeatedly, will drift in ways a fixed program cannot. Memory matters because a process that decides its own trajectory needs to remember what it already tried. Error handling matters because "wrong" now includes silent, confident, well-formed wrongness that no exception will catch for you. None of that is a separate set of problems bolted onto the tool-calling API. It is the same problem, viewed from nine angles: you no longer own the control flow.

:::figure agent-vs-pipeline-control-flow
A straight-line pipeline — fixed boxes, one arrow each — next to an agent loop, where the model's output feeds a decision node that can route back into itself an unknown number of times before exiting.
:::

The practical test, when someone asks whether a system "is an agent", is not whether it calls a tool. It is whether the decision to call that tool, this time, with these arguments, was made by your code or inferred by the model from the conversation so far. If it is the latter, everything below applies.

## Tool Use

A tool call is a structured guess. The model has never executed a line of code in its life. Every tool call it produces is a token sequence shaped to match a schema you supplied earlier in the prompt, and it is correct only as often as its training and your description make that shape likely. Nothing about "the model calls a tool" involves the model doing anything except predicting text that looks like a call.

The mechanism itself is mundane once you see it plainly. You give the model a list of tool definitions: a name, a natural-language description of what it does and when to use it, and a schema for its arguments (JSON Schema, in practice, regardless of provider). On each turn, the model can respond with ordinary text, or it can respond with a structured request naming one tool and its arguments. Your code is the only thing that ever runs it. You parse the arguments, invoke the underlying function — an API call, a database query, a shell command — and post the result back into the conversation as a new message. The model reads that result on the next turn and decides what happens after: another call, or a final answer to the user.

The model's role stops at "I would like to call `get_shipment_status` with `{order_id: "A1029"}`". Whether that order ID is well-formed, whether the function exists, whether it is safe to run unchecked, and what to do if it throws, is entirely your problem, not the model's. This matters because it is the most common misunderstanding in how agent systems get described: the model is not "using" a tool in any sense that implies agency over execution. It is emitting a request. Treat it with the same suspicion you would treat a request from an untrusted client, because that is functionally what it is. Validate arguments before running anything with side effects, and never let a tool call reach a shell or a database without the guardrails you would put around user input.

One mechanical detail changes the cost profile of everything downstream. Every tool result you post back becomes part of the context for every subsequent call. A conversation that calls five tools in sequence is not five independent requests: it is five requests, each carrying the full transcript of everything before it, tool results included. That growth is linear per step at minimum, and it is why long tool-use loops get expensive in a way a single completion never does. The section on cost, later, returns to this directly.

Some providers let a single model turn request several tool calls at once, when the calls do not depend on each other's results. Others are strictly one call per turn. This is a capability difference between model APIs, not a fixed property of agents generally — check the documentation for the specific model in use rather than assuming either behaviour.

:::code python
messages = [{"role": "user", "content": user_query}]

while True:
    response = model.complete(messages, tools=TOOL_SCHEMAS)
    if response.tool_call is None:
        return response.text                        # model is done, no call made

    call = response.tool_call
    result = execute(call.name, call.arguments)       # your code runs it, not the model
    messages.append(response.to_message())
    messages.append({"role": "tool", "tool_call_id": call.id, "content": result})
:::

Everything else in this section, and the two after it, is downstream of this loop: how many tools to expose, what to name them, how to shape an error so the model can act on it. The loop itself is almost too simple to be worth diagramming. What makes agents hard is not this mechanism. It is everything that can go into `execute`, and everything that can come back out of it.

## Designing Tools

Tool design is the single highest-value place to spend effort when building an agent, and it is routinely treated as an afterthought: a thin wrapper generated from an existing internal API, with the original function name and docstring left in place. That approach guarantees the model will misuse the tool some fraction of the time, regardless of which model is running it, because the description is the entire specification the model has to work from. It cannot read your source code. It cannot ask a colleague what the function actually does at the edges. It has the name, the description, and the schema, and it decides how and when to call the tool based on nothing else.

Fewer tools beat more tools. A model choosing among six tools with clearly distinct purposes will pick correctly far more often than one choosing among forty, several of which overlap. `search`, `query`, `find`, and `lookup` doing nearly the same thing under different names forces the model to disambiguate at random, and it will sometimes lose. If two tools are genuinely redundant, merge them or delete one. A smaller, sharper toolset is not a compromise; it is strictly better for accuracy.

Names and descriptions carry the entire selection decision. `search(query)` tells the model almost nothing about what is being searched, over what corpus, or what a good query looks like. `search_product_catalog(query: str, max_results: int)` tells it the domain, the scope, and the shape of a reasonable call. The description should state, explicitly, when to use the tool and, just as important, when not to, plus any format constraints that are not obvious from the type: dates as ISO 8601, currency as minor units, IDs matching a known prefix pattern. Every constraint you leave implicit is a constraint the model will violate on some fraction of calls, not out of failure to try but because it was never told.

Parameter shape matters as much as naming. A flat schema with a small number of required fields is a form the model can fill reliably. A deeply nested schema with several optional fields is a form with many silent decision points, each one a place the model can guess wrong or omit something your function needed. Prefer required-with-sensible-defaults over optional-and-ambiguous wherever the underlying function allows it.

Errors deserve the same design effort as the happy path, because they are the model's only signal that something needs to change. A raw stack trace is written for a human debugging in a terminal. A model reads it as unstructured text and often cannot tell a fatal error from a retryable one. A tool error should return in the same shape as a successful result, structured, with a clear reason and, where possible, a suggested next step, so the model can reason about it as data rather than treat it as the end of the conversation.

| Design choice | What it buys | What ignoring it costs |
|---|---|---|
| Fewer, distinct tools | Reliable selection | The model guesses between near-duplicates |
| Explicit scope in the description | Correct tool for the task | Silent misuse — the call succeeds, on the wrong data |
| Flat, mostly-required arguments | Predictable calls | Missing or malformed optional fields |
| Structured, actionable errors | The model can self-correct | The model retries blindly, or gives up |

:::code python
# Before: mirrors the internal function signature and docstring verbatim.
{"name": "search", "description": "Searches.",
 "parameters": {"query": "string", "filters": "object (optional)"}}

# After: states scope, format, and intent — the only spec the model gets.
{"name": "search_open_invoices",
 "description": ("Finds unpaid invoices for a customer. Use only for invoices, "
                 "not payments or credit notes. customer_id must match the "
                 "CUST-##### format used elsewhere in this conversation."),
 "parameters": {"customer_id": "string, required",
                "max_results": "integer, required, default 20"}}
:::

Test tools the way you would test a public API used by a caller you cannot fully predict. Send malformed arguments deliberately, and confirm the tool degrades to a clear, structured error rather than an unhandled exception. Whatever gets returned there is what the model has to work with when things go wrong, which is the subject of a later section.

## Planning

Two patterns cover most of how agents decide what to do across more than one step. Reason-and-act, commonly called ReAct, interleaves a short burst of reasoning with a single action, observes the result, and repeats: think, act, observe, think again. Plan-then-execute goes the other way. The model produces a multi-step plan upfront, before taking any action, and then works through it, optionally revising the plan when a step's result contradicts an assumption it was built on.

The tradeoff is about how much the model commits to before it has evidence. ReAct never commits beyond one step, so it adapts immediately when a tool result is surprising, but it has no view of the whole task and can wander, solving a subproblem thoroughly while losing track of why it was solving it. Plan-then-execute reasons about the whole task before acting, which tends to produce more coherent multi-step behaviour, but the plan is a guess made with the least information the agent will ever have. An agent that executes a stale plan past the point it stopped making sense is a common and expensive failure. Reflection, pausing periodically to ask whether the plan still holds given what has been learned, mitigates this at the cost of extra model calls, which is a real cost covered later in this section.

| Pattern | Commits to | Adapts when wrong | Coherence over long tasks |
|---|---|---|---|
| ReAct | One step at a time | Immediately, next turn | Weak — no global view |
| Plan-then-execute | A full sequence, upfront | Only on replan | Strong, until the plan goes stale |

Neither pattern solves the deeper problem, which is that error compounds across steps instead of adding. If a single step is correct with probability p, and each step's output feeds the next step's input unchanged, the chance that a chain of n dependent steps ends up entirely correct is the product of the per-step probabilities, not their average.

:::math Compounding correctness over a dependent chain of steps
P(\text{all } n \text{ steps correct}) = p^n
:::

A model that is right on the overwhelming majority of individual steps can still fail the overall task most of the time once the chain is long enough, because the failure only has to happen once, anywhere in the chain, to propagate. This is the mathematical reason "the model is reliable per step" is not comforting information by itself: reliability at n=3 and reliability at n=20 are different tasks wearing the same adjective. It is also why an agent's practical ceiling is set less by model quality and more by how many dependent steps a task actually requires. The same model looks excellent on a three-step task and unreliable on a twenty-step one.

The arithmetic is unforgiving: at 95% per-step success, a twenty-step workflow completes end to end only about a third of the time. It is also why agents that score well on curated benchmarks routinely lose half that performance in production, where error recovery matters more than raw capability.

The engineering response is not "make the model better at each step", though that helps. It is to shorten the dependent chain wherever possible: decompose a task so that as many steps as possible are independent rather than sequential, checkpoint intermediate results so a later failure does not have to redo earlier correct work, and add a verification step at the seams where a wrong intermediate result would otherwise silently poison everything after it. Plan-then-execute makes those seams visible up front, which is its real advantage over ReAct. Not that the plan is more likely to be right, but that you know where to insert a check before the agent commits to acting on it.

## Memory

"Memory" gets used for three different mechanisms that have almost nothing in common except that all three make information available beyond the turn it appeared in. Conflating them is why so many agent systems either forget things they need or retain things they should not.

The scratchpad is the agent's working memory for one task: the running record of what it has tried, what came back, and what it currently believes, usually just the accumulating list of messages in the current tool-call loop. It exists for exactly as long as the task does, and then it is gone. This is the memory that makes multi-step reasoning coherent. Without it, an agent re-deciding its next action on every turn would have no record of what it already ruled out, and would happily repeat a failed action forever.

Conversation memory spans multiple turns of a single ongoing interaction with one user: what they asked earlier in this session, corrections they already made, preferences they stated once and should not have to repeat. It is usually the scratchpad, extended across a session boundary rather than a single task boundary, and it hits the same ceiling every context window does. It is bounded, and a long enough conversation eventually pushes early turns out or forces a summarisation step that is itself a lossy compression the agent cannot fully audit later.

Long-term memory is different in kind, not just in duration: facts, preferences, or outcomes that should persist across sessions entirely, such as a user's stated preference from three weeks ago, or the resolution of a similar ticket last quarter. This cannot live in the context window because it was never part of the conversation that produced it. It has to be written somewhere durable and retrieved back in when relevant, which makes it structurally identical to the retrieval problem covered elsewhere in this Atlas. The retrieval step for long-term memory has the same failure modes as any retrieval system: the right memory can fail to surface, or the wrong one can surface confidently and be treated as fact.

| Kind | Lives for | Where it's stored | Fails when |
|---|---|---|---|
| Scratchpad | One task | The message list, in-context | The task runs long enough to exceed the window |
| Conversation | One session | The message list, in-context | Early turns get summarised or dropped |
| Long-term | Across sessions | An external store, retrieved on demand | The retrieval step surfaces the wrong memory, or none |

The design question that actually matters is not "how do I add memory" but "what, specifically, needs to survive past this task, and for how long", because everything defaults to not persisting. A scratchpad vanishes when the task ends unless you deliberately write part of it somewhere durable. Nothing about running an agent for a long time makes it remember anything from last week unless a separate write path exists for that. Most systems that feel like they have good memory have, in practice, identified a small number of specific facts worth persisting, a user's name, a stated preference, an unresolved commitment, and written an explicit path for exactly those, rather than trying to make the whole transcript durable. Persisting everything is not free. It is more retrieval surface to search, more stale information that can be served with false confidence, and more that has to be kept consistent when the underlying facts change. The honest default is to persist deliberately and narrowly, and treat "the agent should remember X" as a specific engineering requirement each time, not a capability you get by turning a setting on.

## When Tool Calls Fail

This is the question an interviewer asks to find out whether you have actually run an agent in production or only read about one. The honest answer has four distinct failure categories, and they need different handling, because treating them all as "retry" produces an agent that either gives up too early or loops forever on something a retry will never fix.

Malformed arguments are the cheapest failure: the model called the right tool but the arguments do not parse, or fail your schema validation, or reference an entity that does not exist. This is usually recoverable in place. Return the validation error as a structured, specific message ("`customer_id` must match `CUST-#####`; received `1029`") and let the model correct it on the next turn. It made a fixable mistake; give it the information to fix it, and it usually will.

Tool errors are different: the arguments were fine, the call was legitimate, and the underlying system failed anyway, a timeout, a 500, a rate limit. Retrying the same call with the same arguments can work here, but only for errors that are actually transient. Retrying a permission error or a not-found error is wasted turns that look like progress and are not. This is where a plain try/except swallowing everything into "please try again" earns its reputation as an anti-pattern: the agent needs to know which category it is in to react correctly.

Wrong tool is the failure with no automatic recovery from inside the loop: the call was well-formed and it succeeded, and it was still the wrong thing to have called. Nothing threw. The result came back for the wrong customer, the wrong date range, the wrong intent entirely, and the model may build several confident steps on top of it before anything looks broken. This is the failure mode unique to agents. No exception marks it, so it needs a check that is not "did this throw" but "does this result actually satisfy the request", which usually means either a lightweight verification step or, for consequential actions, the human gate covered in the next section.

Loops are what happens when none of the above gets caught: the same tool, the same or near-identical arguments, repeated, because the model's response to a failure was to try again exactly as before rather than adapt. Detecting one is a matter of a short window over recent calls, not a token budget. The loop can be cheap in tokens per turn and still run forever.

:::code python
MAX_STEPS = 8
history = []

for step in range(MAX_STEPS):
    call = model.next_action(messages)
    if call is None:
        return model.final_answer(messages)

    if is_repeat(call, history[-3:]):           # same tool, near-identical args
        return escalate("stuck in a loop", history)

    try:
        result = execute(call.name, call.arguments)
    except ValidationError as e:
        result = {"error": "invalid_arguments", "detail": str(e)}   # let it self-correct
    except TransientError:
        result = retry_with_backoff(call, max_attempts=2) or {"error": "unavailable"}
    except PermissionError as e:
        return escalate(f"blocked: {e}", history)   # not the model's to fix, stop

    history.append(call)
    messages.append(model.tool_result(call.id, result))

return escalate("step budget exhausted without a final answer", history)
:::

The step cap in that loop is not defensive boilerplate. It is the only thing standing between a stuck agent and an unbounded bill, and its placement is deliberate: checked before the call executes, so a runaway loop is caught on the next iteration rather than after the budget is already spent on one more round trip. Escalation, the last resort in each unrecoverable branch, means stopping and handing the transcript to a human or a fallback path, not because it is elegant, but because an agent that cannot tell "I am stuck" from "I am making progress" will spend a great deal of money finding out the hard way.

## Multi-Agent Systems

Splitting one agent into several only helps when the split reduces what each agent has to hold in its head at once. A single agent with one enormous tool list and one sprawling system prompt covering research, writing, and review is straining against the same context-window and attention limits an overloaded function strains against in ordinary software: too many responsibilities, too much irrelevant context on any given step, more room for the wrong tool to get picked. Splitting that into a researcher, a writer, and a reviewer, each with a narrow tool set and a short, specific prompt, can genuinely improve reliability, for the same reason a small function is easier to get right than a large one.

The failure version of this is one agent wearing hats: the same underlying model and context, relabelled as "agent A" and "agent B" in a diagram, passing a full transcript back and forth between two prompts that could have been two sections of one prompt. This buys the appearance of architecture without the benefit. It usually adds round trips and cost without reducing what any single call has to reason about, because both "agents" still see the whole history either way. The test for whether a split is real: does each agent operate with meaningfully less context, fewer tools, and a narrower prompt than the combined version would need? If the answer is no, it is one system with extra hops.

Where splitting is genuine, it earns its cost by isolating both tools and failure. A researcher agent with only search and fetch tools cannot accidentally trigger a write it was never meant to make. A reviewer agent that only ever sees the writer's draft, not the full research trail, produces a cleaner judgement because it is not carrying context irrelevant to the review. This is the same argument as the "fewer tools per agent" point in tool design, applied at the level of an entire role rather than a single call.

Two things have to be designed deliberately for a split to work at all: handoff and shared state. Handoff is the moment control passes from one agent to another, and what exactly gets passed, the full transcript, a summary, a structured result object, matters more than which framework wires it together. Passing everything defeats the purpose of splitting in the first place. Passing too little loses context the next agent actually needed and produces answers that ignore constraints stated three steps earlier to a different agent. Shared state is whatever needs to be visible to more than one agent without being in the prompt: a shared scratchpad, a task queue, a database row representing progress on the overall job. It needs a single source of truth, because two agents independently guessing the current state of a task from their own partial context is a race condition with an LLM instead of a database lock.

| Split is real when | Split is cosmetic when |
|---|---|
| Each agent's tool list is meaningfully narrower | Every agent has access to the same full toolkit |
| Each agent's context is a strict subset of the whole | Every agent sees the full transcript regardless |
| A failure in one role does not corrupt another's state | All agents read and write the same mutable state |
| Coordination happens through a small, explicit handoff | Coordination happens by re-pasting the whole history |

:::figure multi-agent-handoff-shared-state
Two agents with distinct tool sets and prompts, connected by a narrow handoff — a structured result, not a full transcript — and a shared state store both can read but that has one writer at a time.
:::

Orchestration frameworks that implement supervisor/worker or sequential-handoff patterns are common, but the pattern holds regardless of which library wires it together: fewer responsibilities per agent, an explicit and narrow handoff between them, and one place, not two independent guesses, for shared state to live.

## Human in the Loop

An approval gate is a deliberate point where the agent stops and waits for a person to confirm before it proceeds. The only design decision that matters is where to put it. Too many gates and the human becomes a rubber stamp, approving without reading because nothing has gone wrong yet. Too few and the first time a human looks closely is after an irreversible action already happened.

The placement principle that holds up in practice is reversibility, not risk in the abstract. An action that can be undone cheaply, drafting an email, proposing a change, running a read-only query, does not need a gate, because a wrong output costs a review cycle, not an incident. An action that cannot be cleanly undone, sending the email, deleting a record, moving money, pushing to production, needs one regardless of how confident the agent's plan looks, because the cost of a wrong call is no longer bounded by catching it afterward. Between those two extremes sits a middle tier: actions that are technically reversible but expensive to reverse, a bulk update that needs a rollback script someone has to write and test, which usually deserve a gate too, on the grounds that "reversible in principle" and "reversible before anyone notices" are different guarantees.

| Action class | Gate needed | Reasoning |
|---|---|---|
| Read-only, drafts, proposals | No | A wrong output costs a review cycle, nothing more |
| Reversible but costly to undo | Usually | The rollback exists but is itself a project |
| Irreversible or externally visible | Always | Nothing recovers the state once it runs |

Where to place the gate is only half the design. What the agent does while waiting is the half that gets skipped, and it is the difference between a system that scales past one user and one that does not. A synchronous request that blocks on a human's approval, holding a connection open, an API call not returning until someone clicks a button, works for a demo and fails the moment approval takes longer than a request timeout, or the approver is offline, or ten requests are waiting on the same person at once. The agent's state at the point of the gate needs to be serialisable and persisted: the proposed action, its arguments, and enough context to explain why, so the approval can arrive an hour later through a queue, a webhook, or a notification, and resume exactly where it paused rather than starting the task over or losing the reasoning that led there.

The failure mode on the other side of too many gates is not a design flaw so much as a behavioural one. A human asked to approve dozens of low-consequence actions a day stops reading them and starts clicking approve, and at that point the gate provides the appearance of oversight without the substance. This is a strong argument for the reversibility principle over a blanket "gate everything that touches an external system" policy. A gate only works as a safety mechanism for as long as the person on the other end of it is actually evaluating what they are approving, and that stops being true once the volume exceeds what a person can attend to.

A gate that requires a full re-explanation of context every time is also a gate people learn to avoid. The request needs to state the proposed action, the reasoning in one or two lines, and what happens if they do nothing, clearly enough that approving or rejecting takes seconds, not minutes of reading transcript.

## Cost and Latency

Every step in an agent loop is a full round trip to a model, and that changes what a request costs in a way that is easy to underestimate from a demo where the loop happens to finish in two or three calls. A feature that used to be one model call, one response, is now n calls, where n is decided by the model at run time, not by you. The first thing to accept about running agents in production is that "cost per request" has become a distribution, not a number.

The token cost compounds in a specific, mechanical way that is worth writing down rather than waving at. Most agent loops resend the full transcript on every turn, the system prompt, the tool schemas, and every prior tool call and result, because the model has no memory between calls except what is in the context you send it. If each step adds roughly a fixed amount of new content (Δ) on top of a base prompt, the input tokens billed across an n-step loop are not n times one step's cost. They are the sum of a growing transcript at every step.

:::math Total input tokens across an n-step loop, transcript resent in full each turn
T(n) = n \cdot \mathrm{base} + \Delta \cdot \frac{n(n+1)}{2}
:::

That second term is quadratic in the number of steps. A loop that runs twice as long does not cost twice as much. It costs closer to four times as much, because step 20 is paying to resend everything from steps 1 through 19, not just its own new content. Prompt caching, offered in some form by most model providers, mitigates the static part of this, the system prompt and tool schemas, which do not change turn to turn, but the part that grows, the accumulating tool-call history, is new content on every turn and gets billed in full regardless of caching.

Where prefix caching applies, cached input is typically billed at around a tenth of the standard input rate, above a minimum cacheable prefix on the order of a thousand tokens, with a cache lifetime of a few minutes that refreshes on each hit.

Latency compounds for a related reason: each step waits on a full model completion, and typically also on the tool call's own execution time, in sequence. A single query that used to return in one model round trip now returns after however many round trips the loop takes, plus whatever each tool call takes on its own. A slow downstream API inside the loop is now on the critical path of every step that calls it, not a one-off cost paid once.

There is no single per-call figure, because tool execution is the variable — it can be a hundred milliseconds or several seconds. What is reliable is the shape: each round trip costs the tool plus another generation pass to interpret its result, which is why multi-step agents commonly run several times slower than a single-turn call.

The mitigations are unglamorous and load-bearing. A hard step cap, covered in the previous section as a correctness measure, is equally a cost measure: it is the only thing bounding the worst case, and without one a stuck loop is not just wrong, it is an open-ended expense. A token or dollar budget per session catches the case where every individual step looks reasonable but the total does not. And the earlier point about tool design pays for itself here too. Fewer, sharper tools mean fewer wasted steps trying the wrong one, and a wasted step in an agent loop is not a rounding error. It is a full billed round trip that produced nothing.

| Lever | What it bounds | Where it's set |
|---|---|---|
| Step cap | Worst-case cost and latency of a single loop | In the loop itself, checked before each call |
| Token/dollar budget | Cumulative spend across a session | Around the loop, not inside it |
| Prompt caching | Cost of the static prefix, not the growing history | Provider-side, opt-in |
| Tool count and specificity | Wasted steps trying the wrong tool | At design time, covered earlier in this section |

None of this is a reason to avoid agents where the control-flow problem genuinely calls for one. It is a reason to treat the step count as a cost parameter you actively manage, the same way you would treat an unbounded retry loop in any other system, because that, mechanically, is exactly what an agent loop is.
