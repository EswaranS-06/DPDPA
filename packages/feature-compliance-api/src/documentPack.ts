import { authorize, can } from '@duatf/core-access'
import { formatDay, formatIst, isoDate } from '@duatf/core-utils'
import {
  applyReplacements,
  buildClause,
  buildDocument,
  CLAUSE_REPLACE,
  CLAUSE_TITLES,
  checklistFor,
  defaultSelection,
  documentChecks,
  fieldUsage,
  loadChecklist,
  loadLibrary,
  markdownBlocks,
  markdownHtml,
  PACK_PRESETS,
  parseSections,
  projectChecks,
  readManifest,
  recommendedTemplates,
  render,
  zipFiles,
  type CheckResult,
  type CollectionRow,
  type FlagValue,
  type LibraryData,
  type RenderState,
  type Template,
} from '@duatf/platform-documents'
import {
  and,
  appUser,
  asc,
  breach,
  clientDocumentProfile,
  clientProfile,
  department,
  desc,
  documentChecklist,
  documentExport,
  documentTemplateReview,
  dpia,
  dpiaRisk,
  eq,
  processingActivity,
  processor,
  rightsRequest,
  tenant,
  type Transaction,
} from '@duatf/platform-db'
import { z } from 'zod'
import { BREACH_NATURES } from './breaches'
import { audit, inClient, type ServiceContext } from './context'
import { FIRM } from './deliverables'
import { NotFoundError, parseInput, RuleError, ValidationError } from './errors'
import { listFindings } from './findings'
import { ORGANISATION_TYPE_LABEL } from './labels'
import { personalDataMap } from './insights'
import { CONTRACT_TERMS, listProcessors } from './processors'
import { listActivities } from './ropa'
import { RIGHTS_KIND_INFO } from './rights'
import { listBands, ratingFor } from './risks'

// The document pack (ADR-0010): ComplyX's DPDP template library, filled from DUATF's records. The
// templates' words are never changed; DUATF supplies the values, the flags and the tables.

export type Source = 'saved' | 'profile' | 'ropa' | 'registers' | 'record' | 'default'
type Sourced<T> = { value: T; source: Source; note?: string }

/** Documents built from one record, and the record they take. */
export const RECORD_DOCUMENTS = {
  B02: 'breach',
  B03: 'breach',
  R04: 'rights',
  G05: 'dpia',
  V01: 'processor',
  V03: 'processor',
} as const
export type RecordKind = (typeof RECORD_DOCUMENTS)[keyof typeof RECORD_DOCUMENTS]
export type RecordRef = { kind: RecordKind; code: string }

const CHILD = /child|minor|student|under 18|pupil/i

/** The library's Sector flag for DUATF's industry text. */
export const sectorOf = (industry: string | null | undefined): string => {
  const text = (industry ?? '').toLowerCase()
  if (/health|hospital|clinic|diagnos|pharma|medical|lab/.test(text)) return 'Healthcare'
  if (/insur/.test(text)) return 'Insurance-IRDAI'
  if (/securit|broking|stock|mutual fund|asset manag/.test(text)) return 'Securities-SEBI'
  if (/bank|nbfc|financ|lend|payment|fintech/.test(text)) return 'BFSI-RBI'
  if (/educat|school|college|universit|edtech/.test(text)) return 'Education'
  if (/e-?commerce|retail|marketplace/.test(text)) return 'E-Commerce'
  if (/telecom/.test(text)) return 'Telecom'
  if (/software|it services|ites|bpo|technology|\bit\b/.test(text)) return 'IT-ITeS'
  if (/manufactur|factory|industrial/.test(text)) return 'Manufacturing'
  if (/hotel|hospitality|travel|restaurant/.test(text)) return 'Hospitality'
  return text ? 'Other' : 'General'
}

const joinList = (items: readonly (string | null | undefined)[]) => items.filter(Boolean).join('; ')
const yesNo = (value: boolean) => (value ? 'Y' : 'N')

