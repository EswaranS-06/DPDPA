import { formatDay, formatIst } from '@duatf/core-utils'
import { Chip, type ChipTone } from '@duatf/core-ui'
import {
  CONTRACT_STATE_LABEL,
  RIGHTS_STATUS_LABEL,
  type BreachClock,
  type ClockState,
  type ContractState,
} from '@duatf/feature-compliance-api'
import type { BreachSeverity, BreachStatus, DpiaStatus, RightsStatus } from '@duatf/platform-db'
import {
  AlarmClock,
  AlarmClockCheck,
  BadgeCheck,
  CircleCheck,
  CircleDashed,
  CircleDot,
  CircleHelp,
  CircleSlash,
  CircleX,
  FileSignature,
  FileX,
  Hourglass,
  Minus,
  PencilLine,
  Undo2,
  type LucideIcon,
} from 'lucide-react'
import styles from './RegisterBits.module.css'

type Look = { tone: ChipTone; icon: LucideIcon }

const CONTRACT: Record<ContractState, Look> = {
  none: { tone: 'danger', icon: FileX },
  unknown: { tone: 'neutral', icon: CircleHelp },
  not_started: { tone: 'info', icon: Hourglass },
  in_force: { tone: 'success', icon: FileSignature },
  ending_soon: { tone: 'warning', icon: AlarmClock },
  ended: { tone: 'danger', icon: FileX },
}

export const ContractChip = ({ state }: { state: ContractState }) => (
  <Chip tone={CONTRACT[state].tone} icon={CONTRACT[state].icon}>
    {CONTRACT_STATE_LABEL[state]}
  </Chip>
)

const BREACH_STATUS: Record<BreachStatus, Look & { label: string }> = {
  open: { label: 'Open', tone: 'danger', icon: CircleDot },
  contained: { label: 'Contained', tone: 'warning', icon: CircleSlash },
  closed: { label: 'Closed', tone: 'neutral', icon: CircleCheck },
}

export const BreachStatusChip = ({ status }: { status: BreachStatus }) => (
  <Chip tone={BREACH_STATUS[status].tone} icon={BREACH_STATUS[status].icon}>
    {BREACH_STATUS[status].label}
  </Chip>
)

const SEVERITY_TONE: Record<BreachSeverity, ChipTone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
}

export const SeverityTag = ({ severity }: { severity: BreachSeverity }) => (
  <Chip tone={SEVERITY_TONE[severity]}>
    {severity.charAt(0).toUpperCase() + severity.slice(1)} severity
  </Chip>
)

const CLOCK: Record<ClockState, Look & { label: string }> = {
  done: { label: 'Done', tone: 'success', icon: AlarmClockCheck },
  done_late: { label: 'Done, late', tone: 'warning', icon: AlarmClockCheck },
  running: { label: 'To do', tone: 'info', icon: AlarmClock },
  overdue: { label: 'Overdue', tone: 'danger', icon: AlarmClock },
  not_needed: { label: 'Not needed', tone: 'neutral', icon: Minus },
}

const hours = (value: number) => {
  const whole = Math.abs(value)
  return whole >= 96
    ? `${Math.round(whole / 24)} days`
    : `${Math.round(whole * 10) / 10} ${whole === 1 ? 'hour' : 'hours'}`
}

/** What a clock says in a few words: "Overdue by 3 hours", "41 hours left", "Done after 2 hours". */
export const clockText = (clock: BreachClock): string => {
  if (clock.state === 'not_needed') return 'Not a cyber incident'
  if (clock.doneAt) return `${CLOCK[clock.state].label} after ${hours(clock.hoursTaken)}`
  if (clock.hoursLeft === null) return `Not yet, ${hours(clock.hoursTaken)} since aware`
  return clock.hoursLeft < 0
    ? `Overdue by ${hours(clock.hoursLeft)}`
    : `${hours(clock.hoursLeft)} left`
}

