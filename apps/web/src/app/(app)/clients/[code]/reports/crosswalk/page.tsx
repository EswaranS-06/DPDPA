import { DataTable, Disclosure, EmptyState, PageHeader, Panel } from '@duatf/core-ui'
import { standardsCrosswalk } from '@duatf/feature-compliance-api'
import { Waypoints } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PrintButton } from '@/components/PrintButton'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import styles from '../../../clients.module.css'
import local from './crosswalk.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Standards crosswalk' }

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const crosswalk = await standardsCrosswalk(await serviceContext(), client.id)
  const base = `/clients/${client.code}`

  return (
    <>
      <PageHeader
        title="Standards crosswalk"
        lede={`${client.name}’s ${crosswalk.openGaps} open gaps against the standards the knowledge base maps its controls to. A gap appears under every reference of its control, so work done for one standard can be seen to count for another.`}
        actions={<PrintButton />}
      />
      {crosswalk.openGaps === 0 ? (
        <EmptyState icon={Waypoints} title="No open gaps">
          The crosswalk lists open findings; there are none.
        </EmptyState>
      ) : (
        crosswalk.standards.map((standard) => (
          <Panel
            key={standard.key}
            title={standard.label}
            titleId={`standard-${standard.key}`}
            padding={standard.references.length ? 'flush' : 'normal'}
          >
            {standard.references.length ? (
              <DataTable
                plain
                rows={standard.references}
                rowKey={(row) => row.reference}
                columns={[
                  {
                    key: 'reference',
                    header: standard.part,
                    render: (row) => <span className="code">{row.reference}</span>,
                  },
                  {
                    key: 'controls',
                    header: 'Controls',
                    priority: 'low',
                    render: (row) => row.controls.join(', '),
                  },
                  {
                    key: 'gaps',
                    header: 'Open gaps',
                    render: (row) => (
                      <Disclosure summary={`${row.gaps.length} open gap${row.gaps.length === 1 ? '' : 's'}`}>
                        <ul className={local.gapList}>
                          {row.gaps.map((gap) => (
                            <li key={gap.code}>
                              <Link href={`${base}/findings/${gap.code}`} className="code">
                                {gap.code}
                              </Link>{' '}
                              {gap.title}
                            </li>
                          ))}
                        </ul>
                      </Disclosure>
                    ),
                  },
                ]}
              />
            ) : (
              <p className={styles.muted}>No open gap maps to this standard.</p>
            )}
            {standard.unmapped ? (
              <p className={local.note}>
                {standard.unmapped} open gap{standard.unmapped === 1 ? '' : 's'} sit under controls
                with no reference in this standard.
              </p>
            ) : null}
          </Panel>
        ))
      )}
    </>
  )
}
