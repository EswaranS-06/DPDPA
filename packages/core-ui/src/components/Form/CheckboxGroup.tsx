import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import styles from './Form.module.css'

export type CheckboxOption = { value: string; label: string; group?: string }

type CheckboxGroupProps = {
  legend: ReactNode
  name: string
  options: readonly CheckboxOption[]
  /** Values ticked when the form first shows. */
  defaultValue?: readonly string[]
  hint?: ReactNode
  error?: string
  /** Spans both columns of a Fieldset. */
  wide?: boolean
}

/**
 * Several choices from a list, each a native checkbox submitted under the same name. Options
 * with a group are listed under that group's heading, in the order given.
 */
export const CheckboxGroup = ({
  legend,
  name,
  options,
  defaultValue = [],
  hint,
  error,
  wide,
}: CheckboxGroupProps) => {
  const chosen = new Set(defaultValue)
  const groups: { title: string | undefined; options: CheckboxOption[] }[] = []
  for (const option of options) {
    const last = groups.at(-1)
    if (last && last.title === option.group) last.options.push(option)
    else groups.push({ title: option.group, options: [option] })
  }
  const describedBy =
    [error ? `${name}-error` : null, hint ? `${name}-hint` : null].filter(Boolean).join(' ') ||
    undefined
  return (
    <fieldset
      className={wide ? `${styles.choices} ${styles.wide}` : styles.choices}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
    >
      <legend className={styles.label}>
        {legend}
        {chosen.size ? <span className={styles.required}> ({chosen.size} chosen)</span> : null}
      </legend>
      {hint ? (
        <p id={`${name}-hint`} className={styles.hint}>
          {hint}
        </p>
      ) : null}
      {groups.map((group, index) => (
        <div key={group.title ?? `group-${index}`} className={styles.choiceGroup}>
          {group.title ? <p className={styles.choiceGroupTitle}>{group.title}</p> : null}
          <div className={styles.choiceGrid}>
            {group.options.map((option) => (
              <label key={option.value} className={styles.choice}>
                <input
                  type="checkbox"
                  name={name}
                  value={option.value}
                  defaultChecked={chosen.has(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
      {error ? (
        <p id={`${name}-error`} className={styles.error}>
          <CircleAlert size={14} strokeWidth={2.25} aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </fieldset>
  )
}
