import { formatIst } from '@duatf/core-utils'
import { buttonClass } from '@duatf/core-ui'
import { KB_DRAFT_PATH, type ReleaseOverview } from '@duatf/feature-framework-library-api'
import { FilePen, GitBranch } from 'lucide-react'
import Link from 'next/link'
import { setKbViewAction } from '@/app/(app)/knowledge-base/draft/actions'
import styles from './ReleaseBar.module.css'

const ViewSwitch = ({
  view,
  label,
  returnTo,
}: {
  view: string
  label: string
  returnTo: string
}) => (
  <form action={setKbViewAction}>
    <input type="hidden" name="view" value={view} />
    <input type="hidden" name="next" value={returnTo} />
    <button type="submit" className={buttonClass('secondary', 'sm')}>
      {label}
    </button>
  </form>
)

/**
 * For knowledge-base editors: which release they are reading, the open draft and its state,
 * and the switch between the published release and the draft.
 */
export const ReleaseBar = ({
  overview,
  viewingDraft,
  returnTo,
}: {
  overview: ReleaseOverview
  viewingDraft: boolean
  returnTo: string
}) => {
  const { published, draft } = overview
  const changes = draft
    ? `${draft.changes} ${draft.changes === 1 ? 'change' : 'changes'}${draft.awaitingReview ? `, ${draft.awaitingReview} awaiting legal review` : ''}`
    : ''
  return (
    <section
      className={viewingDraft ? `${styles.bar} ${styles.draft}` : styles.bar}
      aria-label="Knowledge base release"
    >
      <span className={styles.icon} aria-hidden="true">
        {viewingDraft ? <FilePen size={18} /> : <GitBranch size={18} />}
      </span>
      <p className={styles.text}>
        {viewingDraft && draft ? (
          <>
            <strong>You are reading draft {draft.version}</strong> ({changes}). Clients and
            assessments still use release {published?.version ?? 'none'} until it is published.
          </>
        ) : draft ? (
          <>
            <strong>Release {published?.version}</strong> is published. Draft {draft.version} is
            open with {changes}.
          </>
        ) : (
          <>
            <strong>Release {published?.version ?? 'none'}</strong>
            {published?.publishedAt ? `, published ${formatIst(published.publishedAt)}` : ''}. To
            add or change entries, start a draft release.
          </>
        )}
      </p>
      <div className={styles.actions}>
        {draft ? (
          viewingDraft ? (
            <ViewSwitch view="published" label="Show the published release" returnTo={returnTo} />
          ) : (
            <ViewSwitch view="draft" label={`Show draft ${draft.version}`} returnTo={returnTo} />
          )
        ) : null}
        <Link href={KB_DRAFT_PATH} className={buttonClass(draft ? 'ghost' : 'secondary', 'sm')}>
          {draft ? 'Review and publish' : 'Start a draft'}
        </Link>
      </div>
    </section>
  )
}
