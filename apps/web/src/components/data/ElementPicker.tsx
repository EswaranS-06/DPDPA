'use client'

import {
  categoryInfo,
  PERSONAL_DATA_CATEGORIES,
  type Level,
} from '@duatf/feature-compliance-api/personal-data'
import { Plus, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { LevelChip } from './LevelChip'
import styles from './ElementPicker.module.css'

export type PickerElement = {
  code: string
  title: string
  category: string
  level: Level
  note: string | null
  personalData: boolean
}

export type PickerSuggestion = {
  presets: string[]
  elements: string[]
  categories: string[]
  processes: { code: string; title: string }[]
}

const ALL = 'all'

const matches = (element: PickerElement, words: string[]) => {
  const haystack = `${element.code} ${element.title}`.toLowerCase()
  return words.every((word) => haystack.includes(word))
}

/**
 * Knowledge-base data elements grouped by personal data category, with the ones suggested for
 * the department on top. Ticking reports the change; the caller keeps the chosen list.
 */
export const ElementPicker = ({
  elements,
  chosen,
  onChange,
  suggestion,
  onAddCustom,
  disabled = false,
}: {
  elements: PickerElement[]
  chosen: ReadonlySet<string>
  onChange: (codes: string[], on: boolean) => void
  suggestion: PickerSuggestion
  onAddCustom: (title: string, category: string) => void
  disabled?: boolean
}) => {
  const [query, setQuery] = useState('')
  const [browse, setBrowse] = useState('')
  const [customTitle, setCustomTitle] = useState('')
  const [customCategory, setCustomCategory] = useState('identifiers')
  const words = query.toLowerCase().split(/\s+/).filter(Boolean)
  const byCode = useMemo(() => new Map(elements.map((row) => [row.code, row])), [elements])
  const suggested = suggestion.elements.flatMap((code) => {
    const row = byCode.get(code)
    return row ? [row] : []
  })
  const missing = suggested.filter((row) => !chosen.has(row.code))
  const listed = elements.filter(
    (element) =>
      (browse === '' || browse === ALL || element.category === browse) && matches(element, words),
  )

  const row = (element: PickerElement) => (
    <li key={element.code}>
      <label className={chosen.has(element.code) ? `${styles.item} ${styles.chosen}` : styles.item}>
        <input
          type="checkbox"
          checked={chosen.has(element.code)}
          disabled={disabled}
          onChange={(event) => onChange([element.code], event.target.checked)}
        />
        <span className={styles.itemMain}>
          <span className={styles.itemTitle}>{element.title}</span>
          <span className={styles.itemMeta}>
            <span className="code">{element.code}</span>
            {element.personalData ? null : (
              <span>Not personal data unless it identifies a person</span>
            )}
          </span>
        </span>
        <LevelChip level={element.level} />
      </label>
    </li>
  )

  return (
    <div className={styles.picker}>
      {suggested.length > 0 ? (
        <section className={styles.suggested} aria-labelledby="suggested-title">
          <div className={styles.suggestedHead}>
            <h3 id="suggested-title" className={styles.suggestedTitle}>
              <Sparkles size={16} aria-hidden="true" /> Suggested for{' '}
              {suggestion.presets.join(' and ').toLowerCase()}
            </h3>
            <button
              type="button"
              className={styles.addAll}
              disabled={disabled || missing.length === 0}
              onClick={() =>
                onChange(
                  missing.map((item) => item.code),
                  true,
                )
              }
            >
              {missing.length === 0 ? 'All suggestions added' : `Add all ${missing.length}`}
            </button>
          </div>
          {suggestion.processes.length > 0 ? (
            <p className={styles.note}>
              From the knowledge-base processes:{' '}
              {suggestion.processes.map((process) => process.title).join('; ')}.
            </p>
          ) : null}
          <ul className={styles.items}>{suggested.map(row)}</ul>
        </section>
      ) : (
        <p className={styles.note}>
          Suggestions appear when the department’s name says what it does, such as HR, Finance,
          Purchase, IT, Marketing, Sales, Support, Admin, Legal, Product or Academics. Otherwise
          search, or browse a category, below.
        </p>
      )}

      <div className={styles.finder}>
        <label className={styles.search}>
          <Search size={16} aria-hidden="true" />
          <span className="visually-hidden">Find a data element</span>
          <input
            type="search"
            placeholder="Find a data element, e.g. PAN, salary or CCTV"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className={styles.browse}>
          <span className="visually-hidden">Browse a category</span>
          <select value={browse} onChange={(event) => setBrowse(event.target.value)}>
            <option value="">Browse a category…</option>
            <option value={ALL}>All categories ({elements.length})</option>
            {PERSONAL_DATA_CATEGORIES.map((category) => {
              const count = elements.filter((element) => element.category === category.code).length
              return count ? (
                <option key={category.code} value={category.code}>
                  {category.title} ({count})
                </option>
              ) : null
            })}
          </select>
        </label>
      </div>

      {words.length === 0 && browse === '' ? (
        <p className={styles.note}>
          Search by name or code, or browse a category to see every data element in it.
        </p>
      ) : (
        <>
          {PERSONAL_DATA_CATEGORIES.filter(
            (category) => browse === '' || browse === ALL || category.code === browse,
          ).map((category) => {
            const visible = elements.filter(
              (element) => element.category === category.code && matches(element, words),
            )
            if (visible.length === 0) return null
            return (
              <section key={category.code} className={styles.group} aria-label={category.title}>
                <h3 className={styles.groupHead}>
                  <span className={styles.groupName}>{category.title}</span>
                  <LevelChip level={category.level} />
                </h3>
                {browse === category.code ? (
                  <p className={styles.groupNote}>{category.description}</p>
                ) : null}
                <ul className={styles.items}>{visible.map(row)}</ul>
              </section>
            )
          })}
          {listed.length ? null : (
            <p className={styles.note}>
              No data element matches “{query}”
              {browse && browse !== ALL ? ` in ${categoryInfo(browse).title}` : ''}. Add it below as
              the department’s own.
            </p>
          )}
        </>
      )}

      <fieldset className={styles.custom} disabled={disabled}>
        <legend className={styles.customLegend}>Not in the list? Add the department’s own</legend>
        <label className={styles.customField}>
          <span>Data element</span>
          <input
            value={customTitle}
            maxLength={120}
            placeholder="e.g. Hostel room allotment"
            onChange={(event) => setCustomTitle(event.target.value)}
          />
        </label>
        <label className={styles.customField}>
          <span>Category</span>
          <select
            value={customCategory}
            onChange={(event) => setCustomCategory(event.target.value)}
          >
            {PERSONAL_DATA_CATEGORIES.map((category) => (
              <option key={category.code} value={category.code}>
                {category.title}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className={styles.addCustom}
          disabled={customTitle.trim() === ''}
          onClick={() => {
            onAddCustom(customTitle.trim(), customCategory)
            setCustomTitle('')
          }}
        >
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </fieldset>
    </div>
  )
}
