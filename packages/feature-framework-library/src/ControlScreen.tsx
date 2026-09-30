import { Chip, Citation, DataTable, MarginRow, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { ObligationRow } from './components/ObligationRow'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string; today: string }

export const ControlScreen = async ({ api, code, today }: Props) => {
  const item = await orNotFound(api.control({ code }))
  const crosswalk = [
    { framework: 'ISO/IEC 27001:2022, Annex A', refs: item.iso27001 },
    { framework: 'ISO/IEC 27701:2019', refs: item.iso27701 },
    { framework: 'NIST Cybersecurity Framework 2.0', refs: item.nistCsf },
  ].filter((row) => row.refs.length > 0)

  return (
    <div className={styles.page}>
      <PageHeader
        kicker={<Citation>{item.code}</Citation>}
        title={item.title}
        lede={item.description}
      >
        <Chip>{item.controlType}</Chip>
        <Chip>{item.nature}</Chip>
        <Chip>{item.frequency}</Chip>
        <Chip>
          <Link href={`/library/domains/${item.domain.code}`}>
            {item.domain.code} {item.domain.title}
          </Link>
        </Chip>
      </PageHeader>

      <div>
        <MarginRow margin="How to test it">
          <p className={styles.flush}>{item.testProcedure || 'No test procedure is recorded.'}</p>
        </MarginRow>
        <MarginRow margin="Evidence">
          <ul className={styles.bullets}>
            {item.evidence.map((evidence) => (
              <li key={evidence}>{evidence}</li>
            ))}
          </ul>
        </MarginRow>
        <MarginRow margin="Usual owner">
          <p className={styles.flush}>{item.ownerRole}</p>
        </MarginRow>
      </div>

      <section className={styles.section} aria-labelledby="obligations-title">
        <h2 id="obligations-title" className={styles.sectionTitle}>
          Obligations it satisfies
        </h2>
        <ul className={styles.plainList}>
          {item.obligations.map((obligation) => (
            <ObligationRow key={obligation.code} item={obligation} today={today} />
          ))}
        </ul>
      </section>

      {crosswalk.length ? (
        <section className={styles.section} aria-labelledby="crosswalk-title">
          <h2 id="crosswalk-title" className={styles.sectionTitle}>
            Mapping to other frameworks
          </h2>
          <DataTable
            rows={crosswalk}
            rowKey={(row) => row.framework}
            columns={[
              { key: 'framework', header: 'Framework', render: (row) => row.framework },
              {
                key: 'refs',
                header: 'Reference',
                render: (row) => (
                  <span className={styles.chips}>
                    {row.refs.map((ref) => (
                      <Citation key={ref}>{ref}</Citation>
                    ))}
                  </span>
                ),
              },
            ]}
          />
        </section>
      ) : null}
    </div>
  )
}
