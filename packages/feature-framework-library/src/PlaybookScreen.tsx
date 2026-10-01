import { PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { EditEntryLink, ReviewChip, reviewsOf } from './components/EditBits'
import { Markdown } from './components/Markdown'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; slug: string; editing?: boolean }

export const PlaybookScreen = async ({ api, slug, editing = false }: Props) => {
  const [item, reviews] = await Promise.all([
    orNotFound(api.playbook({ slug })),
    reviewsOf(api, 'playbooks'),
  ])
  return (
    <div className={styles.page}>
      <PageHeader
        title={item.title}
        actions={
          editing ? (
            <EditEntryLink section="playbooks" code={item.slug} variant="button" />
          ) : undefined
        }
      >
        <ReviewChip review={reviews.get(item.slug)} />
      </PageHeader>
      <Markdown source={item.bodyMd} voice="guide" />
    </div>
  )
}
