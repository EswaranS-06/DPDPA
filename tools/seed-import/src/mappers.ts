import type { ObligationTrigger } from '@duatf/platform-db'
import {
  asList,
  asText,
  bulletItems,
  firstParagraph,
  h1,
  linkTarget,
  linkTargets,
  parseTable,
  plain,
  rewriteLinks,
  section,
  slugify,
  stripObsidian,
  type RefResolver,
  type RefTarget,
} from './markdown'
import type { SeedNote } from './vault'

const PLAYBOOK_TYPES = new Set(['guide', 'reference', 'regulatory_log'])
const PLAYBOOK_EXCLUDED = new Set(['README - Start Here'])

const nullIfEmpty = (value: string): string | null => (value === '' ? null : value)
const codeOf = (target: string): string => target.split(' ')[0] ?? target

/** Maps every framework note to the kind and code it becomes in the database. */
const refFor = (note: SeedNote): RefTarget | undefined => {
  const fm = note.frontmatter
  switch (note.type) {
    case 'obligation':
      return { kind: 'obligation', code: asText(fm.obl_id) }
    case 'control':
      return { kind: 'control', code: asText(fm.control_id) }
    case 'domain':
      return { kind: 'domain', code: asText(fm.domain_id) }
    case 'act_section':
    case 'rule':
    case 'schedule':
      return { kind: 'law', code: codeOf(note.stem) }
    case 'lawful_basis':
      return { kind: 'basis', code: asText(fm.code) }
    case 'sector_overlay':
      return { kind: 'sector', code: asText(fm.sector_code) }
    case 'process_template':
      return { kind: 'process', code: asText(fm.process_id) }
    case 'data_element':
      return { kind: 'data-element', code: asText(fm.element_id) }
    case 'vocabulary':
      return { kind: 'vocabulary', code: slugify(note.stem) }
    default:
      if (PLAYBOOK_TYPES.has(note.type) && !PLAYBOOK_EXCLUDED.has(note.stem)) {
        return { kind: 'playbook', code: slugify(note.stem) }
      }
      return undefined
  }
}

const TRIGGER_KEYS = ['always', 'role', 'basis', 'flags'] as const

const toTrigger = (value: unknown): ObligationTrigger => {
  const source =
    value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const unknownKeys = Object.keys(source).filter(
    (key) => !(TRIGGER_KEYS as readonly string[]).includes(key),
  )
  if (unknownKeys.length) throw new Error(`Unknown trigger keys: ${unknownKeys.join(', ')}`)
  const trigger: ObligationTrigger = {}
  if (source.always === true) trigger.always = true
  if (source.role !== undefined) trigger.role = asList(source.role)
  if (source.basis !== undefined) trigger.basis = asList(source.basis)
  if (source.flags !== undefined) trigger.flags = asList(source.flags)
  return trigger
}

const requirementOf = (body: string): string =>
  /\*\*Requirement:\*\*\s*(.+)/.exec(body)?.[1]?.trim() ?? ''

const assessorNoteOf = (body: string): string =>
  /\*\*Assessor note:\*\*\s*(.+)/.exec(body)?.[1]?.trim() ?? ''

