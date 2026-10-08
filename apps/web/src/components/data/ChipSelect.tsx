'use client'

import { X } from 'lucide-react'
import { useState, type ChangeEvent } from 'react'
import forms from './DataForms.module.css'
import styles from './Ropa.module.css'

export type ChipOption = { value: string; hint?: string | null }

/**
 * Several answers as chips with ×. Type to see the knowledge base's answers (the browser's own
 * list); picking one adds it. With allowFree, Enter or Add keeps other text as typed.
 */
export const ChipSelect = ({
  id,
  label,
  hint,
  options,
  values,
  onChange,
  allowFree = false,
  placeholder,
  error,
  disabled = false,
}: {
  id: string
  label: string
  hint?: string
  options: ChipOption[]
  values: string[]
  onChange: (values: string[]) => void
  allowFree?: boolean
  placeholder?: string
  error?: string
  disabled?: boolean
}) => {
  const [text, setText] = useState('')
  const known = new Map(options.map((option) => [option.value.toLowerCase(), option.value]))
  const add = (raw: string) => {
    const typed = raw.trim()
    const value = known.get(typed.toLowerCase()) ?? (allowFree ? typed : undefined)
    if (!value) return
    if (!values.some((item) => item.toLowerCase() === value.toLowerCase())) {
      onChange([...values, value])
    }
    setText('')
  }
  // A pick from the list arrives whole (not typed letter by letter): add it at once.
  const onInput = (event: ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value
    const native = event.nativeEvent as InputEvent
    if (known.has(next.trim().toLowerCase()) && native.inputType !== 'insertText') add(next)
    else setText(next)
  }
  const left = options.filter((option) => !values.includes(option.value))
  return (
    <div className={styles.chipField}>
      <label htmlFor={id} className={forms.label}>
        {label}
      </label>
      {hint ? <span className={forms.hint}>{hint}</span> : null}
      {values.length ? (
        <ul className={forms.chips} aria-label={label}>
          {values.map((value) => (
            <li key={value} className={forms.chip}>
              <span>{value}</span>
              <button
                type="button"
                aria-label={`Remove ${value}`}
                disabled={disabled}
                onClick={() => onChange(values.filter((item) => item !== value))}
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <div className={styles.chipInputRow}>
        <input
          id={id}
          list={`${id}-options`}
          value={text}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          onChange={onInput}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              add(text)
            }
          }}
        />
        <button
          type="button"
          className={styles.addButton}
          disabled={
            disabled || text.trim() === '' || (!allowFree && !known.has(text.trim().toLowerCase()))
          }
          onClick={() => add(text)}
        >
          Add
        </button>
      </div>
      <datalist id={`${id}-options`}>
        {left.map((option) => (
          <option key={option.value} value={option.value}>
            {option.hint ?? undefined}
          </option>
        ))}
      </datalist>
      {error ? <p className={forms.error}>{error}</p> : null}
    </div>
  )
}

/** A short list as toggle chips: every answer visible, any number on. */
export const ToggleChips = ({
  label,
  hint,
  options,
  values,
  onChange,
  error,
  disabled = false,
}: {
  label: string
  hint?: string
  options: ChipOption[]
  values: string[]
  onChange: (values: string[]) => void
  error?: string
  disabled?: boolean
}) => (
  <fieldset className={forms.choices}>
    <legend className={forms.label}>{label}</legend>
    {hint ? <p className={forms.hint}>{hint}</p> : null}
    <ul className={styles.toggles}>
      {options.map((option) => {
        const on = values.includes(option.value)
        return (
          <li key={option.value}>
            <button
              type="button"
              className={styles.toggle}
              aria-pressed={on}
              title={option.hint ?? undefined}
              disabled={disabled}
              onClick={() =>
                onChange(
                  on ? values.filter((item) => item !== option.value) : [...values, option.value],
                )
              }
            >
              {option.value}
            </button>
          </li>
        )
      })}
    </ul>
    {error ? <p className={forms.error}>{error}</p> : null}
  </fieldset>
)
