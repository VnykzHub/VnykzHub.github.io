export const CORPUS = [
  'The quick brown fox jumps over the lazy dog.',
  'https://vnykzhub.com/blog/llm-atlas/attention-is-all-you-need',
  'Serilingampalle, Hyderabad, Telangana 500019',
  '{"user_id": 88213, "status": "active", "score": 0.9417}',
  'Rechtsschutzversicherungsgesellschaften',
  'def flash_attention(q, k, v, block_size=128):',
  'Antidisestablishmentarianism is a mouthful.',
  'Call +91 9460041703 before 14:30 on 2026-03-11.',
  'supercalifragilisticexpialidocious',
  'SELECT customer_id, SUM(revenue) FROM txns GROUP BY 1;',
  'Vinayak deployed the retrieval pipeline to Cloud Run.',
  'aaaaabbbbbcccccdddddeeeee',
  '🙂 is not in this tokenizer, but rare words are.',
  'The cat sat on the mat and looked at the other cat.',
]

export interface GolfPrompt {
  par: number
  text: string
}

export const GOLF: GolfPrompt[] = [
  {
    par: 24,
    text: 'I would really like it if you could please go ahead and provide me with a short summary of the following document, keeping it brief if at all possible.',
  },
  {
    par: 20,
    text: 'Please make absolutely sure that the answer that you give back to me is returned in the JSON format and nothing else at all besides that.',
  },
  {
    par: 26,
    text: 'You are a helpful assistant. Your job is to help the user by answering the questions that the user asks you, in a way that is helpful to the user.',
  },
]
