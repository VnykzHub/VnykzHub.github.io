import type { AtlasAnim } from '../../llm-atlas/types'
import { AMBER, PATINA, RUST, SOFT, RULE, box, arrow, caption, rr, label, ramp, MONO, SANS } from './_shared'

/* ── 04 RAG ─────────────────────────────────────────────────────────────── */

/**
 * One raw query fanning into four expansion strategies, each retrieving
 * independently, converging back into a single merged candidate set. A
 * travelling highlight shows the fan-out direction without hiding any path
 * at t=0.
 */
const queryExpansionPaths: AtlasAnim = (ctx, w, h, t) => {
  const qw = Math.min(74, w * 0.2)
  const qh = 28
  const qx = 16
  const qy = h / 2 - qh / 2
  box(ctx, qx, qy, qw, qh, 'query', SOFT)

  const paths = [
    { label: 'rewrite', c: PATINA },
    { label: 'HyDE', c: PATINA },
    { label: 'multi-query', c: PATINA },
    { label: 'decompose', c: PATINA },
  ]
  const midX = qx + qw + Math.min(64, (w - qw - 200) / 2 + 40)
  const midW = Math.min(78, midX - qx - qw - 20)
  const rowH = Math.min(22, (h - 24) / paths.length - 6)
  const gap = (h - paths.length * rowH) / (paths.length + 1)

  const mergeX = w - Math.min(90, w * 0.22)
  const mergeW = Math.min(78, w - mergeX - 14)
  const mergeH = 30
  const mergeY = h / 2 - mergeH / 2

  const activeIdx = Math.floor(t * 0.8) % paths.length

  paths.forEach((p, i) => {
    const y = gap + i * (rowH + gap)
    const active = i === activeIdx
    arrow(ctx, qx + qw + 4, qy + qh / 2, midX - 4, active ? AMBER : RULE)
    box(ctx, midX, y, midW, rowH, p.label, p.c, active ? 1 : 0.6)
    arrow(ctx, midX + midW + 4, y + rowH / 2, mergeX - 4, active ? AMBER : RULE)
  })

  box(ctx, mergeX, mergeY, mergeW, mergeH, 'merged set', AMBER)

  // decorative settle-in glow only — the merge box above is already fully
  // drawn and legible at t=0, this just draws attention to it
  ctx.globalAlpha = 0.5 * ramp(t, 1.4)
  ctx.strokeStyle = AMBER
  ctx.lineWidth = 2.5
  rr(ctx, mergeX - 3, mergeY - 3, mergeW + 6, mergeH + 6, 9)
  ctx.stroke()
  ctx.globalAlpha = 1

  caption(ctx, 'four retrievable forms of one question, merged before rerank', w / 2, h - 6)
}

/**
 * Retrieval metrics and generation metrics on two separate axes, meeting
 * only at a reporting node. Nothing merges into one end-to-end number.
 */
