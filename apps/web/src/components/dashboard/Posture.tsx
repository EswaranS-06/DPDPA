import { Disclosure } from '@duatf/core-ui'
import { explainCompliance, type Progress } from '@duatf/feature-compliance-api'
import { Calculator } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { Legend, ProgressBar } from '@/components/assessment/AssessmentBits'
import styles from './Posture.module.css'

export type TrendPoint = { code: string; label: string; value: number | null; current: boolean }

type PostureProps = {
  progress: Progress
  /** The assessment the figure comes from. */
  source: { code: string; title: string; href: string; status: ReactNode; release?: string }
  trend: TrendPoint[]
  /** What the figure does not say: phased commencement, not a legal opinion. */
  caveat?: ReactNode
}

const one = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(1))

/** The arithmetic behind the figure, with this assessment's own numbers. */
export const Calculation = ({ progress }: { progress: Progress }) => {
  const working = explainCompliance(progress)
  return (
    <div className={styles.calculation}>
      <p className={styles.formula}>
        Compliance posture = (Yes + ½ × Partial) ÷ (Yes + Partial + No)
      </p>
      {working.scored ? (
        <p className={styles.formula}>
          = ({working.yes} + ½ × {working.partial}) ÷ ({working.yes} + {working.partial} +{' '}
          {working.no}) = {one(working.points)} ÷ {working.scored} = <strong>{working.pct}%</strong>
        </p>
      ) : (
        <p className={styles.formula}>
          No question in scope is answered yet, so there is no figure.
        </p>
      )}
      <ul className={styles.leftOut}>
        <li>
          {working.notApplicable} answered Not applicable are left out of the score; each needs a
          recorded reason.
        </li>
        <li>
          {working.notAnswered} not answered yet are not counted until they are answered, so the
          figure can move either way.
        </li>
        <li>
          A Partial counts half because the control exists but is not complete or not evidenced.
        </li>
      </ul>
    </div>
  )
}

/** Posture by assessment as a small line, one point per cycle. */
const Trend = ({ points }: { points: TrendPoint[] }) => {
  const shown = points.filter((point) => point.value !== null)
  if (shown.length < 2) return null
  const width = 100
  const x = (index: number) => (shown.length === 1 ? 50 : (index / (shown.length - 1)) * width)
  const y = (value: number) => 100 - value
  const line = shown.map((point, index) => `${x(index)},${y(point.value ?? 0)}`).join(' ')
  const first = shown[0]
  const last = shown.at(-1)
  return (
    <figure className={styles.trend}>
      <figcaption className={styles.trendTitle}>Posture by assessment</figcaption>
      <div className={styles.trendChart}>
        <svg
          viewBox="-4 -6 108 112"
          preserveAspectRatio="none"
          role="img"
          aria-label={shown
            .map(
              (point) =>
                `${point.label} ${point.value}%${point.current ? ' so far, in progress' : ''}`,
            )
            .join('; ')}
        >
          <line className={styles.grid} x1="0" x2="100" y1="50" y2="50" />
          <polyline className={styles.trendLine} points={line} vectorEffect="non-scaling-stroke" />
        </svg>
        {shown.map((point, index) => (
          <span
            key={point.code}
            className={point.current ? `${styles.point} ${styles.currentPoint}` : styles.point}
            style={{
              left: `${(x(index) + 4) / 1.08}%`,
              top: `${(y(point.value ?? 0) + 6) / 1.12}%`,
            }}
            title={`${point.label}: ${point.value}%`}
          />
        ))}
      </div>
      <div className={styles.trendLabels} aria-hidden="true">
        <span>
          {first?.label} <strong>{first?.value}%</strong>
        </span>
        <span>
          {last?.label} <strong>{last?.value}%</strong>
          {last?.current ? ' so far' : ''}
        </span>
      </div>
    </figure>
  )
}

/**
 * The client's compliance posture: one figure, how it was calculated, what it covers and how it
 * moved across assessments. Never shown as a verdict: it measures answers, not legal compliance.
 */
export const Posture = ({ progress, source, trend, caveat }: PostureProps) => (
  <section className={styles.posture} aria-labelledby="posture-title">
    <div className={styles.main}>
      <div className={styles.figureBlock}>
        <h2 id="posture-title" className={styles.label}>
          Compliance posture
        </h2>
        <p className={styles.hero}>
          {progress.compliancePct === null ? '—' : `${progress.compliancePct}%`}
        </p>
        <p className={styles.basis}>
          <span>
            {progress.answered} of {progress.total} questions answered in{' '}
            <Link href={source.href} className="code">
              {source.code}
            </Link>
          </span>
          {source.status}
        </p>
      </div>
      <Trend points={trend} />
    </div>
    <div className={styles.breakdown}>
      <ProgressBar progress={progress} label="Questions by outcome" size="large" />
      <Legend progress={progress} />
    </div>
    <Disclosure summary="How this figure is calculated" icon={Calculator}>
      <Calculation progress={progress} />
      <p className={styles.note}>
        It measures the answers to {source.title} against ComplyX&apos;s question bank
        {source.release ? ` (knowledge base release ${source.release})` : ''}. It is not a legal
        opinion that the organisation complies with the DPDP Act, 2023 or the DPDP Rules, 2025.
      </p>
    </Disclosure>
    {caveat ? <p className={styles.caveat}>{caveat}</p> : null}
  </section>
)
