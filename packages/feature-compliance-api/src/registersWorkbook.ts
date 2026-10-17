import { authorize } from '@duatf/core-access'
import { formatIst, isoDate } from '@duatf/core-utils'
import { loadRegisterLayouts } from '@duatf/platform-documents'
import {
  and,
  asc,
  breach,
  dpia,
  eq,
  processingActivity,
  processor,
  rightsRequest,
  tenant,
} from '@duatf/platform-db'
import { BREACH_NATURES } from './breaches'
import { inClient, type ServiceContext } from './context'
import { CONTRACT_TERMS, listProcessors } from './processors'
import { REQUESTER_ROLE_LABEL } from './rights'
import { listActivities } from './ropa'
import { newWorkbook, recordExport, toBuffer } from './workbooks'

// The registers workbook (C25.6, ADR-0010 decision 11): the template library's seven register
// layouts, their columns exactly as the library gives them, filled from DUATF's records where it
// holds the data. Columns DUATF has nothing for are left blank to fill in.

/** The sheet each register layout becomes. */
export const REGISTER_SHEETS: Record<string, string> = {
  'ropa.csv': 'RoPA',
  'retention-schedule.csv': 'Retention schedule',
  'vendor-register.csv': 'Vendor register',
  'breach-register.csv': 'Breach register',
  'rights-request-log.csv': 'Rights-request log',
  'consent-log.csv': 'Consent log',
  'cookie-register.csv': 'Cookie register',
}

const yn = (value: boolean | null | undefined) =>
  value === null || value === undefined ? '' : value ? 'Y' : 'N'
const at = (value: Date | null) => (value ? formatIst(value) : '')
const CHILD = /child|minor|student|under 18|pupil/i

type Row = Record<string, string | number | null>

