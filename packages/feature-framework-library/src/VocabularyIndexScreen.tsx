import { kbHref } from '@duatf/feature-framework-library-api'
import { PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { AddEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; editing?: boolean }

export const VocabularyIndexScreen = async ({ api, editing = false }: Props) => {
  const [vocabularies, reviews] = await Promise.all([
    api.vocabularies(),
    reviewsOf(api, 'vocabularies'),
  ])
  return (
    <div className={styles.page}>
      <PageHeader
        title="Vocabularies"
        lede="The controlled lists every record uses, so two assessors describe the same thing the same way."
        actions={editing ? <AddEntryLink section="vocabularies" /> : undefined}
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
              <ReviewChip review={reviews.get(vocabulary.code)} block />
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
