import { daysBetween, formatDay } from '@duatf/core-utils'

export type Commencement =
  | { state: 'in_force'; label: string; detail: string }
  | { state: 'starts'; label: string; detail: string; days: number }
  | { state: 'stopped'; label: string; detail: string }

/**
 * Where a provision stands on a given day: in force (since when, and until when if it ends),
 * starting on a later date (and in how many days), or no longer applying.
 */
export const commencementOn = (
  inForce: string | null,
  inForceUntil: string | null,
  today: string,
): Commencement => {
  if (inForceUntil !== null && inForceUntil <= today) {
    return {
      state: 'stopped',
      label: `Stopped applying ${formatDay(inForceUntil)}`,
      detail: `No longer applies from ${formatDay(inForceUntil)}`,
    }
  }
  if (inForce === null || inForce <= today) {
    const until = inForceUntil ? `, stops applying ${formatDay(inForceUntil)}` : ''
    return {
      state: 'in_force',
      label: inForceUntil ? `In force until ${formatDay(inForceUntil)}` : 'In force',
      detail: inForce ? `In force since ${formatDay(inForce)}${until}` : `In force${until}`,
    }
  }
  const days = daysBetween(today, inForce)
  return {
    state: 'starts',
    label: `Starts ${formatDay(inForce)}, ${days === 1 ? 'tomorrow' : `in ${days} days`}`,
    detail: `Commences ${formatDay(inForce)}`,
    days,
  }
}