/** Builds the rows of each register from the client's records, keyed by the library's column names. */
const registerRows = async (
  ctx: ServiceContext,
  clientId: string,
): Promise<Record<string, Row[]>> => {
  const [ropa, processors] = await Promise.all([
    listActivities(ctx, clientId),
    listProcessors(ctx, clientId),
  ])
  const records = await inClient(ctx, clientId, async (tx) => ({
    dpias: await tx
      .select({ code: dpia.code, ref: processingActivity.ref })
      .from(dpia)
      .innerJoin(processingActivity, eq(processingActivity.id, dpia.activityId))
      .where(eq(dpia.tenantId, clientId)),
    breaches: await tx
      .select({ breach, processorName: processor.name })
      .from(breach)
      .leftJoin(processor, eq(processor.id, breach.processorId))
      .where(eq(breach.tenantId, clientId))
      .orderBy(asc(breach.code)),
    requests: await tx
      .select()
      .from(rightsRequest)
      .where(eq(rightsRequest.tenantId, clientId))
      .orderBy(asc(rightsRequest.code)),
  }))
  const basis = new Map(ropa.kb.bases.map((row) => [row.code, row.label]))
  const departments = new Map(ropa.departments.map((row) => [row.code, row.name]))
  const dpiaOf = (ref: number) => records.dpias.find((row) => row.ref === ref)?.code ?? ''
  const highest = (levels: readonly string[]) =>
    levels.reduce((top, level) => (level > top ? level : top), '')
  return {
    'ropa.csv': ropa.activities.map((row) => ({
      'RoPA ID': row.refLabel,
      'Business function': row.departmentName,
      'Purpose (specified purpose)': row.purpose ?? row.name,
      'Goods/services/uses enabled': row.name,
      'Process owner': row.owner,
      'Data Principal categories': row.principals.join(', '),
      'Personal data items (itemised)': row.elements.map((element) => element.title).join(', '),
      'Classification (L3/L4)': highest(row.elements.map((element) => element.level)),
      'Children data (Y/N + VPC/exemption)': yn(row.principals.some((name) => CHILD.test(name))),
      Source: row.sources.join(', '),
      'Legal basis (Consent / s.7 clause / s.17)': [
        ...row.lawfulBases.map((code) => basis.get(code) ?? code),
        row.lawReference,
      ]
        .filter(Boolean)
        .join('; '),
      'Consent purpose ID': row.lawfulBases.includes('consent') ? row.refLabel : '',
      Systems: row.systems.join(', '),
      'Internal recipients': row.internalRecipients
        .map((code) => departments.get(code) ?? code)
        .join(', '),
      'Data Processors (+DPA ref)': row.processors.join(', '),
      'Other Data Fiduciaries (+DSA ref)': row.recipients.join(', '),
      'Cross-border (country/mechanism)':
        row.transfersAbroad === 'yes'
          ? `Yes${row.countries ? `: ${row.countries}` : ''}`
          : row.transfersAbroad === 'no'
            ? 'No'
            : '',
      'Retention period & trigger': row.retention,
      'Erasure method': row.deletion,
      'Security measures': row.security.join(', '),
      'DPIA ref': dpiaOf(row.ref),
      'Last reviewed': isoDate(row.updatedAt),
    })),
    'retention-schedule.csv': ropa.activities
      .filter((row) => row.retention)
      .map((row, index) => ({
        'Retention ref': `RET-${String(index + 1).padStart(3, '0')}`,
        'Data set / record': row.name,
        'Purpose (RoPA ID)': row.refLabel,
        'Legal basis': row.lawfulBases.map((code) => basis.get(code) ?? code).join(', '),
        'Retention period': row.retention,
        'Legal reference': row.lawReference,
        'Disposal method': row.deletion,
        'System(s)': row.systems.join(', '),
        'Processor(s) holding copy': row.processors.join(', '),
        Owner: row.owner ?? row.departmentName,
      })),
    'vendor-register.csv': processors.entries.map((row) => ({
      Vendor: row.name,
      Service: row.service,
      'Role (Processor/Fiduciary/Sub-processor)': row.kind === 'processor' ? 'Processor' : row.kind,
      'Risk tier': row.rating,
      'Data categories (L3/L4)': row.elements.map((element) => element.title).join(', '),
      'Processing locations': [
        row.location === 'outside' ? 'Outside India' : row.location === 'india' ? 'India' : '',
        row.countries,
      ]
        .filter(Boolean)
        .join(': '),
      'Cross-border (Y/N + country)':
        row.location === 'outside'
          ? `Y${row.countries ? `: ${row.countries}` : ''}`
          : row.location === 'india'
            ? 'N'
            : '',
      'DPA/DSA/Rider ref': CONTRACT_TERMS.filter((term) => row.terms.includes(term.code)).length
        ? `Contract: ${row.contract}`
        : row.contract,
      'Contract start': row.contractStart,
      'Contract end': row.contractEnd,
      'Last audit': row.lastAssessedOn,
      'Next review': row.nextReviewOn,
    })),
    'breach-register.csv': records.breaches.map(({ breach: b, processorName }) => ({
      'Breach ID': b.code,
      'Reported by / channel': [b.reportedBy, b.reportChannel].filter(Boolean).join(' / '),
      'Aware at (T0)': at(b.awareAt),
      'Occurred at': at(b.occurredAt),
      'Contained at': at(b.containedAt),
      'Nature (C/I/A + type)': BREACH_NATURES.filter((nature) => b.natures.includes(nature.code))
        .map((nature) => nature.label)
        .join(', '),
      'Systems / location / processor': [b.place, processorName].filter(Boolean).join(' / '),
      'Data categories & items': b.dataAffected,
      'DP categories (children Y/N)': b.childrenAffected === null ? '' : yn(b.childrenAffected > 0),
      'No. of DPs': b.affectedPrincipals,
      'No. of records': b.recordsAffected,
      'Severity (S1-S4)': b.severity,
      'Likely impact': b.likelyImpact,
      'Root cause': b.cause,
      'Person responsible findings': b.personResponsible,
      'Containment & mitigation': b.measures,
      'Remedial actions (owner/date)': b.remedial,
      'CERT-In ref & time': at(b.certInAt),
      'Board initial intimation time & ref': [at(b.boardFirstAt), b.boardReference]
        .filter(Boolean)
        .join(', '),
      'Board detailed report time & ref': at(b.boardDetailedAt),
      'Extension (Y/N + ref)': b.boardExtendedTo ? `Y: until ${formatIst(b.boardExtendedTo)}` : '',
      'DPs notified (count/modes/time)': [b.principalsHow, at(b.principalsAt)]
        .filter(Boolean)
        .join(', '),
      'PIR date & lessons': [b.reviewOn, b.lessons].filter(Boolean).join(': '),
      Status: b.status,
      'Closed on': at(b.closedAt),
    })),
    'rights-request-log.csv': records.requests.map((row) => ({
      'Ticket no.': row.requesterRef,
      'Type (access/correction/erasure/nomination/withdrawal/grievance)': row.kind,
      Channel: row.channel,
      'Received at': row.receivedOn,
      'Requester role (self/parent/guardian/nominee/agent)': row.requesterRole
        ? REQUESTER_ROLE_LABEL[row.requesterRole]
        : '',
      'Verification method': row.verificationMethod,
      'Verified at': row.verifiedOn,
      'Acknowledged at': row.acknowledgedOn,
      'Due date': row.dueOn,
      'Assigned to': row.handler,
      'Outcome (fulfilled/partial/declined)':
        row.status === 'fulfilled' ? 'fulfilled' : row.status === 'refused' ? 'declined' : '',
      'Refusal reason & legal basis': row.status === 'refused' ? row.outcome : '',
      'Letter template (L-xx)': row.letterRef,
      'SLA met (Y/N)': row.closedOn ? yn(row.closedOn <= row.dueOn) : '',
      'Closed at': row.closedOn,
      Notes: row.status === 'refused' ? '' : row.outcome,
    })),
    'consent-log.csv': [],
    'cookie-register.csv': [],
  }
}