export const buildFrameworkRows = (notes: SeedNote[]) => {
  const index = new Map<string, RefTarget>()
  for (const note of notes) {
    const ref = refFor(note)
    if (ref?.code) index.set(note.stem, ref)
  }
  const unresolved = new Map<string, number>()
  const resolve: RefResolver = (target) => index.get(target)
  const bodies = new Map<string, string>()
  const body = (note: SeedNote): string => {
    const cached = bodies.get(note.path)
    if (cached !== undefined) return cached
    const converted = rewriteLinks(stripObsidian(note.body), resolve, (target) =>
      unresolved.set(target, (unresolved.get(target) ?? 0) + 1),
    )
    bodies.set(note.path, converted)
    return converted
  }
  const codeFor = (target: string) => index.get(target)?.code ?? codeOf(target)
  const codesFor = (value: unknown) => linkTargets(value).map(codeFor)
  const ofType = (type: string) => notes.filter((note) => note.type === type)

  const instruments = [
    ...ofType('act_section').map((note) => {
      const fm = note.frontmatter
      return {
        code: codeOf(note.stem),
        kind: 'section' as const,
        number: asText(fm.section),
        title: asText(fm.title),
        chapter: nullIfEmpty(asText(fm.chapter)),
        chapterTitle: nullIfEmpty(asText(fm.chapter_title)),
        phase: fm.phase === undefined ? null : Number(fm.phase),
        inForceDate: nullIfEmpty(asText(fm.in_force_date)),
        statusText: nullIfEmpty(asText(fm.status)),
        phaseNote: nullIfEmpty(asText(fm.phase_note)),
        summaryMd: nullIfEmpty(section(body(note), 'Summary')),
        bodyMd: body(note),
        obligationCodes: codesFor(fm.obligations),
        relatedCodes: codesFor(fm.rules),
      }
    }),
    ...ofType('rule').map((note) => {
      const fm = note.frontmatter
      return {
        code: codeOf(note.stem),
        kind: 'rule' as const,
        number: String(Number(asText(fm.rule).replace(/^R/, ''))),
        title: asText(fm.title),
        chapter: null,
        chapterTitle: null,
        phase: fm.phase === undefined ? null : Number(fm.phase),
        inForceDate: nullIfEmpty(asText(fm.in_force_date)),
        statusText: nullIfEmpty(asText(fm.status)),
        phaseNote: null,
        summaryMd: nullIfEmpty(section(body(note), 'Summary')),
        bodyMd: body(note),
        obligationCodes: codesFor(fm.obligations),
        relatedCodes: codesFor(fm.sections),
      }
    }),
    ...ofType('schedule').map((note) => {
      const fm = note.frontmatter
      return {
        code: codeOf(note.stem),
        kind: 'schedule' as const,
        number: asText(fm.schedule).replace(/^SCH/, ''),
        title: asText(fm.title),
        chapter: null,
        chapterTitle: null,
        phase: fm.phase === undefined ? null : Number(fm.phase),
        inForceDate: null,
        statusText: nullIfEmpty(asText(fm.status)),
        phaseNote: null,
        summaryMd: nullIfEmpty(firstParagraph(body(note).replace(/^\*\*Phase.*$/m, ''))),
        bodyMd: body(note),
        obligationCodes: [],
        relatedCodes: [],
      }
    }),
  ]

  const lawfulBases = ofType('lawful_basis').map((note) => ({
    code: asText(note.frontmatter.code),
    name: asText(note.frontmatter.name),
    reference: asText(note.frontmatter.reference),
    bodyMd: body(note),
  }))

  const domains = ofType('domain').map((note) => ({
    code: asText(note.frontmatter.domain_id),
    title: asText(note.frontmatter.title),
    description: firstParagraph(note.body),
    bodyMd: body(note),
  }))

  const obligations = ofType('obligation').map((note) => {
    const fm = note.frontmatter
    return {
      code: asText(fm.obl_id),
      title: asText(fm.title),
      requirement: requirementOf(note.body),
      domainCode: codeFor(linkTarget(fm.domain)),
      regime: asText(fm.regime),
      actRef: nullIfEmpty(asText(fm.act_ref)),
      ruleRef: nullIfEmpty(asText(fm.rule_ref)),
      scheduleRef: nullIfEmpty(asText(fm.schedule_ref)),
      actor: asText(fm.actor),
      phase: Number(fm.phase),
      inForce: nullIfEmpty(asText(fm.in_force)),
      inForceUntil: null,
      statusText: nullIfEmpty(asText(fm.status)),
      penaltyTier: nullIfEmpty(asText(fm.penalty_tier)),
      penaltyText: nullIfEmpty(asText(fm.penalty_text)),
      section: fm.sec === undefined || fm.sec === '' ? null : Number(fm.sec),
      trigger: toTrigger(fm.trigger),
      evidenceExpected: asList(fm.evidence_expected),
      bodyMd: body(note),
    }
  })

  const controls = ofType('control').map((note) => {
    const fm = note.frontmatter
    return {
      code: asText(fm.control_id),
      title: asText(fm.title),
      description: firstParagraph(note.body),
      domainCode: codeFor(linkTarget(fm.domain)),
      controlType: asText(fm.control_type),
      nature: asText(fm.nature),
      frequency: asText(fm.frequency),
      ownerRole: asText(fm.owner_role),
      testProcedure: plain(section(note.body, 'Test procedure')),
      evidence: bulletItems(section(note.body, 'Evidence')).map(plain),
      iso27001: asList(fm.iso27001_2022),
      iso27701: asList(fm.iso27701_2019),
      nistCsf: asList(fm.nist_csf_2),
      bodyMd: body(note),
    }
  })

  const links = new Set<string>()
  for (const note of ofType('control')) {
    for (const obligationCode of codesFor(note.frontmatter.obligations)) {
      links.add(`${obligationCode}\u0000${asText(note.frontmatter.control_id)}`)
    }
  }
  for (const note of ofType('obligation')) {
    for (const controlCode of codesFor(note.frontmatter.controls)) {
      links.add(`${asText(note.frontmatter.obl_id)}\u0000${controlCode}`)
    }
  }
  const obligationControls = [...links].sort().map((key) => {
    const [obligationCode = '', controlCode = ''] = key.split('\u0000')
    return { obligationCode, controlCode }
  })

  const processTemplates = ofType('process_template').map((note) => {
    const fm = note.frontmatter
    const code = asText(fm.process_id)
    return {
      code,
      title: asText(fm.title),
      sectorCode: code.split('-')[0] ?? '',
      sectorName: asText(fm.sector),
      department: asText(fm.department),
      activities: asList(fm.activities),
      dataPrincipals: asList(fm.data_principals),
      dataCategories: asList(fm.data_categories),
      typicalSystems: asList(fm.typical_systems),
      typicalThirdParties: asList(fm.typical_third_parties),
      typicalLawfulBasis: asList(fm.typical_lawful_basis),
      flags: asList(fm.flags),
      contextTags: asList(fm.context_tags),
      obligationCodes: codesFor(fm.specific_obligations),
      assessorNote: nullIfEmpty(assessorNoteOf(note.body)),
      bodyMd: body(note),
    }
  })

  const sectorOverlays = ofType('sector_overlay').map((note) => {
    const fm = note.frontmatter
    return {
      code: asText(fm.sector_code),
      title: asText(fm.title),
      covers: asText(fm.covers),
      regulators: asList(fm.regulators),
      keyPrincipals: asList(fm.key_principals),
      processTemplateCodes: codesFor(fm.process_templates),
      localisation: nullIfEmpty(plain(section(note.body, 'Localisation'))),
      hotspots: bulletItems(section(note.body, 'DPDP hotspots')).map(plain),
      bodyMd: body(note),
    }
  })

  const sectorLaws = ofType('sector_overlay').flatMap((note) =>
    parseTable(section(note.body, 'Sector laws')).rows.map((row, index) => ({
      overlayCode: asText(note.frontmatter.sector_code),
      seq: index + 1,
      law: plain(row[0] ?? ''),
      relevance: plain(row[1] ?? ''),
    })),
  )

  const retentionAnchors = ofType('sector_overlay').flatMap((note) =>
    parseTable(section(note.body, 'Retention anchors')).rows.map((row, index) => ({
      overlayCode: asText(note.frontmatter.sector_code),
      seq: index + 1,
      record: plain(row[0] ?? ''),
      period: plain(row[1] ?? ''),
      source: plain(row[2] ?? ''),
      confidence: plain(row[3] ?? ''),
    })),
  )

  const dataElements = ofType('data_element').map((note) => ({
    code: asText(note.frontmatter.element_id),
    title: asText(note.frontmatter.title),
    category: asText(note.frontmatter.category),
    personalData: note.frontmatter.personal_data !== false,
    contextTags: asList(note.frontmatter.context_tags),
    note: nullIfEmpty(asText(note.frontmatter.note)),
  }))

  const vocabularyNotes = ofType('vocabulary').map((note) => ({
    note,
    table: parseTable(note.body),
  }))
  const vocabularies = vocabularyNotes.map(({ note, table }) => ({
    code: slugify(note.stem),
    title: note.stem,
    intro: nullIfEmpty(firstParagraph(note.body)),
    columns: table.headers,
  }))
  const vocabularyTerms = vocabularyNotes.flatMap(({ note, table }) =>
    table.rows.map((row, index) => ({
      vocabularyCode: slugify(note.stem),
      seq: index + 1,
      term: plain(row[0] ?? ''),
      meaning: row[1] === undefined ? null : plain(row[1]),
      extra: Object.fromEntries(
        table.headers.slice(2).map((header, column) => [header, plain(row[column + 2] ?? '')]),
      ),
    })),
  )

  const byStem = (stem: string) => notes.find((note) => note.stem === stem)

  const pbcItems = parseTable(byStem('Evidence Request List (PBC)')?.body ?? '').rows.map(
    (row) => ({
      seq: Number(row[0]),
      evidence: plain(row[1] ?? ''),
      domainCodes: (row[2] ?? '')
        .split('/')
        .map((code) => code.trim())
        .filter(Boolean),
      owner: plain(row[3] ?? ''),
    }),
  )

  const stuckPoints = [
    ...(byStem('Stuck-Point Playbook')?.body ?? '').matchAll(
      /^###\s+(SP-\d+)\s+(.+)\n([\s\S]*?)(?=^###\s|(?![\s\S]))/gm,
    ),
  ].map((match) => ({
    code: match[1] ?? '',
    title: (match[2] ?? '').trim(),
    bodyMd: rewriteLinks((match[3] ?? '').trim(), resolve),
  }))

  const numberedQuestions = (markdown: string) => {
    const questions: { section: string; topic: string | null; text: string }[] = []
    let current = ''
    let topic: string | null = null
    for (const line of markdown.split('\n')) {
      const heading2 = /^##\s+(.+)$/.exec(line)
      const heading3 = /^###\s+(.+)$/.exec(line)
      const numbered = /^\d+\.\s+(.+)$/.exec(line)
      const bullet = /^-\s+(.+)$/.exec(line)
      if (heading2) {
        current = plain(heading2[1] ?? '')
        topic = null
      } else if (heading3) {
        topic = plain(heading3[1] ?? '')
      } else if (current && (numbered ?? bullet)) {
        questions.push({ section: current, topic, text: (numbered ?? bullet)?.[1]?.trim() ?? '' })
      }
    }
    return questions
  }

  const scopingQuestions = numberedQuestions(byStem('Entity Scoping Questionnaire')?.body ?? '')
    .filter((question) => question.section !== 'Output')
    .map((question, index) => ({
      seq: index + 1,
      section: question.section,
      text: plain(question.text),
    }))

  const discoveryQuestions = numberedQuestions(byStem('Discovery Question Bank')?.body ?? '').map(
    (question, index) => {
      const hint = /\s*\[([^\]]+)\]\s*$/.exec(question.text)
      return {
        seq: index + 1,
        section: question.section,
        topic: question.topic,
        text: plain(hint ? question.text.slice(0, hint.index) : question.text),
        creates: hint?.[1]?.trim() ?? null,
      }
    },
  )

  const notificationEntries = parseTable(byStem('Notifications Log')?.body ?? '').rows.map(
    (row, index) => ({
      seq: index + 1,
      date: plain(row[0] ?? ''),
      instrument: plain(row[1] ?? ''),
      summary: plain(row[2] ?? ''),
      impact: plain(row[3] ?? ''),
      status: plain(row[5] ?? ''),
    }),
  )

  const playbookDocs = notes
    .filter((note) => PLAYBOOK_TYPES.has(note.type) && !PLAYBOOK_EXCLUDED.has(note.stem))
    .map((note) => ({
      slug: slugify(note.stem),
      title: h1(note.body) ?? note.stem,
      docType: note.type,
      bodyMd: body(note),
    }))

  return {
    rows: {
      instruments,
      lawfulBases,
      domains,
      obligations,
      controls,
      obligationControls,
      processTemplates,
      sectorOverlays,
      sectorLaws,
      retentionAnchors,
      dataElements,
      vocabularies,
      vocabularyTerms,
      pbcItems,
      stuckPoints,
      scopingQuestions,
      discoveryQuestions,
      notificationEntries,
      playbookDocs,
    },
    unresolvedLinks: Object.fromEntries([...unresolved.entries()].sort()),
  }
}

export type FrameworkRows = ReturnType<typeof buildFrameworkRows>['rows']
