import { authorize } from '@duatf/core-access'
import {
  NotFoundError,
  optionalText,
  parseInput,
  requiredText,
  RuleError,
  ValidationError,
} from '@duatf/core-utils'
import {
  and,
  appendAudit,
  asc,
  dataElement,
  domain,
  eq,
  kbChange,
  kbEntryReview,
  lawfulBasis,
  ne,
  obligation,
  playbookDoc,
  processTemplate,
  retentionAnchor,
  sectorLaw,
  sectorOverlay,
  sql,
  vocabulary,
  vocabularyTerm,
  type ObligationTrigger,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { basisBody, basisExplanation, processBody, sectorBody, stuckSection } from './entryBodies'
import { flagLabel } from './describeTrigger'
import { ENTRY_NOUN, type EditableSection } from './refs'
import {
  actorOf,
  releaseReviews,
  requireDraft,
  type AuthoringContext,
  type EntryReview,
} from './releases'

// --- Form description shared with the web app -------------------------------------------------

export type FieldOption = { value: string; label: string; group?: string }

export type EntryField = {
  name: string
  label: string
  kind: 'text' | 'textarea' | 'lines' | 'select' | 'checkboxes' | 'markdown'
  hint?: string
  required?: boolean
  rows?: number
  maxLength?: number
  placeholder?: string
  options?: FieldOption[]
  /** Spans the full width of its group. */
  wide?: boolean
  /** Shown but not editable, such as the code of an existing entry. */
  readOnly?: boolean
}

export type EntryFieldGroup = { legend: string; note?: string; fields: EntryField[] }

/** Form values: text for most fields, a list for checkbox groups. */
export type EntryValues = Record<string, string | string[]>

export type EntryForm = {
  section: EditableSection
  mode: 'create' | 'edit'
  code?: string
  /** "Lawful basis ex17_4" or "New process template". */
  heading: string
  draftVersion: string
  groups: EntryFieldGroup[]
  values: EntryValues
  review?: EntryReview
  /** Why the entry cannot be removed; empty when it can. */
  removeBlockers: string[]
  /** True for process templates: the form offers to suggest obligations. */
  suggestsObligations: boolean
}

// --- Input helpers ----------------------------------------------------------------------------

const lines = (max = 60, itemMax = 400) =>
  z.preprocess(
    (value) =>
      typeof value === 'string'
        ? value
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : Array.isArray(value)
          ? (value as unknown[])
          : [],
    z
      .array(z.string().max(itemMax, `Keep each line under ${itemMax} characters.`))
      .max(max, `List at most ${max} items.`),
  )

const picks = () =>
  z.preprocess(
    (value) =>
      value === undefined || value === ''
        ? []
        : Array.isArray(value)
          ? (value as unknown[])
          : [value],
    z.array(z.string().max(80)).max(300),
  )

const unknownPicks = (field: string, chosen: string[], allowed: FieldOption[]) => {
  const known = new Set(allowed.map((option) => option.value))
  const unknown = chosen.filter((value) => !known.has(value))
  if (unknown.length) {
    throw new ValidationError({ [field]: `Not in the list: ${unknown.join(', ')}.` })
  }
}

const joinLines = (items: readonly string[]) => items.join('\n')
const sorted = (items: readonly string[]) => [...new Set(items)].sort()

/** "Exempt (State) - retention" -> the label that shows in pickers. */
const option = (value: string, label: string, group?: string): FieldOption =>
  group ? { value, label, group } : { value, label }

// --- Shared reads -----------------------------------------------------------------------------

const vocabularyTerms = async (tx: Transaction, releaseId: string, code: string) =>
  (
    await tx
      .select({ term: vocabularyTerm.term, meaning: vocabularyTerm.meaning })
      .from(vocabularyTerm)
      .where(and(eq(vocabularyTerm.releaseId, releaseId), eq(vocabularyTerm.vocabularyCode, code)))
      .orderBy(asc(vocabularyTerm.seq))
  ).map((row) => ({ term: row.term, meaning: row.meaning }))

const SENTENCE = (text: string) =>
  text ? text.charAt(0).toUpperCase() + text.slice(1).replaceAll('_', ' ') : text

/** Sensitivity tags: the context-tags vocabulary plus any tag already used on an entry. */
const tagOptions = async (tx: Transaction, releaseId: string): Promise<FieldOption[]> => {
  const vocab = await vocabularyTerms(tx, releaseId, 'context-tags')
  const used = await tx.execute<{ tag: string }>(sql`
    select distinct unnest(context_tags) as tag from data_element where release_id = ${releaseId}
    union select distinct unnest(context_tags) from process_template where release_id = ${releaseId}`)
  const meanings = new Map(vocab.map((row) => [row.term, row.meaning]))
  return sorted([...vocab.map((row) => row.term), ...used.map((row) => row.tag)]).map((tag) =>
    option(tag, meanings.get(tag) ? `${SENTENCE(tag)}: ${meanings.get(tag)}` : SENTENCE(tag)),
  )
}

const basisOptions = async (tx: Transaction, releaseId: string): Promise<FieldOption[]> =>
  (
    await tx
      .select({ code: lawfulBasis.code, name: lawfulBasis.name, reference: lawfulBasis.reference })
      .from(lawfulBasis)
      .where(eq(lawfulBasis.releaseId, releaseId))
      .orderBy(asc(lawfulBasis.code))
  ).map((row) => option(row.code, `${row.code}: ${row.name}`))

const FLAG_ORDER = [
  'children',
  'pwd',
  'processor',
  'cross_border',
  'third_schedule',
  'decision_or_disclosure',
  'legacy_data',
  'online_presence',
  'consent_manager_used',
  'tracking_ads',
  'marketing',
  'research',
]

/** Engine flags: the ones obligations and processes use, so a pick always means something. */
const flagOptions = async (tx: Transaction, releaseId: string): Promise<FieldOption[]> => {
  const used = await tx.execute<{ flag: string }>(sql`
    select distinct unnest(flags) as flag from process_template where release_id = ${releaseId}
    union select distinct jsonb_array_elements_text(trigger->'flags') from obligation
      where release_id = ${releaseId} and trigger ? 'flags'`)
  const flags = sorted([...FLAG_ORDER, ...used.map((row) => row.flag)])
  flags.sort((a, b) => {
    const [x, y] = [FLAG_ORDER.indexOf(a), FLAG_ORDER.indexOf(b)]
    return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || a.localeCompare(b)
  })
  return flags.map((flag) => option(flag, SENTENCE(flagLabel(flag))))
}

const categoryOptions = async (tx: Transaction, releaseId: string): Promise<FieldOption[]> => {
  const used = await tx.execute<{ category: string }>(sql`
    select distinct category from data_element where release_id = ${releaseId}
    union select distinct unnest(data_categories) from process_template where release_id = ${releaseId}
    order by 1`)
  return used.map((row) => option(row.category, SENTENCE(row.category)))
}

const obligationOptions = async (tx: Transaction, releaseId: string): Promise<FieldOption[]> => {
  const rows = await tx
    .select({
      code: obligation.code,
      title: obligation.title,
      domainCode: obligation.domainCode,
      domainTitle: domain.title,
      trigger: obligation.trigger,
    })
    .from(obligation)
    .leftJoin(
      domain,
      and(eq(domain.releaseId, obligation.releaseId), eq(domain.code, obligation.domainCode)),
    )
    .where(eq(obligation.releaseId, releaseId))
    .orderBy(asc(obligation.domainCode), asc(obligation.code))
  // Always-on obligations apply to every activity; a process lists only what it adds.
  return rows
    .filter((row) => !row.trigger.always)
    .map((row) =>
      option(
        row.code,
        `${row.code} ${row.title}`,
        `${row.domainCode} ${row.domainTitle ?? row.domainCode}`,
      ),
    )
}

/**
 * The obligations a process adds beyond the always-on baseline, from its lawful bases and engine
 * flags. Within one trigger every condition given must hold; entity-level role triggers (SDF,
 * Consent Manager) are left out because they depend on the organisation, not the process.
 */
export const triggeredObligations = (
  obligations: { code: string; trigger: ObligationTrigger }[],
  bases: readonly string[],
  flags: readonly string[],
): string[] =>
  obligations
    .filter(({ trigger }) => {
      if (trigger.always || trigger.role?.length) return false
      const basisOk = !trigger.basis?.length || trigger.basis.some((code) => bases.includes(code))
      const flagsOk = !trigger.flags?.length || trigger.flags.some((flag) => flags.includes(flag))
      return Boolean(trigger.basis?.length || trigger.flags?.length) && basisOk && flagsOk
    })
    .map((row) => row.code)
    .sort()

// --- Section definitions ----------------------------------------------------------------------

type Loaded = { values: EntryValues; title: string }
type Saved = { code: string; title: string; values: EntryValues }

type Definition = {
  /** Fields for a new or existing entry; prefix chooses the code family for a new one. */
  groups: (
    tx: Transaction,
    releaseId: string,
    mode: 'create' | 'edit',
  ) => Promise<EntryFieldGroup[]>
  /** Defaults for a new entry. */
  blank: (tx: Transaction, releaseId: string, prefix: string | undefined) => Promise<EntryValues>
  load: (tx: Transaction, releaseId: string, code: string) => Promise<Loaded | undefined>
  /** Validates and writes; code is the existing entry's code when editing. */
  save: (
    tx: Transaction,
    releaseId: string,
    raw: Record<string, unknown>,
    code: string | undefined,
  ) => Promise<Saved>
  /** Reasons the entry cannot be removed. */
  blockers: (tx: Transaction, releaseId: string, code: string) => Promise<string[]>
  remove: (tx: Transaction, releaseId: string, code: string) => Promise<void>
}

const codeField = (label: string, hint: string, mode: 'create' | 'edit'): EntryField => ({
  name: 'code',
  label,
  kind: 'text',
  required: mode === 'create',
  readOnly: mode === 'edit',
  maxLength: 40,
  hint:
    mode === 'edit' ? 'Codes cannot change: other entries and past releases refer to them.' : hint,
})

const codeSchema = (pattern: RegExp, message: string) =>
  z.string({ error: 'Give the code.' }).trim().regex(pattern, message)

const assertNew = (exists: boolean, code: string) => {
  if (exists) throw new ValidationError({ code: `${code} already exists in this draft.` })
}

const existingCodes = async (tx: Transaction, table: string, releaseId: string, column = 'code') =>
  (
    await tx.execute<{ code: string }>(
      sql`select ${sql.identifier(column)} as code from ${sql.identifier(table)} where release_id = ${releaseId}`,
    )
  ).map((row) => row.code)

/** The next free number after the highest code with this prefix: DE-HLT-011 -> DE-HLT-012. */
export const nextCode = (codes: readonly string[], prefix: string, digits: number): string => {
  const numbers = codes
    .filter((code) => code.startsWith(`${prefix}-`))
    .map((code) => Number(code.slice(prefix.length + 1)))
    .filter((value) => Number.isInteger(value))
  return `${prefix}-${String(Math.max(0, ...numbers) + 1).padStart(digits, '0')}`
}

// Lawful bases --------------------------------------------------------------------------------

const BASIS_CODE = /^[a-z][a-z0-9_]{1,19}$/

const basisSchema = z.object({
  name: requiredText('Meaning', 120),
  reference: requiredText('Reference', 80),
  explanation: optionalText(4000),
})

const bases: Definition = {
  groups: (_tx, _release, mode) =>
    Promise.resolve([
      {
        legend: 'Lawful basis or exemption',
        note: 'Codes starting s7 are legitimate uses under s.7; consent is s.6; anything else is listed as an exemption.',
        fields: [
          codeField(
            'Code',
            'Lower case, e.g. s7j or ex17_4. Used on processes and in obligation triggers.',
            mode,
          ),
          { name: 'name', label: 'Meaning', kind: 'text', required: true, maxLength: 120 },
          {
            name: 'reference',
            label: 'Reference',
            kind: 'text',
            required: true,
            maxLength: 80,
            placeholder: 's.17(4)',
            hint: 'Section, rule or schedule of the DPDP Act or Rules.',
          },
          {
            name: 'explanation',
            label: 'What it covers and what still applies',
            kind: 'markdown',
            rows: 6,
            wide: true,
            hint: 'Shown under the meaning. Markdown; quote the provision only as far as needed.',
          },
        ],
      },
    ]),
  blank: () => Promise.resolve({}),
  load: async (tx, releaseId, code) => {
    const [row] = await tx
      .select()
      .from(lawfulBasis)
      .where(and(eq(lawfulBasis.releaseId, releaseId), eq(lawfulBasis.code, code)))
    if (!row) return undefined
    return {
      title: row.name,
      values: {
        code: row.code,
        name: row.name,
        reference: row.reference,
        explanation: basisExplanation(row.bodyMd),
      },
    }
  },
  save: async (tx, releaseId, raw, existing) => {
    const input = parseInput(basisSchema, raw)
    const code =
      existing ??
      parseInput(
        z.object({
          code: codeSchema(
            BASIS_CODE,
            'Use 2 to 20 lower-case letters, digits or underscores, starting with a letter.',
          ),
        }),
        raw,
      ).code
    const row = {
      name: input.name,
      reference: input.reference,
      bodyMd: basisBody(code, input.name, input.reference, input.explanation ?? ''),
    }
    if (existing) {
      await tx
        .update(lawfulBasis)
        .set(row)
        .where(and(eq(lawfulBasis.releaseId, releaseId), eq(lawfulBasis.code, code)))
    } else {
      assertNew((await existingCodes(tx, 'lawful_basis', releaseId)).includes(code), code)
      await tx.insert(lawfulBasis).values({ releaseId, code, ...row })
    }
    return {
      code,
      title: input.name,
      values: {
        code,
        name: input.name,
        reference: input.reference,
        explanation: input.explanation ?? '',
      },
    }
  },
  blockers: async (tx, releaseId, code) => {
    const rows = await tx.execute<{ what: string }>(sql`
      select 'process ' || code as what from process_template
        where release_id = ${releaseId} and ${code} = any(typical_lawful_basis)
      union all
      select 'obligation ' || code from obligation
        where release_id = ${releaseId} and trigger->'basis' ? ${code}
      union all
      select 'question ' || code from question
        where release_id = ${releaseId} and applicability->'bases' ? ${code}
      order by 1`)
    return rows.length
      ? [
          `It is used by ${rows.length} ${rows.length === 1 ? 'entry' : 'entries'}: ${rows
            .slice(0, 8)
            .map((row) => row.what)
            .join(', ')}${rows.length > 8 ? ' and more' : ''}.`,
        ]
      : []
  },
  remove: async (tx, releaseId, code) => {
    await tx
      .delete(lawfulBasis)
      .where(and(eq(lawfulBasis.releaseId, releaseId), eq(lawfulBasis.code, code)))
  },
}

// Data elements -------------------------------------------------------------------------------

/** Families of data-element codes, as in DE-HLT-004. */
export const DATA_ELEMENT_GROUPS: Record<string, string> = {
  ID: 'Identity',
  CON: 'Contact',
  GOV: 'Government identifiers',
  FIN: 'Financial',
  HLT: 'Health',
  BIO: 'Biometric',
  FAM: 'Family',
  EDU: 'Education',
  EMP: 'Employment',
  DEV: 'Device and online',
  BEH: 'Behaviour and preferences',
  COM: 'Communications',
  LOC: 'Location',
  AV: 'Audio and video',
  SEN: 'Sensitive attributes',
  PRP: 'Property',
  VEH: 'Vehicle',
  DEM: 'Demographic',
  AUT: 'Authentication',
  BUS: 'Business identifiers',
}

const DATA_ELEMENT_CODE = /^DE-[A-Z]{2,4}-\d{3}$/

const dataElementSchema = z.object({
  title: requiredText('Data element', 120),
  category: optionalText(40),
  newCategory: optionalText(40),
  personalData: z.enum(['yes', 'no'], { error: 'Say whether it is personal data.' }),
  contextTags: picks(),
  note: optionalText(500),
})

const dataElements: Definition = {
  groups: async (tx, releaseId, mode) => [
    {
      legend: 'Data element',
      fields: [
        codeField('Code', 'DE-<family>-<number>, e.g. DE-HLT-012.', mode),
        { name: 'title', label: 'Data element', kind: 'text', required: true, maxLength: 120 },
        {
          name: 'category',
          label: 'Category',
          kind: 'select',
          options: await categoryOptions(tx, releaseId),
          placeholder: 'Choose…',
          hint: 'Process templates list their data by these categories.',
        },
        {
          name: 'newCategory',
          label: 'Or a new category',
          kind: 'text',
          maxLength: 40,
          placeholder: 'e.g. consent_record',
          hint: 'Lower case with underscores. Leave blank to use the category above.',
        },
        {
          name: 'personalData',
          label: 'Personal data',
          kind: 'select',
          options: [option('yes', 'Yes'), option('no', 'No')],
          required: true,
        },
        {
          name: 'contextTags',
          label: 'Sensitivity',
          kind: 'checkboxes',
          wide: true,
          options: await tagOptions(tx, releaseId),
          hint: 'Raises the impact score of findings on activities that hold this data.',
        },
        { name: 'note', label: 'Note', kind: 'textarea', rows: 3, wide: true },
      ],
    },
  ],
  blank: async (tx, releaseId, prefix) => {
    const family = prefix && DATA_ELEMENT_GROUPS[prefix] ? prefix : 'ID'
    return {
      code: nextCode(await existingCodes(tx, 'data_element', releaseId), `DE-${family}`, 3),
      personalData: 'yes',
    }
  },
  load: async (tx, releaseId, code) => {
    const [row] = await tx
      .select()
      .from(dataElement)
      .where(and(eq(dataElement.releaseId, releaseId), eq(dataElement.code, code)))
    if (!row) return undefined
    return {
      title: row.title,
      values: {
        code: row.code,
        title: row.title,
        category: row.category,
        personalData: row.personalData ? 'yes' : 'no',
        contextTags: row.contextTags,
        note: row.note ?? '',
      },
    }
  },
  save: async (tx, releaseId, raw, existing) => {
    const input = parseInput(dataElementSchema, raw)
    const code =
      existing ??
      parseInput(
        z.object({
          code: codeSchema(
            DATA_ELEMENT_CODE,
            'Use DE-, a family of 2 to 4 capitals and 3 digits, e.g. DE-HLT-012.',
          ),
        }),
        raw,
      ).code
    const category = input.newCategory ?? input.category
    if (!category) throw new ValidationError({ category: 'Choose a category or name a new one.' })
    if (input.newCategory && !/^[a-z][a-z_]{1,39}$/.test(input.newCategory)) {
      throw new ValidationError({ newCategory: 'Use lower-case letters and underscores.' })
    }
    unknownPicks('contextTags', input.contextTags, await tagOptions(tx, releaseId))
    const row = {
      title: input.title,
      category,
      personalData: input.personalData === 'yes',
      contextTags: sorted(input.contextTags),
      note: input.note ?? null,
    }
    if (existing) {
      await tx
        .update(dataElement)
        .set(row)
        .where(and(eq(dataElement.releaseId, releaseId), eq(dataElement.code, code)))
    } else {
      assertNew((await existingCodes(tx, 'data_element', releaseId)).includes(code), code)
      await tx.insert(dataElement).values({ releaseId, code, ...row })
    }
    return {
      code,
      title: input.title,
      values: {
        code,
        title: row.title,
        category,
        personalData: input.personalData,
        contextTags: row.contextTags,
        note: input.note ?? '',
      },
    }
  },
  blockers: () => Promise.resolve([]),
  remove: async (tx, releaseId, code) => {
    await tx
      .delete(dataElement)
      .where(and(eq(dataElement.releaseId, releaseId), eq(dataElement.code, code)))
  },
}

// Vocabularies --------------------------------------------------------------------------------

const VOCABULARY_CODE = /^[a-z][a-z0-9-]{1,40}$/

const vocabularySchema = z.object({
  title: requiredText('Title', 120),
  intro: optionalText(1000),
  columns: lines(6, 40),
  terms: lines(400, 600),
})

/** "Term | meaning | extra" lines into rows; a column count check keeps cells aligned. */
const parseTerms = (raw: string[], columns: string[]) =>
  raw.map((line, index) => {
    const cells = line.split('|').map((cell) => cell.trim())
    if (cells.length > Math.max(columns.length, 1)) {
      throw new ValidationError({
        terms: `Line ${index + 1} has ${cells.length} cells but the vocabulary has ${columns.length} columns.`,
      })
    }
    const [term = '', meaning, ...extra] = cells
    if (!term) throw new ValidationError({ terms: `Line ${index + 1} has no term.` })
    return {
      term,
      meaning: meaning || null,
      extra: Object.fromEntries(
        columns
          .slice(2)
          .map((header, offset) => [header, extra[offset] ?? ''] as const)
          .filter(([, value]) => value !== ''),
      ),
    }
  })

const vocabularies: Definition = {
  groups: (_tx, _release, mode) =>
    Promise.resolve([
      {
        legend: 'Vocabulary',
        fields: [
          codeField('Code', 'Lower case with hyphens, e.g. notice-languages.', mode),
          { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 120 },
          {
            name: 'intro',
            label: 'What the list is for',
            kind: 'textarea',
            rows: 2,
            wide: true,
            hint: 'Shown above the list.',
          },
          {
            name: 'columns',
            label: 'Column headings',
            kind: 'lines',
            rows: 3,
            hint: 'One per line. The first column is the term; the second, if any, its meaning.',
          },
        ],
      },
      {
        legend: 'Terms',
        fields: [
          {
            name: 'terms',
            label: 'One term per line',
            kind: 'lines',
            rows: 16,
            wide: true,
            hint: 'Separate columns with |, e.g. "Hindi | Eighth Schedule language". The order here is the order shown.',
          },
        ],
      },
    ]),
  blank: () => Promise.resolve({ columns: 'Term\nMeaning' }),
  load: async (tx, releaseId, code) => {
    const [row] = await tx
      .select()
      .from(vocabulary)
      .where(and(eq(vocabulary.releaseId, releaseId), eq(vocabulary.code, code)))
    if (!row) return undefined
    const terms = await tx
      .select()
      .from(vocabularyTerm)
      .where(and(eq(vocabularyTerm.releaseId, releaseId), eq(vocabularyTerm.vocabularyCode, code)))
      .orderBy(asc(vocabularyTerm.seq))
    const extraHeaders = row.columns.slice(2)
    return {
      title: row.title,
      values: {
        code: row.code,
        title: row.title,
        intro: row.intro ?? '',
        columns: joinLines(row.columns),
        terms: joinLines(
          terms.map((term) => {
            const cells = [
              term.term,
              term.meaning ?? '',
              ...extraHeaders.map((header) => term.extra[header] ?? ''),
            ]
            while (cells.length > 1 && cells.at(-1) === '') cells.pop()
            return cells.join(' | ')
          }),
        ),
      },
    }
  },
  save: async (tx, releaseId, raw, existing) => {
    const input = parseInput(vocabularySchema, raw)
    const code =
      existing ??
      parseInput(
        z.object({
          code: codeSchema(VOCABULARY_CODE, 'Use lower-case letters, digits and hyphens.'),
        }),
        raw,
      ).code
    const columns = input.columns.length ? input.columns : ['Term']
    const terms = parseTerms(input.terms, columns)
    if (terms.length === 0) throw new ValidationError({ terms: 'Add at least one term.' })
    const duplicate = terms.find(
      (term, index) => terms.findIndex((other) => other.term === term.term) !== index,
    )
    if (duplicate) throw new ValidationError({ terms: `"${duplicate.term}" is listed twice.` })
    const row = { title: input.title, intro: input.intro ?? null, columns }
    if (existing) {
      await tx
        .update(vocabulary)
        .set(row)
        .where(and(eq(vocabulary.releaseId, releaseId), eq(vocabulary.code, code)))
      await tx
        .delete(vocabularyTerm)
        .where(
          and(eq(vocabularyTerm.releaseId, releaseId), eq(vocabularyTerm.vocabularyCode, code)),
        )
    } else {
      assertNew((await existingCodes(tx, 'vocabulary', releaseId)).includes(code), code)
      await tx.insert(vocabulary).values({ releaseId, code, ...row })
    }
    await tx
      .insert(vocabularyTerm)
      .values(
        terms.map((term, index) => ({ releaseId, vocabularyCode: code, seq: index + 1, ...term })),
      )
    return {
      code,
      title: input.title,
      values: {
        code,
        title: input.title,
        intro: input.intro ?? '',
        columns: joinLines(columns),
        terms: joinLines(input.terms),
      },
    }
  },
  blockers: () => Promise.resolve([]),
  remove: async (tx, releaseId, code) => {
    await tx
      .delete(vocabularyTerm)
      .where(and(eq(vocabularyTerm.releaseId, releaseId), eq(vocabularyTerm.vocabularyCode, code)))
    await tx
      .delete(vocabulary)
      .where(and(eq(vocabulary.releaseId, releaseId), eq(vocabulary.code, code)))
  },
}

// Process templates ---------------------------------------------------------------------------

const COMMON = 'CMN'
const COMMON_NAME = 'All sectors (common functions)'

/** Function families of the common (all-sector) process templates, as in CMN-HR-03. */
export const COMMON_GROUPS: Record<string, string> = {
  HR: 'Human resources',
  FIN: 'Finance',
  MKT: 'Marketing',
  DIG: 'Digital products',
  CS: 'Customer service',
  IT: 'IT and security',
  LEG: 'Legal',
  ADM: 'Administration and facilities',
  CORP: 'Corporate',
}

const PROCESS_CODE = /^[A-Z]{3}(-[A-Z]{2,4})?-\d{2}$/

const processSchema = z.object({
  title: requiredText('Process', 160),
  sectorCode: requiredText('Sector', 8),
  department: requiredText('Department', 80),
  activities: lines(30, 200),
  dataPrincipals: lines(30, 120),
  dataCategories: picks(),
  typicalSystems: lines(30, 120),
  typicalThirdParties: lines(30, 120),
  typicalLawfulBasis: picks(),
  flags: picks(),
  contextTags: picks(),
  obligationCodes: picks(),
  assessorNote: optionalText(2000),
})

const sectorOptions = async (tx: Transaction, releaseId: string): Promise<FieldOption[]> => [
  option(COMMON, COMMON_NAME),
  ...(
    await tx
      .select({ code: sectorOverlay.code, title: sectorOverlay.title })
      .from(sectorOverlay)
      .where(eq(sectorOverlay.releaseId, releaseId))
      .orderBy(asc(sectorOverlay.title))
  ).map((row) => option(row.code, row.title)),
]

/** Keeps each overlay's list of process codes in step with the processes that name it. */
const refreshSectorProcesses = async (tx: Transaction, releaseId: string) => {
  await tx.execute(sql`
    update sector_overlay s set process_template_codes = coalesce(
      (select array_agg(p.code order by p.code) from process_template p
        where p.release_id = s.release_id and p.sector_code = s.code), '{}')
    where s.release_id = ${releaseId}
      and s.process_template_codes is distinct from coalesce(
        (select array_agg(p.code order by p.code) from process_template p
          where p.release_id = s.release_id and p.sector_code = s.code), '{}')`)
}

const processOptions = async (tx: Transaction, releaseId: string) => ({
  sectors: await sectorOptions(tx, releaseId),
  categories: await categoryOptions(tx, releaseId),
  bases: await basisOptions(tx, releaseId),
  flags: await flagOptions(tx, releaseId),
  tags: await tagOptions(tx, releaseId),
  obligations: await obligationOptions(tx, releaseId),
})

const processes: Definition = {
  groups: async (tx, releaseId, mode) => {
    const options = await processOptions(tx, releaseId)
    return [
      {
        legend: 'Process',
        fields: [
          codeField('Code', 'Sector code and a number, e.g. HLT-09 or CMN-HR-10.', mode),
          { name: 'title', label: 'Process', kind: 'text', required: true, maxLength: 160 },
          {
            name: 'sectorCode',
            label: 'Sector',
            kind: 'select',
            required: true,
            options: options.sectors,
            placeholder: 'Choose…',
          },
          {
            name: 'department',
            label: 'Department',
            kind: 'text',
            required: true,
            maxLength: 80,
            hint: 'Where the process usually sits, e.g. Patient Services.',
          },
          {
            name: 'activities',
            label: 'Typical activities',
            kind: 'lines',
            rows: 5,
            wide: true,
            hint: 'One per line. Assessors record one processing activity for each that exists.',
          },
          {
            name: 'assessorNote',
            label: 'Note for assessors',
            kind: 'textarea',
            rows: 3,
            wide: true,
          },
        ],
      },
      {
        legend: 'Whose data and what data',
        fields: [
          {
            name: 'dataPrincipals',
            label: 'Data principals',
            kind: 'lines',
            rows: 4,
            hint: 'One per line.',
          },
          {
            name: 'typicalSystems',
            label: 'Systems',
            kind: 'lines',
            rows: 4,
            hint: 'One per line.',
          },
          {
            name: 'typicalThirdParties',
            label: 'Third parties',
            kind: 'lines',
            rows: 4,
            hint: 'One per line: processors, partners, regulators.',
          },
          {
            name: 'dataCategories',
            label: 'Data categories',
            kind: 'checkboxes',
            wide: true,
            options: options.categories,
          },
          {
            name: 'contextTags',
            label: 'Sensitivity',
            kind: 'checkboxes',
            wide: true,
            options: options.tags,
          },
        ],
      },
      {
        legend: 'Law',
        note: 'The usual lawful basis and the facts that switch on extra obligations. The obligations list is what this process adds to the always-on baseline (governance, security, breach, retention and grievance).',
        fields: [
          {
            name: 'typicalLawfulBasis',
            label: 'Usual lawful basis',
            kind: 'checkboxes',
            wide: true,
            options: options.bases,
          },
          {
            name: 'flags',
            label: 'Facts to confirm',
            kind: 'checkboxes',
            wide: true,
            options: options.flags,
          },
          {
            name: 'obligationCodes',
            label: 'Obligations it usually triggers',
            kind: 'checkboxes',
            wide: true,
            options: options.obligations,
            hint: 'Use "Suggest obligations" to tick the ones the lawful basis and facts trigger, then adjust.',
          },
        ],
      },
    ]
  },
  blank: async (tx, releaseId, prefix) => {
    const sectors = await sectorOptions(tx, releaseId)
    const [sector = COMMON, group] = (prefix ?? COMMON).split('-')
    const known = sectors.some((row) => row.value === sector)
    const family = known
      ? sector === COMMON
        ? `${COMMON}-${group && COMMON_GROUPS[group] ? group : 'HR'}`
        : sector
      : COMMON
    return {
      code: nextCode(await existingCodes(tx, 'process_template', releaseId), family, 2),
      sectorCode: known ? sector : COMMON,
    }
  },
  load: async (tx, releaseId, code) => {
    const [row] = await tx
      .select()
      .from(processTemplate)
      .where(and(eq(processTemplate.releaseId, releaseId), eq(processTemplate.code, code)))
    if (!row) return undefined
    return {
      title: row.title,
      values: {
        code: row.code,
        title: row.title,
        sectorCode: row.sectorCode,
        department: row.department,
        activities: joinLines(row.activities),
        dataPrincipals: joinLines(row.dataPrincipals),
        dataCategories: row.dataCategories,
        typicalSystems: joinLines(row.typicalSystems),
        typicalThirdParties: joinLines(row.typicalThirdParties),
        typicalLawfulBasis: row.typicalLawfulBasis,
        flags: row.flags,
        contextTags: row.contextTags,
        obligationCodes: row.obligationCodes,
        assessorNote: row.assessorNote ?? '',
      },
    }
  },
  save: async (tx, releaseId, raw, existing) => {
    const input = parseInput(processSchema, raw)
    const code =
      existing ??
      parseInput(
        z.object({
          code: codeSchema(
            PROCESS_CODE,
            'Use the sector code and a number, e.g. HLT-09 or CMN-HR-10.',
          ),
        }),
        raw,
      ).code
    const options = await processOptions(tx, releaseId)
    unknownPicks('sectorCode', [input.sectorCode], options.sectors)
    if (!existing && !code.startsWith(`${input.sectorCode}-`)) {
      throw new ValidationError({
        code: `A ${input.sectorCode} process code starts with ${input.sectorCode}-.`,
      })
    }
    if (input.activities.length === 0) {
      throw new ValidationError({ activities: 'List at least one activity.' })
    }
    unknownPicks('dataCategories', input.dataCategories, options.categories)
    unknownPicks('typicalLawfulBasis', input.typicalLawfulBasis, options.bases)
    unknownPicks('flags', input.flags, options.flags)
    unknownPicks('contextTags', input.contextTags, options.tags)
    unknownPicks('obligationCodes', input.obligationCodes, options.obligations)
    const sectorName =
      options.sectors.find((row) => row.value === input.sectorCode)?.label ?? input.sectorCode
    const obligationTitles = new Map(
      (
        await tx
          .select({ code: obligation.code, title: obligation.title })
          .from(obligation)
          .where(eq(obligation.releaseId, releaseId))
      ).map((row) => [row.code, row.title]),
    )
    const fields = {
      title: input.title,
      sectorCode: input.sectorCode,
      sectorName,
      department: input.department,
      activities: input.activities,
      dataPrincipals: input.dataPrincipals,
      dataCategories: input.dataCategories,
      typicalSystems: input.typicalSystems,
      typicalThirdParties: input.typicalThirdParties,
      typicalLawfulBasis: input.typicalLawfulBasis,
      flags: input.flags,
      contextTags: sorted(input.contextTags),
      obligationCodes: sorted(input.obligationCodes),
      assessorNote: input.assessorNote ?? null,
    }
    const row = {
      ...fields,
      bodyMd: processBody(
        code,
        fields,
        (obligationCode) => obligationTitles.get(obligationCode) ?? '',
      ),
    }
    if (existing) {
      await tx
        .update(processTemplate)
        .set(row)
        .where(and(eq(processTemplate.releaseId, releaseId), eq(processTemplate.code, code)))
    } else {
      assertNew((await existingCodes(tx, 'process_template', releaseId)).includes(code), code)
      await tx.insert(processTemplate).values({ releaseId, code, ...row })
    }
    await refreshSectorProcesses(tx, releaseId)
    return {
      code,
      title: input.title,
      values: {
        code,
        title: input.title,
        sectorCode: input.sectorCode,
        department: input.department,
        activities: joinLines(input.activities),
        dataPrincipals: joinLines(input.dataPrincipals),
        dataCategories: input.dataCategories,
        typicalSystems: joinLines(input.typicalSystems),
        typicalThirdParties: joinLines(input.typicalThirdParties),
        typicalLawfulBasis: input.typicalLawfulBasis,
        flags: input.flags,
        contextTags: fields.contextTags,
        obligationCodes: fields.obligationCodes,
        assessorNote: input.assessorNote ?? '',
      },
    }
  },
  blockers: () => Promise.resolve([]),
  remove: async (tx, releaseId, code) => {
    await tx
      .delete(processTemplate)
      .where(and(eq(processTemplate.releaseId, releaseId), eq(processTemplate.code, code)))
    await refreshSectorProcesses(tx, releaseId)
  },
}

// Sector overlays -----------------------------------------------------------------------------

const SECTOR_CODE = /^[A-Z]{3}$/
const CONFIDENCE = new Map([
  ['checked', 'high'],
  ['high', 'high'],
  ['verify', 'verify'],
])

const sectorSchema = z.object({
  title: requiredText('Sector', 120),
  covers: requiredText('Covers', 600),
  regulators: lines(30, 160),
  keyPrincipals: lines(30, 120),
  localisation: optionalText(1000),
  hotspots: lines(30, 400),
  laws: lines(40, 600),
  retention: lines(40, 600),
})

const parseLaws = (raw: string[]) =>
  raw.map((line, index) => {
    const [law = '', relevance = ''] = line.split('|').map((cell) => cell.trim())
    if (!law || !relevance) {
      throw new ValidationError({ laws: `Line ${index + 1}: write "Law | why it matters".` })
    }
    return { law, relevance }
  })

const parseRetention = (raw: string[]) =>
  raw.map((line, index) => {
    const [record = '', period = '', source = '', status = 'verify'] = line
      .split('|')
      .map((cell) => cell.trim())
    const confidence = CONFIDENCE.get(status.toLowerCase())
    if (!record || !period || !source || !confidence) {
      throw new ValidationError({
        retention: `Line ${index + 1}: write "Record | period | source | checked or verify".`,
      })
    }
    return { record, period, source, confidence }
  })

const sectors: Definition = {
  groups: (_tx, _release, mode) =>
    Promise.resolve([
      {
        legend: 'Sector',
        fields: [
          codeField('Code', 'Three capitals, e.g. AGR. Clients and processes refer to it.', mode),
          { name: 'title', label: 'Sector', kind: 'text', required: true, maxLength: 120 },
          {
            name: 'covers',
            label: 'Covers',
            kind: 'textarea',
            required: true,
            rows: 2,
            wide: true,
            hint: 'The kinds of organisation, e.g. hospitals, clinics, diagnostic labs.',
          },
          {
            name: 'regulators',
            label: 'Regulators',
            kind: 'lines',
            rows: 4,
            hint: 'One per line.',
          },
          {
            name: 'keyPrincipals',
            label: 'Whose data',
            kind: 'lines',
            rows: 4,
            hint: 'Typical data principals, one per line.',
          },
          {
            name: 'localisation',
            label: 'Localisation and cross-border',
            kind: 'textarea',
            rows: 2,
            wide: true,
          },
          {
            name: 'hotspots',
            label: 'Where DPDP bites',
            kind: 'lines',
            rows: 5,
            wide: true,
            hint: 'One hotspot per line.',
          },
        ],
      },
      {
        legend: 'Sector law and retention',
        note: 'DPDP applies in addition to sector law (s.38). Retention periods justify keeping data after its purpose ends (s.8(7)).',
        fields: [
          {
            name: 'laws',
            label: 'Laws that run alongside DPDP',
            kind: 'lines',
            rows: 6,
            wide: true,
            hint: 'One per line: Law | why it matters for personal data.',
          },
          {
            name: 'retention',
            label: 'How long records must be kept',
            kind: 'lines',
            rows: 5,
            wide: true,
            hint: 'One per line: Record | period | source | checked or verify. Use verify until the current text is confirmed.',
          },
        ],
      },
    ]),
  blank: () => Promise.resolve({}),
  load: async (tx, releaseId, code) => {
    const [row] = await tx
      .select()
      .from(sectorOverlay)
      .where(and(eq(sectorOverlay.releaseId, releaseId), eq(sectorOverlay.code, code)))
    if (!row) return undefined
    const laws = await tx
      .select()
      .from(sectorLaw)
      .where(and(eq(sectorLaw.releaseId, releaseId), eq(sectorLaw.overlayCode, code)))
      .orderBy(asc(sectorLaw.seq))
    const retention = await tx
      .select()
      .from(retentionAnchor)
      .where(and(eq(retentionAnchor.releaseId, releaseId), eq(retentionAnchor.overlayCode, code)))
      .orderBy(asc(retentionAnchor.seq))
    return {
      title: row.title,
      values: {
        code: row.code,
        title: row.title,
        covers: row.covers,
        regulators: joinLines(row.regulators),
        keyPrincipals: joinLines(row.keyPrincipals),
        localisation: row.localisation ?? '',
        hotspots: joinLines(row.hotspots),
        laws: joinLines(laws.map((law) => `${law.law} | ${law.relevance}`)),
        retention: joinLines(
          retention.map(
            (item) =>
              `${item.record} | ${item.period} | ${item.source} | ${item.confidence === 'verify' ? 'verify' : 'checked'}`,
          ),
        ),
      },
    }
  },
  save: async (tx, releaseId, raw, existing) => {
    const input = parseInput(sectorSchema, raw)
    const code =
      existing ??
      parseInput(z.object({ code: codeSchema(SECTOR_CODE, 'Use three capital letters.') }), raw)
        .code
    if (code === COMMON)
      throw new ValidationError({ code: 'CMN is reserved for common functions.' })
    const laws = parseLaws(input.laws)
    const retention = parseRetention(input.retention)
    const [previous] = existing
      ? await tx
          .select({ bodyMd: sectorOverlay.bodyMd })
          .from(sectorOverlay)
          .where(and(eq(sectorOverlay.releaseId, releaseId), eq(sectorOverlay.code, code)))
      : []
    const processList = await tx
      .select({
        code: processTemplate.code,
        title: processTemplate.title,
        department: processTemplate.department,
      })
      .from(processTemplate)
      .where(and(eq(processTemplate.releaseId, releaseId), eq(processTemplate.sectorCode, code)))
      .orderBy(asc(processTemplate.code))
    const row = {
      title: input.title,
      covers: input.covers,
      regulators: input.regulators,
      keyPrincipals: input.keyPrincipals,
      localisation: input.localisation ?? null,
      hotspots: input.hotspots,
      processTemplateCodes: processList.map((item) => item.code),
    }
    const bodyMd = sectorBody(
      code,
      row,
      laws,
      retention,
      processList,
      stuckSection(previous?.bodyMd ?? ''),
    )
    if (existing) {
      await tx
        .update(sectorOverlay)
        .set({ ...row, bodyMd })
        .where(and(eq(sectorOverlay.releaseId, releaseId), eq(sectorOverlay.code, code)))
      await tx
        .delete(sectorLaw)
        .where(and(eq(sectorLaw.releaseId, releaseId), eq(sectorLaw.overlayCode, code)))
      await tx
        .delete(retentionAnchor)
        .where(and(eq(retentionAnchor.releaseId, releaseId), eq(retentionAnchor.overlayCode, code)))
      // Process templates carry the sector name for display.
      await tx
        .update(processTemplate)
        .set({ sectorName: input.title })
        .where(and(eq(processTemplate.releaseId, releaseId), eq(processTemplate.sectorCode, code)))
    } else {
      assertNew((await existingCodes(tx, 'sector_overlay', releaseId)).includes(code), code)
      await tx.insert(sectorOverlay).values({ releaseId, code, ...row, bodyMd })
    }
    if (laws.length) {
      await tx
        .insert(sectorLaw)
        .values(
          laws.map((law, index) => ({ releaseId, overlayCode: code, seq: index + 1, ...law })),
        )
    }
    if (retention.length) {
      await tx.insert(retentionAnchor).values(
        retention.map((item, index) => ({
          releaseId,
          overlayCode: code,
          seq: index + 1,
          ...item,
        })),
      )
    }
    return {
      code,
      title: input.title,
      values: {
        code,
        title: input.title,
        covers: input.covers,
        regulators: joinLines(input.regulators),
        keyPrincipals: joinLines(input.keyPrincipals),
        localisation: input.localisation ?? '',
        hotspots: joinLines(input.hotspots),
        laws: joinLines(input.laws),
        retention: joinLines(input.retention),
      },
    }
  },
  blockers: async (tx, releaseId, code) => {
    const reasons: string[] = []
    const [used] = await tx.execute<{ n: number }>(
      sql`select count(*)::int as n from process_template where release_id = ${releaseId} and sector_code = ${code}`,
    )
    if (used?.n) {
      reasons.push(
        `${used.n} process ${used.n === 1 ? 'template uses' : 'templates use'} this sector. Move or remove them first.`,
      )
    }
    await tx.execute(sql`select set_config('app.all_tenants', 'on', true)`)
    const clients = await tx.execute<{ code: string }>(sql`
      select t.code from client_profile c join tenant t on t.id = c.tenant_id
      where c.sector_code = ${code} order by t.code`)
    if (clients.length) {
      reasons.push(
        `Clients use it as their sector overlay: ${clients.map((row) => row.code).join(', ')}.`,
      )
    }
    return reasons
  },
  remove: async (tx, releaseId, code) => {
    await tx
      .delete(sectorLaw)
      .where(and(eq(sectorLaw.releaseId, releaseId), eq(sectorLaw.overlayCode, code)))
    await tx
      .delete(retentionAnchor)
      .where(and(eq(retentionAnchor.releaseId, releaseId), eq(retentionAnchor.overlayCode, code)))
    await tx
      .delete(sectorOverlay)
      .where(and(eq(sectorOverlay.releaseId, releaseId), eq(sectorOverlay.code, code)))
  },
}

// Playbooks -----------------------------------------------------------------------------------

const PLAYBOOK_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+){0,9}$/
export const DOC_TYPES = ['guide', 'reference', 'regulatory_log'] as const

