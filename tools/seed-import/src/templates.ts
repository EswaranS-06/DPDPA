import { readdirSync } from 'node:fs'
import { basename, join } from 'node:path'
import ExcelJS from 'exceljs'
import { parse, stringify } from 'yaml'
import { z } from 'zod'

// The ComplyX question templates are kept as Excel workbooks (seed/question-bank/source). Each
// has a "Template Export" sheet with one row per question and an "_options" sheet holding the
// drop-down lists the Options column points at. `pnpm questions:import` turns them into
// templates.yaml, which the release build reads.

export const TEMPLATE_TYPES = [
  'BINARY_PLUS',
  'MATURITY',
  'SINGLE_SELECT',
  'MULTI_SELECT',
  'FREE_TEXT',
] as const
export const TEMPLATE_RISKS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const

const templateQuestionSchema = z.object({
  code: z.string().regex(/^[A-Z]\d+(\.\d+)+[a-z]?$/, 'Codes look like A1.1, C12.4 or B0.3a.'),
  id: z.string(),
  section: z.string().min(1),
  text: z.string().min(10),
  type: z.enum(TEMPLATE_TYPES),
  options: z.array(z.string().min(1)),
  risk: z.enum(TEMPLATE_RISKS),
  ref: z.string().nullable(),
  attachment: z.boolean(),
  /** ComplyX's evidence list for the question, when the workbook has an Evidence column. */
  evidence: z.array(z.string().min(1)).optional(),
})
export type TemplateQuestion = z.infer<typeof templateQuestionSchema>

const templateFileSchema = z.object({
  file: z.string(),
  questionnaire: z.string().regex(/^TPL-\d{3}$/),
  questions: z.array(templateQuestionSchema).min(1),
})
export type TemplateFile = z.infer<typeof templateFileSchema>

const templateBankSchema = z.object({
  version: z.literal(1),
  files: z.array(templateFileSchema).min(1),
})

/** Reads templates.yaml; question codes must be unique across all questionnaires. */
export const parseTemplateBank = (source: string): TemplateFile[] => {
  const { files } = templateBankSchema.parse(parse(source))
  const seen = new Set<string>()
  for (const question of files.flatMap((file) => file.questions)) {
    if (seen.has(question.code)) throw new Error(`Question ${question.code} appears twice.`)
    seen.add(question.code)
  }
  return files
}

const HEADERS = [
  'Question ID',
  'Section',
  'Code',
  'Question',
  'Type',
  'Options',
  'Risk Weight',
  'DPDP Ref',
  'Requires Attachment',
] as const

const cellText = (value: ExcelJS.CellValue): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    if ('richText' in value) return value.richText.map((part) => part.text).join('')
    if ('text' in value) return String(value.text)
    if ('result' in value) return cellText(value.result)
    return ''
  }
  return String(value).trim()
}

/** "(pick any, semicolon-separated: A; B; C)" lists the choices of a multi-select question. */
export const optionsFromNote = (note: string): string[] => {
  const listed = /:\s*(.+?)\)?\s*$/.exec(note)?.[1] ?? ''
  return listed
    .split(';')
    .map((item) => item.trim())
    .filter(Boolean)
}

/** One evidence item per line of the Evidence cell, without bullets. */
export const evidenceItems = (cell: string): string[] =>
  cell
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-*]+/, '').trim())
    .filter(Boolean)

/** The drop-down list of a row: "_options!$A$2:$D$2" read from the options sheet. */
const listFor = (formula: string | undefined, options: ExcelJS.Worksheet): string[] => {
  const match = /_options!\$([A-Z]+)\$(\d+):\$([A-Z]+)\$(\d+)/.exec(formula ?? '')
  if (!match) return []
  const row = options.getRow(Number(match[2]))
  const first = options.getColumn(match[1] ?? 'A').number
  const last = options.getColumn(match[3] ?? 'A').number
  const values: string[] = []
  for (let column = first; column <= last; column += 1) {
    const text = cellText(row.getCell(column).value)
    if (text) values.push(text)
  }
  return values
}

/** Reads one template workbook. */
export const readTemplateWorkbook = async (path: string): Promise<TemplateFile> => {
  const file = basename(path)
  const questionnaire = /^(TPL-\d{3})/.exec(file)?.[1]
  if (!questionnaire) throw new Error(`${file}: the file name must start with TPL-nnn.`)
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(path)
  const sheet = workbook.getWorksheet('Template Export')
  const options = workbook.getWorksheet('_options')
  if (!sheet || !options) throw new Error(`${file}: needs "Template Export" and "_options" sheets.`)
  const header = HEADERS.map((_, index) => cellText(sheet.getRow(1).getCell(index + 1).value))
  if (header.join('|') !== HEADERS.join('|')) {
    throw new Error(`${file}: unexpected columns ${header.join(', ')}.`)
  }
  const evidenceColumn = cellText(sheet.getRow(1).getCell(HEADERS.length + 1).value) === 'Evidence'
  const validations = (
    sheet as unknown as { dataValidations: { model: Record<string, { formulae?: string[] }> } }
  ).dataValidations.model
  const questions: TemplateQuestion[] = []
  sheet.eachRow((row, number) => {
    if (number === 1) return
    const cell = (index: number) => cellText(row.getCell(index).value)
    if (!cell(3)) return
    const type = cell(5) as TemplateQuestion['type']
    const note = cell(6)
    const listed = listFor(validations[`F${number}`]?.formulae?.[0], options)
    const ref = cell(8)
    const evidence = evidenceColumn ? evidenceItems(cell(HEADERS.length + 1)) : []
    questions.push(
      templateQuestionSchema.parse({
        code: cell(3),
        id: cell(1),
        section: cell(2),
        text: cell(4),
        type,
        options: type === 'MULTI_SELECT' && listed.length === 0 ? optionsFromNote(note) : listed,
        risk: cell(7),
        ref: ref === '' || ref === '—' || ref === '-' ? null : ref,
        attachment: cell(9).toLowerCase() === 'yes',
        ...(evidence.length ? { evidence } : {}),
      }),
    )
  })
  return { file, questionnaire, questions }
}

/** Reads every TPL-*.xlsx in a folder, in file-name order. */
export const readTemplateFolder = async (folder: string): Promise<TemplateFile[]> => {
  const names = readdirSync(folder)
    .filter((name) => /^TPL-\d{3}.*\.xlsx$/i.test(name))
    .sort()
  if (names.length === 0) throw new Error(`No TPL-*.xlsx workbooks in ${folder}.`)
  const files: TemplateFile[] = []
  for (const name of names) files.push(await readTemplateWorkbook(join(folder, name)))
  return files
}

/** templates.yaml for the given workbooks. */
export const templateBankYaml = (files: TemplateFile[]): string =>
  [
    '# Generated by `pnpm questions:import` from seed/question-bank/source/*.xlsx.',
    '# Edit the workbooks and import again; the knowledge-base mapping lives in kb-mapping.yaml.',
    stringify({ version: 1, files }, { lineWidth: 0 }),
  ].join('\n')
