/**
 * Approximate tokenizer — a GPT-2-style regex pre-tokenizer feeding a greedy
 * longest-match over a small subword table ("bpe"), plus a SentencePiece-style
 * variant ("sp") that marks word starts with ▁ and splits digits individually.
 * Reproduces the behaviours that matter (whitespace binds forward, rare words
 * shatter, numbers and URLs are expensive) without shipping a 50k vocabulary.
 */

const COMMON = new Set(
  (
    'the of and to in a is that it for on with as was at by an be this from or have not are but had his her they you we all can has will one would there their what so up out if about who get which go me when make like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us are down should does each between little very still world own life through home going where much before right around another old think need place high next big small large group child man woman name number part sound water long find here thing feel great many well those said may say her him she his them what were been has had did does going been more some such only than into over then here come made'
  ).split(' ')
)

const SUB = (
  'tion sion ment ness able ible ance ence ously ally ical ing ers est ous ive ate ise ize ist ism ity ful less ship ward ed er ly es re un in con com pro pre sub inter trans over under non anti auto micro multi semi super hyper de dis mis out up ex en em'
).split(' ')

const PRE = /'s|'t|'re|'ve|'m|'ll|'d| ?[A-Za-z]+| ?[0-9]+| ?[^\sA-Za-z0-9]+|\s+/g

function splitWord(w: string): string[] {
  const lw = w.toLowerCase()
  if (lw.length <= 4 || COMMON.has(lw)) return [w]
  const out: string[] = []
  let i = 0
  while (i < lw.length) {
    let best = ''
    for (const s of SUB) {
      if (i > 0 && lw.startsWith(s, i) && s.length > best.length && i + s.length <= lw.length) best = s
    }
    if (best.length >= 2) {
      out.push(w.slice(i, i + best.length))
      i += best.length
      continue
    }
    let j = i + 1
    const cap = Math.min(lw.length, i + 4)
    while (j < cap && !SUB.some((s) => s.length >= 3 && lw.startsWith(s, j))) j++
    out.push(w.slice(i, j))
    i = j
  }
  return out
}

function chunkDigits(s: string, size: number): string[] {
  const out: string[] = []
  let lead = ''
  if (s[0] === ' ') {
    lead = ' '
    s = s.slice(1)
  }
  for (let i = 0; i < s.length; i += size) out.push((i === 0 ? lead : '') + s.slice(i, i + size))
  return out
}

export type TokenizerScheme = 'bpe' | 'sp'

/** scheme: "bpe" (byte-pair-ish, space binds forward) | "sp" (sentencepiece-ish). */
export function tokenize(text: string, scheme: TokenizerScheme): string[] {
  const pieces = String(text).match(PRE) || []
  const out: string[] = []
  for (const raw of pieces) {
    if (/^\s+$/.test(raw)) {
      if (raw.length > 1) out.push(raw)
      continue
    }
    if (/[0-9]/.test(raw)) {
      out.push(...chunkDigits(raw, scheme === 'sp' ? 1 : 3))
      continue
    }
    if (/^ ?[^\sA-Za-z0-9]+$/.test(raw)) {
      const t = raw
        .trim()
        .split('')
        .map((ch, k) => (k === 0 && raw[0] === ' ' && scheme === 'bpe' ? ' ' + ch : ch))
      out.push(...t)
      continue
    }
    const lead = raw[0] === ' '
    const word = lead ? raw.slice(1) : raw
    const parts = splitWord(word)
    parts.forEach((p, k) => {
      if (k === 0 && lead) out.push(scheme === 'sp' ? '▁' + p : ' ' + p)
      else if (k === 0 && scheme === 'sp') out.push('▁' + p)
      else out.push(p)
    })
  }
  return out
}

export const count = (text: string, scheme: TokenizerScheme) => tokenize(text, scheme).length
