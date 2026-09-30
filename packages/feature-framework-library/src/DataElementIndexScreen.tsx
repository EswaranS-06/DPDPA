import { Chip, Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { sentence } from './consts/labels'
import styles from './screens.module.css'

export const DataElementIndexScreen = async ({ api }: { api: FrameworkLibraryApi }) => {
  const elements = await api.dataElements()
  const categories = new Set(elements.map((element) => element.category)).size
  return (
    <div className={styles.page}>
      <PageHeader
        title="Data elements"
        lede={`${elements.length} kinds of personal data in ${categories} categories. Sensitivity tags such as health, biometric and financial raise the impact score of a finding; they do not change which obligations apply.`}
      />
      <DataTable
        rows={elements}
        rowKey={(row) => row.code}
        rowId={(row) => row.code}
        columns={[
          {
            key: 'code',
            header: 'Code',
            width: '8rem',
            render: (row) => <Citation>{row.code}</Citation>,
          },
          {
            key: 'title',
            header: 'Data element',
            render: (row) => (
              <>
                {row.title}
                {row.note ? <span className={styles.indexMeta}>{row.note}</span> : null}
              </>
            ),
          },
          { key: 'category', header: 'Category', render: (row) => sentence(row.category) },
          {
            key: 'tags',
            header: 'Sensitivity',
            render: (row) => (
              <span className={styles.chips}>
                {row.contextTags.map((tag) => (
                  <Chip key={tag}>{sentence(tag)}</Chip>
                ))}
              </span>
            ),
          },
        ]}
      />
    </div>
  )
}