const playbookSchema = z.object({
  title: requiredText('Title', 160),
  docType: z.enum(DOC_TYPES, { error: 'Choose the kind of document.' }),
  bodyMd: requiredText('Text', 60_000),
})

const playbooks: Definition = {
  groups: (_tx, _release, mode) =>
    Promise.resolve([
      {
        legend: 'Playbook',
        fields: [
          codeField(
            'Short name',
            'Lower case with hyphens, e.g. breach-response. Used in links.',
            mode,
          ),
          { name: 'title', label: 'Title', kind: 'text', required: true, maxLength: 160 },
          {
            name: 'docType',
            label: 'Kind',
            kind: 'select',
            required: true,
            options: [
              option('guide', 'Guide'),
              option('reference', 'Reference'),
              option('regulatory_log', 'Log'),
            ],
          },
          {
            name: 'bodyMd',
            label: 'Text',
            kind: 'markdown',
            required: true,
            rows: 24,
            wide: true,
            hint: 'Markdown. Link to the knowledge base with ref links, e.g. [OBL-BRE-01](ref:obligation/OBL-BRE-01) or [Rule 7](ref:law/R07).',
          },
        ],
      },
    ]),
  blank: () => Promise.resolve({ docType: 'guide' }),
  load: async (tx, releaseId, code) => {
    const [row] = await tx
      .select()
      .from(playbookDoc)
      .where(and(eq(playbookDoc.releaseId, releaseId), eq(playbookDoc.slug, code)))
    if (!row) return undefined
    return {
      title: row.title,
      values: { code: row.slug, title: row.title, docType: row.docType, bodyMd: row.bodyMd },
    }
  },
  save: async (tx, releaseId, raw, existing) => {
    const input = parseInput(playbookSchema, raw)
    const slug =
      existing ??
      parseInput(
        z.object({ code: codeSchema(PLAYBOOK_SLUG, 'Use lower-case words joined by hyphens.') }),
        raw,
      ).code
    const row = { title: input.title, docType: input.docType, bodyMd: input.bodyMd }
    if (existing) {
      await tx
        .update(playbookDoc)
        .set(row)
        .where(and(eq(playbookDoc.releaseId, releaseId), eq(playbookDoc.slug, slug)))
    } else {
      assertNew((await existingCodes(tx, 'playbook_doc', releaseId, 'slug')).includes(slug), slug)
      await tx.insert(playbookDoc).values({ releaseId, slug, ...row })
    }
    return { code: slug, title: input.title, values: { code: slug, ...row } }
  },
  blockers: async (tx, releaseId, code) => {
    const rows = await tx.execute<{ what: string }>(sql`
      select 'playbook ' || slug as what from playbook_doc
        where release_id = ${releaseId} and slug <> ${code} and body_md like ${`%(ref:playbook/${code})%`}
      union all
      select 'sector ' || code from sector_overlay
        where release_id = ${releaseId} and body_md like ${`%(ref:playbook/${code})%`}
      order by 1`)
    return rows.length
      ? [
          `Other entries link to it: ${rows.map((row) => row.what).join(', ')}. Remove those links first.`,
        ]
      : []
  },
  remove: async (tx, releaseId, code) => {
    await tx
      .delete(playbookDoc)
      .where(and(eq(playbookDoc.releaseId, releaseId), eq(playbookDoc.slug, code)))
  },
}

