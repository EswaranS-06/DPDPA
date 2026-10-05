import { describeResponse, type ItemRow } from '@duatf/feature-compliance-api'
import Link from 'next/link'
import { ComplianceChip, ReviewChip } from './AssessmentBits'
import styles from './QuestionList.module.css'

type Group = { code: string; title: string }

/**
 * A department's questions, grouped by questionnaire and section in question order: what was
 * answered, what it means, and whether the answer has been checked.
 */
export const QuestionList = ({
  items,
  questionnaires,
  hrefFor,
}: {
  items: ItemRow[]
  questionnaires: Group[]
  hrefFor: (item: ItemRow) => string
}) => {
  const order = questionnaires.map((group) => group.code)
  const groups = [...new Set(items.map((item) => item.questionnaireCode))].sort(
    (a, b) => order.indexOf(a) - order.indexOf(b),
  )
  return (
    <div className={styles.list}>
      {groups.map((code) => {
        const own = items.filter((item) => item.questionnaireCode === code)
        const sections = [...new Set(own.map((item) => item.section))]
        const title = questionnaires.find((group) => group.code === code)?.title ?? code
        return (
          <section key={code} className={styles.group} aria-label={title}>
            <h3 className={styles.groupTitle}>
              <span className="code">{code}</span> {title}
              <span className={styles.groupCount}>
                {own.filter((item) => item.answer !== 'not_assessed').length} of {own.length}{' '}
                answered
              </span>
            </h3>
            {sections.map((section) => (
              <div key={section} className={styles.section}>
                <h4 className={styles.sectionTitle}>{section}</h4>
                <ul className={styles.rows}>
                  {own
                    .filter((item) => item.section === section)
                    .map((item) => (
                      <li key={item.id} className={styles.row}>
                        <span className={styles.main}>
                          <Link href={hrefFor(item)} className={styles.link}>
                            <span className="code">{item.questionCode}</span> {item.title}
                          </Link>
                          <span className={styles.response}>
                            {item.answer === 'not_assessed'
                              ? 'Not answered yet'
                              : describeResponse(item, item)}
                            {item.autoNaFrom ? ` (from ${item.autoNaFrom})` : ''}
                            {item.assigneeName ? `. Given to ${item.assigneeName}` : ''}
                          </span>
                        </span>
                        <span className={styles.chips}>
                          <ComplianceChip state={item.complianceState} />
                          <ReviewChip review={item.reviewState} />
                        </span>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
