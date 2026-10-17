import { Callout, Disclosure, PageHeader, SectionHeader } from '@duatf/core-ui'
import { documentPack, RECORD_DOCUMENTS, type Source } from '@duatf/feature-compliance-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ApplicabilityForm, CollectionForm, ValuesForm } from '@/components/forms/DocumentForms'
import { loadClient } from '@/server/clients'
import { serviceContext } from '@/server/services'
import page from '../../../clients.module.css'
import {
  clearCollectionAction,
  saveCollectionAction,
  saveFlagsAction,
  saveValuesAction,
} from '../actions'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Answers and details' }

const SOURCE_TEXT: Record<Source, string> = {
  saved: 'Saved here',
  profile: 'From the client profile',
  ropa: 'From the RoPA',
  registers: 'From DUATF’s registers',
  record: 'From the record',
  default: 'The library’s default',
}

/** Fields the documents fill by themselves, never asked for here. */
const AUTOMATIC = new Set([
  'Document-Title',
  'Document-ID',
  'Document-Version',
  'Last-Updated-Date',
  'DP-Category-Label',
])

const GROUP_TITLE = (group: string) =>
  group.charAt(0).toUpperCase() + group.slice(1).replace(/-/g, ' ')

export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const client = await loadClient((await params).code)
  const pack = await documentPack(await serviceContext(), client.id)
  const target = { clientId: client.id, clientCode: client.code }
  const recordTemplates = new Set(Object.keys(RECORD_DOCUMENTS))
  // The documents the client needs, other than those built per record (they take their record's values).
  const needed = new Set(pack.recommended.filter((id) => !recordTemplates.has(id)))
  const asked = (users: readonly string[] | undefined) => (users ?? []).some((id) => needed.has(id))

  const questions = pack.flags.global.map((flag) => {
    const source = pack.sources.flags[flag.name]
    return {
      name: flag.name,
      type: flag.type,
      options: flag.options,
      question: flag.question,
      value: pack.state.flags[flag.name] ?? flag.default,
      source: source
        ? `${SOURCE_TEXT[source.source]}${'note' in source && source.note ? `: ${source.note}` : ''}.`
        : 'The library’s default.',
    }
  })

  const fields = Object.entries(pack.registry)
    .filter(([name]) => !AUTOMATIC.has(name) && asked(pack.usage.fields[name]))
    .map(([name, entry]) => {
      const source = pack.sources.values[name]
      const fallback = typeof entry.default === 'string' ? entry.default : ''
      return {
        name,
        group: entry.group ?? 'other',
        type: entry.type ?? 'text',
        description: entry.description ?? name,
        required: entry.required === true,
        value: pack.state.values[name] ?? '',
        source: source
          ? SOURCE_TEXT[source.source]
          : fallback.startsWith('=')
            ? `Unless set, the same as [${fallback.slice(1)}]`
            : fallback
              ? `Unless set: ${fallback}`
              : '',
      }
    })
  const groups = [...new Set(fields.map((field) => field.group))].sort()
  const tables = Object.entries(pack.collectionFields).filter(([name]) =>
    asked(pack.usage.collections[name]),
  )

  return (
    <>
      <PageHeader
        title="Answers and details"
        lede="What the documents are filled with. DUATF answers what it already knows from the client profile, the RoPA and the registers; an answer saved here wins over it. Only what the client’s documents use is asked."
      />
      {!pack.canEdit ? (
        <Callout tone="neutral" title="Read only">
          <p>The audit team fills these in.</p>
        </Callout>
      ) : null}

      <section className={page.section} aria-labelledby="flags-heading">
        <SectionHeader
          id="flags-heading"
          title="Applicability"
          description="The library’s questions. They decide which documents the client needs and which sections appear in them."
        />
        {pack.canEdit ? (
          <ApplicabilityForm action={saveFlagsAction.bind(null, target)} questions={questions} />
        ) : null}
      </section>

      <section className={page.section} aria-labelledby="values-heading">
        <SectionHeader
          id="values-heading"
          title="Common details"
          count={fields.length}
          description={`Each value is entered once and used in every document. ${fields.filter((field) => !field.value).length} are still empty.`}
        />
        {groups.map((group) => {
          const rows = fields.filter((field) => field.group === group)
          const empty = rows.filter((row) => !row.value).length
          return (
            <Disclosure
              key={group}
              summary={GROUP_TITLE(group)}
              hint={empty ? `${empty} of ${rows.length} empty` : `${rows.length} filled`}
            >
              {pack.canEdit ? (
                <ValuesForm action={saveValuesAction.bind(null, target)} fields={rows} />
              ) : (
                <ul>
                  {rows.map((row) => (
                    <li key={row.name}>
                      {row.description}: {row.value || '—'}
                    </li>
                  ))}
                </ul>
              )}
            </Disclosure>
          )
        })}
      </section>

      <section className={page.section} aria-labelledby="tables-heading">
        <SectionHeader
          id="tables-heading"
          title="Tables"
          count={tables.length}
          description="The library’s tables, one row each. Most come from the RoPA and the registers; paste a table from Excel to replace one."
        />
        {tables.map(([name, columns]) => {
          const rows = pack.state.collections[name] ?? []
          const source = pack.sources.collections[name]?.source
          return (
            <Disclosure
              key={name}
              summary={name}
              hint={`${rows.length} row${rows.length === 1 ? '' : 's'}${source ? `, ${SOURCE_TEXT[source].toLowerCase()}` : ''}`}
            >
              {pack.canEdit ? (
                <CollectionForm
                  action={saveCollectionAction.bind(null, target)}
                  clear={clearCollectionAction.bind(null, target)}
                  name={name}
                  fields={columns}
                  rows={rows}
                  saved={source === 'saved'}
                />
              ) : null}
            </Disclosure>
          )
        })}
      </section>

      <p className={page.muted}>
        <Link href={`/clients/${client.code}/documents`}>Back to the documents</Link>
      </p>
    </>
  )
}