const DEFINITIONS: Record<EditableSection, Definition> = {
  bases,
  'data-elements': dataElements,
  vocabularies,
  processes,
  sectors,
  playbooks,
}

// --- Operations -------------------------------------------------------------------------------

const changedFields = (before: EntryValues, after: EntryValues, groups: EntryFieldGroup[]) => {
  const labels = new Map(
    groups.flatMap((group) => group.fields).map((field) => [field.name, field.label]),
  )
  const same = (a: string | string[] | undefined, b: string | string[] | undefined) =>
    JSON.stringify(Array.isArray(a) ? [...a].sort() : (a ?? '')) ===
    JSON.stringify(Array.isArray(b) ? [...b].sort() : (b ?? ''))
  return Object.keys(after)
    .filter((name) => name !== 'code' && !same(before[name], after[name]))
    .map((name) => labels.get(name) ?? name)
}

const recordChange = async (
  tx: Transaction,
  ctx: AuthoringContext,
  releaseId: string,
  entry: {
    section: EditableSection
    code: string
    title: string
    change: 'added' | 'edited' | 'removed' | 'reviewed'
    detail?: string | null
  },
) => {
  const actor = actorOf(ctx)
  await tx.insert(kbChange).values({
    releaseId,
    section: entry.section,
    code: entry.code,
    title: entry.title,
    change: entry.change,
    detail: entry.detail ?? null,
    actorUserId: actor.userId,
    actorName: actor.name,
  })
  await appendAudit(tx, {
    actorUserId: actor.userId,
    tenantId: null,
    action: `kb.entry.${entry.change}`,
    entity: entry.section,
    entityId: entry.code,
    detail: { releaseId, detail: entry.detail ?? null },
  })
}

