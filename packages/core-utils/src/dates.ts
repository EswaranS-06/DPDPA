// India Standard Time has no daylight saving, so fixed-offset arithmetic is exact.
const IST_OFFSET_MINUTES = 330
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const assertIsoDate = (value: string) => {
  if (!ISO_DATE.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new Error(`Expected a YYYY-MM-DD date, got "${value}"`)
  }
}

/** Calendar date (YYYY-MM-DD) of an instant, as seen in India. */
export const isoDate = (instant: Date): string =>
  new Date(instant.getTime() + IST_OFFSET_MINUTES * 60_000).toISOString().slice(0, 10)

export const addCalendarDays = (date: string, days: number): string => {
  assertIsoDate(date)
  const result = new Date(`${date}T00:00:00Z`)
  result.setUTCDate(result.getUTCDate() + days)
  return result.toISOString().slice(0, 10)
}

export const addHours = (instant: Date, hours: number): Date =>
  new Date(instant.getTime() + hours * 3_600_000)

/** "10 Jun 2027, 16:00 IST" */
export const formatIst = (instant: Date): string => {
  const shifted = new Date(instant.getTime() + IST_OFFSET_MINUTES * 60_000)
  const day = shifted.getUTCDate()
  const month = shifted.toLocaleString('en-GB', { month: 'short', timeZone: 'UTC' })
  const hh = String(shifted.getUTCHours()).padStart(2, '0')
  const mm = String(shifted.getUTCMinutes()).padStart(2, '0')
  return `${day} ${month} ${shifted.getUTCFullYear()}, ${hh}:${mm} IST`
}

/** "2027-05-13" -> "13 May 2027" */
export const formatDay = (date: string): string => {
  assertIsoDate(date)
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/** Whole calendar days from one ISO date to another (negative if "to" is earlier). */
export const daysBetween = (from: string, to: string): number => {
  assertIsoDate(from)
  assertIsoDate(to)
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export const isOnOrBefore = (date: string, reference: string): boolean => {
  assertIsoDate(date)
  assertIsoDate(reference)
  return date <= reference
}
