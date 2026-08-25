export const PICK_CONF = 0.7

/** Surprisal in bits. */
export const bits = (q: number) => -Math.log2(q)

/** Your implied probability: 70% if right, the rest spread across the others if wrong. */
export const pickQ = (correct: boolean, numOptions: number) =>
  correct ? PICK_CONF : (1 - PICK_CONF) / (numOptions - 1)

export const perplexity = (avgBits: number) => Math.pow(2, avgBits)