/** Marks an entry as changed and awaiting legal review in the draft. */
const markChanged = async (
  tx: Transaction,
  ctx: AuthoringContext,
  releaseId: string,
  section: EditableSection,
  code: string,
) => {
  const actor = actorOf(ctx)
  const values = {
    status: 'awaiting_review' as const,
    origin: ctx.origin ?? 'staff',
    changedBy: actor.name,
    changedAt: new Date(),
    reviewedBy: null,
    reviewedAt: null,
    reviewNote: null,
  }
  await tx
    .insert(kbEntryReview)
    .values({ releaseId, section, code, ...values })
    .onConflictDoUpdate({
      target: [kbEntryReview.releaseId, kbEntryReview.section, kbEntryReview.code],
      set: values,
    })
}

const reviewOf = async (tx: Transaction, releaseId: string, section: string, code: string) =>
  (await releaseReviews(tx, releaseId, section)).find((row) => row.code === code)

/** The form for a new entry (prefix picks the code family) or an existing one. */
export const entryForm = async (
  ctx: AuthoringContext,
  section: EditableSection,
  target: { code?: string; prefix?: string },
): Promise<EntryForm> => {
  authorize(ctx.principal, 'kb.edit')
  const definition = DEFINITIONS[section]
  return ctx.db.transaction(async (tx) => {
    const draft = await requireDraft(tx)
    const mode = target.code ? 'edit' : 'create'
    const loaded = target.code ? await definition.load(tx, draft.id, target.code) : undefined
    if (target.code && !loaded) throw new NotFoundError(`${ENTRY_NOUN[section]} ${target.code}`)
    return {
      section,
      mode,
      code: target.code,
      heading: loaded ? loaded.title : `New ${ENTRY_NOUN[section]}`,
      draftVersion: draft.version,
      groups: await definition.groups(tx, draft.id, mode),
      values: loaded ? loaded.values : await definition.blank(tx, draft.id, target.prefix),
      review: target.code ? await reviewOf(tx, draft.id, section, target.code) : undefined,
      removeBlockers: target.code ? await definition.blockers(tx, draft.id, target.code) : [],
      suggestsObligations: section === 'processes',
    }
  })
}

