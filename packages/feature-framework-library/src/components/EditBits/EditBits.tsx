import { buttonClass, Chip } from '@duatf/core-ui'
import {
  draftEntryHref,
  ENTRY_NOUN,
  type EditableSection,
  type FrameworkLibraryApi,
} from '@duatf/feature-framework-library-api'
import { Pencil, Plus, ShieldQuestionMark, Sparkles } from 'lucide-react'
import Link from 'next/link'
import styles from './EditBits.module.css'

/** "Add a lawful basis": opens the editor for a new entry in the draft. */
export const AddEntryLink = ({ section }: { section: EditableSection }) => (
  <Link href={draftEntryHref(section)} className={buttonClass()}>
    <Plus size={16} aria-hidden="true" />
    Add {ENTRY_NOUN[section]}
  </Link>
)

/** Opens the editor for one entry. "label" names it for screen readers in tables. */
export const EditEntryLink = ({
  section,
  code,
  label,
  variant = 'link',
}: {
  section: EditableSection
  code: string
  label?: string
  variant?: 'link' | 'button'
}) => (
  <Link
    href={draftEntryHref(section, code)}
    className={variant === 'button' ? buttonClass('secondary') : styles.editLink}
  >
    <Pencil size={variant === 'button' ? 16 : 14} aria-hidden="true" />
    Edit
    {label ? <span className="visually-hidden"> {label}</span> : null}
  </Link>
)

export type Review = { status: 'awaiting_review' | 'reviewed'; origin: 'staff' | 'assistant' }

/** Review status of the entries of one section that were added or changed in the editor. */
export const reviewsOf = async (
  api: FrameworkLibraryApi,
  section: EditableSection,
): Promise<Map<string, Review>> =>
  new Map(
    (await api.reviews({ section })).map((row) => [
      row.code,
      { status: row.status, origin: row.origin },
    ]),
  )

/** Shown on entries whose wording has not had legal review yet; nothing once reviewed. */
export const ReviewChip = ({
  review,
  block = false,
}: {
  review: Review | undefined
  /** On a line of its own, as under an entry's title in a table. */
  block?: boolean
}) => {
  if (!review || review.status === 'reviewed') return null
  const chip =
    review.origin === 'assistant' ? (
      <Chip
        tone="pending"
        icon={Sparkles}
        title="Drafted with AI assistance. Check it against the Act and Rules before relying on it."
      >
        AI draft, awaiting legal review
      </Chip>
    ) : (
      <Chip
        tone="pending"
        icon={ShieldQuestionMark}
        title="Added or changed in the knowledge-base editor and not reviewed yet."
      >
        Awaiting legal review
      </Chip>
    )
  return block ? <span className={styles.block}>{chip}</span> : chip
}