/** What DUATF already knows for a client, in the library's names, each with where it came from. */
const derive = async (ctx: ServiceContext, clientId: string, tx: Transaction) => {
  const [profile] = await tx
    .select({ tenant, profile: clientProfile })
    .from(tenant)
    .innerJoin(clientProfile, eq(clientProfile.tenantId, tenant.id))
    .where(eq(tenant.id, clientId))
  if (!profile) throw new NotFoundError('Client')
  const departments = await tx
    .select({ code: department.code, name: department.name })
    .from(department)
    .where(and(eq(department.tenantId, clientId), eq(department.active, true)))
  const [ropa, processors, map, dpias, findings, bands] = await Promise.all([
    listActivities(ctx, clientId),
    listProcessors(ctx, clientId),
    personalDataMap(ctx, clientId),
    tx
      .select({ code: dpia.code, activityId: dpia.activityId })
      .from(dpia)
      .where(eq(dpia.tenantId, clientId)),
    listFindings(ctx, clientId, { status: 'open' }),
    listBands(ctx.db),
  ])
  const activityIds = new Map(
    (
      await tx
        .select({ id: processingActivity.id, ref: processingActivity.ref })
        .from(processingActivity)
        .where(eq(processingActivity.tenantId, clientId))
    ).map((row) => [row.ref, row.id]),
  )
  const p = profile.profile
  const values: Record<string, Sourced<string>> = {}
  const flags: Record<string, Sourced<FlagValue>> = {}
  const set = (name: string, value: string | null | undefined, source: Source, note?: string) => {
    if (value && value.trim()) values[name] = { value: value.trim(), source, note }
  }
  const flag = (name: string, value: FlagValue, source: Source, note: string) => {
    flags[name] = { value, source, note }
  }
  set('Server-name', FIRM, 'default', 'The firm preparing the documents')
  set('Client-Name', p.legalName || profile.tenant.name, 'profile')
  set('Client-Brand-Name', profile.tenant.name, 'profile')
  set('Client-Short-Code', profile.tenant.code, 'profile')
  set('Client-Registered-Address', p.address, 'profile')
  set('Client-Website-URL', p.website, 'profile')
  set(
    'Client-Legal-Entity-Type',
    ORGANISATION_TYPE_LABEL[p.organisationType].toLowerCase(),
    'profile',
  )
  set('DPO-Name', p.dpoName, 'profile')
  set('DPO-Email', p.dpoEmail, 'profile')
  set('DPO-Phone', p.dpoPhone, 'profile')
  set('Privacy-Contact-Name', p.dpoName ?? p.primaryContactName, 'profile')
  set('Privacy-Contact-Email', p.dpoEmail ?? p.primaryContactEmail, 'profile')
  set('Privacy-Contact-Phone', p.dpoPhone ?? p.primaryContactPhone, 'profile')
  if (p.rightsResponseDays) {
    set(
      'Grievance-Resolution-Period',
      `${Math.min(p.rightsResponseDays, 90)} days`,
      'registers',
      'The response period of the rights register, never over 90 days',
    )
  }
  const activities = ropa.activities
  const abroad = activities.filter((row) => row.transfersAbroad === 'yes')
  set(
    'Cross-Border-Countries',
    [
      ...new Set(
        abroad
          .flatMap((row) => (row.countries ?? '').split(/[,;]/).map((c) => c.trim()))
          .filter(Boolean),
      ),
    ].join(', '),
    'ropa',
  )
  const childActivities = activities.filter((row) =>
    row.principals.some((name) => CHILD.test(name)),
  )
  const elementTitles = activities.flatMap((row) =>
    row.elements.map((element) => element.title.toLowerCase()),
  )
  flag('Sector', sectorOf(p.industry), 'profile', `From the industry “${p.industry}”`)
  flag(
    'Cross-Border-Transfer',
    abroad.length > 0,
    'ropa',
    `${abroad.length} RoPA activities transfer data outside India`,
  )
  flag(
    'Processes-Children-Data',
    childActivities.length > 0,
    'ropa',
    `${childActivities.length} RoPA activities handle children’s data`,
  )
  flag(
    'Has-Employees',
    departments.some((row) => /\bhr\b|human|people|personnel/i.test(`${row.code} ${row.name}`)) ||
      (p.employeeCount ?? 0) > 0,
    'profile',
    'An HR department or employees in the profile',
  )
  flag(
    'Uses-CCTV',
    elementTitles.some((title) => /cctv|video|camera/.test(title)),
    'ropa',
    'CCTV footage in the RoPA',
  )
  flag(
    'Uses-Biometrics',
    elementTitles.some((title) => /biometric|fingerprint|face|iris/.test(title)),
    'ropa',
    'Biometric data in the RoPA',
  )
  flag(
    'Uses-Consent-Manager',
    activities.some((row) => /consent manager/i.test(row.consentStatus ?? '')),
    'ropa',
    'A Consent Manager named in the RoPA',
  )

  const basisLabel = new Map(ropa.kb.bases.map((row) => [row.code, row.label]))
  const departmentName = new Map(ropa.departments.map((row) => [row.code, row.name]))
  const dpiaOf = (ref: number) =>
    dpias.find((row) => row.activityId === activityIds.get(ref))?.code ?? ''
  const elementsOf = (row: (typeof activities)[number]) =>
    row.elements.map((element) => element.title).join(', ')
  const highest = (row: (typeof activities)[number]) =>
    row.elements.reduce<string>((top, element) => (element.level > top ? element.level : top), '')
  const collections: Record<string, Sourced<CollectionRow[]>> = {}
  const put = (name: string, rows: CollectionRow[], source: Source) => {
    if (rows.length) collections[name] = { value: rows, source }
  }
  put(
    'Processing-Activities',
    activities.map((row) => ({
      'RoPA-ID': row.refLabel,
      'RoPA-Function': row.departmentName,
      'Purpose-Name': row.name,
      'Purpose-Service-Description': row.purpose ?? '',
      'RoPA-Process-Owner': row.owner ?? '',
      'RoPA-DP-Categories': row.principals.join(', '),
      'Purpose-Data-Items': elementsOf(row),
      'RoPA-Classification': highest(row),
      'RoPA-Child-Data': yesNo(row.principals.some((name) => CHILD.test(name))),
      'Data-Source': row.sources.join(', '),
      'Legal-Basis': joinList([
        ...row.lawfulBases.map((code) => basisLabel.get(code) ?? code),
        row.lawReference,
      ]),
      'RoPA-Notice-Ref': '',
      'RoPA-Systems': row.systems.join(', '),
      'RoPA-Processors': row.processors.join(', '),
      'RoPA-Other-DFs': row.recipients.join(', '),
      'RoPA-Cross-Border':
        row.transfersAbroad === 'yes'
          ? `Yes${row.countries ? `: ${row.countries}` : ''}`
          : row.transfersAbroad === 'no'
            ? 'No'
            : '',
      'Purpose-Retention': joinList([row.retention, row.deletion]),
      'RoPA-DPIA-Ref': dpiaOf(row.ref),
      'RoPA-Last-Review': isoDate(row.updatedAt),
    })),
    'ropa',
  )
  put(
    'Consent-Purposes',
    activities
      .filter((row) => row.lawfulBases.includes('consent'))
      .map((row) => ({
        'Purpose-ID': row.refLabel,
        'Purpose-Name': row.name,
        'Purpose-Service-Description': row.purpose ?? '',
        'Purpose-Data-Items': elementsOf(row),
        'Purpose-Retention': row.retention ?? '',
      })),
    'ropa',
  )
  put(
    'Legitimate-Use-Purposes',
    activities
      .filter((row) => row.lawfulBases.some((code) => code.startsWith('s7')))
      .map((row) => ({
        'Purpose-ID': row.refLabel,
        'Purpose-Name': row.name,
        'Purpose-Service-Description': row.purpose ?? '',
        'Purpose-Data-Items': elementsOf(row),
        'Legitimate-Use-Clause': joinList(
          row.lawfulBases
            .filter((code) => code.startsWith('s7'))
            .map((code) => basisLabel.get(code) ?? code),
        ),
      })),
    'ropa',
  )
  put(
    'Retention-Schedule',
    activities
      .filter((row) => row.retention)
      .map((row, index) => ({
        'Retention-Ref': `RET-${String(index + 1).padStart(3, '0')}`,
        'Retention-Data-Set': row.name,
        'Retention-Purpose-ID': row.refLabel,
        'Retention-Legal-Basis': row.lawfulBases
          .map((code) => basisLabel.get(code) ?? code)
          .join(', '),
        'Retention-Period': row.retention ?? '',
        'Retention-Legal-Reference': row.lawReference ?? '',
        'Retention-Disposal-Method': row.deletion ?? '',
        'Retention-Owner': row.owner ?? row.departmentName,
      })),
    'ropa',
  )
  put(
    'Cross-Border-Transfers',
    abroad.map((row) => ({
      'Transfer-Country': row.countries ?? '',
      'Transfer-Importer': row.processors.join(', ') || row.recipients.join(', '),
      'Transfer-Purpose': row.purpose ?? row.name,
      'Transfer-Data-Items': elementsOf(row),
    })),
    'ropa',
  )
  put(
    'Data-Categories',
    map.categories.map((row) => ({
      'Category-ID': row.code,
      'Category-Name': row.title,
      'Data-Items': [
        ...new Set(
          activities.flatMap((activity) =>
            activity.elements
              .filter((element) => element.category === row.code)
              .map((element) => element.title),
          ),
        ),
      ].join(', '),
      'Data-Source': [
        ...new Set(
          activities
            .filter((activity) =>
              activity.elements.some((element) => element.category === row.code),
            )
            .flatMap((activity) => activity.sources),
        ),
      ].join(', '),
    })),
    'ropa',
  )
  put(
    'Recipient-Categories',
    [
      ...new Map(
        activities.flatMap((row): [string, CollectionRow][] => [
          ...row.processors.map((name): [string, CollectionRow] => [
            name,
            {
              'Recipient-Category': name,
              'Recipient-Role': 'Data Processor',
              'Recipient-Purpose': row.name,
            },
          ]),
          ...row.recipients.map((name): [string, CollectionRow] => [
            name,
            {
              'Recipient-Category': name,
              'Recipient-Role': 'Recipient',
              'Recipient-Purpose': row.name,
            },
          ]),
          ...row.internalRecipients.map((code): [string, CollectionRow] => [
            `dept:${code}`,
            {
              'Recipient-Category': departmentName.get(code) ?? code,
              'Recipient-Role': 'Internal department',
              'Recipient-Purpose': row.name,
            },
          ]),
        ]),
      ).values(),
    ],
    'ropa',
  )
  // s.11(1)(b): every Data Fiduciary and Data Processor the data was shared with, and what it got.
  put(
    'Access-Recipients',
    [
      ...activities
        .flatMap((row) => [
          ...row.processors.map((name) => ({
            name,
            role: 'Data Processor',
            data: elementsOf(row),
          })),
          ...row.recipients.map((name) => ({
            name,
            role: 'Data Fiduciary or other recipient',
            data: elementsOf(row),
          })),
        ])
        .reduce((all, item) => {
          const seen = all.get(item.name)
          all.set(item.name, {
            'Access-Recipient-Name': item.name,
            'Access-Recipient-Role': item.role,
            'Access-Recipient-Data': [
              ...new Set(
                [
                  ...(seen?.['Access-Recipient-Data'] ?? '').split(', '),
                  ...item.data.split(', '),
                ].filter(Boolean),
              ),
            ].join(', '),
          })
          return all
        }, new Map<string, CollectionRow>())
        .values(),
    ],
    'ropa',
  )
  put(
    'Sub-Processors',
    processors.entries
      .filter((row) => row.active)
      .map((row) => ({
        'Subprocessor-Name': row.name,
        'Subprocessor-Service': row.service ?? '',
        'Subprocessor-Location': joinList([
          row.location === 'outside' ? 'Outside India' : row.location === 'india' ? 'India' : null,
          row.countries,
        ]),
        'Subprocessor-Data': row.elements.map((element) => element.title).join(', '),
        'Subprocessor-Safeguards': CONTRACT_TERMS.filter((term) => row.terms.includes(term.code))
          .map((term) => term.label)
          .join('; '),
      })),
    'registers',
  )
  put(
    'Audit-Findings',
    findings.map((row) => ({
      'Finding-Ref': row.code,
      'Finding-Date': isoDate(row.openedAt),
      'Finding-Description': row.title,
      'Finding-Rating': row.riskScore === null ? '' : ratingFor(row.riskScore, bands).name,
      'Finding-Owner': row.departmentName ?? '',
    })),
    'registers',
  )
  const breaches = await tx
    .select()
    .from(breach)
    .where(eq(breach.tenantId, clientId))
    .orderBy(asc(breach.code))
  put(
    'Breaches',
    breaches.map((row) => ({
      'Breach-ID': row.code,
      'Breach-Aware-At': formatIst(row.awareAt),
      'Breach-Nature': natureText(row.natures, row.description),
      'Breach-Data-Categories': row.dataAffected ?? '',
      'Breach-DP-Count': row.affectedPrincipals === null ? '' : String(row.affectedPrincipals),
      'Breach-Severity': row.severity,
      'Breach-Root-Cause': row.cause ?? '',
      'Board-Initial-Timestamp': row.boardFirstAt ? formatIst(row.boardFirstAt) : '',
      'Board-Detailed-Timestamp': row.boardDetailedAt ? formatIst(row.boardDetailedAt) : '',
      'Breach-Status': row.status,
    })),
    'registers',
  )
  return {
    values,
    flags,
    collections,
    facts: {
      principalCategories: new Set(activities.flatMap((row) => row.principals)).size,
      sharesWithFiduciaries: activities.some((row) => row.recipients.length > 0),
    },
  }
}

