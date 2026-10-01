import { Chip } from '@duatf/core-ui'
import { CalendarClock, CircleCheck, CircleMinus } from 'lucide-react'
import { commencementOn } from './commencement'

type TimeStatusProps = { inForce: string | null; inForceUntil?: string | null; today: string }

const LOOK = {
  in_force: { tone: 'success', icon: CircleCheck },
  starts: { tone: 'info', icon: CalendarClock },
  stopped: { tone: 'neutral', icon: CircleMinus },
} as const

/** Whether an obligation applies today, the date it starts, or the date it stopped applying. */
export const TimeStatus = ({ inForce, inForceUntil = null, today }: TimeStatusProps) => {
  const status = commencementOn(inForce, inForceUntil, today)
  const look = LOOK[status.state]
  return (
    <Chip tone={look.tone} icon={look.icon} title={status.detail}>
      {status.label}
    </Chip>
  )
}
