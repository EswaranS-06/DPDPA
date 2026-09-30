import { PlaybookScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '../../../../server/api'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).slug),
})

export default async function Page({ params }: Props) {
  const { slug } = await params
  return <PlaybookScreen api={libraryApi()} slug={decodeURIComponent(slug)} />
}
