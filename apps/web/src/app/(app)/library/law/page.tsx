import { LawIndexScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi, today } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'The law' }

export default async function Page() {
  return <LawIndexScreen api={await libraryApi()} today={today()} />
}