export const ClockChip = ({ clock }: { clock: BreachClock }) => (
  <Chip tone={CLOCK[clock.state].tone} icon={CLOCK[clock.state].icon}>
    {clockText(clock)}
  </Chip>
)

const CLOCK_SHORT: Record<BreachClock['key'], string> = {
  board_first: 'Board, first',
  board_detailed: 'Board, detailed',
  principals: 'Data Principals',
  cert_in: 'CERT-In',
}

/** The intimations still to be made, for a row of the register. */
export const PendingClocks = ({ clocks, closed }: { clocks: BreachClock[]; closed: boolean }) => {
  const pending = clocks.filter((clock) => clock.state === 'running' || clock.state === 'overdue')
  if (pending.length === 0) {
    return (
      <Chip tone="success" icon={BadgeCheck}>
        All intimations recorded
      </Chip>
    )
  }
  if (closed) {
    return (
      <span className={styles.muted}>
        Closed with {pending.length} {pending.length === 1 ? 'intimation' : 'intimations'} not made
      </span>
    )
  }
  return (
    <span className={styles.tags}>
      {pending.map((clock) => (
        <Chip key={clock.key} tone={CLOCK[clock.state].tone} icon={CLOCK[clock.state].icon}>
          {CLOCK_SHORT[clock.key]}: {clockText(clock).toLowerCase()}
        </Chip>
      ))}
    </span>
  )
}

/** The four intimations of a breach: what, under which provision, by when, and where it stands. */
export const ClockList = ({ clocks }: { clocks: BreachClock[] }) => (
  <ul className={styles.clocks}>
    {clocks.map((clock) => (
      <li key={clock.key}>
        <span className={styles.clockText}>
          <strong>{clock.label}</strong>
          <span className={styles.muted}>{clock.basis}</span>
          <span className={styles.muted}>
            {clock.doneAt
              ? `Recorded for ${formatIst(clock.doneAt)}`
              : clock.deadline
                ? `By ${formatIst(clock.deadline)}`
                : clock.state === 'not_needed'
                  ? ''
                  : 'No fixed hour: as soon as possible'}
          </span>
        </span>
        <ClockChip clock={clock} />
      </li>
    ))}
  </ul>
)

const RIGHTS: Record<RightsStatus, Look> = {
  received: { tone: 'info', icon: CircleDashed },
  in_progress: { tone: 'info', icon: CircleDot },
  fulfilled: { tone: 'success', icon: BadgeCheck },
  refused: { tone: 'danger', icon: CircleX },
  withdrawn: { tone: 'neutral', icon: Undo2 },
}

export const RightsStatusChip = ({ status }: { status: RightsStatus }) => (
  <Chip tone={RIGHTS[status].tone} icon={RIGHTS[status].icon}>
    {RIGHTS_STATUS_LABEL[status]}
  </Chip>
)

/** When an open request is due: "Overdue since 3 October 2026" or "Due 12 November 2026, in 30 days". */
export const DueChip = ({
  dueOn,
  daysLeft,
  overdue,
}: {
  dueOn: string
  daysLeft: number | null
  overdue: boolean
}) =>
  daysLeft === null ? null : (
    <Chip tone={overdue ? 'danger' : daysLeft <= 7 ? 'warning' : 'neutral'} icon={AlarmClock}>
      {overdue
        ? `Overdue since ${formatDay(dueOn)}`
        : `Due ${formatDay(dueOn)}, in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}`}
    </Chip>
  )

const DPIA: Record<DpiaStatus, Look & { label: string }> = {
  draft: { label: 'Draft', tone: 'info', icon: PencilLine },
  completed: { label: 'Completed', tone: 'success', icon: BadgeCheck },
}

export const DpiaStatusChip = ({ status }: { status: DpiaStatus }) => (
  <Chip tone={DPIA[status].tone} icon={DPIA[status].icon}>
    {DPIA[status].label}
  </Chip>
)
