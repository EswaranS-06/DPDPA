import { formatDay } from '@duatf/core-utils'
import { Chip } from '@duatf/core-ui'

type TimeStatusProps = { inForce: string | null; inForceUntil?: string | null; today: string }

/** Whether an obligation applies today, the date it starts, or the date it stopped applying. */
export const TimeStatus = ({ inForce, inForceUntil = null, today }: TimeStatusProps) => {
  if (inForceUntil !== null && inForceUntil <= today) {
    return <Chip>Stopped applying {formatDay(inForceUntil)}</Chip>
  }
  if (inForce === null || inForce <= today) {
    const until = inForceUntil ? `, stops applying ${formatDay(inForceUntil)}` : ''
    return (
      <Chip
        tone="live"
        title={inForce ? `In force since ${formatDay(inForce)}${until}` : `In force${until}`}
      >
        {inForceUntil ? `In force until ${formatDay(inForceUntil)}` : 'In force'}
      </Chip>
    )
  }
  return <Chip tone="pending">Starts {formatDay(inForce)}</Chip>
}
