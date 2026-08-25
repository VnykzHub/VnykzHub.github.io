export const ROUNDS = 20
export const START = 100
export const CAP = 0.6

/** Beta(1+h, 1+t) posterior mean of the coin's heads probability. */
export const posterior = (heads: number, tails: number) => (heads + 1) / (heads + tails + 2)

/** Full-Kelly fraction for an even-money bet at posterior p. */
export const kellyFraction = (p: number) => Math.max(0, Math.abs(2 * p - 1))

export const kellySide = (p: number): 'H' | 'T' => (p >= 0.5 ? 'H' : 'T')

export const capFraction = (f: number) => Math.min(CAP, f)
