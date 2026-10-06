import { AccessDeniedError, can } from '@duatf/core-access'
import {
  buttonClass,
  Callout,
  EmptyState,
  PageHeader,
  SectionHeader,
  Stat,
  StatGrid,
} from '@duatf/core-ui'
import {
  dataMap,
  NotFoundError,
  RECORD_OF_PROCESSING_NOTE,
  transferLabel,
  type DataMapRecord,
} from '@duatf/feature-compliance-api'
import { ArrowRight, Download, Globe, ShieldAlert } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DataFlowDiagram } from '@/components/data/DataFlowDiagram'
import styles from '@/components/data/DataMap.module.css'
import { LevelChip } from '@/components/data/LevelChip'
import { FilterTabs } from '@/components/FilterTabs'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import page from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Data mapping' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

const VIEWS = ['flow', 'departments', 'ropa'] as const
type View = (typeof VIEWS)[number]

const list = (items: readonly string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items.at(-1) ?? ''}`

/** One department's flow in a sentence, for reading rather than scanning. */
const sentence = (record: DataMapRecord) => {
  const parts = [
    `${record.department.name} holds ${record.elements.length} data element${record.elements.length === 1 ? '' : 's'}${
      record.categories.length
        ? ` (${list(record.categories.map((item) => item.title.toLowerCase()))})`
        : ''
    }`,
  ]
  // People are named in lower case; departments keep their names.
  const from = [...record.principals.map((item) => item.toLowerCase()), ...record.otherSources]
  parts.push(from.length ? `from ${list(from)}` : 'from sources not yet recorded')
  let text = `${parts.join(' ')}.`
  if (record.systems.length) text += ` It keeps it in ${list(record.systems)}.`
  if (record.sharedWith.length) text += ` It shares it with ${list(record.sharedWith)}.`
  if (record.profile?.recipients.length) {
    text += ` It discloses it to ${list(record.profile.recipients)}.`
  }
  if (record.profile?.transfersAbroad === 'yes') {
    text += ` It transfers it outside India${record.profile.countries ? `, to ${record.profile.countries}` : ''}.`
  } else if (record.profile?.transfersAbroad === 'no') {
    text += ' It keeps it in India.'
  }
  if (record.profile?.retention) text += ` Retention: ${record.profile.retention}`
  return text
}

const Tags = ({ items, empty }: { items: string[]; empty: string }) =>
  items.length ? (
    <ul className={styles.tags}>
      {items.map((item) => (
        <li key={item} className={styles.tag}>
          {item}
        </li>
      ))}
    </ul>
  ) : (
    <p className={styles.empty}>{empty}</p>
  )

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const map = await dataMap(ctx, client.id).catch((error: unknown) => {
    if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
    throw error
  })
  const requested = firstValue((await searchParams).view)
  const view: View = VIEWS.includes(requested as View) ? (requested as View) : 'flow'
  const base = `/clients/${client.code}`
  const canExport = can(ctx.principal, 'report.export', { clientId: client.id })
  const canEdit = can(ctx.principal, 'department.manage', { clientId: client.id })
  const mapped = map.records.filter((record) => record.mapped)
  const { summary } = map

  return (
    <>
      <PageHeader
        title="Data mapping"
        lede="What personal data each department handles, where it comes from and where it goes, built from every department’s answer to the personal data question. It is the basis of the record of processing (RoPA)."
        actions={
          canExport ? (
            <a
              href={`${base}/data-mapping/ropa`}
              className={buttonClass('secondary')}
              rel="nofollow"
            >
              <Download size={16} aria-hidden="true" />
              RoPA workbook
            </a>
          ) : null
        }
      />

      <StatGrid label="Data map figures">
        <Stat
          label="Departments mapped"
          value={`${summary.mapped} of ${summary.departments}`}
          note="have listed their personal data"
          tone={summary.unmapped.length ? 'warning' : 'default'}
        />
        <Stat
          label="Data elements"
          value={summary.elements}
          note={`in ${summary.categories} categories`}
        />
        <Stat
          label="Restricted (L4)"
          value={summary.restricted}
          note="elements needing the strictest handling"
          tone={summary.restricted ? 'danger' : 'default'}
          icon={summary.restricted ? ShieldAlert : undefined}
        />
        <Stat
          label="Recipients outside"
          value={summary.recipients}
          note="vendors, processors and others"
        />
        <Stat
          label="Transfers outside India"
          value={summary.abroad}
          note={
            summary.transfersUnknown
              ? `${summary.transfersUnknown} departments not yet known`
              : 'departments'
          }
          icon={summary.abroad ? Globe : undefined}
          tone={summary.abroad ? 'warning' : 'default'}
        />
      </StatGrid>

      {summary.unmapped.length > 0 ? (
        <Callout
          tone="neutral"
          title="Departments that have not answered the personal data question"
        >
          <p>
            {summary.unmapped.map((item, index) => (
              <span key={item.code}>
                {index > 0 ? ', ' : ''}
                <Link href={`${base}/departments/${item.code}/data`}>{item.name}</Link>
              </span>
            ))}
            .
          </p>
        </Callout>
      ) : null}

      <FilterTabs
        label="Data map views"
        tabs={[
          { href: `${base}/data-mapping`, label: 'Flow', current: view === 'flow' },
          {
            href: `${base}/data-mapping?view=departments`,
            label: 'By department',
            count: mapped.length,
            current: view === 'departments',
          },
          {
            href: `${base}/data-mapping?view=ropa`,
            label: 'Record of processing',
            current: view === 'ropa',
          },
        ]}
      />

      {mapped.length === 0 ? (
        <EmptyState
          title="No personal data mapped yet"
          action={
            <Link href={`${base}/departments`} className={buttonClass('primary')}>
              Go to departments
            </Link>
          }
        >
          <p>
            Open a department and answer “What personal data does this department handle?”. Its data
            elements, sources and recipients appear here.
          </p>
        </EmptyState>
      ) : null}

      {mapped.length > 0 && view === 'flow' ? (
        <>
          <section className={page.section} aria-labelledby="flow-heading">
            <SectionHeader id="flow-heading" title="How personal data flows" />
            <DataFlowDiagram nodes={map.nodes} edges={map.edges} />
          </section>
          <section className={page.section} aria-labelledby="matrix-heading">
            <SectionHeader id="matrix-heading" title="Categories by department" />
            <div className={styles.matrixWrap}>
              <table className={styles.matrix}>
                <thead>
                  <tr>
                    <th scope="col">Category</th>
                    {mapped.map((record) => (
                      <th key={record.department.code} scope="col">
                        <Link href={`${base}/departments/${record.department.code}/data`}>
                          {record.department.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {map.categories.map((category) => (
                    <tr key={category.code}>
                      <th scope="row">{category.title}</th>
                      {mapped.map((record) => {
                        const cell = record.categories.find((item) => item.code === category.code)
                        return (
                          <td key={record.department.code}>
                            {cell ? (
                              <>
                                {cell.count} <LevelChip level={cell.level} />
                              </>
                            ) : (
                              <span className={styles.cellNone}>—</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : null}

      {mapped.length > 0 && view === 'departments' ? (
        <div className={styles.records}>
          {mapped.map((record) => (
            <article key={record.department.code} className={styles.record}>
              <header className={styles.recordHead}>
                <h2 className={styles.recordTitle}>
                  <Link href={`${base}/departments/${record.department.code}/data`}>
                    {record.department.name}
                  </Link>{' '}
                  <span className="code">{record.department.fullCode}</span>
                </h2>
                {record.level ? <LevelChip level={record.level} /> : null}
              </header>
              <p className={styles.sentence}>{sentence(record)}</p>
              <div className={styles.lane}>
                <div className={styles.laneBox}>
                  <p className={styles.laneTitle}>From</p>
                  <Tags
                    items={[...record.principals, ...record.otherSources]}
                    empty="Not recorded"
                  />
                </div>
                <ArrowRight className={styles.arrow} size={18} aria-hidden="true" />
                <div className={`${styles.laneBox} ${styles.laneCentre}`}>
                  <p className={styles.laneTitle}>Holds</p>
                  <ul className={styles.tags}>
                    {record.categories.map((item) => (
                      <li key={item.code} className={styles.tag}>
                        {item.title} · {item.count} · {item.level}
                      </li>
                    ))}
                  </ul>
                  <Tags items={record.systems} empty="Systems not recorded" />
                </div>
                <ArrowRight className={styles.arrow} size={18} aria-hidden="true" />
                <div className={styles.laneBox}>
                  <p className={styles.laneTitle}>To</p>
                  <Tags
                    items={[
                      ...record.sharedWith,
                      ...(record.profile?.recipients ?? []),
                      ...(record.profile?.transfersAbroad === 'yes'
                        ? [
                            `Outside India${record.profile.countries ? `: ${record.profile.countries}` : ''}`,
                          ]
                        : []),
                    ]}
                    empty="Nobody recorded"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {mapped.length > 0 && view === 'ropa' ? (
        <section className={page.section} aria-labelledby="ropa-heading">
          <SectionHeader id="ropa-heading" title="Record of processing" />
          <p className={styles.sentence}>{RECORD_OF_PROCESSING_NOTE}</p>
          <div className={styles.matrixWrap}>
            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th scope="col">Department</th>
                  <th scope="col">Purposes</th>
                  <th scope="col">Lawful basis</th>
                  <th scope="col">Data principals</th>
                  <th scope="col">Personal data</th>
                  <th scope="col">Recipients</th>
                  <th scope="col">Outside India</th>
                  <th scope="col">Retention</th>
                  <th scope="col">Security</th>
                </tr>
              </thead>
              <tbody>
                {map.records
                  .filter((record) => record.mapped || record.profile)
                  .map((record) => (
                    <tr key={record.department.code}>
                      <th scope="row">
                        <Link href={`${base}/departments/${record.department.code}/data`}>
                          {record.department.name}
                        </Link>
                      </th>
                      <td>
                        {record.profile?.purposes ?? (
                          <span className={styles.cellNone}>Not recorded</span>
                        )}
                      </td>
                      <td>
                        {record.lawfulBases.join('; ') || (
                          <span className={styles.cellNone}>Not recorded</span>
                        )}
                      </td>
                      <td>
                        {record.principals.join('; ') || (
                          <span className={styles.cellNone}>Not recorded</span>
                        )}
                      </td>
                      <td>
                        {record.categories
                          .map((item) => `${item.title} (${item.level})`)
                          .join('; ')}
                      </td>
                      <td>
                        {[
                          ...record.sharedWith.map((name) => `${name} (internal)`),
                          ...(record.profile?.recipients ?? []),
                        ].join('; ') || <span className={styles.cellNone}>None recorded</span>}
                      </td>
                      <td>
                        {transferLabel(record.profile?.transfersAbroad)}
                        {record.profile?.countries ? `: ${record.profile.countries}` : ''}
                      </td>
                      <td>
                        {record.profile?.retention ?? (
                          <span className={styles.cellNone}>Not recorded</span>
                        )}
                      </td>
                      <td>
                        {record.profile?.security ?? (
                          <span className={styles.cellNone}>Not recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {canEdit && mapped.length > 0 ? (
        <p className={styles.empty}>
          Change a department’s answers on its personal data page; this map updates at once.
        </p>
      ) : null}
    </>
  )
}
