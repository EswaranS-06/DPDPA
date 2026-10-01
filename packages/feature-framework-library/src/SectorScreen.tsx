import { kbHref } from '@duatf/feature-framework-library-api'
import { Chip, Citation, DataTable, MarginRow, PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; code: string }

export const SectorScreen = async ({ api, code }: Props) => {
  const item = await orNotFound(api.sector({ code }))
  const unverified = item.retention.filter(
    (row) => row.confidence.toLowerCase() === 'verify',
  ).length

  return (
    <div className={styles.page}>
      <PageHeader
        kicker={<Citation>SEC-{item.code}</Citation>}
        title={item.title}
        lede={item.covers}
      />

      <div>
        <MarginRow margin="Regulators">
          <div className={styles.chips}>
            {item.regulators.map((regulator) => (
              <Chip key={regulator}>{regulator}</Chip>
            ))}
          </div>
        </MarginRow>
        <MarginRow margin="Whose data">
          <div className={styles.chips}>
            {item.keyPrincipals.map((principal) => (
              <Chip key={principal}>{principal}</Chip>
            ))}
          </div>
        </MarginRow>
        {item.localisation ? (
          <MarginRow margin="Localisation">
            <p className={styles.flush}>{item.localisation}</p>
          </MarginRow>
        ) : null}
        {item.hotspots.length ? (
          <MarginRow margin="Where DPDP bites">
            <ul className={styles.bullets}>
              {item.hotspots.map((hotspot) => (
                <li key={hotspot}>{hotspot}</li>
              ))}
            </ul>
          </MarginRow>
        ) : null}
      </div>

      {item.laws.length ? (
        <section className={styles.section} aria-labelledby="laws-title">
          <h2 id="laws-title" className={styles.sectionTitle}>
            Laws that run alongside DPDP
          </h2>
          <p className={styles.sectionIntro}>
            DPDP applies in addition to these laws (s.38), and stricter sectoral transfer rules
            survive (s.16(2)).
          </p>
          <DataTable
            rows={item.laws}
            rowKey={(row) => row.law}
            columns={[
              { key: 'law', header: 'Law or instrument', width: '40%', render: (row) => row.law },
              {
                key: 'relevance',
                header: 'Why it matters for personal data',
                render: (row) => row.relevance,
              },
            ]}
          />
        </section>
      ) : null}

      {item.retention.length ? (
        <section className={styles.section} aria-labelledby="retention-title">
          <h2 id="retention-title" className={styles.sectionTitle}>
            How long records must be kept
          </h2>
          <p className={styles.sectionIntro}>
            These periods justify keeping data after its purpose ends (s.8(7), s.12(3)).
            {unverified
              ? ` ${unverified} ${unverified === 1 ? 'entry needs' : 'entries need'} checking against the current text before you cite it to a client.`
              : ''}
          </p>
          <DataTable
            rows={item.retention}
            rowKey={(row) => `${row.record}-${row.source}`}
            columns={[
              { key: 'record', header: 'Record', render: (row) => row.record },
              { key: 'period', header: 'Period', render: (row) => row.period },
              { key: 'source', header: 'Source', render: (row) => row.source },
              {
                key: 'confidence',
                header: 'Status',
                render: (row) =>
                  row.confidence.toLowerCase() === 'verify' ? (
                    <Chip tone="warning">Verify before citing</Chip>
                  ) : (
                    <Chip tone="success">Checked</Chip>
                  ),
              },
            ]}
          />
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="processes-title">
        <h2 id="processes-title" className={styles.sectionTitle}>
          Process templates for this sector
        </h2>
        <ul className={styles.bullets}>
          {item.processes.map((process) => (
            <li key={process.code}>
              <Link className={styles.inlineLink} href={kbHref('processes', process.code)}>
                {process.code} {process.title}
              </Link>{' '}
              <span className={styles.muted}>{process.department}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
