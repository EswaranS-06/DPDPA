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
  listActivities,
  NotFoundError,
  RECORD_OF_PROCESSING_NOTE,
  transferLabel,
  type ActivityList,
  type DataMapRecord,
} from '@duatf/feature-compliance-api'
import { ArrowRight, Download, Globe, ListPlus, Plus, ShieldAlert, Upload } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { DataFlowDiagram } from '@/components/data/DataFlowDiagram'
import styles from '@/components/data/DataMap.module.css'
import { LevelChip } from '@/components/data/LevelChip'
import ropa from '@/components/data/Ropa.module.css'
import { FilterTabs } from '@/components/FilterTabs'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import page from '../../clients.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Data mapping' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

const VIEWS = ['flow', 'departments', 'ropa', 'elements'] as const
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
  if (record.activities.length) {
    text += ` It uses it in ${record.activities.length} processing activit${record.activities.length === 1 ? 'y' : 'ies'}: ${list(record.activities.map((item) => item.name))}.`
  }
  if (record.systems.length) text += ` It keeps it in ${list(record.systems)}.`
  if (record.sharedWith.length) text += ` It shares it with ${list(record.sharedWith)}.`
  if (record.recipients.length) text += ` It discloses it to ${list(record.recipients)}.`
  if (record.transfersAbroad === 'yes') {
    text += ` It transfers it outside India${record.countries ? `, to ${record.countries}` : ''}.`
  } else if (record.transfersAbroad === 'no') {
    text += ' It keeps it in India.'
  }
  if (record.retention.length) text += ` Retention: ${record.retention.join('; ')}.`
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

/** At most eight items, then how many more. */
const shortList = (items: readonly string[]) =>
  items.length > 8 ? [...items.slice(0, 8), `and ${items.length - 8} more`] : [...items]

const Cell = ({ items, empty = 'Not recorded' }: { items: readonly string[]; empty?: string }) =>
  items.length ? <>{items.join('; ')}</> : <span className={ropa.none}>{empty}</span>

