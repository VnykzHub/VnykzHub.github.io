---
id: mcp
label: MCP
title: Model Context Protocol
slug: mcp
icon: plug
color: "#4A9E93"
dek: A standard socket between models and the tools they call. The newest material in this Atlas, and the one most likely to be stated wrong with confidence — treat every specific detail here as something to check against the current spec before you repeat it.
---

## Why MCP Exists

Every model provider has its own way of describing a tool, its own request format for calling one, and its own shape for the result that comes back. Every application wiring an LLM up to a database, a ticketing system, or a filesystem has, historically, written that wiring once per model it wants to support. Ten tools and three model providers is not thirteen integrations, it is thirty — every tool reimplemented against every client that wants to use it.

That is the N × M problem, and it is not new. It is the same shape as printer drivers before a common spooling interface, or database access before ODBC. The fix in each case was the same: agree on an interface once, then write to the interface instead of to every consumer of it. MCP is that move applied to model-to-tool calling. A server implements a system's capabilities once; any compliant client — a chat app, an IDE, a custom agent runtime — can talk to it without bespoke glue. N × M becomes N + M.

| Approach | What it costs | Where it loses |
|---|---|---|
| Bespoke integration per client | An integration per (model, tool) pair, each with its own auth and error handling | Cost grows multiplicatively as either side adds a member |
| Hand-written tool definitions, no protocol | One schema and one dispatch function per tool, in-process | Cheapest option for a single app calling its own functions — but that reuse across other clients never happens unless someone rewrites it |
| MCP server | A server process, a transport, a capability-negotiation handshake | Another process to run, another interface to keep compatible, latency of an extra hop |

That table understates the honest case for skipping MCP. If you own both ends — one application, one model, a handful of internal functions — writing tool definitions directly and dispatching them yourself is fewer moving parts: no subprocess, no separate versioning story, no handshake before the first real call. MCP earns its cost when the same capability needs to show up in clients you do not control, or when the tool surface changes on a schedule independent of any one client's release cycle and you want callers to discover what changed rather than hardcode it.

:::figure mcp-n-times-m-problem
Left: a grid of bespoke lines connecting three model clients to four tools, twelve integrations. Right: the same four tools behind one server each, three clients each holding one generic connector — showing the N×M grid collapsing to N+M lines.
:::

The part worth being honest about: a protocol standardises the socket, not the judgement. It does not make a model choose the right tool, call it with sane arguments, or handle a bad result gracefully. Those are prompt-engineering and error-handling problems that exist whether or not a protocol sits underneath them, and MCP does not touch them. What it buys is specifically the reuse — write the server once, and stop caring which client is on the other end of the connection.

## The Protocol

MCP splits into two roles. A **host** is the application the user actually opens — a chat client, an IDE, an agent runtime — and it embeds one **client** per server it talks to, each client holding a stateful, one-to-one connection. A **server** is a separate process or endpoint that fronts one system — a database, a filesystem, a SaaS API — and exposes what that system can do in a shape the client understands. The host is where the model lives; the server has no model in it at all, only capabilities.

Connection happens over a **transport**. As of writing there are two shapes in common use: a local transport that spawns the server as a subprocess and talks over its standard input and output — no network exposure, the simplest option when the server and the host share a machine — and a transport for servers reachable over HTTP, for cases where the server runs remotely or is shared across multiple hosts. Two HTTP-side shapes exist in practice: an older Server-Sent Events transport, and a newer Streamable HTTP transport that is the forward-looking choice for scalable deployments. The older one is not formally deprecated, but new servers should prefer Streamable HTTP. Messages themselves are JSON-RPC 2.0 — structured requests, responses and notifications rather than free text. Before anything else happens, client and server perform a handshake in which the server declares what it supports. That negotiation is what lets a generic client talk to an arbitrary server without being compiled against it in advance — the client asks, at connection time, "what do you have," rather than shipping a hardcoded list. Concretely: the client sends an `initialize` request carrying its own capabilities and client info, the server replies with its capabilities and server info, and the client closes the exchange with an `initialized` notification. What a server actually exposes, at the level that has stayed stable across the protocol's revisions, is three kinds of primitive:

