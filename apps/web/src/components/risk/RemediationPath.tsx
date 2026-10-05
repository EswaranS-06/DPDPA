import type { ActionStatus, FindingStatus } from '@duatf/platform-db'
import { Check } from 'lucide-react'
import styles from './RemediationPath.module.css'

type Step = { label: string; done: boolean; note: string }

/** From the finding and its actions, how far remediation has come and what is next. */
export const remediationSteps = ({
  status,
  rated,
  actions,
}: {
  status: FindingStatus
  rated: boolean
  actions: ActionStatus[]
}): Step[] => {
  const has = (...states: ActionStatus[]) => actions.some((state) => states.includes(state))
  const closed = status === 'closed'
  return [
    { label: 'Gap found', done: true, note: 'From an answer showing a gap' },
    { label: 'Risk rated', done: rated || closed, note: 'Likelihood by impact' },
    {
      label: 'Action planned',
      done: actions.length > 0 || closed,
      note: 'Owner and due date',
    },
    {
      label: 'Fix evidenced',
      done: has('under_review', 'remediated', 'closed') || closed,
      note: 'Evidence of the fix',
    },
    { label: 'Verified', done: has('remediated', 'closed') || closed, note: 'By an auditor' },
    { label: 'Closed', done: closed, note: 'Or resolved by a later answer' },
  ]
}

/** A stepper of the remediation workflow; the first unfinished step is marked as next. */
export const RemediationPath = ({ steps }: { steps: Step[] }) => {
  const next = steps.findIndex((step) => !step.done)
  return (
    <ol className={styles.path} aria-label="Remediation progress">
      {steps.map((step, index) => {
        const state = step.done ? 'done' : index === next ? 'next' : 'todo'
        return (
          <li key={step.label} className={`${styles.step} ${styles[state]}`}>
            <span className={styles.marker} aria-hidden="true">
              {step.done ? <Check size={14} strokeWidth={3} /> : index + 1}
            </span>
            <span className={styles.text}>
              <span className={styles.label}>
                {step.label}
                <span className="visually-hidden">
                  {state === 'done' ? ', done' : state === 'next' ? ', next step' : ', not yet'}
                </span>
              </span>
              <span className={styles.note}>{state === 'next' ? 'Next step' : step.note}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
