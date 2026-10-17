import { buttonClass, FormActions, PageHeader, Panel } from '@duatf/core-ui'
import { clauseOf, documentPack, PACK_PRESETS } from '@duatf/feature-compliance-api'
import { Download } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { loadClient } from '@/server/clients'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { serviceContext } from '@/server/services'
import page from '../../../clients.module.css'
import styles from '../documents.module.css'
import local from './clauses.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Clause pack' }

type Props = { params: Promise<{ code: string }>; searchParams: SearchParams }

const many = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value : value ? [value] : []

export default async function Page({ params, searchParams }: Props) {
  const client = await loadClient((await params).code)
  const ctx = await serviceContext()
  const query = await searchParams
  const doc = firstValue(query.doc) ?? ''
  const presets = many(query.preset)
  const options = {
    templateId: doc || undefined,
    presets,
    number: firstValue(query.number) || undefined,
    title: firstValue(query.title) || undefined,
    intro: firstValue(query.intro) || undefined,
    replace: firstValue(query.replace),
  }
  const [pack, clause] = await Promise.all([
    documentPack(ctx, client.id),
    doc || presets.length ? clauseOf(ctx, client.id, options) : Promise.resolve(null),
  ])
  const base = `/clients/${client.code}/documents/clauses`
  const params2 = new URLSearchParams()
  if (doc) params2.set('doc', doc)
  for (const preset of presets) params2.append('preset', preset)
  for (const key of ['number', 'title', 'intro', 'replace'] as const) {
    const value = firstValue(query[key])
    if (value) params2.set(key, value)
  }
  const download = (format: string) => `${base}/download?${params2.toString()}&format=${format}`

  return (
    <>
      <PageHeader
        title="Clause pack"
        lede="One numbered clause (such as 14, 14.1, 14.1.1) to add to an NDA, MSA, statement of work or vendor contract, instead of issuing a separate document. Take a whole document, or sections of several through the library’s presets."
      />
      <div className={styles.layout}>
        <Panel title="Clause" titleId="clause-preview">
          {clause ? (
            <div className={styles.preview} dangerouslySetInnerHTML={{ __html: clause.html }} />
          ) : (
            <p className={page.muted}>Choose a document or a preset to see the clause.</p>
          )}
        </Panel>
        <div className={styles.side}>
          <Panel title="What it takes" titleId="clause-form">
            <form method="get" className={local.form}>
              <label className={local.field}>
                <span>A whole document</span>
                <select name="doc" defaultValue={doc}>
                  <option value="">None</option>
                  {pack.templates.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.id} {row.title}
                    </option>
                  ))}
                </select>
              </label>
              <fieldset className={local.presets}>
                <legend>Sections from the presets</legend>
                {PACK_PRESETS.map((preset) => (
                  <label key={preset.key} className={local.check}>
                    <input
                      type="checkbox"
                      name="preset"
                      value={preset.key}
                      defaultChecked={presets.includes(preset.key)}
                    />
                    <span>
                      {preset.label}
                      <span className={page.muted}> ({preset.hint})</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <label className={local.field}>
                <span>Clause number</span>
                <input name="number" defaultValue={options.number ?? '1'} />
              </label>
              <label className={local.field}>
                <span>Clause title</span>
                <input
                  name="title"
                  defaultValue={options.title ?? ''}
                  placeholder="Data Protection"
                />
              </label>
              <label className={local.field}>
                <span>Opening sentence</span>
                <textarea name="intro" rows={2} defaultValue={options.intro ?? ''} />
              </label>
              <label className={local.field}>
                <span>Replace wording, one “old =&gt; new” per line</span>
                <textarea
                  name="replace"
                  rows={2}
                  defaultValue={options.replace ?? ''}
                  placeholder="this DPA => this Clause"
                />
              </label>
              <FormActions>
                <button type="submit" className={buttonClass()}>
                  Show the clause
                </button>
              </FormActions>
            </form>
          </Panel>
          {clause && pack.canEdit ? (
            <Panel title="Download" titleId="clause-download">
              <div className={styles.downloads}>
                <a href={download('docx')} className={buttonClass('secondary')} rel="nofollow">
                  <Download size={16} aria-hidden="true" />
                  Word
                </a>
                <a href={download('md')} className={buttonClass('ghost', 'sm')} rel="nofollow">
                  Markdown
                </a>
                <a href={download('html')} className={buttonClass('ghost', 'sm')} rel="nofollow">
                  HTML
                </a>
              </div>
              <p className={page.muted}>
                {clause.sections} sections. After pasting, check cross-references such as “Clause
                6.2” in the text.
              </p>
            </Panel>
          ) : null}
          <p className={page.muted}>
            <Link href={`/clients/${client.code}/documents`}>Back to the documents</Link>
          </p>
        </div>
      </div>
    </>
  )
}