const natureText = (natures: readonly string[], description: string) =>
  joinList([
    BREACH_NATURES.filter((nature) => natures.includes(nature.code))
      .map((nature) => nature.label)
      .join(', '),
    description,
  ])

/** The values a document built from one record takes from it. */
const recordValues = async (
  tx: Transaction,
  clientId: string,
  record: RecordRef,
): Promise<{
  values: Record<string, string>
  flags: Record<string, FlagValue>
  collections: Record<string, CollectionRow[]>
  label: string
}> => {
  const code = record.code.toUpperCase()
  if (record.kind === 'breach') {
    const [row] = await tx
      .select({ breach, processorName: processor.name })
      .from(breach)
      .leftJoin(processor, eq(processor.id, breach.processorId))
      .where(and(eq(breach.tenantId, clientId), eq(breach.code, code)))
    if (!row) throw new NotFoundError(`Breach ${code}`)
    const b = row.breach
    const at = (value: Date | null) => (value ? formatIst(value) : '')
    return {
      label: `${b.code} ${b.title}`,
      flags: { 'Board-Extension-Granted': b.boardExtendedTo !== null },
      collections: {},
      values: {
        'Breach-ID': b.code,
        'Breach-Nature': natureText(b.natures, ''),
        'Breach-Detailed-Description': b.description,
        'Breach-Plain-Description': b.description,
        'Breach-Data-Categories': b.dataAffected ?? '',
        'Breach-DP-Data-Items': b.dataAffected ?? '',
        'Breach-DP-Data-Short': b.dataAffected ?? '',
        'Breach-DP-Count': b.affectedPrincipals === null ? '' : String(b.affectedPrincipals),
        'Breach-Record-Count': b.recordsAffected === null ? '' : String(b.recordsAffected),
        'Breach-Child-Count': b.childrenAffected === null ? '' : String(b.childrenAffected),
        'Breach-Occurred-At': at(b.occurredAt),
        'Breach-Occurred-At-Plain': b.occurredAt ? formatDay(isoDate(b.occurredAt)) : '',
        'Breach-Date-Short': b.occurredAt
          ? formatDay(isoDate(b.occurredAt))
          : formatDay(isoDate(b.awareAt)),
        'Breach-Detected-At': at(b.detectedAt),
        'Breach-Detected-At-Plain': b.detectedAt ? formatDay(isoDate(b.detectedAt)) : '',
        'Breach-Aware-At': at(b.awareAt),
        'Breach-Contained-At': at(b.containedAt),
        'Breach-Location': joinList([b.place, row.processorName]),
        'Breach-Likely-Impact': b.likelyImpact ?? '',
        'Breach-DP-Consequences': b.likelyImpact ?? '',
        'Breach-Processor-Involved': row.processorName ? `Yes: ${row.processorName}` : 'No',
        'Breach-Containment': b.measures ?? '',
        'Breach-Mitigation': b.measures ?? '',
        'Breach-DP-Mitigation': b.measures ?? '',
        'Breach-DP-Safety-Step-1': (b.safetySteps ?? '').split(/\n+/)[0] ?? '',
        'Breach-Root-Cause': b.cause ?? '',
        'Breach-Actor-Findings': b.personResponsible ?? '',
        'Breach-Remediation': b.remedial ?? '',
        'Breach-Other-Authorities': b.certInAt ? `CERT-In, ${formatIst(b.certInAt)}` : '',
        'Breach-DP-Notice-Status': b.principalsAt
          ? `Intimated on ${formatIst(b.principalsAt)}`
          : 'Not yet intimated',
        'Breach-DP-Notice-Modes': b.principalsHow ?? '',
        'Breach-DP-Notice-Timestamps': at(b.principalsAt),
        'Board-Initial-Timestamp': at(b.boardFirstAt),
        'Board-Detailed-Timestamp': at(b.boardDetailedAt),
        'Board-Initial-Ref': b.boardReference ?? '',
        'Board-Extension-Ref': b.boardReference ?? '',
      },
    }
  }
  if (record.kind === 'rights') {
    const [row] = await tx
      .select()
      .from(rightsRequest)
      .where(and(eq(rightsRequest.tenantId, clientId), eq(rightsRequest.code, code)))
    if (!row) throw new NotFoundError(`Request ${code}`)
    return {
      label: `${row.code} ${RIGHTS_KIND_INFO[row.kind].label}`,
      flags: {},
      collections: {},
      values: {
        'Ticket-No': row.requesterRef,
        'Request-Type': RIGHTS_KIND_INFO[row.kind].label,
        'Request-Date': row.receivedOn,
        'Due-Date': row.dueOn,
        'Response-Date': row.closedOn ?? '',
        'Refusal-Reason': row.status === 'refused' ? (row.outcome ?? '') : '',
      },
    }
  }
  if (record.kind === 'dpia') {
    const [row] = await tx
      .select({ dpia, activity: processingActivity })
      .from(dpia)
      .innerJoin(processingActivity, eq(processingActivity.id, dpia.activityId))
      .where(and(eq(dpia.tenantId, clientId), eq(dpia.code, code)))
    if (!row) throw new NotFoundError(`DPIA ${code}`)
    const risks = await tx
      .select()
      .from(dpiaRisk)
      .where(eq(dpiaRisk.dpiaId, row.dpia.id))
      .orderBy(asc(dpiaRisk.seq))
    const ref = `PA-${String(row.activity.ref).padStart(3, '0')}`
    return {
      label: `${row.dpia.code} ${row.activity.name}`,
      flags: {},
      values: {
        'DPIA-Ref': row.dpia.code,
        'DPIA-Project-Name': row.activity.name,
        'DPIA-RoPA-IDs': ref,
        'DPIA-Lead': row.dpia.preparedBy ?? '',
        'DPIA-Approval-Date': row.dpia.completedOn ?? '',
        'DPIA-Next-Review': row.dpia.nextReviewOn ?? '',
        'DPIA-Conditions': row.dpia.outcomeNote ?? '',
      },
      collections: {
        'DPIA-Risks': risks.map((risk, index) => ({
          'Risk-ID': `R${index + 1}`,
          'Risk-Description': risk.risk,
          'Risk-Source': ref,
          'Risk-L': String(risk.likelihood),
          'Risk-I': String(risk.impact),
          'Risk-Inherent': String(risk.likelihood * risk.impact),
          'Risk-Controls': risk.measures ?? '',
          'Risk-Res-L': String(risk.residualLikelihood),
          'Risk-Res-I': String(risk.residualImpact),
          'Risk-Residual': String(risk.residualLikelihood * risk.residualImpact),
        })),
      },
    }
  }
  const [row] = await tx
    .select()
    .from(processor)
    .where(and(eq(processor.tenantId, clientId), eq(processor.code, code)))
  if (!row) throw new NotFoundError(`Processor ${code}`)
  return {
    label: `${row.code} ${row.name}`,
    flags: {},
    collections: {},
    values: {
      'Vendor-Name': row.name,
      'Vendor-Services': row.service ?? '',
      'DPA-Locations': joinList([row.location, row.countries]),
      'Vendor-Privacy-Contact': joinList([row.contactName, row.contactEmail]),
    },
  }
}

