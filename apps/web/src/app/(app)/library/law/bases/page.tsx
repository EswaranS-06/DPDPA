import { LawfulBasesScreen } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi } from '@/server/api'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Lawful bases and exemptions' }

export default async function Page() {
  return <LawfulBasesScreen api={await libraryApi()} />
}
