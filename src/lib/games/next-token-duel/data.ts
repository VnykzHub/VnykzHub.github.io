/**
 * Precomputed next-token distributions, shipped as static data so the duel
 * makes zero inference calls. `o` = [token, probability] candidates, `c` =
 * index of the token that actually came next. Ported from the prototype.
 */

export interface DuelStep {
  o: [string, number][]
  c: number
}

export interface DuelPassage {
  genre: string
  prefix: string
  steps: DuelStep[]
}

export const PASSAGES: DuelPassage[] = [
  {
    genre: 'contract boilerplate',
    prefix: 'The parties hereby agree that any dispute arising',
    steps: [
      { o: [[' under', 0.42], [' out', 0.31], [' from', 0.19], [' in', 0.05], [' between', 0.03]], c: 1 },
      { o: [[' of', 0.96], [' from', 0.02], [' in', 0.01], [' to', 0.005], [' and', 0.005]], c: 0 },
      { o: [[' this', 0.55], [' or', 0.18], [' the', 0.15], [' these', 0.08], [' any', 0.04]], c: 1 },
      { o: [[' relating', 0.62], [' in', 0.15], [' connected', 0.12], [' arising', 0.07], [' under', 0.04]], c: 0 },
    ],
  },
  {
    genre: 'wire copy',
    prefix: 'The central bank raised interest rates by 25 basis',
    steps: [
      { o: [[' points', 0.97], [' point', 0.015], [' pts', 0.008], [' %', 0.004], [' bp', 0.003]], c: 0 },
      { o: [[' on', 0.22], [',', 0.2], [' to', 0.19], [' in', 0.15], [' and', 0.12]], c: 2 },
      { o: [[' a', 0.34], [' 5', 0.28], [' the', 0.2], [' its', 0.1], [' 4', 0.08]], c: 0 },
      { o: [[' 22', 0.18], [' two', 0.16], [' fresh', 0.14], [' 15', 0.13], [' record', 0.11]], c: 3 },
    ],
  },
  {
    genre: 'python',
    prefix: 'for i in range(len(arr)):\n    if arr[i] >',
    steps: [
      { o: [[' arr', 0.41], [' 0', 0.22], [' max', 0.14], [' target', 0.13], [' n', 0.1]], c: 2 },
      { o: [[':', 0.6], ['_', 0.18], ['imum', 0.12], [' :', 0.06], ['(', 0.04]], c: 0 },
      { o: [['\n        ', 0.85], [' ', 0.07], ['\n', 0.05], ['  ', 0.02], ['\t', 0.01]], c: 0 },
      { o: [['max', 0.55], ['ans', 0.13], ['print', 0.12], ['result', 0.1], ['best', 0.1]], c: 0 },
    ],
  },
  {
    genre: 'dialogue',
    prefix: '"I told you," she said, "not to open the',
    steps: [
      { o: [[' door', 0.38], [' box', 0.22], [' window', 0.14], [' letter', 0.13], [' gate', 0.13]], c: 1 },
      { o: [['."', 0.45], [',"', 0.25], ['!"', 0.12], ['?"', 0.08], [' ,', 0.1]], c: 0 },
      { o: [[' He', 0.32], [' I', 0.28], [' The', 0.16], [' She', 0.14], [' It', 0.1]], c: 1 },
      { o: [[' didn', 0.4], [' hadn', 0.2], [' knew', 0.15], [' said', 0.13], [' was', 0.12]], c: 1 },
    ],
  },
  {
    genre: 'encyclopedia',
    prefix: 'Hyderabad is the capital and largest city of the Indian state',
    steps: [
      { o: [[' of', 0.94], [',', 0.03], [' and', 0.01], [' in', 0.01], [' Telangana', 0.01]], c: 0 },
      { o: [[' Telangana', 0.86], [' Andhra', 0.09], [' Karnataka', 0.02], [' Maharashtra', 0.02], [' Tamil', 0.01]], c: 0 },
      { o: [['.', 0.55], [',', 0.22], [' and', 0.12], [';', 0.06], [' in', 0.05]], c: 0 },
      { o: [[' It', 0.48], [' The', 0.19], [' Hyderabad', 0.13], [' With', 0.12], [' As', 0.08]], c: 3 },
    ],
  },
  {
    genre: 'product review',
    prefix: 'Battery life is fine but the fan noise is',
    steps: [
      { o: [[' noticeable', 0.36], [' a', 0.22], [' really', 0.18], [' unbearable', 0.14], [' the', 0.1]], c: 3 },
      { o: [['.', 0.35], [' ,', 0.2], [' under', 0.2], [' when', 0.15], [' at', 0.1]], c: 2 },
      { o: [[' load', 0.72], [' any', 0.09], [' heavy', 0.08], [' full', 0.07], [' stress', 0.04]], c: 0 },
      { o: [['.', 0.6], [',', 0.2], [' and', 0.12], [' —', 0.05], [';', 0.03]], c: 0 },
    ],
  },
  {
    genre: 'service log',
    prefix: 'ERROR 2026-03-11T14:02:11Z gunicorn worker timeout after',
    steps: [
      { o: [[' 30', 0.36], [' 60', 0.24], [' 120', 0.14], [' 90', 0.14], [' 300', 0.12]], c: 0 },
      { o: [['s', 0.42], [' seconds', 0.3], ['sec', 0.12], [' s', 0.11], ['000', 0.05]], c: 1 },
      { o: [['\n', 0.45], [' (', 0.22], [' ,', 0.18], [';', 0.1], [' —', 0.05]], c: 0 },
      { o: [['ERROR', 0.35], ['INFO', 0.3], ['WARN', 0.2], ['DEBUG', 0.1], ['TRACE', 0.05]], c: 0 },
    ],
  },
]

/** Passages per run. */
export const PASSAGES_PER_RUN = 4