const profileSchema = z.object({
  flags: z.record(z.string(), z.union([z.boolean(), z.string().max(80)])).optional(),
  values: z.record(z.string(), z.string().max(8000)).optional(),
  collections: z
    .record(z.string(), z.array(z.record(z.string(), z.string().max(4000))).max(500))
    .optional(),
  docFlags: z
    .record(z.string(), z.record(z.string(), z.union([z.boolean(), z.string().max(80)])))
    .optional(),
  docValues: z.record(z.string(), z.record(z.string(), z.string().max(8000))).optional(),
})

const savedProfile = async (tx: Transaction, clientId: string) => {
  const [row] = await tx
    .select()
    .from(clientDocumentProfile)
    .where(eq(clientDocumentProfile.tenantId, clientId))
  return row ?? null
}

/** The state a client's documents render from: the library's defaults, then DUATF's records, then what was saved. */
const stateOf = (
  data: LibraryData,
  derived: Awaited<ReturnType<typeof derive>>,
  saved: Awaited<ReturnType<typeof savedProfile>>,
): RenderState => {
  const flags: Record<string, FlagValue> = Object.fromEntries(
    data.flags.global.map((flag) => [flag.name, flag.default]),
  )
  for (const [name, item] of Object.entries(derived.flags)) flags[name] = item.value
  Object.assign(flags, saved?.flags ?? {})
  const values: Record<string, string> = Object.fromEntries(
    Object.entries(derived.values).map(([name, item]) => [name, item.value]),
  )
  for (const [name, value] of Object.entries(saved?.values ?? {}))
    if (value.trim()) values[name] = value
  const collections: Record<string, CollectionRow[]> = Object.fromEntries(
    Object.entries(derived.collections).map(([name, item]) => [name, item.value]),
  )
  for (const [name, rows] of Object.entries(saved?.collections ?? {}))
    if (rows.length) collections[name] = rows
  return {
    flags,
    values,
    collections,
    docFlags: saved?.docFlags ?? {},
    docValues: saved?.docValues ?? {},
  }
}

