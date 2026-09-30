import { KnowledgeBaseScreen, type KnowledgeBaseParams } from '@duatf/feature-framework-library'
import type { Metadata } from 'next'
import { libraryApi, today } from '@/server/api'
import { firstValue, type SearchParams } from '@/server/searchParams'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Knowledge base' }

const KEYS = [
  'section',
  'item',
  'q',
  'domain',
  'phase',
  'penalty',
  'actor',
  'type',
  'sector',
  'text',
] as const satisfies readonly (keyof KnowledgeBaseParams)[]

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  const raw = await searchParams
  const params: KnowledgeBaseParams = Object.fromEntries(
    KEYS.map((key) => [key, firstValue(raw[key])]),
  )
  return <KnowledgeBaseScreen api={await libraryApi()} today={today()} params={params} />
}
