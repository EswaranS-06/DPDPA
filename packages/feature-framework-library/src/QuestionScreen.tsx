import { Chip, Citation, MarginRow, PageHeader } from '@duatf/core-ui'
import {
  describeApplicability,
  kbHref,
  type FrameworkLibraryApi,
} from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ObligationRow } from './components/ObligationRow'
import { PenaltyChip } from './components/PenaltyChip'
import { ANSWER_TYPE_LABEL, OUTCOME_LABEL, RiskLevelChip } from './components/QuestionBits'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

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

const Lines = ({ text }: { text: string }) =>
  text.split('\n').map((line) => (
    <p key={line} className={styles.flush}>
      {line}
    </p>
  ))

/** One template question: how it is answered, what each answer means, and its KB mapping. */
export const QuestionScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.question({ code }))
  return (
    <div className={styles.page}>
      <PageHeader
        kicker={
          <span>
            <Citation>{item.code}</Citation> {item.questionnaire.title}, {item.section}
          </span>
        }
        title={item.text}
        lede={item.title}
      >
        <Chip>{ANSWER_TYPE_LABEL[item.answerType]}</Chip>
        <RiskLevelChip level={item.riskLevel} />
        {item.reviewStatus === 'draft' ? (
          <Chip tone="warning">KB mapping awaiting legal review</Chip>
        ) : (
          <Chip tone="success">Reviewed</Chip>
        )}
        <Chip>
          <Link href={kbHref('domains', item.domain.code)}>
            {item.domain.code} {item.domain.title}
          </Link>
        </Chip>
      </PageHeader>

      <div>
        <MarginRow margin="Answers">
          <ul className={`${styles.bullets} ${styles.flush}`}>
            {item.options.map((option) => (
              <li key={option.value}>
                <strong>{option.label}</strong>: {OUTCOME_LABEL[option.outcome]}
                {option.hint ? `. ${option.hint}` : ''}
              </li>
            ))}
            {item.answerType === 'text' ? <li>Free text, recorded, not scored.</li> : null}
            <li>
              <strong>Not applicable</strong>: left out of the score; a reason is required.
            </li>
          </ul>
        </MarginRow>
        <MarginRow margin="Applies">
          <p className={styles.flush}>{describeApplicability(item.applicability)}</p>
        </MarginRow>
        <MarginRow margin="Highest penalty">
          {item.penalty ? (
            <p className={styles.flush}>
              {item.penalty.text} <PenaltyChip tier={item.penalty.tier} />
            </p>
          ) : (
            <p className={`${styles.flush} ${styles.muted}`}>No DPDP penalty tier is linked.</p>
          )}
        </MarginRow>
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
        <MarginRow margin="From the template">
          <p className={styles.flush}>
            {item.questionnaire.title} template reference: {item.sourceRef ?? 'none given'}
          </p>
          {item.mappingNote ? (
            <p className={styles.flush}>
              <strong>ComplyX note:</strong> {item.mappingNote}
            </p>
          ) : null}
        </MarginRow>
        <MarginRow margin="Controls">
          <ul className={`${styles.bullets} ${styles.flush}`}>
            {item.controls.map((row) => (
              <li key={row.code}>
                <Link href={kbHref('controls', row.code)} className="code">
                  {row.code}
                </Link>{' '}
                <strong>{row.title}.</strong> {row.description}
              </li>
            ))}
          </ul>
        </MarginRow>
        <MarginRow margin="How to test it">
          <Lines text={item.guidance} />
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
        <MarginRow margin="If there is a gap">
          <Lines text={item.recommendation} />
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
