'use client'

import {
  categoryInfo,
  suggestFor,
  type ProcessHint,
} from '@duatf/feature-compliance-api/personal-data'
import { X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ElementPicker, type PickerElement } from './ElementPicker'
import styles from './DataForms.module.css'

type Custom = { title: string; category: string }
type Chosen = { codes: string[]; custom: Custom[] }

/** What a failed submission sent back, so the choices survive the error. */
const restore = (json: string | undefined): Chosen => {
  try {
    const parsed: unknown = JSON.parse(json ?? '[]')
    if (!Array.isArray(parsed)) return { codes: [], custom: [] }
    const items = parsed.filter(
      (item): item is { code?: string; title?: string; category?: string } =>
        typeof item === 'object' && item !== null,
    )
    return {
      codes: items.flatMap((item) => (typeof item.code === 'string' ? [item.code] : [])),
      custom: items.flatMap((item) =>
        !item.code && typeof item.title === 'string'
          ? [{ title: item.title, category: item.category ?? 'other' }]
          : [],
      ),
    }
  } catch {
    return { codes: [], custom: [] }
  }
}

/**
 * The add-department question "what personal data does this department handle?". Suggests the
 * elements for the name typed above; sends the choice as one "personalData" field.
 */
export const PersonalDataStep = ({
  name,
  code,
  elements,
  processes,
  initial,
}: {
  name: string
  code: string
  elements: PickerElement[]
  processes: ProcessHint[]
  initial?: string
}) => {
  const [chosen, setChosen] = useState<Chosen>(() => restore(initial))
  const codes = useMemo(() => new Set(chosen.codes), [chosen.codes])
  const byCode = useMemo(() => new Map(elements.map((row) => [row.code, row])), [elements])
  const suggestion = useMemo(() => suggestFor(name, code, processes), [name, code, processes])
  const value = JSON.stringify([
    ...chosen.codes.map((item) => ({ code: item })),
    ...chosen.custom.map((item) => ({ title: item.title, category: item.category })),
  ])
  const total = chosen.codes.length + chosen.custom.length

  return (
    <section className={styles.step} aria-labelledby="personal-data-title">
      <header className={styles.stepHead}>
        <div>
          <h2 id="personal-data-title" className={styles.stepTitle}>
            What personal data does this department handle?
          </h2>
          <p className={styles.lede}>
            Pick the data elements it collects, receives or keeps: take the suggestions or search
            for others. Each is filed under its category and sensitivity level. Add where it comes
            from, where it is kept and who receives it on the department’s personal data page; you
            can change all of it at any time.
          </p>
        </div>
        <p className={styles.count} aria-live="polite">
          <strong>{total}</strong> chosen
        </p>
      </header>
      <input type="hidden" name="personalData" value={value} />
      {total > 0 ? (
        <ul className={styles.chips} aria-label="Data elements chosen">
          {chosen.codes.map((item) => {
            const element = byCode.get(item)
            if (!element) return null
            return (
              <li
                key={item}
                className={styles.chip}
                title={`${element.code}, ${categoryInfo(element.category).title}`}
              >
                <span>{element.title}</span>
                <span className={`${styles.chipLevel} ${styles[`level${element.level}`]}`}>
                  {element.level}
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${element.title}`}
                  onClick={() =>
                    setChosen((current) => ({
                      ...current,
                      codes: current.codes.filter((other) => other !== item),
                    }))
                  }
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            )
          })}
          {chosen.custom.map((item) => (
            <li
              key={`custom:${item.title}`}
              className={styles.chip}
              title={`Added by hand, ${categoryInfo(item.category).title}`}
            >
              <span>{item.title}</span>
              <span className={styles.chipLevel}>own</span>
              <button
                type="button"
                aria-label={`Remove ${item.title}`}
                onClick={() =>
                  setChosen((current) => ({
                    ...current,
                    custom: current.custom.filter((other) => other.title !== item.title),
                  }))
                }
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <ElementPicker
        elements={elements}
        chosen={codes}
        suggestion={suggestion}
        onChange={(changed, on) =>
          setChosen((current) => {
            const next = new Set(current.codes)
            for (const item of changed) {
              if (on) next.add(item)
              else next.delete(item)
            }
            return { ...current, codes: [...next] }
          })
        }
        onAddCustom={(title, category) =>
          setChosen((current) =>
            current.custom.some((item) => item.title.toLowerCase() === title.toLowerCase())
              ? current
              : { ...current, custom: [...current.custom, { title, category }] },
          )
        }
      />
    </section>
  )
}
