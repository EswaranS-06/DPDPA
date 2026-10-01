import { kbHref } from '@duatf/feature-framework-library-api'
import { formatDay, isoDate } from '@duatf/core-utils'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { buildLadder } from './components/CommencementLadder/ladder'
import { RegulatoryClock } from './components/RegulatoryClock'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; today: string }

export const LibraryOverviewScreen = async ({ api, today }: Props) => {
  const [summary, domains] = await Promise.all([api.summary({ asOf: today }), api.domains()])
  const ladder = buildLadder(summary, today)
  const { counts, release } = summary
  const sections = [
    {
      href: kbHref('law'),
      title: 'The law',
      meta: `${counts.law} sections, rules and schedules of the DPDP Act 2023 and Rules 2025`,
    },
    {
      href: kbHref('questions'),
      title: 'Question bank',
      meta: `${counts.questions} assessment questions, one per control, with evidence and recommendations`,
    },
    {
      href: kbHref('controls'),
      title: 'Controls',
      meta: `${counts.controls} controls with test procedures and ISO and NIST mappings`,
    },
    {
      href: kbHref('sectors'),
      title: 'Sector overlays',
      meta: `${counts.sectors} sectors with regulators, parallel laws and retention periods`,
    },
    {
      href: kbHref('processes'),
      title: 'Process catalogue',
      meta: `${counts.processes} process templates to start discovery from`,
    },
    {
      href: kbHref('data-elements'),
      title: 'Data elements',
      meta: `${counts.dataElements} kinds of personal data with sensitivity tags`,
    },
    {
      href: kbHref('vocabularies'),
      title: 'Vocabularies',
      meta: `${counts.vocabularies} controlled lists: roles, flags, ratings, risk scales`,
    },
    {
      href: kbHref('playbooks'),
      title: 'Playbooks',
      meta: `${counts.playbooks} guides: methodology, scoping, stuck points, evidence requests`,
    },
  ]

  return (
    <div className={styles.page}>
      <h1 className="visually-hidden">Knowledge base</h1>
      <RegulatoryClock ladder={ladder} release={release.version} />

      <section className={styles.section} aria-labelledby="domains-title">
        <h2 id="domains-title" className={styles.sectionTitle}>
          Obligations by domain
        </h2>
        <ul className={styles.indexGrid}>
          {domains.map((domain) => (
            <li key={domain.code}>
              <span className={styles.indexCode}>{domain.code}</span>
              <span>
                <Link className={styles.indexTitle} href={kbHref('domains', domain.code)}>
                  {domain.title}
                </Link>
                <span className={styles.indexMeta}>
                  {domain.obligationCount}{' '}
                  {domain.obligationCount === 1 ? 'obligation' : 'obligations'},{' '}
                  {domain.controlCount} {domain.controlCount === 1 ? 'control' : 'controls'}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="library-title">
        <h2 id="library-title" className={styles.sectionTitle}>
          Also in the knowledge base
        </h2>
        <ul className={`${styles.indexGrid} ${styles.noCode}`}>
          {sections.map((section) => (
            <li key={section.href}>
              <span>
                <Link className={styles.indexTitle} href={section.href}>
                  {section.title}
                </Link>
                <span className={styles.indexMeta}>{section.meta}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className={styles.muted}>
        Framework release {release.version}
        {release.publishedAt ? `, published ${formatDay(isoDate(release.publishedAt))}` : ''}.
        Commencement dates are computed from the Gazette and may shift by a day.
      </p>
    </div>
  )
}
