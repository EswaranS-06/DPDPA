import { DomainScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi, today } from '@/server/api'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ code: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => ({
  title: decodeURIComponent((await params).code),
})

export default async function Page({ params }: Props) {
  const { code } = await params
  return <DomainScreen api={await libraryApi()} code={decodeURIComponent(code)} today={today()} />
}
