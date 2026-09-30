import { ProcessIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Process catalogue' }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const sector = firstValue((await searchParams).sector)
  return <ProcessIndexScreen api={await libraryApi()} sector={sector} />
}