/** Adds an entry to the draft, or saves changes to one; returns its code. */
export const saveEntry = async (
  ctx: AuthoringContext,
  section: EditableSection,
  raw: Record<string, unknown>,
  code?: string,
): Promise<{ code: string }> => {
  authorize(ctx.principal, 'kb.edit')
  const definition = DEFINITIONS[section]
  return ctx.db.transaction(async (tx) => {
    const draft = await requireDraft(tx)
    const before = code ? await definition.load(tx, draft.id, code) : undefined
    if (code && !before) throw new NotFoundError(`${ENTRY_NOUN[section]} ${code}`)
    const saved = await definition.save(tx, draft.id, raw, code)
    if (before) {
      const groups = await definition.groups(tx, draft.id, 'edit')
      const changed = changedFields(before.values, saved.values, groups)
      if (changed.length === 0) return { code: saved.code }
      await recordChange(tx, ctx, draft.id, {
        section,
        code: saved.code,
        title: saved.title,
        change: 'edited',
        detail: `Changed: ${changed.join(', ')}.`,
      })
    } else {
      await recordChange(tx, ctx, draft.id, {
        section,
        code: saved.code,
        title: saved.title,
        change: 'added',
      })
    }
    await markChanged(tx, ctx, draft.id, section, saved.code)
    return { code: saved.code }
  })
}