type SourceNote = { source: Source; note?: string }

const sourcesOf = (
  derived: Awaited<ReturnType<typeof derive>>,
  saved: Awaited<ReturnType<typeof savedProfile>>,
) => {
  const names = (a: object, b: object | undefined) => [
    ...new Set([...Object.keys(a), ...Object.keys(b ?? {})]),
  ]
  const flags: Record<string, SourceNote> = {}
  for (const name of names(derived.flags, saved?.flags)) {
    flags[name] =
      name in (saved?.flags ?? {})
        ? { source: 'saved' }
        : { source: derived.flags[name]?.source ?? 'default', note: derived.flags[name]?.note }
  }
  const values: Record<string, SourceNote> = {}
  for (const name of names(derived.values, saved?.values)) {
    values[name] = saved?.values[name]?.trim()
      ? { source: 'saved' }
      : { source: derived.values[name]?.source ?? 'default', note: derived.values[name]?.note }
  }
  const collections: Record<string, SourceNote> = {}
  for (const name of names(derived.collections, saved?.collections)) {
    collections[name] = {
      source: saved?.collections[name]?.length
        ? 'saved'
        : (derived.collections[name]?.source ?? 'default'),
    }
  }
  return { flags, values, collections }
}

const reviewsOf = async (tx: Transaction) =>
  tx
    .select({
      templateId: documentTemplateReview.templateId,
      sha256: documentTemplateReview.sha256,
      reviewedAt: documentTemplateReview.reviewedAt,
      reviewerName: appUser.displayName,
    })
    .from(documentTemplateReview)
    .leftJoin(appUser, eq(appUser.id, documentTemplateReview.reviewedBy))

/** Whether the current file of a template has had legal review. */
const reviewOf = (template: Template, reviews: Awaited<ReturnType<typeof reviewsOf>>) => {
  const sha = readManifest().files[template.file] ?? ''
  const found = reviews.find((row) => row.templateId === template.id && row.sha256 === sha)
  return {
    sha256: sha,
    reviewed: Boolean(found),
    reviewedAt: found?.reviewedAt ?? null,
    reviewerName: found?.reviewerName ?? null,
  }
}

const loadContext = async (ctx: ServiceContext, clientId: string) =>
  inClient(ctx, clientId, async (tx) => {
    const derived = await derive(ctx, clientId, tx)
    const saved = await savedProfile(tx, clientId)
    const reviews = await reviewsOf(tx)
    return { derived, saved, reviews }
  })

/** The client's document pack: every template with whether it is needed, its checks and its review. */
export const documentPack = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const data = loadLibrary()
  const { derived, saved, reviews } = await loadContext(ctx, clientId)
  const state = stateOf(data, derived, saved)
  const recommended = recommendedTemplates(data, state, derived.facts)
  const templates = data.templates.map((template) => {
    const rendered = render(template, data, state, { mode: 'export' })
    const checks = documentChecks(template, rendered, state)
    return {
      id: template.id,
      title: template.title,
      category: template.category,
      publish: template.publish,
      appliesWhen: template.appliesWhen,
      legalBasis: template.legalBasis,
      recommended: recommended.includes(template.id),
      record: (RECORD_DOCUMENTS as Record<string, RecordKind | undefined>)[template.id] ?? null,
      missing: rendered.analysis.missing.length,
      emptyTables: [...rendered.analysis.emptyCollections],
      blocking: checks.filter((check) => check.level === 'block').length,
      review: reviewOf(template, reviews),
    }
  })
  const manifest = readManifest()
  return {
    library: {
      source: manifest.source,
      importedOn: manifest.importedOn,
      templates: data.templates.length,
    },
    templates,
    recommended,
    state,
    sources: sourcesOf(derived, saved),
    flags: data.flags,
    registry: data.registry,
    collectionFields: data.collections,
    usage: fieldUsage(data),
    checks: projectChecks(state, recommended),
    counsel: loadChecklist().counsel,
    updatedAt: saved?.updatedAt ?? null,
    canEdit: can(ctx.principal, 'document.manage', { clientId }),
    canReview: can(ctx.principal, 'template.review', {}),
  }
}
export type DocumentPack = Awaited<ReturnType<typeof documentPack>>