| Primitive | Who decides to use it | What it is |
|---|---|---|
| Tools | The model, during its own reasoning | Callable functions with a name, a description and a parameter schema — the model chooses when to invoke one |
| Resources | The application, on the user's or host's behalf | Addressable data the host can read and place into context — a file, a record, a query result |
| Prompts | The user, explicitly | Pre-written, parameterised message templates the human selects rather than the model inferring |

The distinction that matters operationally is the "who decides" column, not the names. A tool is something the model's own policy triggers mid-conversation, which is why tool descriptions double as prompting surface — badly worded, and the model either never calls the tool or calls it with the wrong arguments. A resource is pulled in by the host's own logic, closer to a document loader than a function call. Getting a server's tool count and tool descriptions right for the models that will actually call them matters more than getting the wire protocol right; the protocol just makes the negotiation consistent across whichever model ends up doing the calling.

:::figure mcp-client-server-topology
A host process containing three client instances, each with a dedicated one-to-one connection to a separate server process; annotate one connection as the local subprocess transport and another as the remote transport, with the capability list flowing from server to client at connection time.
:::

## Building and Operating a Server

The protocol handshake is the smallest part of building a server that survives contact with production. Almost everything that determines whether it is reliable sits underneath it, unstandardised.

Auth is the first gap. MCP defines how a client discovers and calls a server's tools; it says comparatively little about how the server authenticates to the real system behind it. Client-to-server auth over HTTP transports *is* specified — built on OAuth 2.1, with the server acting as an OAuth Resource Server — but much of the surrounding machinery, dynamic client registration among it, is permitted rather than required, so coverage varies between implementations. For a local server launched as a subprocess, the common pattern is inheriting credentials from the host's own environment — which means the server runs at the same trust level as the host application, and a tool call is effectively an RPC into your infrastructure that a model's inference decided to make. Treat every tool as something that needs the same access review a REST endpoint would get, not something exempt because "the model asked for it."

| Deployment | Typical credential path | Risk if skipped |
|---|---|---|
| Local, stdio | Inherited from the host process's environment | Server runs with the host's full trust level; no per-tool scoping |
| Remote, HTTP | A token or OAuth flow the server validates independently | Skipping this exposes the underlying system to anyone who can reach the endpoint |

The second gap is error surfaces. A stack trace is written for a human debugger and a model cannot act on one. What a model needs is a message that names what went wrong and what to try differently — "rate limited, retry after 30 seconds" is something a policy can act on; a bare exception with no structure just gets retried blindly or produces a confident, wrong next step. Designing a tool's error path is prompt design, not exception handling, and it is the part most example servers skip because it does not show up until the tool is called under real failure conditions.

Versioning is the third. A tool's name and parameter schema are an API surface a deployed agent has learned to call in a particular way, whether through a system prompt, few-shot examples, or a model's own priors about what a parameter named `query` should contain. Rename a parameter and you have not made a compatible change — you have broken every caller's implicit understanding of the tool, silently, with no type error to catch it. It surfaces later as malformed calls with no obvious cause.

:::code python
# What an agent loop actually needs around every tool call: a hard timeout
# independent of the server's own, and a decision for what happens on top of it.

async def call_tool(session, name, args, timeout_s=8):
    try:
        return await asyncio.wait_for(session.call(name, args), timeout=timeout_s)
    except asyncio.TimeoutError:
        # A hung server should cost one tool call, not the whole conversation.
        return {"error": "tool_timeout", "detail": f"{name} did not respond in {timeout_s}s"}
    except ConnectionError:
        # Session drop: reconnect, or drop the tool from what the model is offered
        # this turn rather than let it call something no longer there.
        return {"error": "server_unavailable", "detail": name}
:::

That is the shape of what breaks when a server is slow or down: the model is usually waiting synchronously on the result before it can keep generating, so a slow tool call is felt as an entire added turn of latency, not a background delay. And because a connection is typically a stateful session rather than a one-off request, a dropped server does not just fail the in-flight call — it can take the whole set of previously discovered tools with it until the host reconnects. Worth being precise about why: session state is a property of the transport rather than a requirement of the protocol core. Streamable HTTP carries a session id header, but a server may run sessionless — so how badly a dropped connection hurts is an implementation choice, not a fixed cost of using MCP. An agent runtime that does not handle that reconnection explicitly will have tools quietly vanish from the model's options mid-conversation, with nothing in the transcript to explain why the model stopped using them.
