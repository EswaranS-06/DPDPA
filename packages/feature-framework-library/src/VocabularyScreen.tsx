import { Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { EditEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; editing?: boolean }

export const VocabularyScreen = async ({ api, code, editing = false }: Props) => {
  const [item, reviews] = await Promise.all([
    orNotFound(api.vocabulary({ code })),
    reviewsOf(api, 'vocabularies'),
  ])
  const [termHeader = 'Term', meaningHeader = 'Meaning', ...extraHeaders] = item.columns
  return (
    <div className={styles.page}>
      <PageHeader
        title={item.title}
        lede={item.intro ?? undefined}
        actions={
          editing ? (
            <EditEntryLink section="vocabularies" code={item.code} variant="button" />
          ) : undefined
        }
      >
        <ReviewChip review={reviews.get(item.code)} />
      </PageHeader>
      <DataTable
        rows={item.terms}
        rowKey={(row) => row.term}
        columns={[
          {
            key: 'term',
            header: termHeader,
            render: (row) => <Citation strong>{row.term}</Citation>,
          },
          ...(item.columns.length > 1
            ? [
                {
                  key: 'meaning',
                  header: meaningHeader,
                  render: (row: (typeof item.terms)[number]) => row.meaning,
                },
              ]
            : []),
          ...extraHeaders.map((header) => ({
            key: header,
            header,
            render: (row: (typeof item.terms)[number]) => row.extra[header] ?? '',
          })),
        ]}
      />
    </div>
  )
}
