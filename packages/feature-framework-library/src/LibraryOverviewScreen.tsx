import { formatDay, isoDate } from '@duatf/core-utils'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { buildLadder, CommencementLadder } from './components/CommencementLadder'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; today: string }

export const LibraryOverviewScreen = async ({ api, today }: Props) => {
  const [summary, domains] = await Promise.all([api.summary({ asOf: today }), api.domains()])
  const ladder = buildLadder(summary, today)
  const { counts, release } = summary
  const sections = [
    {
      href: '/library/law',
      title: 'The law',
      meta: `${counts.law} sections, rules and schedules of the DPDP Act 2023 and Rules 2025`,
    },
    {
      href: '/library/controls',
      title: 'Controls',
      meta: `${counts.controls} controls with test procedures and ISO and NIST mappings`,
    },
    {
      href: '/library/sectors',
      title: 'Sector overlays',
      meta: `${counts.sectors} sectors with regulators, parallel laws and retention periods`,
    },
    {
      href: '/library/processes',
      title: 'Process catalogue',
      meta: `${counts.processes} process templates to start discovery from`,
    },
    {
      href: '/library/data-elements',
      title: 'Data elements',
      meta: `${counts.dataElements} kinds of personal data with sensitivity tags`,
    },
    {
      href: '/library/vocabularies',
      title: 'Vocabularies',
      meta: `${counts.vocabularies} controlled lists: roles, flags, ratings, risk scales`,
    },
    {
      href: '/library/playbooks',
      title: 'Playbooks',
      meta: `${counts.playbooks} guides: methodology, scoping, stuck points, evidence requests`,
    },
  ]

  return (
    <div className={styles.page}>
      <section className={styles.section} aria-labelledby="overview-headline">
        <h1 id="overview-headline" className={styles.headline}>
          {ladder.headline}
        </h1>
        {ladder.upcoming ? (
          <p className={styles.countdown}>
            {ladder.upcoming} {ladder.countdown}
          </p>
        ) : null}
      </section>

      <CommencementLadder ladder={ladder} />

      <section className={styles.section} aria-labelledby="domains-title">
        <h2 id="domains-title" className={styles.sectionTitle}>
          Obligations by domain
        </h2>
        <ul className={styles.indexGrid}>
          {domains.map((domain) => (
            <li key={domain.code}>
              <span className={styles.indexCode}>{domain.code}</span>
              <span>
                <Link className={styles.indexTitle} href={`/library/domains/${domain.code}`}>
                  {domain.title}
                </Link>
                <span className={styles.indexMeta}>
                  {domain.obligationCount} obligations, {domain.controlCount} controls
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="library-title">
        <h2 id="library-title" className={styles.sectionTitle}>
          Also in the library
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
        Commencement dates are computed from the Gazette and may shift by a day. This is a working
        compliance framework, not legal advice.
      </p>
    </div>
  )
}
