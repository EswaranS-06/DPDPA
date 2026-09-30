import { kbHref } from '@duatf/feature-framework-library-api'
import { Chip, Citation, MarginRow, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { Markdown } from './components/Markdown'
import { ObligationRow } from './components/ObligationRow'
import { TimeStatus } from './components/TimeStatus'
import { instrumentName } from './consts/labels'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

export const InstrumentScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.instrument({ code }))
  const source =
    item.kind === 'section'
      ? 'DPDP Act 2023'
      : item.kind === 'rule'
        ? 'DPDP Rules 2025'
        : 'Schedule'

  return (
    <div className={styles.page}>
      <PageHeader
        kicker={
          <Citation>
            {instrumentName(item.kind, item.number)}, {source}
          </Citation>
        }
        title={item.title}
      >
        {item.kind !== 'schedule' ? <TimeStatus inForce={item.inForceDate} today={today} /> : null}
        {item.phase !== null ? <Chip>Phase {item.phase}</Chip> : null}
        {item.chapter ? (
          <Chip>
            Chapter {item.chapter}
            {item.chapterTitle ? `, ${item.chapterTitle}` : ''}
          </Chip>
        ) : null}
      </PageHeader>

      <div>
        {item.summaryMd ? (
          <MarginRow margin="Summary">
            <Markdown source={item.summaryMd} voice="law" dropTitle={false} />
          </MarginRow>
        ) : null}
        {item.phaseNote ? (
          <MarginRow margin="Commencement">
            <p className={styles.flush}>{item.phaseNote}</p>
          </MarginRow>
        ) : null}
        {item.related.length ? (
          <MarginRow margin={item.kind === 'rule' ? 'Parent sections' : 'Related rules'}>
            <ul className={styles.bullets}>
              {item.related.map((related) => (
                <li key={related.code}>
                  <Link className={styles.inlineLink} href={kbHref('law', related.code)}>
                    {related.code} {related.title}
                  </Link>
                </li>
              ))}
            </ul>
          </MarginRow>
        ) : null}
      </div>

      <section className={styles.section} aria-labelledby="obligations-title">
        <h2 id="obligations-title" className={styles.sectionTitle}>
          Obligations drawn from this provision
        </h2>
        {item.obligations.length ? (
          <ul className={styles.plainList}>
            {item.obligations.map((obligation) => (
              <ObligationRow key={obligation.code} item={obligation} today={today} />
            ))}
          </ul>
        ) : (
          <p className={styles.sectionIntro}>
            This provision sets up the framework (definitions, the Board, procedure) and creates no
            separate obligation for an organisation to test.
          </p>
        )}
      </section>
    </div>
  )
}
