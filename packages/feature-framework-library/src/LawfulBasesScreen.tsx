import { Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { AddEntryLink, EditEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import styles from './screens.module.css'

const group = (code: string) =>
  code === 'consent' ? 'Consent' : code.startsWith('s7') ? 'Legitimate use' : 'Exemption'

type Props = { api: FrameworkLibraryApi; editing?: boolean }

export const LawfulBasesScreen = async ({ api, editing = false }: Props) => {
  const [{ bases }, reviews] = await Promise.all([api.law(), reviewsOf(api, 'bases')])
  return (
    <div className={styles.page}>
      <PageHeader
        title="Lawful bases and exemptions"
        lede="The codes used on purposes and activities. Section 4 allows processing only on consent or a legitimate use under s.7; s.17 exemptions switch off parts of the Act and must be documented."
        actions={editing ? <AddEntryLink section="bases" /> : undefined}
      />
      <DataTable
        rows={bases}
        rowKey={(row) => row.code}
        rowId={(row) => row.code}
        columns={[
          {
            key: 'code',
            header: 'Code',
            width: '7rem',
            render: (row) => <Citation strong>{row.code}</Citation>,
          },
          {
            key: 'name',
            header: 'Meaning',
            render: (row) => (
              <>
                {row.name}
                {row.explanation ? (
                  <span className={styles.indexMeta}>{row.explanation}</span>
                ) : null}
                <ReviewChip review={reviews.get(row.code)} block />
              </>
            ),
          },
          { key: 'group', header: 'Kind', render: (row) => group(row.code) },
          {
            key: 'reference',
            header: 'Reference',
            render: (row) => <Citation>{row.reference}</Citation>,
          },
          ...(editing
            ? [
                {
                  key: 'edit',
                  header: <span className="visually-hidden">Edit</span>,
                  label: '',
                  render: (row: (typeof bases)[number]) => (
                    <EditEntryLink section="bases" code={row.code} label={row.name} />
                  ),
                },
              ]
            : []),
        ]}
      />
    </div>
  )
}
