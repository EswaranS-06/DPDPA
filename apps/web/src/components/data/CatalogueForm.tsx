'use client'

import { buttonClass } from '@duatf/core-ui'
import { useState } from 'react'
import { Feedback } from '@/components/forms/Feedback'
import type { FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
import styles from './Ropa.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

type Process = {
  code: string
  title: string
  department: string
  purpose: string | null
  elements: number
}

type Department = {
  code: string
  name: string
  suggested: string[]
  adopted: string[]
  activities: number
}

const pickOf = (department: string, process: string) => `${department}|${process}`

/**
 * The process catalogue for every department at once: the processes suggested for each are
 * ticked, so a whole RoPA starts in one step; any other process can be ticked too.
 */
export const CatalogueForm = ({
  action,
  departments,
  processes,
}: {
  action: Action
  departments: Department[]
  processes: Process[]
}) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const byCode = new Map(processes.map((row) => [row.code, row]))
  const suggestedPicks = () =>
    new Set(
      departments.flatMap((item) =>
        item.suggested
          .filter((code) => !item.adopted.includes(code))
          .map((code) => pickOf(item.code, code)),
      ),
    )
  const [picked, setPicked] = useState<Set<string>>(suggestedPicks)
  const toggle = (pick: string, on: boolean) =>
    setPicked((current) => {
      const next = new Set(current)
      if (on) next.add(pick)
      else next.delete(pick)
      return next
    })
  const groups = [...new Set(processes.map((row) => row.department))].sort()

  const row = (department: Department, process: Process) => {
    const pick = pickOf(department.code, process.code)
    const adopted = department.adopted.includes(process.code)
    return (
      <li key={process.code}>
        <label className={adopted ? `${styles.process} ${styles.added}` : styles.process}>
          <input
            type="checkbox"
            name="pick"
            value={pick}
            checked={adopted || picked.has(pick)}
            disabled={adopted}
            onChange={(event) => toggle(pick, event.target.checked)}
          />
          <span>
            <span className={styles.processTitle}>{process.title}</span>
            <span className={styles.processMeta}>
              {process.code}
              {adopted
                ? ', already recorded'
                : process.elements
                  ? `, ${process.elements} data elements suggested`
                  : ''}
            </span>
            {process.purpose ? <span className={styles.processMeta}>{process.purpose}</span> : null}
          </span>
        </label>
      </li>
    )
  }

  return (
    <form onSubmit={onSubmit} className={styles.catalogue}>
      <Feedback state={state} />
      {departments.map((department) => {
        const suggested = department.suggested.flatMap((code) => byCode.get(code) ?? [])
        const rest = processes.filter((row) => !department.suggested.includes(row.code))
        return (
          <fieldset key={department.code} className={styles.departmentCard}>
            <legend>
              {department.name} <span className={styles.legendCode}>{department.code}</span>
            </legend>
            {suggested.length ? (
              <ul className={styles.processList}>
                {suggested.map((process) => row(department, process))}
              </ul>
            ) : (
              <p className={styles.muted}>
                The catalogue suggests nothing from this department’s name. Choose processes below.
              </p>
            )}
            <details className={styles.more}>
              <summary>Other catalogue processes ({rest.length})</summary>
              {groups.map((group) => {
                const items = rest.filter((process) => process.department === group)
                return items.length ? (
                  <div key={group}>
                    <p className={styles.groupHead}>{group}</p>
                    <ul className={styles.processList}>
                      {items.map((process) => row(department, process))}
                    </ul>
                  </div>
                ) : null
              })}
            </details>
          </fieldset>
        )
      })}
      <div className={styles.stickyBar}>
        <p className={styles.muted}>
          <strong>{picked.size}</strong> processing {picked.size === 1 ? 'activity' : 'activities'}{' '}
          to add. Each starts with the knowledge base’s defaults; review and adjust it after.
        </p>
        <div className={styles.toolbar}>
          <button
            type="button"
            className={buttonClass('ghost', 'sm')}
            onClick={() => setPicked(suggestedPicks())}
          >
            Suggested only
          </button>
          <button
            type="button"
            className={buttonClass('ghost', 'sm')}
            onClick={() => setPicked(new Set())}
          >
            Clear
          </button>
          <button
            type="submit"
            className={buttonClass('primary')}
            disabled={pending || picked.size === 0}
            aria-busy={pending}
          >
            {pending
              ? 'Adding…'
              : `Add ${picked.size} ${picked.size === 1 ? 'activity' : 'activities'}`}
          </button>
        </div>
      </div>
    </form>
  )
}