/** Removes an entry from the draft when nothing depends on it. */
export const removeEntry = async (
  ctx: AuthoringContext,
  section: EditableSection,
  code: string,
): Promise<void> => {
  authorize(ctx.principal, 'kb.edit')
  const definition = DEFINITIONS[section]
  await ctx.db.transaction(async (tx) => {
    const draft = await requireDraft(tx)
    const loaded = await definition.load(tx, draft.id, code)
    if (!loaded) throw new NotFoundError(`${ENTRY_NOUN[section]} ${code}`)
    const blockers = await definition.blockers(tx, draft.id, code)
    if (blockers.length) throw new RuleError(`${code} cannot be removed. ${blockers.join(' ')}`)
    await definition.remove(tx, draft.id, code)
    await tx
      .delete(kbEntryReview)
      .where(
        and(
          eq(kbEntryReview.releaseId, draft.id),
          eq(kbEntryReview.section, section),
          eq(kbEntryReview.code, code),
        ),
      )
    await recordChange(tx, ctx, draft.id, { section, code, title: loaded.title, change: 'removed' })
  })
}

const reviewSchema = z.object({ note: optionalText(1000) })

/** Records the legal review of an entry added or changed in the draft. */
export const markReviewed = async (
  ctx: AuthoringContext,
  section: EditableSection,
  code: string,
  raw: unknown,
): Promise<void> => {
  authorize(ctx.principal, 'kb.publish')
  const input = parseInput(reviewSchema, raw)
  const actor = actorOf(ctx)
  await ctx.db.transaction(async (tx) => {
    const draft = await requireDraft(tx)
    const review = await reviewOf(tx, draft.id, section, code)
    if (!review) throw new NotFoundError(`A change to ${code} awaiting review`)
    if (review.status === 'reviewed') throw new RuleError(`${code} is already reviewed.`)
    const loaded = await DEFINITIONS[section].load(tx, draft.id, code)
    await tx
      .update(kbEntryReview)
      .set({
        status: 'reviewed',
        reviewedBy: actor.name,
        reviewedAt: new Date(),
        reviewNote: input.note ?? null,
      })
      .where(
        and(
          eq(kbEntryReview.releaseId, draft.id),
          eq(kbEntryReview.section, section),
          eq(kbEntryReview.code, code),
        ),
      )
    await recordChange(tx, ctx, draft.id, {
      section,
      code,
      title: loaded?.title ?? code,
      change: 'reviewed',
      detail: input.note ?? null,
    })
  })
}

