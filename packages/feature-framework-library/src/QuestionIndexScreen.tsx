import { Chip, Citation, EmptyState, MarginRow, PageHeader } from '@duatf/core-ui'
import {
  KB_PATH,
  kbHref,
  type FrameworkLibraryApi,
  type QuestionListItem,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ImpactChip } from './components/ImpactChip'
import styles from './screens.module.css'

export type QuestionSearchParams = { domain?: string; text?: string }

type Props = { api: FrameworkLibraryApi; params: QuestionSearchParams }

const QuestionRow = ({ item }: { item: QuestionListItem }) => (
  <MarginRow as="li" margin={<Citation strong>{item.code}</Citation>}>
    <Link href={kbHref('questions', item.code)} className={styles.questionText}>
      {item.text}
    </Link>
    <div className={styles.chips}>
      <ImpactChip weight={item.riskWeight} />
      {item.applicability.always ? null : <Chip tone="pending">Conditional</Chip>}
      <Chip>
        <Link href={kbHref('controls', item.controlCode)}>{item.controlCode}</Link>
      </Chip>
    </div>
  </MarginRow>
)

export const QuestionIndexScreen = async ({ api, params }: Props) => {
  const [domains, questions] = await Promise.all([
    api.domains(),
    api.questions({
      domain: params.domain || undefined,
      text: params.text?.trim() || undefined,
    }),
  ])
  const filtering = Boolean(params.domain || params.text)
  const groups = domains
    .map((domain) => ({
      domain,
      items: questions.filter((item) => item.domainCode === domain.code),
    }))
    .filter((group) => group.items.length > 0)
  const drafts = questions.filter((item) => item.reviewStatus === 'draft').length

  return (
    <div className={styles.page}>
      <PageHeader
        title="Question bank"
        lede="One question per control. Each is answered Yes, Partial, No or Not applicable; No and Partial answers raise findings with the recommendation shown on the question."
      >
        {drafts > 0 ? (
          <Chip tone="pending">{drafts} awaiting legal review</Chip>
        ) : (
          <Chip tone="live">Reviewed</Chip>
        )}
      </PageHeader>

      <form method="get" action={KB_PATH} className={styles.filters}>
        <input type="hidden" name="section" value="questions" />
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
            placeholder="breach, Q-CON-02"
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

      {groups.length === 0 ? (
        <EmptyState title="No question matches these filters." />
      ) : (
        groups.map((group) => (
          <section
            key={group.domain.code}
            className={styles.section}
            aria-labelledby={`q-${group.domain.code}`}
          >
            <h2 id={`q-${group.domain.code}`} className={styles.sectionTitle}>
              <Link href={kbHref('domains', group.domain.code)} className={styles.indexTitle}>
                {group.domain.code} {group.domain.title}
              </Link>
            </h2>
            <ul className={styles.plainList}>
              {group.items.map((item) => (
                <QuestionRow key={item.code} item={item} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