/** The record of processing as a table: one row per activity. */
const RopaTable = ({ data, base }: { data: ActivityList; base: string }) => {
  const names = new Map(data.kb.elements.map((row) => [row.code, row.name]))
  const bases = new Map(data.kb.bases.map((row) => [row.code, row.label]))
  const departments = new Map(data.departments.map((row) => [row.code, row.name]))
  return (
    <div className={ropa.tableWrap}>
      <table className={ropa.table}>
        <thead>
          <tr>
            <th scope="col">ID</th>
            <th scope="col">Processing activity</th>
            <th scope="col">Department</th>
            <th scope="col">Purpose</th>
            <th scope="col">Lawful basis</th>
            <th scope="col">Data principals</th>
            <th scope="col">Personal data</th>
            <th scope="col">Recipients</th>
            <th scope="col">Retention</th>
            <th scope="col">Outside India</th>
            <th scope="col">Security</th>
          </tr>
        </thead>
        <tbody>
          {data.activities.map((row) => (
            <tr key={row.ref}>
              <td className="code">{row.refLabel}</td>
              <th scope="row">
                <Link href={`${base}/activities/${row.refLabel}`}>{row.name}</Link>
              </th>
              <td>{row.departmentName}</td>
              <td>{row.purpose ?? <span className={ropa.none}>Not recorded</span>}</td>
              <td>
                <Cell items={row.lawfulBases.map((code) => bases.get(code) ?? code)} />
                {row.lawReference ? `; ${row.lawReference}` : ''}
              </td>
              <td>
                <Cell items={row.principals} />
              </td>
              <td>
                <Cell
                  items={shortList(
                    row.elements.map(
                      (item) => (item.code ? names.get(item.code) : null) ?? item.title,
                    ),
                  )}
                />
              </td>
              <td>
                <Cell
                  items={[
                    ...row.internalRecipients.map((code) => departments.get(code) ?? code),
                    ...row.processors.map((name) => `${name} (processor)`),
                    ...row.recipients,
                  ]}
                  empty="None recorded"
                />
              </td>
              <td>
                {row.retention ?? <span className={ropa.none}>Not recorded</span>}
                {row.deletion ? `; ${row.deletion.toLowerCase()}` : ''}
              </td>
              <td>
                {transferLabel(row.transfersAbroad)}
                {row.countries ? `: ${row.countries}` : ''}
              </td>
              <td>
                <Cell items={row.security} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const map = await dataMap(ctx, client.id).catch((error: unknown) => {
    if (error instanceof NotFoundError || error instanceof AccessDeniedError) notFound()
    throw error
  })
  const requested = firstValue(query.view)
  const view: View = VIEWS.includes(requested as View) ? (requested as View) : 'flow'
  const activities = view === 'ropa' ? await listActivities(ctx, client.id) : null
  const base = `/clients/${client.code}`
  const mapping = `${base}/data-mapping`
  const canExport = can(ctx.principal, 'report.export', { clientId: client.id })
  const canEdit = can(ctx.principal, 'department.manage', { clientId: client.id })
  const mapped = map.records.filter((record) => record.mapped)
  const elementRows = map.records.flatMap((record) =>
    record.elements.map((item) => ({ ...item, department: record.department })),
  )
  const { summary } = map
  const added = firstValue(query.added)
  const skipped = Number(firstValue(query.skipped) ?? 0)
  const removed = firstValue(query.removed)

  return (
    <>
      <PageHeader
        title="Data mapping"
        lede="What personal data each department handles, the processing activities it uses it for, where it comes from and where it goes. The activities make the record of processing (RoPA)."
        actions={
          canEdit ? (
            <Link href={`${mapping}/catalogue`} className={buttonClass('primary')}>
              <ListPlus size={16} aria-hidden="true" />
              Add from the catalogue
            </Link>
          ) : null
        }
      />

      <StatGrid label="Data map figures">
        <Stat
          label="Processing activities"
          value={summary.activities}
          note={`in ${summary.mapped} of ${summary.departments} departments`}
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
          note="processors and other recipients"
        />
        <Stat
          label="Transfers outside India"
          value={summary.abroad}
          note={
            summary.transfersUnknown
              ? `${summary.transfersUnknown} activities not yet known`
              : 'activities'
          }
          icon={summary.abroad ? Globe : undefined}
          tone={summary.abroad ? 'warning' : 'default'}
        />
      </StatGrid>

      {summary.unmapped.length > 0 ? (
        <Callout tone="neutral" title="Departments with no personal data or activities yet">
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
          { href: mapping, label: 'Flow', current: view === 'flow' },
          {
            href: `${mapping}?view=departments`,
            label: 'By department',
            count: mapped.length,
            current: view === 'departments',
          },
          {
            href: `${mapping}?view=ropa`,
            label: 'Record of processing',
            count: summary.activities,
            current: view === 'ropa',
          },
          {
            href: `${mapping}?view=elements`,
            label: 'Data elements',
            count: elementRows.length,
            current: view === 'elements',
          },
        ]}
      />

      {mapped.length === 0 && (view === 'flow' || view === 'departments') ? (
        <EmptyState
          title="No personal data mapped yet"
          action={
            canEdit ? (
              <Link href={`${mapping}/catalogue`} className={buttonClass('primary')}>
                Add from the catalogue
              </Link>
            ) : null
          }
        >
          <p>
            Add each department’s processing activities from the process catalogue, or answer “What
            personal data does this department handle?” on its page. The flows appear here.
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
                        {item.title}, {item.count}, {item.level}
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
                      ...record.recipients,
                      ...(record.transfersAbroad === 'yes'
                        ? [`Outside India${record.countries ? `: ${record.countries}` : ''}`]
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

      {view === 'ropa' && activities ? (
        <section className={page.section} aria-labelledby="ropa-heading">
          <SectionHeader
            id="ropa-heading"
            title="Record of processing"
            count={activities.activities.length}
            description={RECORD_OF_PROCESSING_NOTE}
            actions={
              <>
                {canEdit ? (
                  <Link href={`${mapping}/activities/new`} className={buttonClass('ghost', 'sm')}>
                    <Plus size={16} aria-hidden="true" />
                    Add activity
                  </Link>
                ) : null}
                {canExport ? (
                  <a
                    href={`${mapping}/ropa`}
                    className={buttonClass('secondary', 'sm')}
                    rel="nofollow"
                  >
                    <Download size={16} aria-hidden="true" />
                    Export RoPA
                  </a>
                ) : null}
                {canEdit ? (
                  <Link
                    href={`${mapping}/import?kind=ropa`}
                    className={buttonClass('secondary', 'sm')}
                  >
                    <Upload size={16} aria-hidden="true" />
                    Import RoPA
                  </Link>
                ) : null}
              </>
            }
          />
          {added ? (
            <Callout
              tone="success"
              title={`${added} processing ${added === '1' ? 'activity' : 'activities'} added`}
            >
              <p>
                Each started with the catalogue’s defaults.
                {skipped
                  ? ` ${skipped} already recorded ${skipped === 1 ? 'was' : 'were'} left as ${skipped === 1 ? 'it was' : 'they were'}.`
                  : ''}{' '}
                Open each to confirm its answers, or export the RoPA and review them all in Excel.
              </p>
            </Callout>
          ) : null}
          {removed ? <Callout tone="success" title={`${removed} deleted`} /> : null}
          {activities.activities.length ? (
            <RopaTable data={activities} base={mapping} />
          ) : (
            <EmptyState
              title="No processing activities yet"
              action={
                canEdit ? (
                  <Link href={`${mapping}/catalogue`} className={buttonClass('primary')}>
                    Add from the catalogue
                  </Link>
                ) : null
              }
            >
              <p>
                Start from the process catalogue: each department’s usual processes are suggested,
                with their purpose, data, recipients, retention and safeguards filled in.
              </p>
            </EmptyState>
          )}
        </section>
      ) : null}

      {view === 'elements' ? (
        <section className={page.section} aria-labelledby="elements-heading">
          <SectionHeader
            id="elements-heading"
            title="Data elements by department"
            count={elementRows.length}
            description="The data element listing: every department’s data elements with their category, level, source, storage, security and access."
            actions={
              <>
                {canExport ? (
                  <a
                    href={`${mapping}/elements`}
                    className={buttonClass('secondary', 'sm')}
                    rel="nofollow"
                  >
                    <Download size={16} aria-hidden="true" />
                    Export data elements
                  </a>
                ) : null}
                {canEdit ? (
                  <Link
                    href={`${mapping}/import?kind=elements`}
                    className={buttonClass('secondary', 'sm')}
                  >
                    <Upload size={16} aria-hidden="true" />
                    Import data elements
                  </Link>
                ) : null}
              </>
            }
          />
          {elementRows.length ? (
            <div className={ropa.tableWrap}>
              <table className={ropa.table}>
                <thead>
                  <tr>
                    <th scope="col">Department</th>
                    <th scope="col">Data element</th>
                    <th scope="col">Category</th>
                    <th scope="col">Level</th>
                    <th scope="col">Comes from</th>
                    <th scope="col">Stored in</th>
                    <th scope="col">Security</th>
                    <th scope="col">Access</th>
                  </tr>
                </thead>
                <tbody>
                  {elementRows.map((row) => (
                    <tr key={`${row.department.code}:${row.title}`}>
                      <td>
                        <Link href={`${base}/departments/${row.department.code}/data`}>
                          {row.department.name}
                        </Link>
                      </td>
                      <th scope="row">
                        {row.title} <span className="code">{row.code ?? 'own'}</span>
                      </th>
                      <td>{row.categoryTitle}</td>
                      <td>
                        <LevelChip level={row.level} />
                      </td>
                      <td>{row.sourceLabel}</td>
                      <td>{row.storage ?? <span className={ropa.none}>—</span>}</td>
                      <td>{row.security ?? <span className={ropa.none}>—</span>}</td>
                      <td>{row.access ?? <span className={ropa.none}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={ropa.muted}>
              No data elements yet. Add them on each department’s personal data page, or import the
              data element workbook.
            </p>
          )}
        </section>
      ) : null}
    </>
  )
}
