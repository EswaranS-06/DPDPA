import type { LibrarySummary } from '@duatf/feature-framework-library-api'
import { daysBetween, formatDay } from '@duatf/core-utils'

export type LadderStep = {
  date: string
  label: string
  added: number
  cumulative: number
  /** Position along the time axis, 0-100. */
  position: number
  detail: string
}

export type Ladder = {
  today: string
  total: number
  liveToday: number
  steps: LadderStep[]
  headline: string
  upcoming: string | null
  countdown: string | null
}

const describeDomains = (count: number, domains: { title: string; count: number }[]) =>
  domains.length === 1
    ? `${count} more: ${domains[0]?.title ?? ''}`
    : `${count} more across ${domains.length} domains`

/** Turns commencement milestones into a dated, cumulative step ladder starting today. */
export const buildLadder = (summary: LibrarySummary, today: string): Ladder => {
  const total = summary.counts.obligations
  const liveToday = summary.milestones
    .filter((milestone) => milestone.date === null || milestone.date <= today)
    .reduce((sum, milestone) => sum + milestone.count, 0)
  const future = summary.milestones
    .filter((milestone): milestone is typeof milestone & { date: string } =>
      Boolean(milestone.date && milestone.date > today),
    )
    .sort((a, b) => a.date.localeCompare(b.date))

  const lastDate = future.at(-1)?.date ?? today
  const span = Math.max(daysBetween(today, lastDate), 1) * 1.08
  let cumulative = liveToday
  const steps: LadderStep[] = [
    {
      date: today,
      label: 'Today',
      added: liveToday,
      cumulative: liveToday,
      position: 0,
      detail: `${liveToday} in force`,
    },
    ...future.map((milestone) => {
      cumulative += milestone.count
      return {
        date: milestone.date,
        label: formatDay(milestone.date),
        added: milestone.count,
        cumulative,
        position: (daysBetween(today, milestone.date) / span) * 100,
        detail: describeDomains(milestone.count, milestone.domains),
      }
    }),
  ]

  const upcoming = future.map((milestone, index) => {
    const isLast = index === future.length - 1 && future.length > 1
    return `${isLast ? 'the remaining ' : ''}${milestone.count} ${index === 0 ? 'start ' : ''}on ${formatDay(milestone.date)}`
  })
  const headline = `${liveToday} of ${total} obligations apply today.`

  const final = future.at(-1)
  const countdown = final ? `${daysBetween(today, final.date)} days to go.` : null

  return {
    today,
    total,
    liveToday,
    steps,
    headline,
    upcoming: upcoming.length ? `${capitalise(joinAnd(upcoming))}.` : null,
    countdown,
  }
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const joinAnd = (items: string[]) =>
  items.length <= 1 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