const evalMetricSplit: AtlasAnim = (ctx, w, h, t) => {
  const qw = Math.min(84, w * 0.22)
  const qh = 26
  const qx = 16
  const qy = h / 2 - qh / 2
  box(ctx, qx, qy, qw, qh, 'golden query', SOFT)

  const branchX = qx + qw + Math.min(60, (w - qw - 40) * 0.28)
  const boxW = Math.min(110, w - branchX - 60)
  const boxH = 30
  const topY = h * 0.28 - boxH / 2
  const botY = h * 0.72 - boxH / 2

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.6)

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.4
  ctx.beginPath()
  ctx.moveTo(qx + qw + 4, qy + qh / 2)
  ctx.lineTo(branchX, qy + qh / 2)
  ctx.lineTo(branchX, topY + boxH / 2)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(branchX, qy + qh / 2)
  ctx.lineTo(branchX, botY + boxH / 2)
  ctx.stroke()

  box(ctx, branchX, topY, boxW, boxH, 'retrieval metrics', PATINA, 0.65 + 0.35 * pulse)
  label(ctx, 'recall@k · MRR', branchX, topY - 8, PATINA, 9)

  box(ctx, branchX, botY, boxW, boxH, 'generation metrics', AMBER, 0.65 + 0.35 * (1 - pulse))
  label(ctx, 'faithfulness · citation', branchX, botY - 8, AMBER, 9)

  // meet at reporting stage — dashed, not merged
  const repX = branchX + boxW + Math.min(56, w - branchX - boxW - 30)
  const repW = Math.min(70, w - repX - 12)
  const repH = 60
  const repY = h / 2 - repH / 2

  ctx.strokeStyle = RULE
  ctx.setLineDash([3, 3])
  ctx.lineWidth = 1.2
  ctx.beginPath()
  ctx.moveTo(branchX + boxW + 4, topY + boxH / 2)
  ctx.lineTo(repX, topY + boxH / 2)
  ctx.lineTo(repX, h / 2 - 10)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(branchX + boxW + 4, botY + boxH / 2)
  ctx.lineTo(repX, botY + boxH / 2)
  ctx.lineTo(repX, h / 2 + 10)
  ctx.stroke()
  ctx.setLineDash([])

  ctx.strokeStyle = SOFT
  ctx.lineWidth = 1.2
  rr(ctx, repX, repY, repW, repH, 6)
  ctx.stroke()
  ctx.fillStyle = SOFT
  ctx.font = `600 11px ${SANS}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('report', repX + repW / 2, repY + repH / 2 - 7)
  ctx.font = `11px ${SANS}`
  ctx.fillText('side by side', repX + repW / 2, repY + repH / 2 + 9)
  ctx.textBaseline = 'alphabetic'

  caption(ctx, 'never merged — a blended score can’t say which half broke', w / 2, h - 4)
}

/* ── 05 Agents ──────────────────────────────────────────────────────────── */

/**
 * Two agents, each with its own narrower tool set, connected by a narrow
 * structured handoff, both reading a single shared state store that has
 * one active writer at a time.
 */
const multiAgentHandoffSharedState: AtlasAnim = (ctx, w, h, t) => {
  const aw = Math.min(108, w * 0.3)
  const ah = 34
  const y = h * 0.26 - ah / 2
  const ax1 = 16
  const ax2 = w - 16 - aw

  box(ctx, ax1, y, aw, ah, 'agent A', PATINA)
  label(ctx, 'tools: search, fetch', ax1, y - 8, SOFT, 9)
  box(ctx, ax2, y, aw, ah, 'agent B', AMBER)
  label(ctx, 'tools: write, notify', ax2, y - 8, SOFT, 9)

  // narrow structured handoff between them, not a full transcript
  const midX1 = ax1 + aw
  const midX2 = ax2
  arrow(ctx, midX1 + 4, y + ah / 2, midX2 - 4, PATINA)
  ctx.fillStyle = SOFT
  ctx.font = `11px ${MONO}`
  ctx.textAlign = 'center'
  ctx.fillText('handoff: structured result', (midX1 + midX2) / 2, y + ah / 2 - 12)

  // single shared state store below, one writer at a time
  const sw = Math.min(180, w - 60)
  const sh = 34
  const sx = w / 2 - sw / 2
  const sy = h * 0.72 - sh / 2
  box(ctx, sx, sy, sw, sh, 'shared state — single writer', RUST, 0.85)

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1.2
  ctx.setLineDash([3, 3])
  ctx.beginPath()
  ctx.moveTo(ax1 + aw / 2, y + ah)
  ctx.lineTo(ax1 + aw / 2, sy)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(ax2 + aw / 2, y + ah)
  ctx.lineTo(ax2 + aw / 2, sy)
  ctx.stroke()
  ctx.setLineDash([])

  // writer marker alternates position to show "one writer at a time",
  // never implying simultaneous writes even mid-animation
  const writerAtA = Math.sin(t * 0.9) > 0
  const wx = writerAtA ? ax1 + aw / 2 : ax2 + aw / 2
  ctx.fillStyle = RUST
  ctx.beginPath()
  ctx.arc(wx, sy - 6, 3, 0, Math.PI * 2)
  ctx.fill()

  label(ctx, 'read/write', ax1 + aw / 2 + 4, (y + ah + sy) / 2, SOFT, 8)
  label(ctx, 'read/write', ax2 + aw / 2 + 4, (y + ah + sy) / 2, SOFT, 8)

  caption(ctx, 'a narrow handoff, one mutable state, one writer at a time', w / 2, sy + sh + 20)
}

/* ── 06 MCP ─────────────────────────────────────────────────────────────── */

/**
 * The whole "why MCP exists" argument. Left: 3 clients × 4 tools wired
 * bespoke — 12 crossing lines. Right: the same 3 clients and 4 tools each
 * connected once to a protocol layer — 3 + 4 = 7 lines. The edge count is
 * drawn literally so the collapse reads at a glance.
 */
const mcpNTimesMProblem: AtlasAnim = (ctx, w, h, t) => {
  const half = w / 2
  const clientsN = 3
  const toolsN = 4

  ctx.strokeStyle = RULE
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(half, 8)
  ctx.lineTo(half, h - 8)
  ctx.stroke()

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.3)

  // ── left: bespoke N×M grid ──
  const lPad = 14
  const lClientX = lPad
  const lToolX = half - lPad - 56
  const colW = 56
  const topY = 30

  const lClientY = (i: number) => topY + i * ((h - topY - 20) / (clientsN - 1 || 1))
  const lToolY = (j: number) => topY + j * ((h - topY - 20) / (toolsN - 1 || 1))

  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('bespoke: 12 integrations', half / 2, 18)

  // 12 crossing bespoke lines, drawn first so boxes sit on top
  for (let i = 0; i < clientsN; i++) {
    for (let j = 0; j < toolsN; j++) {
      ctx.strokeStyle = RUST
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(lClientX + colW, lClientY(i))
      ctx.lineTo(lToolX, lToolY(j))
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }

  for (let i = 0; i < clientsN; i++) {
    box(ctx, lClientX, lClientY(i) - 11, colW, 22, `client ${i + 1}`, SOFT)
  }
  for (let j = 0; j < toolsN; j++) {
    box(ctx, lToolX, lToolY(j) - 11, colW, 22, `tool ${j + 1}`, RUST, 0.75 + 0.25 * pulse)
  }

  // ── right: N+M via protocol ──
  const rPad = 14
  const rClientX = half + rPad
  const rToolX = w - rPad - 56
  const protoW = Math.min(64, rToolX - (rClientX + colW) - 20)
  const protoX = (rClientX + colW + rToolX) / 2 - protoW / 2
  const protoH = 30
  const protoY = h / 2 - protoH / 2

  ctx.fillStyle = SOFT
  ctx.font = `11px ${SANS}`
  ctx.textAlign = 'center'
  ctx.fillText('via protocol: 3 + 4 = 7', half + half / 2, 18)

  const rClientY = (i: number) => topY + i * ((h - topY - 20) / (clientsN - 1 || 1))
  const rToolY = (j: number) => topY + j * ((h - topY - 20) / (toolsN - 1 || 1))

  for (let i = 0; i < clientsN; i++) {
    ctx.strokeStyle = PATINA
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(rClientX + colW, rClientY(i))
    ctx.lineTo(protoX, protoY + protoH / 2)
    ctx.stroke()
  }
  for (let j = 0; j < toolsN; j++) {
    ctx.strokeStyle = AMBER
    ctx.lineWidth = 1.2
    ctx.beginPath()
    ctx.moveTo(protoX + protoW, protoY + protoH / 2)
    ctx.lineTo(rToolX, rToolY(j))
    ctx.stroke()
  }

  box(ctx, protoX, protoY, protoW, protoH, 'MCP', AMBER)
  for (let i = 0; i < clientsN; i++) {
    box(ctx, rClientX, rClientY(i) - 11, colW, 22, `client ${i + 1}`, SOFT)
  }
  for (let j = 0; j < toolsN; j++) {
    box(ctx, rToolX, rToolY(j) - 11, colW, 22, `tool ${j + 1}`, PATINA)
  }

  caption(ctx, 'N×M bespoke lines collapse to N+M through one protocol', w / 2, h - 4)
}

/**
 * A host process holding three 1:1 client-server connections. One
 * connection is a local subprocess transport, another a remote transport.
 * A capability marker flows from server to client at connection time.
 */
const mcpClientServerTopology: AtlasAnim = (ctx, w, h, t) => {
  const hostW = Math.min(150, w * 0.34)
  const hostH = h - 24
  const hostX = 12
  const hostY = 12

  ctx.strokeStyle = SOFT
  ctx.lineWidth = 1.4
  rr(ctx, hostX, hostY, hostW, hostH, 8)
  ctx.stroke()
  ctx.fillStyle = SOFT
  ctx.font = `600 11.5px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('host process', hostX + 10, hostY + 16)

  const clients = [
    { label: 'client 1', transport: 'local · subprocess', c: PATINA },
    { label: 'client 2', transport: 'remote · HTTP', c: AMBER },
    { label: 'client 3', transport: 'local · subprocess', c: PATINA },
  ]
  const cw = hostW - 24
  const ch = 22
  const gap = (hostH - 30 - clients.length * ch) / (clients.length + 1)

  const servers = [{ label: 'server A' }, { label: 'server B' }, { label: 'server C' }]
  const sw = Math.min(96, w - hostX - hostW - 60)
  const sh = 22
  const sx = w - 14 - sw

  const pulse = 0.5 + 0.5 * Math.sin(t * 1.5)

  clients.forEach((c, i) => {
    const y = hostY + 26 + gap + i * (ch + gap)
    box(ctx, hostX + 12, y, cw, ch, c.label, c.c)

    const active = Math.floor(t * 0.7) % clients.length === i

    ctx.strokeStyle = c.c
    ctx.lineWidth = 1.3
    ctx.setLineDash(c.transport.startsWith('local') ? [] : [4, 3])
    ctx.globalAlpha = active ? 1 : 0.6
    ctx.beginPath()
    ctx.moveTo(hostX + hostW, y + ch / 2)
    ctx.lineTo(sx, y + sh / 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    label(ctx, c.transport, hostX + hostW + 8, y + ch / 2 - 4, c.c, 8)

    // capability marker flowing server -> client at connection time
    if (active) {
      const fx = sx - (sx - (hostX + hostW)) * pulse
      ctx.fillStyle = c.c
      ctx.beginPath()
      ctx.arc(fx, y + ch / 2, 2.6, 0, Math.PI * 2)
      ctx.fill()
    }

    box(ctx, sx, y, sw, sh, servers[i].label, SOFT)
  })

  ctx.fillStyle = SOFT
  ctx.font = `10px ${SANS}`
  ctx.textAlign = 'left'
  ctx.fillText('← capabilities, at connection time', hostX + hostW + 8, hostY + hostH - 2)

  caption(ctx, 'one client, one server, one connection — per pair', w / 2, h - 4)
}

export const FIGURES_04_06: Record<string, AtlasAnim> = {
  'query-expansion-paths': queryExpansionPaths,
  'eval-metric-split': evalMetricSplit,
  'multi-agent-handoff-shared-state': multiAgentHandoffSharedState,
  'mcp-n-times-m-problem': mcpNTimesMProblem,
  'mcp-client-server-topology': mcpClientServerTopology,
}
