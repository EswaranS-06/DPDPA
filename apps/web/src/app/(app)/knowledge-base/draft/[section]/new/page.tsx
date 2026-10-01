import { PageHeader } from '@duatf/core-ui'
import {
  codeFamilies,
  ENTRY_NOUN,
  entryForm,
  isEditableSection,
  kbHref,
  openDraft,
} from '@duatf/feature-framework-library-api'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EntryEditor } from '@/components/forms/KbForms'
import { NoDraft, SECTION_GUIDE } from '@/components/kb/EntryParts'
import { PermissionNotice } from '@/components/PermissionNotice'
import { permissionFor } from '@/server/auth'
import { authoringContext } from '@/server/knowledgeBase'
import { firstValue, type SearchParams } from '@/server/searchParams'
import { saveEntryAction } from '../../actions'
import styles from '../../draft.module.css'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'New entry' }

type Props = { params: Promise<{ section: string }>; searchParams: SearchParams }

export default async function Page({ params, searchParams }: Props) {
  const { section } = await params
  if (!isEditableSection(section)) notFound()
  const { denial } = await permissionFor('kb.edit')
  if (denial) {
    return (
      <PermissionNotice
        denial={denial}
        back={{ href: kbHref(section), label: 'Back to the knowledge base' }}
      />
    )
  }
  const ctx = await authoringContext()
  const draft = await openDraft(ctx.db)
  const header = (
    <PageHeader
      kicker={draft ? `Draft ${draft.version}` : undefined}
      title={`Add ${ENTRY_NOUN[section]}`}
      lede={SECTION_GUIDE[section]}
    />
  )
  if (!draft) {
    return (
      <>
        {header}
        <NoDraft />
      </>
    )
  }

  const prefix = firstValue((await searchParams).prefix)
  if ((section === 'data-elements' || section === 'processes') && !prefix) {
    const families = await codeFamilies(ctx, section)
    return (
      <>
        {header}
        <section className={styles.section} aria-labelledby="family-title">
          <h2 id="family-title" className={styles.intro}>
            {section === 'processes'
              ? 'Which sector is the process for? Common functions apply to every sector.'
              : 'Which family does the data element belong to?'}
          </h2>
          <ul className={styles.picker}>
            {families.map((family) => (
              <li key={family.prefix}>
                <Link href={`?prefix=${encodeURIComponent(family.prefix)}`}>
                  <span>{family.label}</span>
                  <span className={styles.pickerCode}>
                    Next code <span className="code">{family.next}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </>
    )
  }

  const form = await entryForm(ctx, section, { prefix })
  return (
    <>
      {header}
      <EntryEditor
        form={form}
        action={saveEntryAction.bind(null, section, null)}
        cancelHref={kbHref(section)}
      />
    </>
  )
}