/** The client's registers in the template library's layouts, as one Excel workbook. */
export const buildRegistersWorkbook = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'report.export', { clientId })
  const layouts = loadRegisterLayouts()
  const [rows, client] = await Promise.all([
    registerRows(ctx, clientId),
    inClient(ctx, clientId, async (tx) => {
      const [row] = await tx
        .select({ code: tenant.code, name: tenant.name })
        .from(tenant)
        .where(and(eq(tenant.id, clientId)))
      return row
    }),
  ])
  const workbook = newWorkbook(`${client?.name ?? ''} registers`)
  // The registers in the order a consultant fills them: the RoPA first.
  const ordered = Object.keys(REGISTER_SHEETS).flatMap((file) =>
    layouts.filter((layout) => layout.file === file),
  )
  for (const layout of [
    ...ordered,
    ...layouts.filter((layout) => !(layout.file in REGISTER_SHEETS)),
  ]) {
    const sheet = workbook.addWorksheet(
      REGISTER_SHEETS[layout.file] ?? layout.file.replace(/\.csv$/, ''),
    )
    sheet.addRow([...layout.columns])
    sheet.getRow(1).font = { bold: true }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
    for (const row of rows[layout.file] ?? []) {
      sheet.addRow(layout.columns.map((column) => row[column] ?? null))
    }
    layout.columns.forEach((column, index) => {
      sheet.getColumn(index + 1).width = Math.min(Math.max(column.length + 2, 14), 40)
    })
  }
  const content = await toBuffer(workbook)
  await recordExport(ctx, clientId, 'registers-workbook', {
    registers: Object.fromEntries(Object.entries(rows).map(([file, list]) => [file, list.length])),
  })
  return { fileName: `${client?.code ?? 'client'}-registers-${isoDate(new Date())}.xlsx`, content }
}
