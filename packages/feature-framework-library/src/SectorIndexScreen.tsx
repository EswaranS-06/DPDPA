import { kbHref } from '@duatf/feature-framework-library-api'
import { DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import styles from './screens.module.css'

export const SectorIndexScreen = async ({ api }: { api: FrameworkLibraryApi }) => {
  const sectors = await api.sectors()
  return (
    <div className={styles.page}>
      <PageHeader
        title="Sector overlays"
        lede="DPDP runs alongside sector law. Each overlay lists the regulators, the parallel laws, how long records must be kept, and where assessments usually get stuck."
      />
      <DataTable
        rows={sectors}
        rowKey={(row) => row.code}
        columns={[
          {
            key: 'title',
            header: 'Sector',
            render: (row) => (
              <Link className={styles.inlineLink} href={kbHref('sectors', row.code)}>
                {row.title}
              </Link>
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
