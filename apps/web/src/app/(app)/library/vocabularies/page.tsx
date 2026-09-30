import { VocabularyIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Vocabularies' }

export default async function Page() {
  return <VocabularyIndexScreen api={await libraryApi()} />
}
