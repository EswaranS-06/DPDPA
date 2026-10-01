import { kbHref } from '@duatf/feature-framework-library-api'
import { DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { AddEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; editing?: boolean }

export const SectorIndexScreen = async ({ api, editing = false }: Props) => {
  const [sectors, reviews] = await Promise.all([api.sectors(), reviewsOf(api, 'sectors')])
  return (
    <div className={styles.page}>
      <PageHeader
        title="Sector overlays"
        lede="DPDP runs alongside sector law. Each overlay lists the regulators, the parallel laws, how long records must be kept, and where assessments usually get stuck."
        actions={editing ? <AddEntryLink section="sectors" /> : undefined}
      />
      <DataTable
        rows={sectors}
        rowKey={(row) => row.code}
        columns={[
          {
            key: 'title',
            header: 'Sector',
            render: (row) => (
              <>
                <Link className={styles.inlineLink} href={kbHref('sectors', row.code)}>
                  {row.title}
                </Link>
                <ReviewChip review={reviews.get(row.code)} block />
              </>
            ),
          },
          { key: 'covers', header: 'Covers', render: (row) => row.covers },
          { key: 'regulators', header: 'Regulators', render: (row) => row.regulators.join(', ') },
          {
            key: 'processes',
            header: 'Process templates',
            align: 'end',
            render: (row) => row.processCount,
          },
        ]}
      />
    </div>
  )
}
