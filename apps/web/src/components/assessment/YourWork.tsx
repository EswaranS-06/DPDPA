import { formatDay } from '@duatf/core-utils'
import { Chip, Panel } from '@duatf/core-ui'
import type { MyWork } from '@duatf/feature-compliance-api'
import Link from 'next/link'
import { ComplianceChip } from './AssessmentBits'
import styles from './QuestionList.module.css'

/**
 * What is given to the signed-in person at a client: questions, evidence requests, actions
 * and controls. Shown only when there is something.
 */
export const YourWork = ({ work, clientCode }: { work: MyWork; clientCode: string }) => {
  const total =
    work.items.length + work.requests.length + work.actions.length + work.controls.length
  if (total === 0) return null
  const base = `/clients/${clientCode}`
  return (
    <Panel title="Your work" titleId="your-work-title">
      <div className={styles.list}>
        {work.requests.length ? (
          <section aria-label="Evidence asked of you">
            <h3 className={styles.sectionTitle}>Evidence asked of you ({work.requests.length})</h3>
            <ul className={styles.rows}>
              {work.requests.map((row) => (
                <li key={row.id} className={styles.row}>
                  <span className={styles.main}>
                    <Link
                      href={`${base}/assessments/${row.assessmentCode}/items/${row.departmentCode ?? '-'}/${row.questionCode}`}
                      className={styles.link}
                    >
                      {row.title}
                    </Link>
                    <span className={styles.response}>
                      <span className="code">{row.questionCode}</span>, {row.departmentName}
                      {row.dueDate ? `, by ${formatDay(row.dueDate)}` : ''}
                    </span>
                  </span>
                  <span className={styles.chips}>
                    <Chip
                      tone={
                        row.overdue ? 'danger' : row.status === 'received' ? 'pending' : 'warning'
                      }
                    >
                      {row.overdue
                        ? 'Overdue'
                        : row.status === 'received'
                          ? 'Received, to review'
                          : 'Requested'}
                    </Chip>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {work.items.length ? (
          <section aria-label="Questions given to you">
            <h3 className={styles.sectionTitle}>Questions given to you ({work.items.length})</h3>
            <ul className={styles.rows}>
              {work.items.map((row) => (
                <li key={row.id} className={styles.row}>
                  <span className={styles.main}>
                    <Link
                      href={`${base}/assessments/${row.assessmentCode}/items/${row.departmentCode ?? '-'}/${row.questionCode}`}
                      className={styles.link}
                    >
                      <span className="code">{row.questionCode}</span> {row.title}
                    </Link>
                    <span className={styles.response}>{row.departmentName}</span>
                  </span>
                  <span className={styles.chips}>
                    <ComplianceChip state={row.complianceState} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {work.actions.length ? (
          <section aria-label="Actions you own">
            <h3 className={styles.sectionTitle}>Actions you own ({work.actions.length})</h3>
            <ul className={styles.rows}>
              {work.actions.map((row) => (
                <li key={row.code} className={styles.row}>
                  <span className={styles.main}>
                    <Link href={`${base}/actions/${row.code}`} className={styles.link}>
                      {row.title}
                    </Link>
                    <span className={styles.response}>
                      <span className="code">{row.code}</span>
                      {row.dueDate ? `, due ${formatDay(row.dueDate)}` : ''}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        {work.controls.length ? (
          <section aria-label="Controls you own">
            <h3 className={styles.sectionTitle}>Controls you own ({work.controls.length})</h3>
            <p className={styles.response}>
              {work.controls.map((row) => row.code).join(', ')}.{' '}
              <Link href={`${base}/controls`}>See control owners</Link>
            </p>
          </section>
        ) : null}
      </div>
    </Panel>
  )
}
