import { Chip, Citation, MarginRow, PageHeader } from '@duatf/core-ui'
import {
  describeApplicability,
  kbHref,
  type FrameworkLibraryApi,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ImpactChip } from './components/ImpactChip'
import { ObligationRow } from './components/ObligationRow'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

const ANSWERS = [
  { answer: 'Yes', outcome: 'Compliant, once the required evidence is accepted.' },
  { answer: 'Partial', outcome: 'Potential gap: a finding is raised for review.' },
  { answer: 'No', outcome: 'Gap: a finding is raised with the recommendation below.' },
  { answer: 'Not applicable', outcome: 'Excluded from the score; a reason is required.' },
]

const EvidenceList = ({ items, empty }: { items: string[]; empty: string }) =>
  items.length ? (
    <ul className={`${styles.bullets} ${styles.flush}`}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className={`${styles.flush} ${styles.muted}`}>{empty}</p>
  )

export const QuestionScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.question({ code }))
  return (
    <div className={styles.page}>
      <PageHeader
        kicker={<Citation>{item.code}</Citation>}
        title={item.text}
        lede={describeApplicability(item.applicability)}
      >
        <ImpactChip weight={item.riskWeight} />
        {item.reviewStatus === 'draft' ? (
          <Chip tone="warning">Draft wording, awaiting legal review</Chip>
        ) : (
          <Chip tone="success">Reviewed</Chip>
        )}
        <Chip>
          <Link href={kbHref('controls', item.control.code)}>
            {item.control.code} {item.control.title}
          </Link>
        </Chip>
        <Chip>
          <Link href={kbHref('domains', item.domain.code)}>
            {item.domain.code} {item.domain.title}
          </Link>
        </Chip>
      </PageHeader>

      <div>
        <MarginRow margin="Law">
          {item.references.length ? (
            <span className={styles.chips}>
              {item.references.map((reference) => (
                <Citation key={reference}>{reference}</Citation>
              ))}
            </span>
          ) : (
            <p className={styles.flush}>No citation is recorded.</p>
          )}
        </MarginRow>
        <MarginRow margin="How to test it">
          <p className={styles.flush}>{item.guidance}</p>
        </MarginRow>
        <MarginRow margin="Evidence required">
          <EvidenceList items={item.evidenceRequired} empty="None listed." />
        </MarginRow>
        <MarginRow margin="Also expected">
          <EvidenceList items={item.evidenceRecommended} empty="Nothing further." />
        </MarginRow>
        <MarginRow margin="Supporting documents">
          <EvidenceList items={item.evidenceSupporting} empty="None for this domain." />
        </MarginRow>
        <MarginRow margin="Recommendation if No or Partial">
          <p className={styles.flush}>{item.recommendation}</p>
        </MarginRow>
        <MarginRow margin="Answers">
          <ul className={`${styles.bullets} ${styles.flush}`}>
            {ANSWERS.map((row) => (
              <li key={row.answer}>
                <strong>{row.answer}</strong>: {row.outcome}
              </li>
            ))}
          </ul>
        </MarginRow>
      </div>

      {item.criteria.length ? (
        <section className={styles.section} aria-labelledby="criteria-title">
          <h2 id="criteria-title" className={styles.sectionTitle}>
            Acceptance criteria
          </h2>
          <ul className={styles.bullets}>
            {item.criteria.map((criterion) => (
              <li key={`${criterion.obligationCode}-${criterion.text}`}>
                <Citation>{criterion.obligationCode}</Citation> {criterion.text}{' '}
                {criterion.critical ? <Chip tone="danger">Critical</Chip> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="obligations-title">
        <h2 id="obligations-title" className={styles.sectionTitle}>
          Obligations this question tests
        </h2>
        <ul className={styles.plainList}>
          {item.obligations.map((obligation) => (
            <ObligationRow key={obligation.code} item={obligation} today={today} />
          ))}
        </ul>
      </section>
    </div>
  )
}
