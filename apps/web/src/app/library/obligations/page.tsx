import { ObligationIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { firstValue, type SearchParams } from '../../../server/searchParams'
import { libraryApi, today } from '../../../server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Obligations' }

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  return (
    <ObligationIndexScreen
      api={libraryApi()}
      today={today()}
      params={{
        domain: firstValue(params.domain),
        phase: firstValue(params.phase),
        penalty: firstValue(params.penalty),
        actor: firstValue(params.actor),
        q: firstValue(params.q),
      }}
    />
  )
}
