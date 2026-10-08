'use client'

import { buttonClass, FormActions } from '@duatf/core-ui'
import { categoryInfo } from '@duatf/feature-compliance-api/personal-data'
import type {
  ActivityElement,
  ActivityValues,
  RopaAnswer,
  RopaKb,
} from '@duatf/feature-compliance-api/ropa-kb'
import { Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Feedback } from '@/components/forms/Feedback'
import type { FormState } from '@/lib/formState'
import { useSubmit } from '@/lib/useSubmit'
import { ChipSelect, ToggleChips, type ChipOption } from './ChipSelect'
import forms from './DataForms.module.css'
import { ElementPicker, type PickerElement } from './ElementPicker'
import styles from './Ropa.module.css'

type Action = (state: FormState, formData: FormData) => Promise<FormState>

type Props = {
  action: Action
  deleteAction?: ((state: FormState) => Promise<FormState>) | null
  values: ActivityValues
  kb: RopaKb
  /** Department code -> the knowledge-base elements it already lists. */
  held: Record<string, string[]>
  departments: { code: string; name: string }[]
  owners: string[]
  disabled?: boolean
}

const options = (answers: readonly RopaAnswer[]): ChipOption[] =>
  answers.map((answer) => ({ value: answer.value, hint: answer.meaning }))

const TRANSFERS = [
  ['no', 'No'],
  ['yes', 'Yes'],
  ['unknown', 'Not yet known'],
] as const

/**
 * One processing activity: a row of the record of processing. Every list answer comes from the
 * knowledge base's RoPA lists; systems, recipients, retention, security and owner can also be
 * typed. Sent as one "activity" field.
 */
