import { kbHref } from '@duatf/feature-framework-library-api'
import { Citation, EmptyState, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; query: string }

type Hit = { href: string; code: string; title: string }

const HitList = ({ title, hits }: { title: string; hits: Hit[] }) =>
  hits.length ? (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>
        {title} <span className={styles.muted}>{hits.length}</span>
      </h2>
      <ul className={`${styles.indexGrid} ${styles.noCode}`}>
        {hits.map((hit) => (
          <li key={hit.href}>
            <span>
              <Citation>{hit.code}</Citation>{' '}
              <Link className={styles.indexTitle} href={hit.href}>
                {hit.title}
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  ) : null

export const SearchScreen = async ({ api, query }: Props) => {
  const trimmed = query.trim()
  if (!trimmed) {
    return (
      <div className={styles.page}>
        <PageHeader
          title="Search the knowledge base"
          lede="Search by citation (s.8(6), Rule 7, Schedule 3), by code (OBL-CON-01, CTL-SEC-02), or by words such as withdrawal or CCTV."
        />
      </div>
    )
  }
  const results = await api.search({ query: trimmed })
  const groups = [
    {
      title: 'Law',
      hits: results.law.map((row) => ({
        href: kbHref('law', row.code),
        code: row.code,
        title: row.title,
      })),
    },
    {
      title: 'Obligations',
      hits: results.obligations.map((row) => ({
        href: kbHref('obligations', row.code),
        code: row.code,
        title: row.title,
      })),
    },
    {
      title: 'Controls',
      hits: results.controls.map((row) => ({
        href: kbHref('controls', row.code),
        code: row.code,
        title: row.title,
      })),
    },
    {
      title: 'Questions',
      hits: results.questions.map((row) => ({
        href: kbHref('questions', row.code),
        code: row.code,
        title: row.text,
      })),
    },
    {
      title: 'Process templates',
      hits: results.processes.map((row) => ({
        href: kbHref('processes', row.code),
        code: row.code,
        title: row.title,
      })),
    },
    {
      title: 'Playbooks',
      hits: results.playbooks.map((row) => ({
        href: kbHref('playbooks', row.slug),
        code: '',
        title: row.title,
      })),
    },
  ]
  const total = groups.reduce((sum, group) => sum + group.hits.length, 0)

  return (
    <div className={styles.page}>
      <PageHeader
        title={`Results for “${trimmed}”`}
        lede={`${total} matches across the knowledge base.`}
      />
      {total === 0 ? (
        <EmptyState title={`Nothing matches “${trimmed}”.`}>
          Try a citation such as s.8(6) or Rule 7, a code such as OBL-CON-01, or a single word such
          as consent.
        </EmptyState>
      ) : (
        groups.map((group) => <HitList key={group.title} title={group.title} hits={group.hits} />)
      )}
    </div>
  )
}
