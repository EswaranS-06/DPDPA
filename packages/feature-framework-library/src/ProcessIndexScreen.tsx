import { kbHref } from '@duatf/feature-framework-library-api'
import { Chip, Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { AddEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; sector?: string; editing?: boolean }

export const ProcessIndexScreen = async ({ api, sector, editing = false }: Props) => {
  const [all, sectors, reviews] = await Promise.all([
    api.processes(),
    api.sectors(),
    reviewsOf(api, 'processes'),
  ])
  const names = new Map(all.map((process) => [process.sectorCode, process.sectorName]))
  const sectorCodes = [...names.keys()].sort((a, b) =>
    a === 'CMN' ? -1 : b === 'CMN' ? 1 : a.localeCompare(b),
  )
  const titleOf = (code: string) =>
    code === 'CMN'
      ? 'Common functions'
      : (sectors.find((item) => item.code === code)?.title ?? code)
  const shown = sector ? all.filter((process) => process.sectorCode === sector) : all

  return (
    <div className={styles.page}>
      <PageHeader
        title="Process catalogue"
        lede="Templates of common business processes. Start discovery from the ones a client runs, then record what actually happens."
        actions={editing ? <AddEntryLink section="processes" /> : undefined}
      />
      <nav aria-label="Filter by sector">
        <ul className={styles.sectorLinks}>
          <li>
            <Chip tone={sector ? 'neutral' : 'brand'}>
              <Link href={kbHref('processes')} aria-current={sector ? undefined : 'page'}>
                All {all.length}
              </Link>
            </Chip>
          </li>
          {sectorCodes.map((code) => (
            <li key={code}>
              <Chip tone={sector === code ? 'brand' : 'neutral'}>
                <Link
                  href={kbHref('processes', undefined, { sector: code })}
                  aria-current={sector === code ? 'page' : undefined}
                >
                  {titleOf(code)}
                </Link>
              </Chip>
            </li>
          ))}
        </ul>
      </nav>
      <DataTable
        rows={shown}
        rowKey={(row) => row.code}
        columns={[
          {
            key: 'code',
            header: 'Template',
            width: '7rem',
            render: (row) => <Citation>{row.code}</Citation>,
          },
          {
            key: 'title',
            header: 'Process',
            render: (row) => (
              <>
                <Link className={styles.inlineLink} href={kbHref('processes', row.code)}>
                  {row.title}
                </Link>
                <ReviewChip review={reviews.get(row.code)} block />
              </>
            ),
          },
          { key: 'department', header: 'Department', render: (row) => row.department },
          { key: 'sector', header: 'Sector', render: (row) => titleOf(row.sectorCode) },
          {
            key: 'activities',
            header: 'Activities',
            align: 'end',
            render: (row) => row.activityCount,
          },
        ]}
      />
    </div>
  )
}