export const ActivityForm = ({
  action,
  deleteAction = null,
  values: start,
  kb,
  held,
  departments,
  owners,
  disabled = false,
}: Props) => {
  const { state, onSubmit, pending } = useSubmit(action)
  const [values, setValues] = useState<ActivityValues>(start)
  const set = <Key extends keyof ActivityValues>(key: Key, value: ActivityValues[Key]) =>
    setValues((current) => ({ ...current, [key]: value }))
  const error = (key: keyof ActivityValues) => state.fieldErrors?.[key]

  const catalogue = useMemo<PickerElement[]>(
    () =>
      kb.elements.map((row) => ({
        code: row.code,
        title: row.title,
        category: row.category,
        level: row.level,
        note: null,
        personalData: row.personalData,
      })),
    [kb.elements],
  )
  const byCode = useMemo(() => new Map(kb.elements.map((row) => [row.code, row])), [kb.elements])
  const chosen = useMemo(
    () => new Set(values.elements.flatMap((item) => (item.code ? [item.code] : []))),
    [values.elements],
  )
  const process = kb.processes.find((row) => row.code === values.templateCode)
  const suggested = [
    ...new Set([...(process?.elements ?? []), ...(held[values.departmentCode] ?? [])]),
  ]
  const toggleElements = (codes: string[], on: boolean) =>
    set(
      'elements',
      on
        ? [
            ...values.elements,
            ...codes
              .filter((code) => !chosen.has(code))
              .flatMap((code): ActivityElement[] => {
                const entry = byCode.get(code)
                return entry
                  ? [{ code, title: entry.title, category: entry.category, level: entry.level }]
                  : []
              }),
          ]
        : values.elements.filter((item) => !item.code || !codes.includes(item.code)),
    )

  const activity = JSON.stringify({
    department: values.departmentCode,
    name: values.name,
    templateCode: values.templateCode ?? '',
    purpose: values.purpose ?? '',
    lawfulBases: values.lawfulBases,
    lawReference: values.lawReference ?? '',
    principals: values.principals,
    elements: values.elements.map((item) =>
      item.code
        ? { code: item.code }
        : { title: item.title, category: item.category, level: item.level },
    ),
    sources: values.sources,
    systems: values.systems,
    internalRecipients: values.internalRecipients,
    processors: values.processors,
    recipients: values.recipients,
    retention: values.retention ?? '',
    deletion: values.deletion ?? '',
    security: values.security,
    transfersAbroad: values.transfersAbroad,
    countries: values.countries ?? '',
    consentStatus: values.consentStatus ?? '',
    owner: values.owner ?? '',
    notes: values.notes ?? '',
  })
  const recipientOptions = options(kb.lists.recipients).map((option) => ({
    ...option,
    hint: option.hint ? `Usually a ${option.hint.toLowerCase()}` : null,
  }))
  const retentionOptions = [...kb.lists.retention, ...kb.sectorRetention]
  const others = departments.filter((item) => item.code !== values.departmentCode)
  const text = (key: keyof ActivityValues) => {
    const value = values[key]
    return typeof value === 'string' ? value : ''
  }

  return (
    <>
      <form onSubmit={onSubmit} className={forms.form} noValidate>
        <Feedback state={state} />
        <input type="hidden" name="activity" value={activity} />

        <fieldset className={forms.block} disabled={disabled}>
          <legend className={forms.blockTitle}>The activity</legend>
          <div className={forms.pair}>
            <label className={forms.field}>
              <span className={forms.label}>Processing activity</span>
              <input
                value={values.name}
                maxLength={160}
                required
                placeholder="e.g. Employee payroll"
                onChange={(event) => set('name', event.target.value)}
              />
              {error('name') ? <span className={forms.error}>{error('name')}</span> : null}
            </label>
            <label className={forms.field}>
              <span className={forms.label}>Department</span>
              <select
                className={styles.select}
                value={values.departmentCode}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    departmentCode: event.target.value,
                    internalRecipients: current.internalRecipients.filter(
                      (code) => code !== event.target.value,
                    ),
                  }))
                }
              >
                <option value="">Choose…</option>
                {departments.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              {error('departmentCode') ? (
                <span className={forms.error}>{error('departmentCode')}</span>
              ) : null}
            </label>
          </div>
          <label className={forms.field}>
            <span className={forms.label}>Purpose</span>
            <span className={forms.hint}>Why the data is processed, in plain words.</span>
            <textarea
              rows={2}
              maxLength={1000}
              value={text('purpose')}
              onChange={(event) => set('purpose', event.target.value)}
            />
          </label>
          <div className={forms.pair}>
            <label className={forms.field}>
              <span className={forms.label}>Catalogue process</span>
              <span className={forms.hint}>The knowledge-base process it follows, if any.</span>
              <select
                className={styles.select}
                value={values.templateCode ?? ''}
                onChange={(event) => set('templateCode', event.target.value || null)}
              >
                <option value="">None</option>
                {kb.processes.map((row) => (
                  <option key={row.code} value={row.code}>
                    {row.code} {row.title}
                  </option>
                ))}
              </select>
            </label>
            <label className={forms.field}>
              <span className={forms.label}>Owner or DPO contact</span>
              <span className={forms.hint}>Who answers for it: name, role and email.</span>
              <input
                value={text('owner')}
                maxLength={200}
                list="activity-owners"
                onChange={(event) => set('owner', event.target.value)}
              />
              <datalist id="activity-owners">
                {owners.map((owner) => (
                  <option key={owner} value={owner} />
                ))}
              </datalist>
            </label>
          </div>
        </fieldset>

        <fieldset className={forms.block} disabled={disabled}>
          <legend className={forms.blockTitle}>Lawful basis</legend>
          <fieldset className={forms.choices}>
            <legend className={forms.label}>The DPDP ground relied on</legend>
            <div className={forms.choiceGrid}>
              {kb.bases.map((basis) => (
                <label key={basis.code} className={forms.choice}>
                  <input
                    type="checkbox"
                    checked={values.lawfulBases.includes(basis.code)}
                    onChange={(event) =>
                      set(
                        'lawfulBases',
                        event.target.checked
                          ? [...values.lawfulBases, basis.code]
                          : values.lawfulBases.filter((code) => code !== basis.code),
                      )
                    }
                  />
                  <span>{basis.label}</span>
                </label>
              ))}
            </div>
            {error('lawfulBases') ? <p className={forms.error}>{error('lawfulBases')}</p> : null}
          </fieldset>
          <div className={forms.pair}>
            <label className={forms.field}>
              <span className={forms.label}>Law relied on</span>
              <span className={forms.hint}>Another law that requires or permits it, if any.</span>
              <input
                value={text('lawReference')}
                maxLength={300}
                placeholder="e.g. PML Act"
                onChange={(event) => set('lawReference', event.target.value)}
              />
            </label>
            <label className={forms.field}>
              <span className={forms.label}>Consent status</span>
              <span className={forms.hint}>For an activity that relies on consent.</span>
              <select
                className={styles.select}
                value={values.consentStatus ?? ''}
                onChange={(event) => set('consentStatus', event.target.value || null)}
              >
                <option value="">Not recorded</option>
                {kb.lists.consent.map((answer) => (
                  <option key={answer.value} value={answer.value}>
                    {answer.value}
                  </option>
                ))}
              </select>
              {error('consentStatus') ? (
                <span className={forms.error}>{error('consentStatus')}</span>
              ) : null}
            </label>
          </div>
        </fieldset>

        <fieldset className={forms.block} disabled={disabled}>
          <legend className={forms.blockTitle}>Whose data, and what data</legend>
          <ChipSelect
            id="activity-principals"
            label="Data principals"
            hint="Whose personal data it is. Type to see the list."
            options={options(kb.lists.principals)}
            values={values.principals}
            onChange={(next) => set('principals', next)}
            placeholder="e.g. Employee"
            error={error('principals')}
            disabled={disabled}
          />
          <ToggleChips
            label="Source of data"
            options={options(kb.lists.sources)}
            values={values.sources}
            onChange={(next) => set('sources', next)}
            error={error('sources')}
            disabled={disabled}
          />
          <div className={styles.chipField}>
            <span className={forms.label}>
              Personal data <span className={forms.muted}>({values.elements.length})</span>
            </span>
            {values.elements.length ? (
              <ul className={forms.chips} aria-label="Personal data">
                {values.elements.map((item) => (
                  <li
                    key={item.code ?? `own:${item.title}`}
                    className={forms.chip}
                    title={`${item.code ?? 'The department’s own'}, ${categoryInfo(item.category).title}`}
                  >
                    <span>
                      {item.code ? (byCode.get(item.code)?.name ?? item.title) : item.title}
                    </span>
                    <span className={`${forms.chipLevel} ${forms[`level${item.level}`]}`}>
                      {item.code ? item.level : 'own'}
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() =>
                        set(
                          'elements',
                          values.elements.filter((other) => other !== item),
                        )
                      }
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {error('elements') ? <p className={forms.error}>{error('elements')}</p> : null}
            <details
              className={forms.addMore}
              open={values.elements.length === 0 && suggested.length <= 12}
            >
              <summary className={forms.addMoreSummary}>
                Choose personal data
                {suggested.length ? ` (${suggested.length} suggested)` : ''}
              </summary>
              <ElementPicker
                elements={catalogue}
                chosen={chosen}
                onChange={toggleElements}
                suggestion={{ presets: [], elements: suggested, categories: [], processes: [] }}
                suggestionTitle={
                  process
                    ? `Suggested by ${process.code} and the department’s data`
                    : 'The department’s data elements'
                }
                disabled={disabled}
                onAddCustom={(title, category) =>
                  values.elements.some((item) => item.title.toLowerCase() === title.toLowerCase())
                    ? undefined
                    : set('elements', [
                        ...values.elements,
                        {
                          code: null,
                          title,
                          category,
                          level: categoryInfo(category).level,
                        },
                      ])
                }
              />
            </details>
          </div>
        </fieldset>

        <fieldset className={forms.block} disabled={disabled}>
          <legend className={forms.blockTitle}>Where it is kept and who receives it</legend>
          <ChipSelect
            id="activity-systems"
            label="Systems"
            hint="Where it is processed and kept. Name the product if you know it."
            options={[
              ...options(kb.lists.systems),
              ...(process?.typicalSystems ?? []).map((value) => ({ value })),
            ]}
            values={values.systems}
            onChange={(next) => set('systems', next)}
            allowFree
            placeholder="e.g. HRMS"
            disabled={disabled}
          />
          {others.length ? (
            <fieldset className={forms.choices}>
              <legend className={forms.label}>Internal recipients</legend>
              <div className={forms.choiceGrid}>
                {others.map((item) => (
                  <label key={item.code} className={forms.choice}>
                    <input
                      type="checkbox"
                      checked={values.internalRecipients.includes(item.code)}
                      onChange={(event) =>
                        set(
                          'internalRecipients',
                          event.target.checked
                            ? [...values.internalRecipients, item.code]
                            : values.internalRecipients.filter((code) => code !== item.code),
                        )
                      }
                    />
                    <span>
                      {item.name} <span className="code">{item.code}</span>
                    </span>
                  </label>
                ))}
              </div>
              {error('internalRecipients') ? (
                <p className={forms.error}>{error('internalRecipients')}</p>
              ) : null}
            </fieldset>
          ) : null}
          <div className={forms.pair}>
            <ChipSelect
              id="activity-processors"
              label="Processors"
              hint="Organisations processing it on the client’s behalf."
              options={recipientOptions}
              values={values.processors}
              onChange={(next) => set('processors', next)}
              allowFree
              placeholder="e.g. Payroll provider"
              disabled={disabled}
            />
            <ChipSelect
              id="activity-recipients"
              label="Other recipients"
              hint="Organisations and authorities using it for their own purposes."
              options={recipientOptions}
              values={values.recipients}
              onChange={(next) => set('recipients', next)}
              allowFree
              placeholder="e.g. Bank"
              disabled={disabled}
            />
          </div>
          <div className={forms.pair}>
            <fieldset className={forms.choices}>
              <legend className={forms.label}>Cross-border transfer</legend>
              <div className={forms.radioRow}>
                {TRANSFERS.map(([value, label]) => (
                  <label key={value} className={forms.choice}>
                    <input
                      type="radio"
                      name="transfersAbroadChoice"
                      checked={values.transfersAbroad === value}
                      onChange={() => set('transfersAbroad', value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {values.transfersAbroad === 'yes' ? (
              <label className={forms.field}>
                <span className={forms.label}>Countries</span>
                <input
                  value={text('countries')}
                  maxLength={300}
                  placeholder="e.g. Singapore (cloud hosting)"
                  onChange={(event) => set('countries', event.target.value)}
                />
              </label>
            ) : null}
          </div>
        </fieldset>

        <fieldset className={forms.block} disabled={disabled}>
          <legend className={forms.blockTitle}>Retention and safeguards</legend>
          <div className={forms.pair}>
            <label className={forms.field}>
              <span className={forms.label}>Retention period</span>
              <span className={forms.hint}>Pick from the list, or type the client’s own.</span>
              <input
                value={text('retention')}
                maxLength={300}
                list="activity-retention"
                onChange={(event) => set('retention', event.target.value)}
              />
              <datalist id="activity-retention">
                {retentionOptions.map((answer) => (
                  <option key={answer.value} value={answer.value}>
                    {answer.extra.Reference ?? undefined}
                  </option>
                ))}
              </datalist>
            </label>
            <label className={forms.field}>
              <span className={forms.label}>Deletion</span>
              <span className={forms.hint}>What happens at the end of retention.</span>
              <select
                className={styles.select}
                value={values.deletion ?? ''}
                onChange={(event) => set('deletion', event.target.value || null)}
              >
                <option value="">Not recorded</option>
                {kb.lists.deletion.map((answer) => (
                  <option key={answer.value} value={answer.value}>
                    {answer.value}
                  </option>
                ))}
              </select>
              {error('deletion') ? <span className={forms.error}>{error('deletion')}</span> : null}
            </label>
          </div>
          <ToggleChips
            label="Security measures"
            hint="The Rule 6 safeguards in place. Hover a measure for what it means."
            options={options(kb.lists.security)}
            values={values.security.filter((item) =>
              kb.lists.security.some((answer) => answer.value === item),
            )}
            onChange={(next) =>
              set('security', [
                ...next,
                ...values.security.filter(
                  (item) => !kb.lists.security.some((answer) => answer.value === item),
                ),
              ])
            }
            disabled={disabled}
          />
          <ChipSelect
            id="activity-security-other"
            label="Other measures"
            options={[]}
            values={values.security.filter(
              (item) => !kb.lists.security.some((answer) => answer.value === item),
            )}
            onChange={(next) =>
              set('security', [
                ...values.security.filter((item) =>
                  kb.lists.security.some((answer) => answer.value === item),
                ),
                ...next,
              ])
            }
            allowFree
            placeholder="e.g. Field-level encryption for Aadhaar"
            disabled={disabled}
          />
        </fieldset>

        <fieldset className={forms.block} disabled={disabled}>
          <legend className={forms.blockTitle}>Notes</legend>
          <label className={forms.field}>
            <span className="visually-hidden">Notes</span>
            <textarea
              rows={3}
              maxLength={2000}
              value={text('notes')}
              placeholder="e.g. Consent captured through the consent manager since 15 Jan 2026"
              onChange={(event) => set('notes', event.target.value)}
            />
          </label>
        </fieldset>

        {disabled ? null : (
          <FormActions>
            <button
              type="submit"
              className={buttonClass('primary')}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Saving…' : 'Save activity'}
            </button>
          </FormActions>
        )}
      </form>
      {deleteAction && !disabled ? (
        <DeleteActivity action={deleteAction} name={values.name} />
      ) : null}
    </>
  )
}

const DeleteActivity = ({
  action,
  name,
}: {
  action: (state: FormState) => Promise<FormState>
  name: string
}) => {
  const { state, onSubmit, pending } = useSubmit(action)
  return (
    <form
      onSubmit={(event) => {
        if (window.confirm(`Delete “${name}” from the record of processing?`)) onSubmit(event)
        else event.preventDefault()
      }}
      className={forms.form}
    >
      <Feedback state={state} />
      <FormActions>
        <button type="submit" className={buttonClass('danger')} disabled={pending}>
          <Trash2 size={16} aria-hidden="true" />
          Delete activity
        </button>
      </FormActions>
    </form>
  )
}
