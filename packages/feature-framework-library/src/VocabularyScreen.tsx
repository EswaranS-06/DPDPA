import { Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string }

export const VocabularyScreen = async ({ api, code }: Props) => {
  const item = await orNotFound(api.vocabulary({ code }))
  const [termHeader = 'Term', meaningHeader = 'Meaning', ...extraHeaders] = item.columns
  return (
    <div className={styles.page}>
      <PageHeader title={item.title} lede={item.intro ?? undefined} />
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
