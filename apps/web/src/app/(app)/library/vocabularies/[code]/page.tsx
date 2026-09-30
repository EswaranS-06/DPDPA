import { VocabularyScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).code),
})

export default async function Page({ params }: Props) {
  const { code } = await params
  return <VocabularyScreen api={await libraryApi()} code={decodeURIComponent(code)} />
}
