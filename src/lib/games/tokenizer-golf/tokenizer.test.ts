import { describe, it, expect } from 'vitest'
import { tokenize, count } from './tokenizer'
import { GOLF } from './data'

describe('tokenize — bpe', () => {
  it('chunks digits in groups of three', () => {
    expect(tokenize('123456789', 'bpe')).toEqual(['123', '456', '789'])
  })
  it('binds a leading space to the following word', () => {
    expect(tokenize(' foo', 'bpe')).toEqual([' foo'])
  })
  it('keeps short words whole', () => {
    expect(tokenize('the cat sat', 'bpe')).toEqual(['the', ' cat', ' sat'])
  })
  it('shatters URLs into many tokens', () => {
    expect(count('https://vnykzhub.com/blog', 'bpe')).toBe(11)
  })
  it('shatters rare long words', () => {
    expect(count('supercalifragilisticexpialidocious', 'bpe')).toBeGreaterThanOrEqual(5)
  })
})

describe('tokenize — sentencepiece', () => {
  it('chunks digits one at a time', () => {
    expect(tokenize('123456789', 'sp')).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9'])
  })
  it('marks word starts with ▁', () => {
    expect(tokenize(' foo', 'sp')).toEqual(['▁foo'])
    expect(tokenize('the', 'sp')).toEqual(['▁the'])
  })
})

describe('golf data', () => {
  it('every original prompt is at or over par (par is beatable)', () => {
    for (const g of GOLF) {
      expect(count(g.text, 'bpe')).toBeGreaterThanOrEqual(g.par)
    }
  })
})

describe('determinism', () => {
  it('returns identical tokens for identical input', () => {
    const text = 'Vinayak deployed the retrieval pipeline to Cloud Run.'
    expect(tokenize(text, 'bpe')).toEqual(tokenize(text, 'bpe'))
    expect(tokenize(text, 'sp')).toEqual(tokenize(text, 'sp'))
  })
})
