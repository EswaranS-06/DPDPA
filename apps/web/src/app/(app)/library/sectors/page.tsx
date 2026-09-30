import { SectorIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Sector overlays' }

export default async function Page() {
  return <SectorIndexScreen api={await libraryApi()} />
}
