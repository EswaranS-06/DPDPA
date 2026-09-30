import { DataElementIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Data elements' }

export default async function Page() {
  return <DataElementIndexScreen api={await libraryApi()} />
}
