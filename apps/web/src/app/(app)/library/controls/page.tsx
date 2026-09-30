import { ControlIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Controls' }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  return (
    <ControlIndexScreen
      api={await libraryApi()}
      params={{
        domain: firstValue(params.domain),
        type: firstValue(params.type),
        q: firstValue(params.q),
      }}
    />
  )
}
