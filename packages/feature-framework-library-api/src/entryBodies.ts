// Markdown bodies for entries written in the editor, in the layout of the imported vault notes,
// so search and exports read edited entries the same way as imported ones.

const BASIS_HEADER = /^# .*\n+Reference: .*\n+(?:## Activities using this basis\n*)?/

/** The editable part of a lawful basis body: everything after its generated header. */
export const basisExplanation = (body: string): string => body.replace(BASIS_HEADER, '').trim()

export const basisBody = (code: string, name: string, reference: string, explanation: string) =>
  [`# ${code} - ${name}`, `Reference: ${reference}`, explanation.trim()]
    .filter(Boolean)
    .join('\n\n')
    .concat('\n')

/** One line of plain text from a basis explanation, for the lawful-bases table. */
export const plainExplanation = (body: string): string =>
  basisExplanation(body)
    .replace(/^>\s?/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()

type ProcessFields = {
  title: string
  sectorName: string
  department: string
  activities: string[]
  dataPrincipals: string[]
  dataCategories: string[]
  typicalSystems: string[]
  typicalThirdParties: string[]
  typicalLawfulBasis: string[]
  flags: string[]
  contextTags: string[]
  obligationCodes: string[]
  assessorNote: string | null
}

const listOrDash = (items: readonly string[]) => (items.length ? items.join(', ') : '-')

export const processBody = (
  code: string,
  fields: ProcessFields,
  obligationTitle: (code: string) => string,
): string =>
  [
    `# ${code} - ${fields.title}`,
    `**Sector:** ${fields.sectorName} | **Department:** ${fields.department}`,
    ...(fields.assessorNote ? [`**Assessor note:** ${fields.assessorNote}`] : []),
    '## Typical activities (create one `processing_activity` per row that exists at the client)',
    fields.activities.map((activity, index) => `${index + 1}. ${activity}`).join('\n'),
    [
      '| Dimension | Typical values |',
      '|---|---|',
      `| Data principals | ${listOrDash(fields.dataPrincipals)} |`,
      `| Data categories | ${listOrDash(fields.dataCategories)} |`,
      `| Systems | ${listOrDash(fields.typicalSystems)} |`,
      `| Third parties | ${listOrDash(fields.typicalThirdParties)} |`,
      `| Lawful basis (typical) | ${fields.typicalLawfulBasis.length ? fields.typicalLawfulBasis.map((basis) => `[${basis}](ref:basis/${basis})`).join(', ') : '-'} |`,
      `| Engine flags | ${listOrDash(fields.flags)} |`,
      `| Risk context | ${listOrDash(fields.contextTags)} |`,
    ].join('\n'),
    '## Obligations likely triggered (beyond the always-on baseline)',
    'Baseline: governance, security (R6), breach (R7), retention (R8), grievance (R14) and linked CERT-In duties apply to every activity.',
    fields.obligationCodes
      .map((obligation) =>
        `- [${obligation}](ref:obligation/${obligation}) ${obligationTitle(obligation)}`.trimEnd(),
      )
      .join('\n') || '- None beyond the baseline.',
    '## Discovery prompts',
    [
      '- Which of the activities above exist here, and are there others?',
      '- Confirm the data fields against real forms and screens.',
      '- Confirm every system (incl. Excel/WhatsApp) and every recipient.',
      '- Check whether the lawful basis per purpose is really as typical.',
      '- Check whether the flags hold, especially children, cross-border and processors.',
    ].join('\n'),
  ].join('\n\n') + '\n'

const STUCK = /## Where assessments get stuck here\n([\s\S]*?)(?=\n## |$)/

/** The "where assessments get stuck" part of an imported sector note, kept when it is edited. */
export const stuckSection = (body: string): string => STUCK.exec(body)?.[1]?.trim() ?? ''

type SectorFields = {
  title: string
  covers: string
  regulators: string[]
  keyPrincipals: string[]
  localisation: string | null
  hotspots: string[]
}

export const sectorBody = (
  code: string,
  fields: SectorFields,
  laws: { law: string; relevance: string }[],
  retention: { record: string; period: string; source: string; confidence: string }[],
  processes: { code: string; title: string; department: string }[],
  stuck: string,
): string =>
  [
    `# SEC-${code} - ${fields.title}`,
    `**Covers:** ${fields.covers}`,
    `**Regulators:** ${listOrDash(fields.regulators)}`,
    '## Sector laws that run alongside DPDP (s.38: DPDP is in addition; s.16(2): stricter transfer rules survive)',
    [
      '| Law / instrument | Why it matters for personal data |',
      '|---|---|',
      ...laws.map((law) => `| ${law.law} | ${law.relevance} |`),
    ].join('\n'),
    '## Localisation / cross-border',
    fields.localisation ?? '-',
    "## Retention anchors (use in Retention Rules; reconciles s.8(7) 'retention required by law')",
    [
      '| Record | Period | Source | Confidence |',
      '|---|---|---|---|',
      ...retention.map(
        (item) => `| ${item.record} | ${item.period} | ${item.source} | ${item.confidence} |`,
      ),
    ].join('\n'),
    '> Confidence `verify` means you must confirm the current text before citing it in a client deliverable.',
    '## DPDP hotspots in this sector',
    fields.hotspots.map((hotspot) => `- ${hotspot}`).join('\n') || '-',
    ...(stuck ? ['## Where assessments get stuck here', stuck] : []),
    '## Typical data principals',
    listOrDash(fields.keyPrincipals),
    '## Sector process templates',
    processes
      .map(
        (process) =>
          `- [${process.code} ${process.title}](ref:process/${process.code}) (${process.department})`,
      )
      .join('\n') || '- None yet.',
    '## Plus common functions',
    'All common-function templates (HR, finance, marketing, IT, admin, legal) also apply.',
  ].join('\n\n') + '\n'
