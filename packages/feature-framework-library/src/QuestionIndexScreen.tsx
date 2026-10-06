import { Chip, Citation, EmptyState, MarginRow, PageHeader } from '@duatf/core-ui'
import {
  KB_PATH,
  kbHref,
  type FrameworkLibraryApi,
  type QuestionListItem,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ANSWER_TYPE_LABEL, RiskLevelChip } from './components/QuestionBits'
import styles from './screens.module.css'

export type QuestionSearchParams = { domain?: string; text?: string; questionnaire?: string }

type Props = { api: FrameworkLibraryApi; params: QuestionSearchParams }

const QuestionRow = ({ item }: { item: QuestionListItem }) => (
  <MarginRow as="li" margin={<Citation strong>{item.code}</Citation>}>
    <Link href={kbHref('questions', item.code)} className={styles.questionText}>
      {item.title}
    </Link>
    <p className={`${styles.flush} ${styles.muted}`}>{item.text}</p>
    <div className={styles.chips}>
      <Chip>{ANSWER_TYPE_LABEL[item.answerType]}</Chip>
      <RiskLevelChip level={item.riskLevel} />
      {item.scored ? null : <Chip>Recorded, not scored</Chip>}
      {item.applicability.always ? null : <Chip tone="warning">Conditional</Chip>}
      {item.controlCodes.map((code) => (
        <Chip key={code}>
          <Link href={kbHref('controls', code)}>{code}</Link>
        </Chip>
      ))}
    </div>
  </MarginRow>
)

/** The ComplyX question templates, by questionnaire and section, with their KB mapping. */
export const QuestionIndexScreen = async ({ api, params }: Props) => {
  const [domains, questionnaires, questions] = await Promise.all([
    api.domains(),
    api.questionnaires(),
    api.questions({
      domain: params.domain || undefined,
      text: params.text?.trim() || undefined,
      questionnaire: params.questionnaire || undefined,
    }),
  ])
  const filtering = Boolean(params.domain || params.text || params.questionnaire)
  const drafts = questions.filter((item) => item.reviewStatus === 'draft').length

  return (
    <div className={styles.page}>
      <PageHeader
        title="Question bank"
        lede="The ComplyX templates: the Data Fiduciary questions for the organisation, the internal handler module for each department and the external handler questionnaire for each vendor. Questions are answered Yes, Partial or No, on a maturity scale from 0 to 4, or record a fact. Each maps to obligations (the law and its penalty) and controls (how to test it and the evidence)."
      >
        {drafts > 0 ? (
          <Chip tone="warning">{drafts} with KB mapping awaiting legal review</Chip>
        ) : (
          <Chip tone="success">Reviewed</Chip>
        )}
      </PageHeader>

      <form method="get" action={KB_PATH} className={styles.filters}>
        <input type="hidden" name="section" value="questions" />
        <label className={styles.field}>
          Questionnaire
          <select name="questionnaire" defaultValue={params.questionnaire ?? ''}>
            <option value="">All questionnaires</option>
            {questionnaires.map((group) => (
              <option key={group.code} value={group.code}>
                {group.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Domain
          <select name="domain" defaultValue={params.domain ?? ''}>
            <option value="">All domains</option>
            {domains.map((domain) => (
              <option key={domain.code} value={domain.code}>
                {domain.code} {domain.title}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Words or code
          <input
            name="text"
            type="search"
            defaultValue={params.text ?? ''}
            placeholder="breach, C1.5"
          />
        </label>
        <button type="submit" className={styles.button}>
          Filter
        </button>
        {filtering ? (
          <Link href={kbHref('questions')} className={styles.linkButton}>
            Clear
          </Link>
        ) : null}
      </form>

      <p className={styles.resultCount} role="status">
        {questions.length} question{questions.length === 1 ? '' : 's'}
      </p>

      {questions.length === 0 ? (
        <EmptyState title="No question matches these filters." />
      ) : (
        questionnaires
          .map((group) => ({
            group,
            items: questions.filter((item) => item.questionnaireCode === group.code),
          }))
          .filter((entry) => entry.items.length > 0)
          .map(({ group, items }) => (
            <section
              key={group.code}
              className={styles.section}
              aria-labelledby={`q-${group.code}`}
            >
              <h2 id={`q-${group.code}`} className={styles.sectionTitle}>
                {group.title}
              </h2>
              <p className={`${styles.flush} ${styles.muted}`}>{group.description}</p>
              {[...new Set(items.map((item) => item.section))].map((section) => (
                <div key={section}>
                  <h3 className={styles.subTitle}>{section}</h3>
                  <ul className={styles.plainList}>
                    {items
                      .filter((item) => item.section === section)
                      .map((item) => (
                        <QuestionRow key={item.code} item={item} />
                      ))}
                  </ul>
                </div>
              ))}
            </section>
          ))
      )}
    </div>
  )
}
