import { kbHref } from '@duatf/feature-framework-library-api'
import { Citation, DataTable, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ObligationRow } from './components/ObligationRow'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

export const DomainScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.domain({ code }))
  return (
    <div className={styles.page}>
      <PageHeader
        kicker={<Citation>{item.code}</Citation>}
        title={item.title}
        lede={item.description}
      />

      <section className={styles.section} aria-labelledby="obligations-title">
        <h2 id="obligations-title" className={styles.sectionTitle}>
          {item.obligations.length} obligations
        </h2>
        <ul className={styles.plainList}>
          {item.obligations.map((obligation) => (
            <ObligationRow
              key={obligation.code}
              item={obligation}
              today={today}
              showDomain={false}
            />
          ))}
        </ul>
      </section>

      <section className={styles.section} aria-labelledby="controls-title">
        <h2 id="controls-title" className={styles.sectionTitle}>
          {item.controls.length} controls
        </h2>
        <DataTable
          rows={item.controls}
          rowKey={(row) => row.code}
          columns={[
            {
              key: 'code',
              header: 'Control',
              width: '7rem',
              render: (row) => <Citation>{row.code}</Citation>,
            },
            {
              key: 'title',
              header: 'Title',
              render: (row) => (
                <Link className={styles.inlineLink} href={kbHref('controls', row.code)}>
                  {row.title}
                </Link>
              ),
            },
            { key: 'type', header: 'Type', render: (row) => row.controlType },
            { key: 'owner', header: 'Usual owner', render: (row) => row.ownerRole },
          ]}
        />
      </section>
    </div>
  )
}
