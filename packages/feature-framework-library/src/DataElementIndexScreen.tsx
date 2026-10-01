import { Chip, Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { AddEntryLink, EditEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import { sentence } from './consts/labels'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; editing?: boolean }

export const DataElementIndexScreen = async ({ api, editing = false }: Props) => {
  const [elements, reviews] = await Promise.all([
    api.dataElements(),
    reviewsOf(api, 'data-elements'),
  ])
  const categories = new Set(elements.map((element) => element.category)).size
  return (
    <div className={styles.page}>
      <PageHeader
        title="Data elements"
        lede={`${elements.length} kinds of personal data in ${categories} categories. Sensitivity tags such as health, biometric and financial raise the impact score of a finding; they do not change which obligations apply.`}
        actions={editing ? <AddEntryLink section="data-elements" /> : undefined}
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
                <ReviewChip review={reviews.get(row.code)} block />
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
          ...(editing
            ? [
                {
                  key: 'edit',
                  header: <span className="visually-hidden">Edit</span>,
                  label: '',
                  render: (row: (typeof elements)[number]) => (
                    <EditEntryLink section="data-elements" code={row.code} label={row.title} />
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