/** Saves answers of the document profile; a key left out keeps its saved answer. */
export const saveDocumentProfile = async (ctx: ServiceContext, clientId: string, raw: unknown) => {
  authorize(ctx.principal, 'document.manage', { clientId })
  const input = parseInput(profileSchema, raw)
  const data = loadLibrary()
  const errors: Record<string, string> = {}
  const knownFlags = new Map(
    [...data.flags.global, ...data.flags.doc].map((flag) => [flag.name, flag]),
  )
  for (const [name, value] of Object.entries(input.flags ?? {})) {
    const flag = knownFlags.get(name)
    if (!flag) errors[`flag_${name}`] = `${name} is not a flag of the library.`
    else if (flag.type === 'enum' && (typeof value !== 'string' || !flag.options.includes(value))) {
      errors[`flag_${name}`] = `Choose one of: ${flag.options.join(', ')}.`
    }
  }
  for (const name of Object.keys(input.values ?? {})) {
    if (!(name in data.registry)) errors[`value_${name}`] = `${name} is not a field of the library.`
  }
  for (const [name, rows] of Object.entries(input.collections ?? {})) {
    const fields = data.collections[name]
    if (!fields) errors[`collection_${name}`] = `${name} is not a table of the library.`
    else if (rows.some((row) => Object.keys(row).some((field) => !fields.includes(field)))) {
      errors[`collection_${name}`] = `A column of ${name} is not one the library defines.`
    }
  }
  if (Object.keys(errors).length) throw new ValidationError(errors)
  await inClient(ctx, clientId, async (tx) => {
    const current = await savedProfile(tx, clientId)
    const next = {
      flags: { ...(current?.flags ?? {}), ...(input.flags ?? {}) },
      values: { ...(current?.values ?? {}), ...(input.values ?? {}) },
      collections: { ...(current?.collections ?? {}), ...(input.collections ?? {}) },
      docFlags: { ...(current?.docFlags ?? {}), ...(input.docFlags ?? {}) },
      docValues: { ...(current?.docValues ?? {}), ...(input.docValues ?? {}) },
      updatedBy: ctx.principal.userId,
      updatedAt: new Date(),
    }
    await tx
      .insert(clientDocumentProfile)
      .values({ tenantId: clientId, ...next })
      .onConflictDoUpdate({ target: clientDocumentProfile.tenantId, set: next })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'documents.profile',
      entity: 'client',
      entityId: clientId,
      detail: {
        flags: Object.keys(input.flags ?? {}),
        values: Object.keys(input.values ?? {}).length,
        collections: Object.keys(input.collections ?? {}),
      },
    })
  })
}

/** Removes saved answers so DUATF's own records (or the library's default) apply again. */
export const clearDocumentAnswers = async (
  ctx: ServiceContext,
  clientId: string,
  keys: { flags?: string[]; values?: string[]; collections?: string[] },
) => {
  authorize(ctx.principal, 'document.manage', { clientId })
  await inClient(ctx, clientId, async (tx) => {
    const current = await savedProfile(tx, clientId)
    if (!current) return
    const without = <T>(record: Record<string, T>, names: readonly string[] = []) =>
      Object.fromEntries(Object.entries(record).filter(([name]) => !names.includes(name)))
    await tx
      .update(clientDocumentProfile)
      .set({
        flags: without(current.flags, keys.flags),
        values: without(current.values, keys.values),
        collections: without(current.collections, keys.collections),
        updatedBy: ctx.principal.userId,
        updatedAt: new Date(),
      })
      .where(eq(clientDocumentProfile.tenantId, clientId))
  })
}

const templateOf = (data: LibraryData, templateId: string) => {
  const template = data.templates.find((row) => row.id === templateId.toUpperCase())
  if (!template) throw new NotFoundError(`Template ${templateId}`)
  return template
}

/** One document rendered for the client (and the record, for a document built from one). */
export const renderClientDocument = async (
  ctx: ServiceContext,
  clientId: string,
  templateId: string,
  options: { record?: RecordRef; showNotes?: boolean; mode?: 'preview' | 'export' } = {},
) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const data = loadLibrary()
  const template = templateOf(data, templateId)
  const expected = (RECORD_DOCUMENTS as Record<string, RecordKind | undefined>)[template.id]
  if (options.record && options.record.kind !== expected) {
    throw new RuleError(`${template.id} is not built from a ${options.record.kind}.`)
  }
  const { derived, saved, reviews, fromRecord } = await inClient(ctx, clientId, async (tx) => ({
    derived: await derive(ctx, clientId, tx),
    saved: await savedProfile(tx, clientId),
    reviews: await reviewsOf(tx),
    fromRecord: options.record ? await recordValues(tx, clientId, options.record) : null,
  }))
  const base = stateOf(data, derived, saved)
  const state: RenderState = fromRecord
    ? {
        ...base,
        flags: { ...base.flags, ...fromRecord.flags },
        values: {
          ...base.values,
          ...Object.fromEntries(Object.entries(fromRecord.values).filter(([, value]) => value)),
        },
        collections: { ...base.collections, ...fromRecord.collections },
      }
    : base
  const exported = render(template, data, state, { mode: 'export' })
  const preview =
    options.mode === 'export'
      ? exported
      : render(template, data, state, { mode: 'preview', showNotes: options.showNotes })
  const recommended = recommendedTemplates(data, state, derived.facts)
  const checks: CheckResult[] = [
    ...documentChecks(template, exported, state),
    ...projectChecks(state, recommended).filter(
      (check) =>
        ['A5', 'A6', 'A7', 'A9', 'A10', 'A11'].includes(check.id) && check.level === 'block',
    ),
  ]
  return {
    template,
    record:
      fromRecord && options.record
        ? {
            kind: options.record.kind,
            code: options.record.code.toUpperCase(),
            label: fromRecord.label,
          }
        : null,
    markdown: exported.markdown,
    preview: preview.markdown,
    html: markdownHtml(preview.markdown),
    missing: exported.analysis.missing,
    emptyTables: [...exported.analysis.emptyCollections],
    checks,
    blocked: checks.some((check) => check.level === 'block'),
    review: reviewOf(template, reviews),
    checklist: checklistFor(template.id),
    state,
  }
}
export type RenderedDocument = Awaited<ReturnType<typeof renderClientDocument>>

export const DOCUMENT_FORMATS = ['docx', 'md', 'html'] as const
export type DocumentFormat = (typeof DOCUMENT_FORMATS)[number]

const CONTENT_TYPES: Record<DocumentFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  md: 'text/markdown; charset=utf-8',
  html: 'text/html; charset=utf-8',
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

/** The label a document carries in its page header until it is ready and reviewed. */
const headerLabelOf = (document: RenderedDocument) =>
  document.blocked
    ? `Draft: ${document.checks.filter((check) => check.level === 'block').length} checks to fix before release`
    : document.review.reviewed
      ? undefined
      : 'Draft: awaiting legal review'

const htmlPage = (title: string, body: string) =>
  `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><title>${title.replace(/</g, '&lt;')}</title><style>body{font:15px/1.55 Calibri,Segoe UI,Arial,sans-serif;max-width:52rem;margin:2rem auto;padding:0 1rem;color:#0f172a}table{border-collapse:collapse;width:100%;margin:1rem 0}td,th{border:1px solid #cbd5e1;padding:.4rem .5rem;text-align:left;vertical-align:top}th{background:#f1f5f9}</style></head><body>\n${body}\n</body></html>\n`

