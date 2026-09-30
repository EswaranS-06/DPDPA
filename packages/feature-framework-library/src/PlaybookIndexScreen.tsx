import { kbHref } from '@duatf/feature-framework-library-api'
import { PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import Link from 'next/link'
import { DOC_TYPE_LABEL } from './consts/labels'
import styles from './screens.module.css'

export const PlaybookIndexScreen = async ({ api }: { api: FrameworkLibraryApi }) => {
  const playbooks = await api.playbooks()
  return (
    <div className={styles.page}>
      <PageHeader
        title="Playbooks"
        lede="How the assessment is run: the methodology, scoping questions, where fieldwork gets stuck, and what evidence to ask for."
      />
      <ul className={`${styles.indexGrid} ${styles.noCode}`}>
        {playbooks.map((playbook) => (
          <li key={playbook.slug}>
            <span>
              <Link className={styles.indexTitle} href={kbHref('playbooks', playbook.slug)}>
                {playbook.title}
              </Link>
              <span className={styles.indexMeta}>
                {DOC_TYPE_LABEL[playbook.docType] ?? playbook.docType}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
