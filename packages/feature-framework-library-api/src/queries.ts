import {
  and,
  asc,
  control,
  count,
  dataElement,
  desc,
  domain,
  eq,
  frameworkRelease,
  ilike,
  inArray,
  instrument,
  lawfulBasis,
  obligation,
  obligationControl,
  or,
  playbookDoc,
  processTemplate,
  question,
  acceptanceCriterion,
  retentionAnchor,
  sectorLaw,
  sectorOverlay,
  sql,
  vocabulary,
  vocabularyTerm,
  type Database,
  type ObligationTrigger,
  type QuestionApplicability,
} from '@duatf/platform-db'
import type { KbListSection } from './refs'

export type Release = { id: string; version: string; publishedAt: Date | null; source: string }

export const currentRelease = async (db: Database): Promise<Release | undefined> => {
  const [row] = await db
    .select({
      id: frameworkRelease.id,
      version: frameworkRelease.version,
      publishedAt: frameworkRelease.publishedAt,
      source: frameworkRelease.source,
    })
    .from(frameworkRelease)
    .where(eq(frameworkRelease.status, 'published'))
    .orderBy(desc(frameworkRelease.publishedAt))
    .limit(1)
  return row
}

const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, (match) => `\\${match}`)}%`

// --- Summary ------------------------------------------------------------------------------------

/** An obligation is live from its in-force date until (not including) its in-force-until date. */
export const isLiveOn = (
  item: { inForce: string | null; inForceUntil: string | null },
  asOf: string,
): boolean =>
  (item.inForce === null || item.inForce <= asOf) &&
  (item.inForceUntil === null || item.inForceUntil > asOf)

// SQL form of isLiveOn; the two must agree (TC-C4.2-03).
const liveOn = (asOf: string) =>
  and(
    or(sql`${obligation.inForce} is null`, sql`${obligation.inForce} <= ${asOf}`),
    or(sql`${obligation.inForceUntil} is null`, sql`${obligation.inForceUntil} > ${asOf}`),
  )

export const getSummary = async (db: Database, release: Release, asOf: string) => {
  const countOf = async (
    table:
      | typeof instrument
      | typeof obligation
      | typeof control
      | typeof domain
      | typeof processTemplate
      | typeof sectorOverlay
      | typeof dataElement
      | typeof vocabulary
      | typeof playbookDoc
      | typeof question,
  ) => {
    const [row] = await db.select({ n: count() }).from(table).where(eq(table.releaseId, release.id))
    return row?.n ?? 0
  }
  const [live] = await db
    .select({ n: count() })
    .from(obligation)
    .where(and(eq(obligation.releaseId, release.id), liveOn(asOf)))
  const byDateAndDomain = await db
    .select({
      date: obligation.inForce,
      domainCode: obligation.domainCode,
      domainTitle: domain.title,
      count: count(),
    })
    .from(obligation)
    .leftJoin(
      domain,
      and(eq(domain.releaseId, obligation.releaseId), eq(domain.code, obligation.domainCode)),
    )
    .where(eq(obligation.releaseId, release.id))
    .groupBy(obligation.inForce, obligation.domainCode, domain.title)
    .orderBy(sql`${obligation.inForce} nulls first`, asc(obligation.domainCode))
  const milestones: {
    date: string | null
    count: number
    domains: { code: string; title: string; count: number }[]
  }[] = []
  for (const row of byDateAndDomain) {
    let milestone = milestones.find((item) => item.date === row.date)
    if (!milestone) {
      milestone = { date: row.date, count: 0, domains: [] }
      milestones.push(milestone)
    }
    milestone.count += row.count
    milestone.domains.push({
      code: row.domainCode,
      title: row.domainTitle ?? row.domainCode,
      count: row.count,
    })
  }
  return {
    release: { version: release.version, publishedAt: release.publishedAt },
    asOf,
    inForce: live?.n ?? 0,
    counts: {
      law: await countOf(instrument),
      obligations: await countOf(obligation),
      controls: await countOf(control),
      domains: await countOf(domain),
      processes: await countOf(processTemplate),
      sectors: await countOf(sectorOverlay),
      dataElements: await countOf(dataElement),
      vocabularies: await countOf(vocabulary),
      playbooks: await countOf(playbookDoc),
      questions: await countOf(question),
    },
    milestones,
  }
}
export type LibrarySummary = Awaited<ReturnType<typeof getSummary>>

// --- Obligations ------------------------------------------------------------------------------

export type ObligationFilters = {
  domain?: string
  phase?: number
  penaltyTier?: string
  actor?: string
  text?: string
}

const obligationColumns = {
  code: obligation.code,
  inForceUntil: obligation.inForceUntil,
  title: obligation.title,
  requirement: obligation.requirement,
  domainCode: obligation.domainCode,
  regime: obligation.regime,
  actRef: obligation.actRef,
  ruleRef: obligation.ruleRef,
  actor: obligation.actor,
  phase: obligation.phase,
  inForce: obligation.inForce,
  penaltyTier: obligation.penaltyTier,
  penaltyText: obligation.penaltyText,
}

export const listObligations = (db: Database, release: Release, filters: ObligationFilters) =>
  db
    .select(obligationColumns)
    .from(obligation)
    .where(
      and(
        eq(obligation.releaseId, release.id),
        filters.domain ? eq(obligation.domainCode, filters.domain) : undefined,
        filters.phase === undefined ? undefined : eq(obligation.phase, filters.phase),
        filters.penaltyTier ? eq(obligation.penaltyTier, filters.penaltyTier) : undefined,
        filters.actor ? eq(obligation.actor, filters.actor) : undefined,
        filters.text
          ? or(
              ilike(obligation.code, likePattern(filters.text)),
              ilike(obligation.title, likePattern(filters.text)),
              ilike(obligation.requirement, likePattern(filters.text)),
              ilike(obligation.actRef, likePattern(filters.text)),
            )
          : undefined,
      ),
    )
    .orderBy(asc(obligation.domainCode), asc(obligation.code))
export type ObligationListItem = Awaited<ReturnType<typeof listObligations>>[number]

export const getObligation = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(obligation)
    .where(and(eq(obligation.releaseId, release.id), eq(obligation.code, code)))
  if (!item) return undefined
  const [domainRow] = await db
    .select({ code: domain.code, title: domain.title })
    .from(domain)
    .where(and(eq(domain.releaseId, release.id), eq(domain.code, item.domainCode)))
  const controls = await db
    .select({
      code: control.code,
      title: control.title,
      controlType: control.controlType,
      nature: control.nature,
      frequency: control.frequency,
      ownerRole: control.ownerRole,
    })
    .from(obligationControl)
    .innerJoin(
      control,
      and(
        eq(control.releaseId, obligationControl.releaseId),
        eq(control.code, obligationControl.controlCode),
      ),
    )
    .where(
      and(eq(obligationControl.releaseId, release.id), eq(obligationControl.obligationCode, code)),
    )
    .orderBy(asc(control.code))
  const instruments = await db
    .select({ code: instrument.code, kind: instrument.kind, title: instrument.title })
    .from(instrument)
    .where(
      and(eq(instrument.releaseId, release.id), sql`${code} = any(${instrument.obligationCodes})`),
    )
    .orderBy(asc(instrument.kind), asc(instrument.code))
  const processes = await db
    .select({ code: processTemplate.code, title: processTemplate.title })
    .from(processTemplate)
    .where(
      and(
        eq(processTemplate.releaseId, release.id),
        sql`${code} = any(${processTemplate.obligationCodes})`,
      ),
    )
    .orderBy(asc(processTemplate.code))
  return {
    ...item,
    trigger: item.trigger satisfies ObligationTrigger,
    domain: domainRow ?? { code: item.domainCode, title: item.domainCode },
    controls,
    instruments,
    processes,
  }
}
export type ObligationDetail = NonNullable<Awaited<ReturnType<typeof getObligation>>>

// --- Controls ---------------------------------------------------------------------------------
// Correlated subqueries name the outer table explicitly: the query builder renders selected
// columns unqualified, which would silently bind to the inner table instead.

export const listControls = (
  db: Database,
  release: Release,
  filters: { domain?: string; controlType?: string; text?: string },
) =>
  db
    .select({
      code: control.code,
      title: control.title,
      description: control.description,
      domainCode: control.domainCode,
      controlType: control.controlType,
      nature: control.nature,
      frequency: control.frequency,
      ownerRole: control.ownerRole,
      obligationCount: sql<number>`(select count(*)::int from obligation_control l
        where l.release_id = "control"."release_id" and l.control_code = "control"."code")`,
    })
    .from(control)
    .where(
      and(
        eq(control.releaseId, release.id),
        filters.domain ? eq(control.domainCode, filters.domain) : undefined,
        filters.controlType ? eq(control.controlType, filters.controlType) : undefined,
        filters.text
          ? or(
              ilike(control.code, likePattern(filters.text)),
              ilike(control.title, likePattern(filters.text)),
              ilike(control.description, likePattern(filters.text)),
            )
          : undefined,
      ),
    )
    .orderBy(asc(control.domainCode), asc(control.code))

export const getControl = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(control)
    .where(and(eq(control.releaseId, release.id), eq(control.code, code)))
  if (!item) return undefined
  const obligations = await db
    .select(obligationColumns)
    .from(obligationControl)
    .innerJoin(
      obligation,
      and(
        eq(obligation.releaseId, obligationControl.releaseId),
        eq(obligation.code, obligationControl.obligationCode),
      ),
    )
    .where(
      and(eq(obligationControl.releaseId, release.id), eq(obligationControl.controlCode, code)),
    )
    .orderBy(asc(obligation.code))
  const [domainRow] = await db
    .select({ code: domain.code, title: domain.title })
    .from(domain)
    .where(and(eq(domain.releaseId, release.id), eq(domain.code, item.domainCode)))
  return {
    ...item,
    obligations,
    domain: domainRow ?? { code: item.domainCode, title: item.domainCode },
  }
}

// --- Domains ----------------------------------------------------------------------------------

export const listDomains = (db: Database, release: Release) =>
  db
    .select({
      code: domain.code,
      title: domain.title,
      description: domain.description,
      obligationCount: sql<number>`(select count(*)::int from obligation o
        where o.release_id = "domain"."release_id" and o.domain_code = "domain"."code")`,
      controlCount: sql<number>`(select count(*)::int from control c
        where c.release_id = "domain"."release_id" and c.domain_code = "domain"."code")`,
    })
    .from(domain)
    .where(eq(domain.releaseId, release.id))
    .orderBy(asc(domain.code))

export const getDomain = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(domain)
    .where(and(eq(domain.releaseId, release.id), eq(domain.code, code)))
  if (!item) return undefined
  return {
    ...item,
    obligations: await listObligations(db, release, { domain: code }),
    controls: await listControls(db, release, { domain: code }),
  }
}

// --- Law --------------------------------------------------------------------------------------

export const listLaw = async (db: Database, release: Release) => {
  const instruments = await db
    .select({
      code: instrument.code,
      kind: instrument.kind,
      number: instrument.number,
      title: instrument.title,
      chapter: instrument.chapter,
      chapterTitle: instrument.chapterTitle,
      phase: instrument.phase,
      inForceDate: instrument.inForceDate,
      obligationCount: sql<number>`cardinality(${instrument.obligationCodes})`,
    })
    .from(instrument)
    .where(eq(instrument.releaseId, release.id))
    .orderBy(asc(instrument.kind), asc(instrument.code))
  const bases = await db
    .select({ code: lawfulBasis.code, name: lawfulBasis.name, reference: lawfulBasis.reference })
    .from(lawfulBasis)
    .where(eq(lawfulBasis.releaseId, release.id))
    .orderBy(asc(lawfulBasis.code))
  return { instruments, bases }
}

export const getInstrument = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(instrument)
    .where(and(eq(instrument.releaseId, release.id), eq(instrument.code, code)))
  if (!item) return undefined
  const obligations = item.obligationCodes.length
    ? await db
        .select(obligationColumns)
        .from(obligation)
        .where(
          and(eq(obligation.releaseId, release.id), inArray(obligation.code, item.obligationCodes)),
        )
        .orderBy(asc(obligation.code))
    : []
  const related = item.relatedCodes.length
    ? await db
        .select({ code: instrument.code, kind: instrument.kind, title: instrument.title })
        .from(instrument)
        .where(
          and(eq(instrument.releaseId, release.id), inArray(instrument.code, item.relatedCodes)),
        )
        .orderBy(asc(instrument.code))
    : []
  return { ...item, obligations, related }
}

// --- Sectors and processes ----------------------------------------------------------------------

export const listSectors = (db: Database, release: Release) =>
  db
    .select({
      code: sectorOverlay.code,
      title: sectorOverlay.title,
      covers: sectorOverlay.covers,
      regulators: sectorOverlay.regulators,
      processCount: sql<number>`cardinality(${sectorOverlay.processTemplateCodes})`,
    })
    .from(sectorOverlay)
    .where(eq(sectorOverlay.releaseId, release.id))
    .orderBy(asc(sectorOverlay.title))

export const getSector = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(sectorOverlay)
    .where(and(eq(sectorOverlay.releaseId, release.id), eq(sectorOverlay.code, code)))
  if (!item) return undefined
  const laws = await db
    .select({ law: sectorLaw.law, relevance: sectorLaw.relevance })
    .from(sectorLaw)
    .where(and(eq(sectorLaw.releaseId, release.id), eq(sectorLaw.overlayCode, code)))
    .orderBy(asc(sectorLaw.seq))
  const retention = await db
    .select({
      record: retentionAnchor.record,
      period: retentionAnchor.period,
      source: retentionAnchor.source,
      confidence: retentionAnchor.confidence,
    })
    .from(retentionAnchor)
    .where(and(eq(retentionAnchor.releaseId, release.id), eq(retentionAnchor.overlayCode, code)))
    .orderBy(asc(retentionAnchor.seq))
  const processes = await listProcesses(db, release, { sector: code })
  return { ...item, laws, retention, processes }
}

export const listProcesses = (db: Database, release: Release, filters: { sector?: string }) =>
  db
    .select({
      code: processTemplate.code,
      title: processTemplate.title,
      sectorCode: processTemplate.sectorCode,
      sectorName: processTemplate.sectorName,
      department: processTemplate.department,
      activityCount: sql<number>`cardinality(${processTemplate.activities})`,
      contextTags: processTemplate.contextTags,
    })
    .from(processTemplate)
    .where(
      and(
        eq(processTemplate.releaseId, release.id),
        filters.sector ? eq(processTemplate.sectorCode, filters.sector) : undefined,
      ),
    )
    .orderBy(asc(processTemplate.code))

export const getProcess = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(processTemplate)
    .where(and(eq(processTemplate.releaseId, release.id), eq(processTemplate.code, code)))
  if (!item) return undefined
  const obligations = item.obligationCodes.length
    ? await db
        .select(obligationColumns)
        .from(obligation)
        .where(
          and(eq(obligation.releaseId, release.id), inArray(obligation.code, item.obligationCodes)),
        )
        .orderBy(asc(obligation.code))
    : []
  return { ...item, obligations }
}

// --- Data elements, vocabularies, playbooks ---------------------------------------------------

export const listDataElements = (db: Database, release: Release) =>
  db
    .select({
      code: dataElement.code,
      title: dataElement.title,
      category: dataElement.category,
      personalData: dataElement.personalData,
      contextTags: dataElement.contextTags,
      note: dataElement.note,
    })
    .from(dataElement)
    .where(eq(dataElement.releaseId, release.id))
    .orderBy(asc(dataElement.category), asc(dataElement.code))

export const listVocabularies = (db: Database, release: Release) =>
  db
    .select({
      code: vocabulary.code,
      title: vocabulary.title,
      intro: vocabulary.intro,
      termCount: sql<number>`(select count(*)::int from vocabulary_term t
        where t.release_id = "vocabulary"."release_id" and t.vocabulary_code = "vocabulary"."code")`,
    })
    .from(vocabulary)
    .where(eq(vocabulary.releaseId, release.id))
    .orderBy(asc(vocabulary.title))

export const getVocabulary = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(vocabulary)
    .where(and(eq(vocabulary.releaseId, release.id), eq(vocabulary.code, code)))
  if (!item) return undefined
  const terms = await db
    .select({
      term: vocabularyTerm.term,
      meaning: vocabularyTerm.meaning,
      extra: vocabularyTerm.extra,
    })
    .from(vocabularyTerm)
    .where(and(eq(vocabularyTerm.releaseId, release.id), eq(vocabularyTerm.vocabularyCode, code)))
    .orderBy(asc(vocabularyTerm.seq))
  return { ...item, terms }
}

export const listPlaybooks = (db: Database, release: Release) =>
  db
    .select({ slug: playbookDoc.slug, title: playbookDoc.title, docType: playbookDoc.docType })
    .from(playbookDoc)
    .where(eq(playbookDoc.releaseId, release.id))
    .orderBy(asc(playbookDoc.title))

export const getPlaybook = async (db: Database, release: Release, slug: string) => {
  const [item] = await db
    .select()
    .from(playbookDoc)
    .where(and(eq(playbookDoc.releaseId, release.id), eq(playbookDoc.slug, slug)))
  return item
}

// --- Questions --------------------------------------------------------------------------------

export const listQuestions = (
  db: Database,
  release: Release,
  filters: { domain?: string; text?: string },
) =>
  db
    .select({
      code: question.code,
      seq: question.seq,
      text: question.text,
      controlCode: question.controlCode,
      domainCode: question.domainCode,
      riskWeight: question.riskWeight,
      applicability: question.applicability,
      reviewStatus: question.reviewStatus,
    })
    .from(question)
    .where(
      and(
        eq(question.releaseId, release.id),
        filters.domain ? eq(question.domainCode, filters.domain) : undefined,
        filters.text
          ? or(
              ilike(question.code, likePattern(filters.text)),
              ilike(question.text, likePattern(filters.text)),
              ilike(question.controlCode, likePattern(filters.text)),
            )
          : undefined,
      ),
    )
    .orderBy(asc(question.seq))
export type QuestionListItem = Awaited<ReturnType<typeof listQuestions>>[number]

export const getQuestion = async (db: Database, release: Release, code: string) => {
  const [item] = await db
    .select()
    .from(question)
    .where(and(eq(question.releaseId, release.id), eq(question.code, code)))
  if (!item) return undefined
  const [controlRow] = await db
    .select({
      code: control.code,
      title: control.title,
      description: control.description,
      controlType: control.controlType,
      ownerRole: control.ownerRole,
    })
    .from(control)
    .where(and(eq(control.releaseId, release.id), eq(control.code, item.controlCode)))
  const [domainRow] = await db
    .select({ code: domain.code, title: domain.title })
    .from(domain)
    .where(and(eq(domain.releaseId, release.id), eq(domain.code, item.domainCode)))
  const obligations = item.obligationCodes.length
    ? await db
        .select(obligationColumns)
        .from(obligation)
        .where(
          and(eq(obligation.releaseId, release.id), inArray(obligation.code, item.obligationCodes)),
        )
        .orderBy(asc(obligation.code))
    : []
  const criteria = item.obligationCodes.length
    ? await db
        .select({
          obligationCode: acceptanceCriterion.obligationCode,
          text: acceptanceCriterion.text,
          critical: acceptanceCriterion.critical,
        })
        .from(acceptanceCriterion)
        .where(
          and(
            eq(acceptanceCriterion.releaseId, release.id),
            inArray(acceptanceCriterion.obligationCode, item.obligationCodes),
          ),
        )
        .orderBy(asc(acceptanceCriterion.obligationCode), asc(acceptanceCriterion.seq))
    : []
  return {
    ...item,
    applicability: item.applicability satisfies QuestionApplicability,
    control: controlRow ?? {
      code: item.controlCode,
      title: item.controlCode,
      description: '',
      controlType: '',
      ownerRole: '',
    },
    domain: domainRow ?? { code: item.domainCode, title: item.domainCode },
    obligations,
    criteria,
  }
}
export type QuestionDetail = NonNullable<Awaited<ReturnType<typeof getQuestion>>>

// --- Knowledge-base sections --------------------------------------------------------------------

export type SectionItem = { code: string; title: string }
export type ListedSection = KbListSection

/** Every item of one knowledge-base section as code and title, in display order. */
export const listSection = async (
  db: Database,
  release: Release,
  section: ListedSection,
): Promise<SectionItem[]> => {
  const pick = (rows: { code: string; title: string }[]) =>
    rows.map(({ code, title }) => ({ code, title }))
  switch (section) {
    case 'law':
      return pick((await listLaw(db, release)).instruments)
    case 'bases':
      return (await listLaw(db, release)).bases.map((row) => ({ code: row.code, title: row.name }))
    case 'obligations':
      return pick(await listObligations(db, release, {}))
    case 'controls':
      return pick(await listControls(db, release, {}))
    case 'questions':
      return (await listQuestions(db, release, {})).map((row) => ({
        code: row.code,
        title: row.text,
      }))
    case 'domains':
      return pick(await listDomains(db, release))
    case 'sectors':
      return pick(await listSectors(db, release))
    case 'processes':
      return pick(await listProcesses(db, release, {}))
    case 'data-elements':
      return pick(await listDataElements(db, release))
    case 'vocabularies':
      return pick(await listVocabularies(db, release))
    case 'playbooks':
      return (await listPlaybooks(db, release)).map((row) => ({ code: row.slug, title: row.title }))
  }
}

// --- Search -----------------------------------------------------------------------------------

const pad2 = (value: string) => value.padStart(2, '0')

/** Recognises citations like "Rule 7", "R7", "s.6", "section 6", "Schedule 3". */
const citationOf = (query: string) => {
  const rule = /^(?:rule\s*|r)(\d{1,2})$/i.exec(query)
  if (rule?.[1]) return { code: `R${pad2(rule[1])}`, ref: 'rule' as const, number: rule[1] }
  const sectionMatch = /^(?:s\.?|sec\.?|section)\s*(\d{1,2})(?:\(.*)?$/i.exec(query)
  if (sectionMatch?.[1]) {
    return { code: `S${pad2(sectionMatch[1])}`, ref: 'act' as const, number: sectionMatch[1] }
  }
  const schedule = /^(?:schedule|sch)\s*(\d)$/i.exec(query)
  if (schedule?.[1])
    return { code: `SCH${schedule[1]}`, ref: 'schedule' as const, number: schedule[1] }
  return undefined
}

export const search = async (db: Database, release: Release, rawQuery: string) => {
  const query = rawQuery.trim().replace(/\s+/g, ' ')
  const pattern = likePattern(query)
  const citation = citationOf(query)

  const law = await db
    .select({ code: instrument.code, kind: instrument.kind, title: instrument.title })
    .from(instrument)
    .where(
      and(
        eq(instrument.releaseId, release.id),
        or(
          citation ? eq(instrument.code, citation.code) : undefined,
          ilike(instrument.title, pattern),
          ilike(instrument.code, pattern),
        ),
      ),
    )
    .orderBy(asc(instrument.code))
    .limit(20)

  const citedObligations = citation
    ? citation.ref === 'rule'
      ? sql`${obligation.ruleRef} ~ ${`(^|[^0-9A-Za-z])R${citation.number}([^0-9]|$)`}`
      : citation.ref === 'act'
        ? sql`${obligation.actRef} ~ ${`s\\.${citation.number}([^0-9]|$)`}`
        : sql`${obligation.scheduleRef} ~ ${`${citation.number}`}`
    : undefined

  const obligations = await db
    .select({
      code: obligation.code,
      title: obligation.title,
      actRef: obligation.actRef,
      ruleRef: obligation.ruleRef,
    })
    .from(obligation)
    .where(
      and(
        eq(obligation.releaseId, release.id),
        or(
          citedObligations,
          ilike(obligation.code, pattern),
          ilike(obligation.title, pattern),
          ilike(obligation.requirement, pattern),
        ),
      ),
    )
    .orderBy(asc(obligation.code))
    .limit(50)

  const controls = await db
    .select({ code: control.code, title: control.title })
    .from(control)
    .where(
      and(
        eq(control.releaseId, release.id),
        or(
          ilike(control.code, pattern),
          ilike(control.title, pattern),
          ilike(control.description, pattern),
        ),
      ),
    )
    .orderBy(asc(control.code))
    .limit(30)

  const processes = await db
    .select({ code: processTemplate.code, title: processTemplate.title })
    .from(processTemplate)
    .where(
      and(
        eq(processTemplate.releaseId, release.id),
        or(ilike(processTemplate.code, pattern), ilike(processTemplate.title, pattern)),
      ),
    )
    .orderBy(asc(processTemplate.code))
    .limit(30)

  const questions = await db
    .select({ code: question.code, text: question.text })
    .from(question)
    .where(
      and(
        eq(question.releaseId, release.id),
        or(ilike(question.code, pattern), ilike(question.text, pattern)),
      ),
    )
    .orderBy(asc(question.seq))
    .limit(30)

  const playbooks = await db
    .select({ slug: playbookDoc.slug, title: playbookDoc.title })
    .from(playbookDoc)
    .where(
      and(
        eq(playbookDoc.releaseId, release.id),
        or(ilike(playbookDoc.title, pattern), ilike(playbookDoc.bodyMd, pattern)),
      ),
    )
    .orderBy(asc(playbookDoc.title))
    .limit(10)

  return { query, law, obligations, controls, questions, processes, playbooks }
}
export type SearchResults = Awaited<ReturnType<typeof search>>
