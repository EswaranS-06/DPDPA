import { Citation, MarginRow, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { TimeStatus } from './components/TimeStatus'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; today: string }
type Instrument = Awaited<ReturnType<FrameworkLibraryApi['law']>>['instruments'][number]

const shortCitation = (item: Instrument) =>
  item.kind === 'section'
    ? `s.${item.number}`
    : item.kind === 'rule'
      ? `R${item.number}`
      : `Sch ${item.number}`

const InstrumentList = ({ items, today }: { items: Instrument[]; today: string }) => (
  <ul className={styles.plainList}>
    {items.map((item) => (
      <MarginRow key={item.code} as="li" margin={<Citation strong>{shortCitation(item)}</Citation>}>
        <Link className={styles.indexTitle} href={`/library/law/${item.code}`}>
          {item.title}
        </Link>
        <div className={`${styles.chips} ${styles.below}`}>
          {item.kind !== 'schedule' ? (
            <TimeStatus inForce={item.inForceDate} today={today} />
          ) : null}
          {item.obligationCount ? (
            <span className={styles.muted}>
              {item.obligationCount} obligation{item.obligationCount === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
      </MarginRow>
    ))}
  </ul>
)

export const LawIndexScreen = async ({ api, today }: Props) => {
  const { instruments, bases } = await api.law()
  const sections = instruments
    .filter((item) => item.kind === 'section')
    .sort((a, b) => Number(a.number) - Number(b.number))
  const chapters = [...new Map(sections.map((item) => [item.chapter, item.chapterTitle])).entries()]
  const rules = instruments
    .filter((item) => item.kind === 'rule')
    .sort((a, b) => Number(a.number) - Number(b.number))
  const schedules = instruments.filter((item) => item.kind === 'schedule')

  return (
    <div className={styles.page}>
      <PageHeader
        title="The law"
        lede="The Digital Personal Data Protection Act 2023 (Act 22 of 2023) and the DPDP Rules 2025 (G.S.R. 846(E)), provision by provision, with the obligations drawn from each."
      />

      <section className={styles.section} aria-labelledby="act-title">
        <h2 id="act-title" className={styles.sectionTitle}>
          The Act
        </h2>
        {chapters.map(([chapter, title]) => (
          <div key={chapter ?? 'none'} className={styles.section}>
            <h3 className={styles.subTitle}>
              Chapter {chapter}
              {title ? `. ${title}` : ''}
            </h3>
            <InstrumentList
              items={sections.filter((item) => item.chapter === chapter)}
              today={today}
            />
          </div>
        ))}
      </section>

      <section className={styles.section} aria-labelledby="rules-title">
        <h2 id="rules-title" className={styles.sectionTitle}>
          The Rules
        </h2>
        <InstrumentList items={rules} today={today} />
      </section>

      <section className={styles.section} aria-labelledby="schedules-title">
        <h2 id="schedules-title" className={styles.sectionTitle}>
          Schedules
        </h2>
        <InstrumentList items={schedules} today={today} />
      </section>

      <section className={styles.section} aria-labelledby="bases-title">
        <h2 id="bases-title" className={styles.sectionTitle}>
          Lawful bases and exemptions
        </h2>
        <p className={styles.sectionIntro}>
          Processing needs consent (s.6) or one of the legitimate uses in s.7. Section 17 exempts
          some processing from parts of the Act.{' '}
          <Link className={styles.inlineLink} href="/library/law/bases">
            See all {bases.length} bases and exemptions
          </Link>
          .
        </p>
      </section>
    </div>
  )
}