const suggestSchema = z.object({ typicalLawfulBasis: picks(), flags: picks() })

/** Obligations from laws other than the DPDP Act and Rules, such as the CERT-In Directions. */
const OTHER_LAW = 'Other Indian law'

/** The obligations a process's lawful bases and flags trigger in the draft. */
export const suggestObligations = async (
  ctx: AuthoringContext,
  raw: Record<string, unknown>,
): Promise<string[]> => {
  authorize(ctx.principal, 'kb.edit')
  const input = parseInput(suggestSchema, raw)
  return ctx.db.transaction(async (tx) => {
    const draft = await requireDraft(tx)
    const rows = await tx
      .select({ code: obligation.code, trigger: obligation.trigger })
      .from(obligation)
      .where(and(eq(obligation.releaseId, draft.id), ne(obligation.regime, OTHER_LAW)))
    return triggeredObligations(rows, input.typicalLawfulBasis, input.flags)
  })
}

export type CodeFamily = { prefix: string; label: string; next: string }

/** Where a new entry can go, for sections whose codes come in families. */
export const codeFamilies = async (
  ctx: AuthoringContext,
  section: EditableSection,
): Promise<CodeFamily[]> => {
  authorize(ctx.principal, 'kb.edit')
  return ctx.db.transaction(async (tx) => {
    const draft = await requireDraft(tx)
    if (section === 'data-elements') {
      const codes = await existingCodes(tx, 'data_element', draft.id)
      return Object.entries(DATA_ELEMENT_GROUPS).map(([prefix, label]) => ({
        prefix,
        label,
        next: nextCode(codes, `DE-${prefix}`, 3),
      }))
    }
    if (section === 'processes') {
      const codes = await existingCodes(tx, 'process_template', draft.id)
      const sectorRows = await sectorOptions(tx, draft.id)
      return [
        ...Object.entries(COMMON_GROUPS).map(([group, label]) => ({
          prefix: `${COMMON}-${group}`,
          label: `Common functions: ${label}`,
          next: nextCode(codes, `${COMMON}-${group}`, 2),
        })),
        ...sectorRows
          .filter((row) => row.value !== COMMON)
          .map((row) => ({
            prefix: row.value,
            label: row.label,
            next: nextCode(codes, row.value, 2),
          })),
      ]
    }
    return []
  })
}
