'use client'

import { buttonClass, FormActions } from '@duatf/core-ui'
import {
  categoryInfo,
  DATA_SOURCES,
  DEPARTMENT_SOURCE,
  LEVEL_INFO,
  LEVELS,
  PERSONAL_DATA_CATEGORIES,
  type Level,
} from '@duatf/feature-compliance-api/personal-data'
import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Feedback } from '@/components/forms/Feedback'
import type { FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
import { ElementPicker, type PickerElement, type PickerSuggestion } from './ElementPicker'
import styles from './DataForms.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

export type ElementRow = {
  code: string | null
  title: string
  category: string
  level: Level
  source: string | null
  storage: string | null
  security: string | null
  access: string | null
}

export type ProfileValues = {
  purposes: string | null
  lawfulBases: string[]
  systems: string[]
  sharedWith: string[]
  recipients: string[]
  transfersAbroad: string
  countries: string | null
  retention: string | null
  security: string | null
}

type Props = {
  action: Action
  elements: ElementRow[]
  profile: ProfileValues | null
  catalogue: PickerElement[]
  bases: { code: string; name: string; reference: string }[]
  departments: { code: string; name: string }[]
  suggestion: PickerSuggestion & { systems: string[]; recipients: string[]; sources: string[] }
  disabled?: boolean
}

const lines = (text: string) => [
  ...new Set(
    text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean),
  ),
]

const EMPTY_PROFILE: ProfileValues = {
  purposes: null,
  lawfulBases: [],
  systems: [],
  sharedWith: [],
  recipients: [],
  transfersAbroad: 'unknown',
  countries: null,
  retention: null,
  security: null,
}

/** Chips that add a suggested line to a one-per-line list. */
const SuggestLines = ({
  label,
  options,
  current,
  onAdd,
}: {
  label: string
  options: string[]
  current: string
  onAdd: (value: string) => void
}) => {
  const taken = new Set(lines(current).map((line) => line.toLowerCase()))
  const left = options.filter((option) => !taken.has(option.toLowerCase()))
  if (left.length === 0) return null
  return (
    <div className={styles.suggestLine}>
      <span className={styles.muted}>{label}</span>
      {left.map((option) => (
        <button
          key={option}
          type="button"
          className={styles.suggestChip}
          onClick={() => onAdd(option)}
        >
          <Plus size={12} aria-hidden="true" /> {option}
        </button>
      ))}
    </div>
  )
}

/**
 * A department's personal data: what it does with it (purposes, lawful basis, systems,
 * recipients, transfers, retention, security) and each data element with its category, level,
 * source, storage and access. Sent as one "data" field.
 */
