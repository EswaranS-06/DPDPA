import { buttonClass, EmptyState, PageHeader, Panel } from '@duatf/core-ui'
import { SearchX } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import type { PaletteHit } from '@/components/shell/CommandPalette'
import { searchEverything } from '@/server/search'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import styles from './search.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Search' }

const GROUPS: { kind: PaletteHit['kind']; label: string }[] = [
  { kind: 'client', label: 'Clients' },
  { kind: 'assessment', label: 'Assessments' },
  { kind: 'finding', label: 'Findings' },
  { kind: 'action', label: 'Remediation actions' },
  { kind: 'evidence', label: 'Evidence' },
  { kind: 'department', label: 'Departments' },
  { kind: 'knowledge', label: 'Knowledge base' },
]

/** Full search results; the palette's fallback and its "all results" view. */
export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const query = (firstValue((await searchParams).q) ?? '').trim()
  const hits = await searchEverything(await serviceContext(), query)
  return (
    <div className={styles.page}>
      <PageHeader
        title="Search"
        lede="Clients, assessments, findings, actions, evidence and departments you can open, and the knowledge base."
      />
      <form method="get" action="/search" role="search" className={styles.form}>
        <label htmlFor="search-query" className="visually-hidden">
          Search
        </label>
        <input
          id="search-query"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="A name, a code such as FND-NADALL-004, or a citation such as s.8(6)"
          className={styles.input}
        />
        <button type="submit" className={buttonClass()}>
          Search
        </button>
      </form>
      {query.length >= 2 && hits.length === 0 ? (
        <EmptyState icon={SearchX} title={`Nothing you can open matches "${query}"`}>
          Check the spelling, or search by code: clients (AMMA), findings (FND-AMMA-003), questions
          (A9.3) or provisions (s.8(6), R7).
        </EmptyState>
      ) : null}
      {GROUPS.map((group) => {
        const rows = hits.filter((hit) => hit.kind === group.kind)
        return rows.length ? (
          <Panel
            key={group.kind}
            title={`${group.label} (${rows.length})`}
            titleId={`search-${group.kind}`}
            padding="flush"
          >
            <ul className={styles.list}>
              {rows.map((hit) => (
                <li key={hit.href}>
                  <Link href={hit.href} className={styles.title}>
                    {hit.title}
                  </Link>
                  {hit.detail ? <span className={styles.detail}>{hit.detail}</span> : null}
                </li>
              ))}
            </ul>
          </Panel>
        ) : null
      })}
    </div>
  )
}
