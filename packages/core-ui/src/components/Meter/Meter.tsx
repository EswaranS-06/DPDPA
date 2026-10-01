import { CircleAlert, CircleCheck, CircleDashed, CircleX, type LucideIcon } from 'lucide-react'
import styles from './Meter.module.css'

export type MeterBand = 'good' | 'fair' | 'poor' | 'none'

/** The bands used wherever a compliance percentage is coloured: 80 and 50 are the cut-offs. */
export const meterBand = (value: number | null | undefined): MeterBand =>
  value === null || value === undefined
    ? 'none'
    : value >= 80
      ? 'good'
      : value >= 50
        ? 'fair'
        : 'poor'

export const METER_BAND: Record<MeterBand, { label: string; icon: LucideIcon }> = {
  good: { label: '80% or more', icon: CircleCheck },
  fair: { label: '50 to 79%', icon: CircleAlert },
  poor: { label: 'Under 50%', icon: CircleX },
  none: { label: 'Not answered yet', icon: CircleDashed },
}

type MeterProps = {
  /** 0 to 100, or null when nothing is answered yet. */
  value: number | null | undefined
  /** What is measured, for screen readers: "Consent". */
  label: string
  /** Show the percentage and its band icon after the bar. */
  showValue?: boolean
}

/** A single percentage as a bar whose fill carries its band; the value is always written too. */
export const Meter = ({ value, label, showValue = true }: MeterProps) => {
  const band = meterBand(value)
  const Icon = METER_BAND[band].icon
  const shown = value === null || value === undefined ? '—' : `${Math.round(value)}%`
  return (
    <div className={styles.meter}>
      <div
        className={`${styles.track} ${styles[band]}`}
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null || value === undefined ? 'Not answered yet' : shown}
      >
        {value !== null && value !== undefined && value > 0 ? (
          <span className={styles.fill} style={{ width: `${Math.min(value, 100)}%` }} />
        ) : null}
      </div>
      {showValue ? (
        <span className={`${styles.value} ${styles[`${band}Text`]}`}>
          <Icon size={14} strokeWidth={2.25} aria-hidden="true" />
          {shown}
        </span>
      ) : null}
    </div>
  )
}
