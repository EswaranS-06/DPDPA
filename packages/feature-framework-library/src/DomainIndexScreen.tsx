import { PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import styles from './screens.module.css'

export const DomainIndexScreen = async ({ api }: { api: FrameworkLibraryApi }) => {
  const domains = await api.domains()
  return (
    <div className={styles.page}>
      <PageHeader
        title="Domains"
        lede="The framework groups obligations and controls into 18 domains, from governance to Consent Manager operations."
      />
      <ul className={styles.indexGrid}>
        {domains.map((domain) => (
          <li key={domain.code}>
            <span className={styles.indexCode}>{domain.code}</span>
            <span>
              <Link className={styles.indexTitle} href={`/library/domains/${domain.code}`}>
                {domain.title}
              </Link>
              <span className={styles.indexMeta}>{domain.description}</span>
              <span className={styles.indexMeta}>
                {domain.obligationCount} obligations, {domain.controlCount} controls
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
