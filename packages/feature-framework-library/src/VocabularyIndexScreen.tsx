import { kbHref } from '@duatf/feature-framework-library-api'
import { PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import styles from './screens.module.css'

export const VocabularyIndexScreen = async ({ api }: { api: FrameworkLibraryApi }) => {
  const vocabularies = await api.vocabularies()
  return (
    <div className={styles.page}>
      <PageHeader
        title="Vocabularies"
        lede="The controlled lists every record uses, so two assessors describe the same thing the same way."
      />
      <ul className={`${styles.indexGrid} ${styles.noCode}`}>
        {vocabularies.map((vocabulary) => (
          <li key={vocabulary.code}>
            <span>
              <Link className={styles.indexTitle} href={kbHref('vocabularies', vocabulary.code)}>
                {vocabulary.title}
              </Link>
              <span className={styles.indexMeta}>
                {vocabulary.termCount} entries{vocabulary.intro ? `. ${vocabulary.intro}` : ''}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
