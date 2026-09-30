import { PageHeader } from '@duatf/core-ui'
import type { FrameworkLibraryApi } from '@duatf/feature-framework-library-api'
import { Markdown } from './components/Markdown'
import { orNotFound } from './orNotFound'
import styles from './screens.module.css'

type Props = { api: FrameworkLibraryApi; slug: string }

export const PlaybookScreen = async ({ api, slug }: Props) => {
  const item = await orNotFound(api.playbook({ slug }))
  return (
    <div className={styles.page}>
      <PageHeader title={item.title} />
      <Markdown source={item.bodyMd} voice="guide" />
    </div>
  )
}
