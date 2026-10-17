import type { GapType } from '@duatf/platform-db'
import type { Band } from './risks'

// Roadmap phases (ADR-0009): now, next or later, and the phase a finding's risk rating suggests.
// Kept apart from the roadmap so the action service can use it without importing the roadmap.

export const ROADMAP_PHASES = [1, 2, 3] as const
export type RoadmapPhase = (typeof ROADMAP_PHASES)[number]

export const PHASE_INFO: Record<RoadmapPhase, { label: string; window: string }> = {
  1: { label: 'Now', window: 'within 3 months' },
  2: { label: 'Next', window: '3 to 6 months' },
  3: { label: 'Later', window: '6 to 12 months' },
}

export const isRoadmapPhase = (value: number | null | undefined): value is RoadmapPhase =>
  value === 1 || value === 2 || value === 3

/**
 * The phase a finding's risk suggests. A score in a severe band (High and Critical by default) is
 * now; a score in the band just below the severe ones is next; anything lower is later. With no
 * rated risk, a gap is next and a potential gap later.
 */
export const suggestedPhase = (
  score: number | null,
  bands: readonly Band[],
  gapType: GapType,
): RoadmapPhase => {
  if (score === null) return gapType === 'gap' ? 2 : 3
  const descending = [...bands].sort((a, b) => b.minScore - a.minScore)
  const severe = descending.filter((band) => band.tone === 'severe')
  const top = severe.length ? severe : descending.slice(0, 1)
  const band = descending.find((item) => score >= item.minScore && score <= item.maxScore)
  if (!band) return 3
  if (top.some((item) => item.name === band.name)) return 1
  const next = descending.find((item) => !top.some((other) => other.name === item.name))
  return next?.name === band.name ? 2 : 3
}
