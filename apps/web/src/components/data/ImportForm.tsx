'use client'

import { buttonClass, Callout, FormActions, FormAlert } from '@duatf/core-ui'
import type { ImportPlan } from '@duatf/feature-compliance-api'
import { Download, FileCheck2, Upload } from 'lucide-react'
import Link from 'next/link'
import { startTransition, useActionState, useState, type FormEvent } from 'react'
import styles from './Ropa.module.css'

export type ImportState = {
  status: 'idle' | 'error' | 'checked' | 'applied'
  message?: string
  plan?: ImportPlan
  applied?: ImportPlan['counts']
}

type Action = (state: ImportState, formData: FormData) => Promise<ImportState>

const ACTION_LABEL = { create: 'Add', update: 'Change', remove: 'Remove' } as const

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/**
 * Import of an edited workbook in two steps: check the file (nothing is saved), then import the
 * changes listed. The file stays chosen between the steps; choosing another file starts again.
 */
export const ImportForm = ({
  action,
  noun,
  exportHref,
  doneHref,
}: {
  action: Action
  /** "activity" or "data element". */
  noun: { one: string; many: string }
  exportHref: string
  doneHref: string
}) => {
  const [state, dispatch, pending] = useActionState(action, { status: 'idle' } as ImportState)
  const [stale, setStale] = useState(false)
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const submitter = (event.nativeEvent as SubmitEvent).submitter
    const data = new FormData(event.currentTarget, submitter)
    setStale(false)
    startTransition(() => dispatch(data))
  }
  const plan = !stale && state.status === 'checked' ? state.plan : undefined
  const changes = plan ? plan.counts.create + plan.counts.update + plan.counts.remove : 0

  if (state.status === 'applied' && state.applied) {
    const { create, update, remove } = state.applied
    return (
      <Callout tone="success" title="Imported">
        <p>
          {plural(create, `${noun.one} added`, `${noun.many} added`)},{' '}
          {plural(update, 'changed', 'changed')} and {plural(remove, 'removed', 'removed')}.{' '}
          <Link href={doneHref}>See the result</Link>.
        </p>
      </Callout>
    )
  }

  return (
    <form onSubmit={onSubmit} className={styles.importForm} noValidate>
      <ol className={styles.steps}>
        <li>
          <a href={exportHref} rel="nofollow">
            Export the workbook
          </a>{' '}
          and edit it in Excel. Its dropdowns hold the knowledge base’s answers.
        </li>
        <li>Choose the edited file and check it. Nothing is saved yet.</li>
        <li>Read the changes DUATF found, then import them.</li>
      </ol>
      <label className={styles.chipField}>
        <span>Excel file (.xlsx)</span>
        <input
          className={styles.file}
          type="file"
          name="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          onChange={() => setStale(true)}
        />
      </label>
      {plan ? <input type="hidden" name="fingerprint" value={plan.fingerprint} /> : null}
      {state.status === 'error' && !stale ? <FormAlert>{state.message}</FormAlert> : null}

      {plan ? (
        <section aria-label="What the import would change" className={styles.importForm}>
          <ul className={styles.counts}>
            <li className={styles.count}>
              <strong>{plan.counts.create}</strong> to add
            </li>
            <li className={styles.count}>
              <strong>{plan.counts.update}</strong> to change
            </li>
            <li className={styles.count}>
              <strong>{plan.counts.remove}</strong> to remove
            </li>
            <li className={styles.count}>
              <strong>{plan.counts.unchanged}</strong> unchanged
            </li>
          </ul>
          {plan.errors.length ? (
            <Callout
              tone="danger"
              title={`${plural(plan.errors.length, 'error', 'errors')}: fix the file and check it again`}
            >
              <IssueTable issues={plan.errors} />
            </Callout>
          ) : null}
          {plan.warnings.length ? (
            <Callout tone="warning" title="Kept as written">
              <IssueTable issues={plan.warnings} />
            </Callout>
          ) : null}
          {plan.changes.length ? (
            <div className={styles.tableWrap}>
              <table className={styles.issueTable}>
                <thead>
                  <tr>
                    <th scope="col">Row</th>
                    <th scope="col">Change</th>
                    <th scope="col">{noun.one.charAt(0).toUpperCase() + noun.one.slice(1)}</th>
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.changes.map((change) => (
                    <tr key={`${change.row}-${change.action}`}>
                      <td>{change.row}</td>
                      <td className={styles[`action_${change.action}`]}>
                        {ACTION_LABEL[change.action]}
                      </td>
                      <td>{change.label}</td>
                      <td>{change.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : plan.errors.length ? null : (
            <p className={styles.muted}>
              The file matches what DUATF holds. There is nothing to import.
            </p>
          )}
        </section>
      ) : null}

      <FormActions>
        <button
          type="submit"
          name="intent"
          value="check"
          className={buttonClass(plan && changes && !plan.errors.length ? 'secondary' : 'primary')}
          disabled={pending}
        >
          <FileCheck2 size={16} aria-hidden="true" />
          {plan ? 'Check again' : 'Check the file'}
        </button>
        {plan && changes > 0 && plan.errors.length === 0 ? (
          <button
            type="submit"
            name="intent"
            value="apply"
            className={buttonClass('primary')}
            disabled={pending}
            aria-busy={pending}
          >
            <Upload size={16} aria-hidden="true" />
            {pending ? 'Importing…' : `Import ${plural(changes, 'change', 'changes')}`}
          </button>
        ) : null}
        <a href={exportHref} className={buttonClass('ghost')} rel="nofollow">
          <Download size={16} aria-hidden="true" />
          Export the workbook
        </a>
      </FormActions>
    </form>
  )
}

const IssueTable = ({ issues }: { issues: { row: number; field: string; message: string }[] }) => (
  <table className={styles.issueTable}>
    <thead>
      <tr>
        <th scope="col">Row</th>
        <th scope="col">Column</th>
        <th scope="col">What to do</th>
      </tr>
    </thead>
    <tbody>
      {issues.map((issue, index) => (
        <tr key={`${issue.row}-${issue.field}-${index}`}>
          <td>{issue.row}</td>
          <td>{issue.field}</td>
          <td>{issue.message}</td>
        </tr>
      ))}
    </tbody>
  </table>
)
