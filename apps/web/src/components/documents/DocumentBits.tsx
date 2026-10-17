import { formatDay, isoDate } from '@duatf/core-utils'
import { Chip } from '@duatf/core-ui'
import { CircleAlert, CircleCheck, Scale, TriangleAlert } from 'lucide-react'
import styles from './DocumentBits.module.css'

type Review = { reviewed: boolean; reviewedAt: Date | null; reviewerName: string | null }

/** Whether the current version of a template has had legal review. */
export const ReviewChip = ({ review }: { review: Review }) =>
  review.reviewed ? (
    <Chip tone="success" icon={Scale}>
      Reviewed{review.reviewedAt ? ` ${formatDay(isoDate(review.reviewedAt))}` : ''}
    </Chip>
  ) : (
    <Chip tone="neutral" icon={Scale}>
      Awaiting legal review
    </Chip>
  )

type Check = { id: string; level: 'block' | 'warn'; message: string; templateId?: string }

/** The library's release checks: a block stops the release download, a warning is to look at. */
export const CheckList = ({ checks }: { checks: Check[] }) =>
  checks.length ? (
    <ul className={styles.checks}>
      {checks.map((check, index) => (
        <li
          key={`${check.id}-${index}`}
          className={check.level === 'block' ? styles.block : styles.warn}
        >
          {check.level === 'block' ? (
            <CircleAlert size={16} aria-hidden="true" />
          ) : (
            <TriangleAlert size={16} aria-hidden="true" />
          )}
          <span>
            <strong>{check.level === 'block' ? 'Fix' : 'Check'}</strong>{' '}
            <span className="code">{check.id}</span> {check.message}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className={styles.ok}>
      <CircleCheck size={16} aria-hidden="true" /> No check is open.
    </p>
  )