/** A file of one document; a release download refuses while a blocking check fails. */
const fileOf = async (
  document: RenderedDocument,
  format: DocumentFormat,
  clientCode: string,
  clientName: string,
  draft: boolean,
): Promise<{ fileName: string; content: Buffer; contentType: string }> => {
  if (document.blocked && !draft) {
    throw new RuleError(
      `${document.template.id} is not ready for release: ${document.checks
        .filter((check) => check.level === 'block')
        .map((check) => check.message)
        .join(' ')}`,
    )
  }
  const recordPart = document.record ? `-${document.record.code}` : ''
  const base = `${clientCode}-${document.template.id}${recordPart}-${slug(document.template.title)}`
  const label = headerLabelOf(document)
  if (format === 'md') {
    return {
      fileName: `${base}.md`,
      content: Buffer.from(document.markdown, 'utf8'),
      contentType: CONTENT_TYPES.md,
    }
  }
  if (format === 'html') {
    return {
      fileName: `${base}.html`,
      content: Buffer.from(
        htmlPage(
          document.template.title,
          `${label ? `<p><strong>${label}</strong></p>\n` : ''}${markdownHtml(document.markdown)}`,
        ),
        'utf8',
      ),
      contentType: CONTENT_TYPES.html,
    }
  }
  const content = await buildDocument({
    title: document.template.title,
    subject: `${clientName}, ${document.template.id}`,
    header: `${clientName}: ${document.template.id}${document.record ? `, ${document.record.code}` : ''}`,
    headerLabel: label,
    footer: `${document.template.id} v${document.template.version}`,
    children: markdownBlocks(document.markdown),
  })
  return { fileName: `${base}.docx`, content, contentType: CONTENT_TYPES.docx }
}

const logExport = (
  ctx: ServiceContext,
  clientId: string,
  entry: {
    templateId: string
    recordRef?: string | null
    format: string
    templateSha?: string | null
  },
) =>
  inClient(ctx, clientId, async (tx) => {
    await tx.insert(documentExport).values({
      tenantId: clientId,
      templateId: entry.templateId,
      recordRef: entry.recordRef ?? null,
      format: entry.format,
      templateSha: entry.templateSha ?? null,
      userId: ctx.principal.userId,
    })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: 'documents.export',
      entity: 'document',
      entityId: `${entry.templateId}${entry.recordRef ? `/${entry.recordRef}` : ''}`,
      detail: { format: entry.format },
    })
  })

const clientNames = (ctx: ServiceContext, clientId: string) =>
  inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({ code: tenant.code, name: tenant.name })
      .from(tenant)
      .where(eq(tenant.id, clientId))
    if (!row) throw new NotFoundError('Client')
    return row
  })

/** Downloads one document; logged with the template's version. */
export const exportClientDocument = async (
  ctx: ServiceContext,
  clientId: string,
  templateId: string,
  options: { format: DocumentFormat; draft?: boolean; record?: RecordRef },
) => {
  authorize(ctx.principal, 'document.manage', { clientId })
  const [document, client] = await Promise.all([
    renderClientDocument(ctx, clientId, templateId, { record: options.record, mode: 'export' }),
    clientNames(ctx, clientId),
  ])
  const file = await fileOf(
    document,
    options.format,
    client.code,
    client.name,
    Boolean(options.draft),
  )
  await logExport(ctx, clientId, {
    templateId: document.template.id,
    recordRef: options.record?.code.toUpperCase(),
    format: `${options.format}${options.draft ? ' (draft)' : ''}`,
    templateSha: document.review.sha256,
  })
  return file
}

/** The recommended documents as Word files in one ZIP. A release pack needs every one of them ready. */
export const exportDocumentPack = async (
  ctx: ServiceContext,
  clientId: string,
  options: { draft?: boolean } = {},
) => {
  authorize(ctx.principal, 'document.manage', { clientId })
  const pack = await documentPack(ctx, clientId)
  const client = await clientNames(ctx, clientId)
  const wanted = pack.templates.filter((row) => row.recommended && !row.record)
  const blocked = wanted.filter((row) => row.blocking > 0)
  if (blocked.length && !options.draft) {
    throw new RuleError(
      `${blocked.length} of the ${wanted.length} documents are not ready for release: ${blocked.map((row) => row.id).join(', ')}.`,
    )
  }
  const files: { name: string; content: Buffer }[] = []
  for (const row of wanted) {
    const document = await renderClientDocument(ctx, clientId, row.id, { mode: 'export' })
    const file = await fileOf(document, 'docx', client.code, client.name, true)
    files.push({ name: `${document.template.folder}/${file.fileName}`, content: file.content })
  }
  const content = await zipFiles(files)
  await logExport(ctx, clientId, {
    templateId: 'PACK',
    format: `zip${options.draft ? ' (draft)' : ''}`,
  })
  return {
    fileName: `${client.code}-dpdp-document-pack-${isoDate(new Date())}.zip`,
    content,
    contentType: 'application/zip',
    documents: files.length,
  }
}

/** A document as one numbered clause, or a clause pack from the library's presets. */
export const clauseOf = async (
  ctx: ServiceContext,
  clientId: string,
  input: {
    templateId?: string
    presets?: string[]
    number?: string
    title?: string
    intro?: string
    replace?: string
    selected?: string[]
  },
) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const items: { section: ReturnType<typeof parseSections>['sections'][number]; group: string }[] =
    []
  let defaults = { title: 'Data Protection', replace: '' }
  if (input.templateId) {
    const document = await renderClientDocument(ctx, clientId, input.templateId, { mode: 'export' })
    const parsed = parseSections(document.markdown)
    const chosen = new Set(input.selected?.length ? input.selected : defaultSelection(parsed))
    items.push(
      ...parsed.sections
        .filter((section) => chosen.has(section.path))
        .map((section) => ({ section, group: document.template.id })),
    )
    defaults = {
      title:
        CLAUSE_TITLES[document.template.id] ??
        document.template.title.split(/ [—(]/)[0] ??
        document.template.title,
      replace: CLAUSE_REPLACE[document.template.id] ?? '',
    }
  }
  for (const key of input.presets ?? []) {
    const preset = PACK_PRESETS.find((row) => row.key === key)
    if (!preset) throw new ValidationError({ presets: `Unknown preset ${key}.` })
    const document = await renderClientDocument(ctx, clientId, preset.doc, { mode: 'export' })
    for (const section of parseSections(document.markdown).sections.filter((row) =>
      preset.match.test(row.title),
    )) {
      if (!items.some((item) => item.group === preset.doc && item.section.path === section.path)) {
        items.push({ section, group: preset.doc })
      }
    }
  }
  const markdown = applyReplacements(
    buildClause(items, {
      number: input.number,
      title: input.title ?? defaults.title,
      intro: input.intro,
    }),
    input.replace ?? defaults.replace,
  )
  return { markdown, html: markdownHtml(markdown), sections: items.length }
}

