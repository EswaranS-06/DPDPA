import { readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { isTruthy, parseDurationDays, type RenderAnalysis, type RenderState } from './engine'
import { libraryRoot, readLibraryText, type LibraryData, type Template } from './library'

// Part A of the library's validation checklist (00-common/validation-checklist.md), run on every
// render: a "block" stops the downloads, a "warn" is listed. A2 is the library's own structural
// validator (tools/validate.py), ported.

export type CheckLevel = 'block' | 'warn'
export type CheckResult = { id: string; level: CheckLevel; message: string; templateId?: string }

/** The 22 languages of the Eighth Schedule to the Constitution (s.5(3) of the Act). */
export const EIGHTH_SCHEDULE = [
  'Assamese',
  'Bengali',
  'Bodo',
  'Dogri',
  'Gujarati',
  'Hindi',
  'Kannada',
  'Kashmiri',
  'Konkani',
  'Maithili',
  'Malayalam',
  'Manipuri',
  'Marathi',
  'Nepali',
  'Odia',
  'Punjabi',
  'Sanskrit',
  'Santali',
  'Sindhi',
  'Tamil',
  'Telugu',
  'Urdu',
]

/** Templates whose body must carry the contact block (A13, Rule 9). */
export const CONTACT_BLOCK_TEMPLATES = ['N01', 'N02', 'N05', 'N06', 'R01', 'R04']

// ---- A2: the library's structural validator ----

const PH = /\[((?:[A-Z][A-Za-z0-9]*)(?:-[A-Za-z0-9]+)*)\](?!\()/g
const IF = /^<!--\s*IF\s+(NOT\s+)?([A-Za-z0-9-]+)(?:\s*(==|!=|has)\s*([A-Za-z0-9-]+))?\s*-->$/
const ENDIF = /^<!--\s*END IF\s*-->$/
const REP = /^<!--\s*REPEAT\s+([A-Za-z0-9-]+)\s*-->$/
const ENDREP = /^<!--\s*END REPEAT\s*-->$/
const INC = /^<!--\s*INCLUDE\s+([A-Za-z0-9-]+)\s*-->$/

const markdownFiles = (dir: string): string[] =>
  readdirSync(dir)
    .flatMap((name) => {
      const path = join(dir, name)
      return statSync(path).isDirectory()
        ? markdownFiles(path)
        : name.endsWith('.md') && name !== 'README.md'
          ? [path]
          : []
    })
    .sort()

/** Every structural problem in the library's Markdown files, as the library's validator lists them. */
export const structureIssues = (root = libraryRoot()) => {
  const shared = readLibraryText(join(root, '00-common', 'shared-blocks.md'))
  const blocks = new Set([...shared.matchAll(/^## BLOCK:\s*([a-z0-9-]+)/gm)].map((m) => m[1]))
  const flagsDoc = readLibraryText(join(root, '00-common', 'conditional-flags.md'))
  const knownFlags = new Set(
    [...flagsDoc.matchAll(/\|\s*`([A-Za-z0-9-]+)`\s*\|/g)].map((m) => m[1]),
  )
  const problems: string[] = []
  const flagsUsed = new Set<string>()
  for (const path of markdownFiles(root)) {
    // Ignore the copy of the Studio's own files that are not templates.
    const rel = relative(root, path).replace(/\\/g, '/')
    if (rel.startsWith('ui/')) continue
    const text = readLibraryText(path)
    let depth = 0
    for (const match of text.matchAll(/<!--.*?-->/g)) {
      const comment = match[0]
      const condition = IF.exec(comment)
      if (condition) {
        depth += 1
        flagsUsed.add(condition[2] ?? '')
      } else if (ENDIF.test(comment)) {
        depth -= 1
        if (depth < 0) {
          problems.push(`${rel}: END IF without IF at ${match.index}`)
          depth = 0
        }
      } else if (!REP.test(comment) && !ENDREP.test(comment) && !INC.test(comment)) {
        problems.push(`${rel}: unrecognised comment ${comment.slice(0, 60)}`)
      }
    }
    if (depth !== 0) problems.push(`${rel}: ${depth} unclosed IF`)
    const repeats = [...text.matchAll(/<!--\s*REPEAT\s+([A-Za-z0-9-]+)\s*-->/g)].length
    const ends = [...text.matchAll(/<!--\s*END REPEAT\s*-->/g)].length
    if (repeats !== ends) problems.push(`${rel}: REPEAT/END REPEAT mismatch ${repeats}/${ends}`)
    for (const include of text.matchAll(/<!--\s*INCLUDE\s+([A-Za-z0-9-]+)\s*-->/g)) {
      if (!blocks.has(include[1])) problems.push(`${rel}: INCLUDE ${include[1] ?? ''} not defined`)
    }
  }
  return {
    problems,
    unknownFlags: [...flagsUsed].filter((flag) => !knownFlags.has(flag)).sort(),
  }
}

// ---- The render-time checks ----

const filled = (value: string | undefined) => (value ?? '').trim() !== ''

/** The checks of one rendered document: A1, A3, A4, A5 where it uses the grievance period, A13. */
export const documentChecks = (
  template: Template,
  rendered: { markdown: string; analysis: RenderAnalysis },
  state: RenderState,
): CheckResult[] => {
  const out: CheckResult[] = []
  const at = { templateId: template.id }
  if (rendered.analysis.missing.length) {
    out.push({
      id: 'A1',
      level: 'block',
      message: `${rendered.analysis.missing.length} value${rendered.analysis.missing.length === 1 ? '' : 's'} still to fill: ${rendered.analysis.missing.slice(0, 8).join(', ')}${rendered.analysis.missing.length > 8 ? '…' : ''}.`,
      ...at,
    })
  }
  const unfilledRows = [...rendered.markdown.matchAll(PH)].map((m) => m[1] ?? '')
  const rowFields = unfilledRows.filter((name) => !rendered.analysis.missing.includes(name))
  if (rowFields.length) {
    out.push({
      id: 'A1',
      level: 'block',
      message: `Tables still to fill: ${[...rendered.analysis.emptyCollections].join(', ') || [...new Set(rowFields)].slice(0, 6).join(', ')}.`,
      ...at,
    })
  }
  if (/^> \*\*(?:🛈 )?Drafting note/m.test(rendered.markdown) || /<!--/.test(rendered.markdown)) {
    out.push({
      id: 'A3',
      level: 'block',
      message: 'A drafting note or a comment is still in the text.',
      ...at,
    })
  }
  const server = String(state.values['Server-name'] ?? '').trim()
  if (
    /^(public|regulator)/.test(template.publish) &&
    server &&
    rendered.markdown.includes(server)
  ) {
    out.push({
      id: 'A4',
      level: 'block',
      message: `The preparer's name (${server}) appears in a ${template.publish.split(' ')[0]} document.`,
      ...at,
    })
  }
  if (rendered.analysis.fields.has('Grievance-Resolution-Period')) {
    const days = parseDurationDays(state.values['Grievance-Resolution-Period'])
    if (days !== null && days > 90) {
      out.push({
        id: 'A5',
        level: 'block',
        message: 'The grievance resolution period is over 90 days (Rule 14(3)).',
        ...at,
      })
    }
  }
  if (
    CONTACT_BLOCK_TEMPLATES.includes(template.id) &&
    !/<!--\s*INCLUDE\s+contact-block\s*-->/.test(template.body)
  ) {
    out.push({
      id: 'A13',
      level: 'block',
      message: 'The contact block is missing (Rule 9).',
      ...at,
    })
  }
  return out
}

/** The checks of the client's pack as a whole: A5 to A12, A14 and A15. */
export const projectChecks = (
  state: RenderState,
  recommended: readonly string[],
): CheckResult[] => {
  const out: CheckResult[] = []
  const flag = (name: string) => isTruthy(state.flags[name])
  const value = (name: string) => state.values[name]
  const grievance = parseDurationDays(value('Grievance-Resolution-Period'))
  if (grievance !== null && grievance > 90) {
    out.push({
      id: 'A5',
      level: 'block',
      message: 'The grievance resolution period is over 90 days (Rule 14(3)).',
    })
  }
  const thirdSchedule = state.flags['Third-Schedule-Entity']
  if (isTruthy(thirdSchedule)) {
    const days = parseFloat(String(value('Erasure-Pre-Notice-Days') ?? ''))
    if (!(days * 24 >= 48)) {
      out.push({
        id: 'A6',
        level: 'block',
        message:
          'A Third Schedule entity must give at least 48 hours’ notice before erasure (Rule 8(2)): set Erasure-Pre-Notice-Days to 2 or more.',
      })
    }
  }
  for (const row of state.collections['Consent-Purposes'] ?? []) {
    const name = String(row['Purpose-Name'] ?? '').trim()
    if (!name) continue
    if (!(
      filled(row['Purpose-Data-Items']) &&
      filled(row['Purpose-Service-Description']) &&
      filled(row['Purpose-Retention'])
    )) {
      out.push({
        id: 'A7',
        level: 'block',
        message: `Consent purpose “${name}” needs its data items, the service it enables and its retention (Rule 3(b)).`,
      })
    }
    if (
      /market|advert|personali|analytic|promot/i.test(name) &&
      /^y/i.test(String(row['Purpose-Mandatory'] ?? ''))
    ) {
      out.push({
        id: 'A8',
        level: 'warn',
        message: `“${name}” is marked mandatory: an optional purpose must not be a condition of the service (s.6(1)).`,
      })
    }
  }
  if (flag('Is-SDF')) {
    for (const name of ['DPO-Name', 'DPO-Email', 'DPO-Phone']) {
      if (!filled(value(name))) {
        out.push({
          id: 'A9',
          level: 'block',
          message: `A Significant Data Fiduciary needs ${name} (s.10(2)(a)).`,
        })
      }
    }
    for (const id of ['S01', 'S02', 'S03']) {
      if (!recommended.includes(id))
        out.push({ id: 'A9', level: 'block', message: `A Significant Data Fiduciary needs ${id}.` })
    }
  }
  if (flag('Processes-Children-Data')) {
    if (!recommended.includes('N05')) {
      out.push({
        id: 'A10',
        level: 'block',
        message: 'Children’s data is processed, so N05 (parental consent) is needed (s.9).',
      })
    }
    for (const row of state.collections.Cookies ?? []) {
      if (
        /marketing/i.test(String(row['Cookie-Category'] ?? '')) &&
        /^y/i.test(String(row['Cookie-Child-Safe'] ?? ''))
      ) {
        out.push({
          id: 'A10',
          level: 'block',
          message: `Marketing cookie “${row['Cookie-Name'] ?? ''}” is marked safe for children: tracking and targeted advertising aimed at children are not allowed (s.9(3)).`,
        })
      }
    }
  }
  if (flag('Cross-Border-Transfer')) {
    if (!filled(value('Cross-Border-Countries'))) {
      out.push({
        id: 'A11',
        level: 'block',
        message: 'Data goes outside India: fill Cross-Border-Countries.',
      })
    }
    if (!recommended.includes('V05')) {
      out.push({
        id: 'A11',
        level: 'block',
        message: 'Data goes outside India, so V05 (cross-border clauses) is needed.',
      })
    }
  }
  for (const name of ['Log-Retention-Period', 'Processor-Log-Retention']) {
    const days = parseDurationDays(value(name))
    if (days !== null && days < 365) {
      out.push({
        id: 'A12',
        level: 'warn',
        message: `${name} is under one year (Rules 6(1)(e), 8(3)).`,
      })
    }
  }
  const languages = String(value('Notice-Languages') ?? '')
    .split(/[,;/]/)
    .map((item) => item.trim())
    .filter(Boolean)
  const unknown = languages.filter(
    (language) => !EIGHTH_SCHEDULE.some((known) => known.toLowerCase() === language.toLowerCase()),
  )
  if (unknown.length) {
    out.push({
      id: 'A14',
      level: 'warn',
      message: `Not an Eighth Schedule language: ${unknown.join(', ')} (s.5(3)).`,
    })
  }
  const effective = String(value('Effective-Date') ?? '')
  const review = String(value('Next-Review-Date') ?? '')
  if (/^\d{4}-\d{2}-\d{2}$/.test(effective) && /^\d{4}-\d{2}-\d{2}$/.test(review)) {
    const months =
      (Number(review.slice(0, 4)) - Number(effective.slice(0, 4))) * 12 +
      (Number(review.slice(5, 7)) - Number(effective.slice(5, 7))) +
      (Number(review.slice(8, 10)) > Number(effective.slice(8, 10)) ? 1 : 0)
    if (review < effective) {
      out.push({
        id: 'A15',
        level: 'warn',
        message: 'The next review date is before the effective date.',
      })
    } else if (months > 12) {
      out.push({
        id: 'A15',
        level: 'warn',
        message: 'The next review is more than 12 months after the effective date.',
      })
    }
  }
  return out
}

/**
 * The documents the client needs, by the library's applicability matrix (conditional-flags.md §2).
 * N02 needs more than one category of Data Principal, or a healthcare client; V02 sharing with
 * another Data Fiduciary, such as a group company.
 */
export const recommendedTemplates = (
  data: Pick<LibraryData, 'templates'>,
  state: RenderState,
  facts: { principalCategories?: number; sharesWithFiduciaries?: boolean } = {},
): string[] => {
  const flag = (name: string) => isTruthy(state.flags[name])
  const applies = (id: string) => {
    switch (id) {
      case 'N02':
        return (facts.principalCategories ?? 0) > 1 || state.flags.Sector === 'Healthcare'
      case 'N03':
        return flag('Has-Employees')
      case 'N04':
        return flag('Uses-Cookies')
      case 'N05':
        return flag('Processes-Children-Data') || flag('Processes-Disability-Guardian-Data')
      case 'N06':
        return flag('Legacy-Data-Exists')
      case 'C03':
        return flag('Uses-Consent-Manager')
      case 'V02':
        return flag('Is-Group-Company') || Boolean(facts.sharesWithFiduciaries)
      case 'V05':
        return flag('Cross-Border-Transfer')
      case 'S01':
      case 'S02':
      case 'S03':
        return flag('Is-SDF') || flag('SDF-Anticipated')
      case 'S04':
        return flag('Is-SDF') || flag('Uses-Automated-Decisions')
      default:
        return true
    }
  }
  return data.templates.map((template) => template.id).filter(applies)
}
