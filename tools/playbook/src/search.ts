import { groupTitle } from './catalog.ts'
import type { Tour } from './types.ts'

const words = (text: string): string[] =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)

const fieldsOf = (tour: Tour) => ({
  title: words(tour.title),
  keywords: words(tour.keywords.join(' ')),
  other: words(
    [
      tour.summary,
      groupTitle(tour.group),
      ...tour.who,
      ...tour.steps.map((step) => step.title),
    ].join(' '),
  ),
})

/** A query word matches a word that starts with it ("upload" finds "uploading", "evid" finds "evidence"). */
const hits = (term: string, list: string[]) => list.some((word) => word.startsWith(term))

/**
 * The tours matching a query, best first. Every query word must appear somewhere; a word in the
 * title counts most, then the keywords, then the summary, group, roles and step titles.
 */
export const searchTours = (query: string, tours: readonly Tour[]): Tour[] => {
  const terms = words(query)
  if (terms.length === 0) return [...tours]
  const scored = tours
    .map((tour, order) => {
      const fields = fieldsOf(tour)
      let score = 0
      for (const term of terms) {
        const inTitle = hits(term, fields.title)
        const inKeywords = hits(term, fields.keywords)
        const inOther = hits(term, fields.other)
        if (!inTitle && !inKeywords && !inOther) return null
        score += inTitle ? 3 : inKeywords ? 2 : 1
      }
      return { tour, score, order }
    })
    .filter((row): row is { tour: Tour; score: number; order: number } => row !== null)
  return scored.sort((a, b) => b.score - a.score || a.order - b.order).map((row) => row.tour)
}