/** A clause or a clause pack as a file; logged like any document download. */
export const exportClause = async (
  ctx: ServiceContext,
  clientId: string,
  input: Parameters<typeof clauseOf>[2],
  format: DocumentFormat,
) => {
  authorize(ctx.principal, 'document.manage', { clientId })
  const [clause, client] = await Promise.all([
    clauseOf(ctx, clientId, input),
    clientNames(ctx, clientId),
  ])
  const name = `${client.code}-${input.templateId ? `${input.templateId.toUpperCase()}-clause` : 'clause-pack'}`
  const title = input.title ?? 'Data Protection'
  const file =
    format === 'md'
      ? {
          fileName: `${name}.md`,
          content: Buffer.from(clause.markdown, 'utf8'),
          contentType: CONTENT_TYPES.md,
        }
      : format === 'html'
        ? {
            fileName: `${name}.html`,
            content: Buffer.from(htmlPage(title, clause.html), 'utf8'),
            contentType: CONTENT_TYPES.html,
          }
        : {
            fileName: `${name}.docx`,
            content: await buildDocument({
              title,
              subject: client.name,
              header: `${client.name}: clause`,
              headerLabel: 'Draft: check cross-references such as "Clause 6.2" after pasting',
              footer: 'From the DPDP template library',
              children: markdownBlocks(clause.markdown),
            }),
            contentType: CONTENT_TYPES.docx,
          }
  await logExport(ctx, clientId, {
    templateId: input.templateId ? input.templateId.toUpperCase() : 'CLAUSE',
    format: `${format} (clause)`,
  })
  return file
}

/** Marks the current file of a template reviewed by counsel; an Administrator only. */
export const reviewTemplate = async (ctx: ServiceContext, templateId: string, note?: string) => {
  authorize(ctx.principal, 'template.review', {})
  const data = loadLibrary()
  const template = templateOf(data, templateId)
  const sha = readManifest().files[template.file]
  if (!sha) throw new RuleError(`${template.id} is not in the library manifest.`)
  await ctx.db.transaction(async (tx) => {
    await tx
      .insert(documentTemplateReview)
      .values({
        templateId: template.id,
        sha256: sha,
        reviewedBy: ctx.principal.userId,
        note: note ?? null,
      })
      .onConflictDoNothing()
    await audit(tx, ctx, {
      tenantId: null,
      action: 'documents.review',
      entity: 'template',
      entityId: template.id,
      detail: { sha256: sha },
    })
  })
}

/** The consultant's statutory checklist (Part B) of one document, with what was ticked and signed. */
export const documentChecklistOf = async (
  ctx: ServiceContext,
  clientId: string,
  templateId: string,
) => {
  authorize(ctx.principal, 'client.view', { clientId })
  const template = templateOf(loadLibrary(), templateId)
  const groups = checklistFor(template.id)
  const saved = await inClient(ctx, clientId, async (tx) => {
    const [row] = await tx
      .select({ checklist: documentChecklist, signerName: appUser.displayName })
      .from(documentChecklist)
      .leftJoin(appUser, eq(appUser.id, documentChecklist.signedBy))
      .where(
        and(
          eq(documentChecklist.tenantId, clientId),
          eq(documentChecklist.templateId, template.id),
        ),
      )
    return row ?? null
  })
  return {
    groups,
    ticked: saved?.checklist.items ?? [],
    signedAt: saved?.checklist.signedAt ?? null,
    signerName: saved?.signerName ?? null,
  }
}

/** Saves the ticked checklist items; signing needs every item ticked. */
export const saveDocumentChecklist = async (
  ctx: ServiceContext,
  clientId: string,
  templateId: string,
  input: { items: string[]; sign?: boolean },
) => {
  authorize(ctx.principal, 'document.manage', { clientId })
  const template = templateOf(loadLibrary(), templateId)
  const all = checklistFor(template.id).flatMap((group) => group.items)
  const items = input.items.filter((item) => all.includes(item))
  if (input.sign && items.length < all.length) {
    throw new ValidationError({
      items: `Tick all ${all.length} items before signing; ${all.length - items.length} are open.`,
    })
  }
  await inClient(ctx, clientId, async (tx) => {
    const values = {
      items,
      signedBy: input.sign ? ctx.principal.userId : null,
      signedAt: input.sign ? new Date() : null,
      updatedAt: new Date(),
    }
    await tx
      .insert(documentChecklist)
      .values({ tenantId: clientId, templateId: template.id, ...values })
      .onConflictDoUpdate({
        target: [documentChecklist.tenantId, documentChecklist.templateId],
        set: values,
      })
    await audit(tx, ctx, {
      tenantId: clientId,
      action: input.sign ? 'documents.checklist.sign' : 'documents.checklist',
      entity: 'document',
      entityId: template.id,
      detail: { ticked: items.length, of: all.length },
    })
  })
}

/** The client's document downloads, newest first. */
export const listDocumentExports = async (ctx: ServiceContext, clientId: string, limit = 50) => {
  authorize(ctx.principal, 'client.view', { clientId })
  return inClient(ctx, clientId, (tx) =>
    tx
      .select({
        id: documentExport.id,
        templateId: documentExport.templateId,
        recordRef: documentExport.recordRef,
        format: documentExport.format,
        templateSha: documentExport.templateSha,
        at: documentExport.at,
        userName: appUser.displayName,
      })
      .from(documentExport)
      .leftJoin(appUser, eq(appUser.id, documentExport.userId))
      .where(eq(documentExport.tenantId, clientId))
      .orderBy(desc(documentExport.at), desc(documentExport.id))
      .limit(limit),
  )
}

/** Template IDs with their records, for the record pages' "documents" links. */
export const documentsForRecord = (kind: RecordKind) =>
  Object.entries(RECORD_DOCUMENTS)
    .filter(([, value]) => value === kind)
    .map(([id]) => id)
