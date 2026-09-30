import { formatDay } from '@duatf/core-utils'
import { Chip } from '@duatf/core-ui'

type TimeStatusProps = { inForce: string | null; today: string }

/** Whether an obligation applies today, or the date it starts. */
export const TimeStatus = ({ inForce, today }: TimeStatusProps) => {
  if (inForce === null || inForce <= today) {
    return (
      <Chip tone="live" title={inForce ? `In force since ${formatDay(inForce)}` : 'In force'}>
        In force
      </Chip>
    )
  }
  return <Chip tone="pending">Starts {formatDay(inForce)}</Chip>
}
