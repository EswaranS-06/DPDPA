import { formatDay, formatIst } from '@duatf/core-utils'
import {
  buttonClass,
  Callout,
  Chip,
  DataTable,
  Disclosure,
  PageHeader,
  Panel,
  SectionHeader,
  Stat,
  StatGrid,
} from '@duatf/core-ui'
import { documentPack, listDocumentExports } from '@duatf/feature-compliance-api'
import { CircleCheck, Download, FileClock, FileStack, ListChecks, Settings2 } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckList, ReviewChip } from '@/components/documents/DocumentBits'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import page from '../../clients.module.css'
import styles from './documents.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Documents' }

/** The library's own category names, in its order: "1. Notices" and so on. */
const categoryOrder = (category: string) => Number(/^(\d+)/.exec(category)?.[1] ?? 99)

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const [pack, exports] = await Promise.all([
    documentPack(ctx, client.id),
    listDocumentExports(ctx, client.id, 10),
  ])
  const base = `/clients/${client.code}/documents`
  const needed = pack.templates.filter((row) => row.recommended && !row.record)
  const ready = needed.filter((row) => row.blocking === 0)
  const reviewed = pack.templates.filter((row) => row.review.reviewed).length
  const categories = [...new Set(pack.templates.map((row) => row.category))].sort(
    (a, b) => categoryOrder(a) - categoryOrder(b),
  )

  return (
    <>
      <PageHeader
        title="Documents"
        lede={`The ${pack.library.templates} templates of ComplyX’s DPDP template library, filled from ${client.name}’s records. The wording is the library’s; DUATF fills the values, the tables and the answers that switch sections on or off.`}
        actions={
          <>
            <Link href={`${base}/profile`} className={buttonClass('secondary')}>
              <Settings2 size={16} aria-hidden="true" />
              Answers and details
            </Link>
            <Link href={`${base}/clauses`} className={buttonClass('secondary')}>
              <ListChecks size={16} aria-hidden="true" />
              Clause pack
            </Link>
            {pack.canEdit ? (
              <a
                href={`${base}/pack${ready.length === needed.length ? '' : '?draft=1'}`}
                className={buttonClass()}
                rel="nofollow"
              >
                <Download size={16} aria-hidden="true" />
                {ready.length === needed.length
                  ? 'Download the pack'
                  : 'Download the pack as a draft'}
              </a>
            ) : null}
          </>
        }
      />

      <StatGrid label="Document pack figures">
        <Stat
          label="Documents needed"
          value={needed.length}
          note={`of ${pack.templates.length}, by the client’s answers`}
        />
        <Stat
          label="Ready for release"
          value={ready.length}
          note="no blocking check left"
          tone={ready.length < needed.length ? 'warning' : 'default'}
          icon={ready.length === needed.length ? CircleCheck : undefined}
        />
        <Stat
          label="Legally reviewed"
          value={reviewed}
          note={`templates, of ${pack.templates.length}`}
          tone={reviewed < pack.templates.length ? 'warning' : 'default'}
        />
        <Stat
          label="Library version"
          value={pack.library.importedOn ? formatDay(pack.library.importedOn) : '—'}
          note={pack.library.source}
        />
      </StatGrid>

      {reviewed < pack.templates.length ? (
        <Callout tone="warning" title="Templates awaiting legal review">
          <p>
            Until an Administrator marks a template reviewed, its Word file says “Draft: awaiting
            legal review” in the page header. The library asks counsel to re-check the clauses it
            marks VERIFY against the Gazette copy before release to any client.
          </p>
        </Callout>
      ) : null}

      {pack.checks.length ? (
        <Panel title="Checks across the pack" titleId="pack-checks">
          <CheckList checks={pack.checks} />
        </Panel>
      ) : null}

      {categories.map((category) => {
        const rows = pack.templates.filter((row) => row.category === category)
        return (
          <section
            key={category}
            className={page.section}
            aria-labelledby={`cat-${categoryOrder(category)}`}
          >
            <SectionHeader
              id={`cat-${categoryOrder(category)}`}
              title={category.replace(/^\d+\.\s*/, '')}
              count={rows.length}
              level={3}
            />
            <DataTable
              rows={rows}
              rowKey={(row) => row.id}
              columns={[
                {
                  key: 'document',
                  header: 'Document',
                  render: (row) => (
                    <span className={page.personCell}>
                      <Link href={`${base}/${row.id}`} className={page.clientName}>
                        <span className="code">{row.id}</span> {row.title}
                      </Link>
                      <span className={page.muted}>
                        {row.record
                          ? `Built from a ${row.record === 'rights' ? 'rights request' : row.record === 'dpia' ? 'DPIA' : row.record}`
                          : row.recommended
                            ? 'Needed'
                            : `Not needed: ${row.appliesWhen}`}
                      </span>
                    </span>
                  ),
                },
                {
                  key: 'state',
                  header: 'Ready',
                  render: (row) =>
                    row.record ? (
                      <span className={page.muted}>Per record</span>
                    ) : row.blocking === 0 ? (
                      <Chip tone="success" icon={CircleCheck}>
                        Ready
                      </Chip>
                    ) : (
                      <Chip tone="warning" icon={FileClock}>
                        {row.missing ? `${row.missing} to fill` : `${row.blocking} to fix`}
                      </Chip>
                    ),
                },
                {
                  key: 'review',
                  header: 'Legal review',
                  priority: 'low',
                  render: (row) => <ReviewChip review={row.review} />,
                },
              ]}
            />
          </section>
        )
      })}

      <Disclosure
        summary="Points counsel re-confirms before each delivery"
        hint={`${pack.counsel.length} points`}
      >
        <ul className={styles.counsel}>
          {pack.counsel.map((point) => (
            <li key={point.id}>
              <strong>{point.id}</strong> {point.item}.{' '}
              <span className={page.muted}>{point.why}</span>
            </li>
          ))}
        </ul>
      </Disclosure>

      <Panel title="Recent downloads" titleId="downloads-title" padding="flush">
        {exports.length ? (
          <DataTable
            plain
            rows={exports}
            rowKey={(row) => String(row.id)}
            columns={[
              { key: 'at', header: 'When', render: (row) => formatIst(row.at) },
              {
                key: 'what',
                header: 'Document',
                render: (row) => (
                  <>
                    <span className="code">
                      {row.templateId === 'PACK' ? 'Pack' : row.templateId}
                    </span>
                    {row.recordRef ? ` for ${row.recordRef}` : ''}
                  </>
                ),
              },
              { key: 'format', header: 'Format', render: (row) => row.format },
              { key: 'who', header: 'By', priority: 'low', render: (row) => row.userName ?? '—' },
            ]}
          />
        ) : (
          <p className={styles.empty}>
            <FileStack size={16} aria-hidden="true" /> Nothing downloaded yet.
          </p>
        )}
      </Panel>
    </>
  )
}
