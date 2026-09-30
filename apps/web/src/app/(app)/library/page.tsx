import { LibraryOverviewScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi, today } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Knowledge base' }

export default async function Page() {
  return <LibraryOverviewScreen api={await libraryApi()} today={today()} />
}