export const DepartmentDataForm = ({
  action,
  elements,
  profile,
  catalogue,
  bases,
  departments,
  suggestion,
  disabled = false,
}: Props) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const [rows, setRows] = useState<ElementRow[]>(elements)
  const start = profile ?? EMPTY_PROFILE
  const [purposes, setPurposes] = useState(start.purposes ?? '')
  const [lawfulBases, setLawfulBases] = useState<string[]>(start.lawfulBases)
  const [systems, setSystems] = useState(start.systems.join('\n'))
  const [sharedWith, setSharedWith] = useState<string[]>(start.sharedWith)
  const [recipients, setRecipients] = useState(start.recipients.join('\n'))
  const [transfersAbroad, setTransfersAbroad] = useState(start.transfersAbroad)
  const [countries, setCountries] = useState(start.countries ?? '')
  const [retention, setRetention] = useState(start.retention ?? '')
  const [security, setSecurity] = useState(start.security ?? '')
  const [allFrom, setAllFrom] = useState('')

  const byCode = useMemo(() => new Map(catalogue.map((row) => [row.code, row])), [catalogue])
  const chosen = useMemo(() => new Set(rows.flatMap((row) => (row.code ? [row.code] : []))), [rows])
  const update = (index: number, change: Partial<ElementRow>) =>
    setRows((current) => current.map((row, at) => (at === index ? { ...row, ...change } : row)))
  const toggle = (codes: string[], on: boolean) =>
    setRows((current) => {
      if (!on) return current.filter((row) => !row.code || !codes.includes(row.code))
      const added = codes
        .filter((code) => !current.some((row) => row.code === code))
        .flatMap((code) => {
          const entry = byCode.get(code)
          return entry
            ? [
                {
                  code,
                  title: entry.title,
                  category: entry.category,
                  level: entry.level,
                  source: null,
                  storage: null,
                  security: null,
                  access: null,
                },
              ]
            : []
        })
      return [...current, ...added]
    })

  const data = JSON.stringify({
    elements: rows.map((row) => ({
      code: row.code ?? undefined,
      title: row.title,
      category: row.category,
      level: row.level,
      source: row.source ?? '',
      storage: row.storage ?? '',
      security: row.security ?? '',
      access: row.access ?? '',
    })),
    profile: {
      purposes,
      lawfulBases,
      systems: lines(systems),
      sharedWith,
      recipients: lines(recipients),
      transfersAbroad,
      countries,
      retention,
      security,
    },
  })

  const principals = DATA_SOURCES.filter((source) => source.group === 'principal')
  const others = DATA_SOURCES.filter((source) => source.group === 'other')
  const sourceOptions = (
    <>
      <option value="">Not recorded</option>
      <optgroup label="The person it is about">
        {principals.map((source) => (
          <option key={source.code} value={source.code}>
            {source.label}
          </option>
        ))}
      </optgroup>
      {departments.length > 0 ? (
        <optgroup label="Another department">
          {departments.map((item) => (
            <option key={item.code} value={`${DEPARTMENT_SOURCE}${item.code}`}>
              {item.name}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label="Elsewhere">
        {others.map((source) => (
          <option key={source.code} value={source.code}>
            {source.label}
          </option>
        ))}
      </optgroup>
    </>
  )
  const elementError = (index: number) => state.fieldErrors?.[`elements.${index}`]

  return (
    <form onSubmit={onSubmit} className={styles.form} noValidate>
      <Feedback state={state} />
      <input type="hidden" name="data" value={data} />
      <fieldset className={styles.block} disabled={disabled}>
        <legend className={styles.blockTitle}>What the department does with it</legend>
        <label className={styles.field}>
          <span className={styles.label}>Purposes</span>
          <span className={styles.hint}>Why it collects and uses the data, in plain words.</span>
          <textarea
            rows={3}
            value={purposes}
            maxLength={2000}
            onChange={(event) => setPurposes(event.target.value)}
          />
        </label>
        <fieldset className={styles.choices}>
          <legend className={styles.label}>Lawful basis</legend>
          <div className={styles.choiceGrid}>
            {bases.map((basis) => (
              <label key={basis.code} className={styles.choice}>
                <input
                  type="checkbox"
                  checked={lawfulBases.includes(basis.code)}
                  onChange={(event) =>
                    setLawfulBases((current) =>
                      event.target.checked
                        ? [...current, basis.code]
                        : current.filter((code) => code !== basis.code),
                    )
                  }
                />
                <span>
                  {basis.name} <span className={styles.muted}>{basis.reference}</span>
                </span>
              </label>
            ))}
          </div>
          {state.fieldErrors?.lawfulBases ? (
            <p className={styles.error}>{state.fieldErrors.lawfulBases}</p>
          ) : null}
        </fieldset>
        <div className={styles.pair}>
          <label className={styles.field}>
            <span className={styles.label}>Systems and storage</span>
            <span className={styles.hint}>
              One per line: applications, shared drives, paper files.
            </span>
            <textarea
              rows={4}
              value={systems}
              onChange={(event) => setSystems(event.target.value)}
            />
            <SuggestLines
              label="Typical:"
              options={suggestion.systems}
              current={systems}
              onAdd={(value) => setSystems((current) => lines(`${current}\n${value}`).join('\n'))}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Recipients outside the organisation</span>
            <span className={styles.hint}>
              One per line: vendors, processors, regulators, group companies.
            </span>
            <textarea
              rows={4}
              value={recipients}
              onChange={(event) => setRecipients(event.target.value)}
            />
            <SuggestLines
              label="Typical:"
              options={suggestion.recipients}
              current={recipients}
              onAdd={(value) =>
                setRecipients((current) => lines(`${current}\n${value}`).join('\n'))
              }
            />
          </label>
        </div>
        {departments.length > 0 ? (
          <fieldset className={styles.choices}>
            <legend className={styles.label}>Shares this data with departments</legend>
            <div className={styles.choiceGrid}>
              {departments.map((item) => (
                <label key={item.code} className={styles.choice}>
                  <input
                    type="checkbox"
                    checked={sharedWith.includes(item.code)}
                    onChange={(event) =>
                      setSharedWith((current) =>
                        event.target.checked
                          ? [...current, item.code]
                          : current.filter((code) => code !== item.code),
                      )
                    }
                  />
                  <span>
                    {item.name} <span className="code">{item.code}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}
        <div className={styles.pair}>
          <fieldset className={styles.choices}>
            <legend className={styles.label}>Transfers outside India</legend>
            <div className={styles.radioRow}>
              {[
                ['no', 'No'],
                ['yes', 'Yes'],
                ['unknown', 'Not yet known'],
              ].map(([value, label]) => (
                <label key={value} className={styles.choice}>
                  <input
                    type="radio"
                    name="transfersAbroadChoice"
                    checked={transfersAbroad === value}
                    onChange={() => setTransfersAbroad(value ?? 'unknown')}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {transfersAbroad === 'yes' ? (
            <label className={styles.field}>
              <span className={styles.label}>Countries</span>
              <input
                value={countries}
                maxLength={300}
                placeholder="e.g. Singapore (cloud hosting), USA (CRM)"
                onChange={(event) => setCountries(event.target.value)}
              />
            </label>
          ) : null}
        </div>
        <div className={styles.pair}>
          <label className={styles.field}>
            <span className={styles.label}>Retention</span>
            <span className={styles.hint}>How long it is kept and what happens then.</span>
            <textarea
              rows={3}
              value={retention}
              onChange={(event) => setRetention(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span className={styles.label}>Security measures</span>
            <span className={styles.hint}>
              Encryption, access control, masking, logging and so on.
            </span>
            <textarea
              rows={3}
              value={security}
              onChange={(event) => setSecurity(event.target.value)}
            />
          </label>
        </div>
      </fieldset>

      <fieldset className={styles.block} disabled={disabled}>
        <legend className={styles.blockTitle}>
          Data elements <span className={styles.muted}>({rows.length})</span>
        </legend>
        {rows.length > 0 ? (
          <>
            <div className={styles.bulk}>
              <label className={styles.inlineField}>
                <span>Where it comes from, for every element not yet set</span>
                <select value={allFrom} onChange={(event) => setAllFrom(event.target.value)}>
                  {sourceOptions}
                </select>
              </label>
              <button
                type="button"
                className={styles.secondary}
                disabled={allFrom === ''}
                onClick={() =>
                  setRows((current) =>
                    current.map((row) => (row.source ? row : { ...row, source: allFrom })),
                  )
                }
              >
                Apply
              </button>
            </div>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th scope="col">Data element</th>
                    <th scope="col">Category</th>
                    <th scope="col">Level</th>
                    <th scope="col">From</th>
                    <th scope="col">Stored in</th>
                    <th scope="col">Security</th>
                    <th scope="col">Access</th>
                    <th scope="col">
                      <span className="visually-hidden">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr
                      key={row.code ?? `custom:${row.title}`}
                      className={elementError(index) ? styles.rowError : undefined}
                    >
                      <th scope="row">
                        <span className={styles.elementTitle}>{row.title}</span>
                        <span className={styles.elementCode}>{row.code ?? 'Added by hand'}</span>
                        {elementError(index) ? (
                          <span className={styles.error}>{elementError(index)}</span>
                        ) : null}
                      </th>
                      <td>
                        <select
                          aria-label={`Category of ${row.title}`}
                          value={row.category}
                          onChange={(event) => update(index, { category: event.target.value })}
                        >
                          {PERSONAL_DATA_CATEGORIES.map((category) => (
                            <option key={category.code} value={category.code}>
                              {category.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          aria-label={`Level of ${row.title}`}
                          value={row.level}
                          onChange={(event) =>
                            update(index, { level: event.target.value as Level })
                          }
                        >
                          {LEVELS.map((level) => (
                            <option key={level} value={level}>
                              {level} {LEVEL_INFO[level].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          aria-label={`Where ${row.title} comes from`}
                          value={row.source ?? ''}
                          onChange={(event) =>
                            update(index, { source: event.target.value || null })
                          }
                        >
                          {sourceOptions}
                        </select>
                      </td>
                      <td>
                        <input
                          aria-label={`Where ${row.title} is stored`}
                          value={row.storage ?? ''}
                          maxLength={200}
                          list="data-systems"
                          onChange={(event) =>
                            update(index, { storage: event.target.value || null })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Security for ${row.title}`}
                          value={row.security ?? ''}
                          maxLength={300}
                          onChange={(event) =>
                            update(index, { security: event.target.value || null })
                          }
                        />
                      </td>
                      <td>
                        <input
                          aria-label={`Who can access ${row.title}`}
                          value={row.access ?? ''}
                          maxLength={200}
                          onChange={(event) =>
                            update(index, { access: event.target.value || null })
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.remove}
                          aria-label={`Remove ${row.title}`}
                          onClick={() =>
                            setRows((current) => current.filter((_, at) => at !== index))
                          }
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <datalist id="data-systems">
              {[...new Set([...lines(systems), ...suggestion.systems])].map((system) => (
                <option key={system} value={system} />
              ))}
            </datalist>
            <p className={styles.hint}>
              Each level starts from the element’s category; financial, health, biometric and
              government ID data start at L4 Restricted. Change a level where this department’s use
              differs.
            </p>
          </>
        ) : (
          <p className={styles.hint}>No data elements yet. Choose them below.</p>
        )}
        <details className={styles.addMore} open={rows.length === 0}>
          <summary className={styles.addMoreSummary}>
            <Plus size={16} aria-hidden="true" /> Add data elements
          </summary>
          <ElementPicker
            elements={catalogue}
            chosen={chosen}
            onChange={toggle}
            suggestion={suggestion}
            disabled={disabled}
            onAddCustom={(title, category) =>
              setRows((current) =>
                current.some((row) => row.title.toLowerCase() === title.toLowerCase())
                  ? current
                  : [
                      ...current,
                      {
                        code: null,
                        title,
                        category,
                        level: categoryInfo(category).level,
                        source: null,
                        storage: null,
                        security: null,
                        access: null,
                      },
                    ],
              )
            }
          />
        </details>
      </fieldset>
      {disabled ? null : (
        <FormActions>
          <button
            type="submit"
            className={buttonClass('primary')}
            disabled={pending}
            aria-busy={pending}
          >
            {pending ? 'Saving…' : 'Save personal data'}
          </button>
        </FormActions>
      )}
    </form>
  )
}
