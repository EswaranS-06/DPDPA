import { can } from '@duatf/core-access'
import { KnowledgeBaseScreen, type KnowledgeBaseParams } from '@duatf/feature-framework-library'
import { releaseOverview } from '@duatf/feature-framework-library-api'
import type { Metadata } from 'next'
import { ReleaseBar } from '@/components/kb/ReleaseBar'
import { libraryApi, today } from '@/server/api'
import { requireSession } from '@/server/auth'
import { viewingDraft } from '@/server/knowledgeBase'
import { database } from '@/server/runtime'
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
  const { principal } = await requireSession()
  const editor = can(principal, 'kb.edit')
  const draft = await viewingDraft()
  const here = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString()
  return (
    <>
      {editor ? (
        <ReleaseBar
          overview={await releaseOverview(database().db)}
          viewingDraft={draft}
          returnTo={here ? `/knowledge-base?${here}` : '/knowledge-base'}
        />
      ) : null}
      <KnowledgeBaseScreen
        api={await libraryApi({ draft })}
        today={today()}
        params={params}
        editing={draft}
      />
    </>
  )
}
