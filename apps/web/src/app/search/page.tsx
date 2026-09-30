import { SearchScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { firstValue, type SearchParams } from '../../server/searchParams'
import { libraryApi } from '../../server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Search' }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const query = firstValue((await searchParams).q) ?? ''
  return <SearchScreen api={libraryApi()} query={query.slice(0, 200)} />
}
