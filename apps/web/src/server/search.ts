import { searchWorkspace } from '@duatf/feature-compliance-api'
import { kbHref } from '@duatf/feature-framework-library-api'
import type { PaletteHit } from '@/components/shell/CommandPalette'
import { libraryApi } from './api'
import type { serviceContext } from './services'

const KNOWLEDGE_LIMIT = 8

/**
 * Everything the user can open that matches: their clients' records first, then the
 * knowledge base (provisions, obligations, controls and questions).
 */
export const searchEverything = async (
  ctx: Awaited<ReturnType<typeof serviceContext>>,
  query: string,
): Promise<PaletteHit[]> => {
  const trimmed = query.trim().slice(0, 100)
  if (trimmed.length < 2) return []
  const [workspace, knowledge] = await Promise.all([
    searchWorkspace(ctx, trimmed),
    (await libraryApi()).search({ query: trimmed }),
  ])
  const records: PaletteHit[] = workspace.map((hit) => ({
    kind: hit.kind,
    title: hit.kind === 'client' ? hit.title : `${hit.code} ${hit.title}`,
    detail: hit.kind === 'client' ? hit.code : hit.clientName,
    href: hit.href,
  }))
  const library: PaletteHit[] = [
    ...knowledge.law.map((row) => ({
      title: `${row.code} ${row.title}`,
      detail: 'DPDP Act and Rules',
      href: kbHref('law', row.code),
    })),
    ...knowledge.obligations.map((row) => ({
      title: `${row.code} ${row.title}`,
      detail: [row.actRef, row.ruleRef].filter(Boolean).join(', ') || 'Obligation',
      href: kbHref('obligations', row.code),
    })),
    ...knowledge.controls.map((row) => ({
      title: `${row.code} ${row.title}`,
      detail: 'Control',
      href: kbHref('controls', row.code),
    })),
    ...knowledge.questions.map((row) => ({
      title: `${row.code} ${row.text}`,
      detail: 'Assessment question',
      href: kbHref('questions', row.code),
    })),
  ]
    .slice(0, KNOWLEDGE_LIMIT)
    .map((hit) => ({ ...hit, kind: 'knowledge' as const }))
  return [...records, ...library]
}
