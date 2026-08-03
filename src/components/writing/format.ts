/**
 * Small formatting helpers shared by the article chrome and the cards.
 *
 * Kept out of Article.tsx so that listing pages can use them without pulling
 * in KaTeX, Prism and the canvas figures through that module's imports.
 */

/** Source titles carry their own "3. " prefix; split it out for the margin marker. */
export function splitTitle(title: string): { num?: string; text: string } {
  const match = title.match(/^(\d+)\.\s+(.*)$/)
  return match ? { num: match[1], text: match[2] } : { text: title }
}

/** ISO date (YYYY-MM-DD) → "2 August 2026", pinned to UTC so it never shifts. */
export const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

export const pad = (n: number) => String(n).padStart(2, '0')
