import { authorize } from '@duatf/core-access'
import {
  and,
  asc,
  assessment,
  control,
  eq,
  finding,
  inArray,
  type GapType,
} from '@duatf/platform-db'
import { inClient, type ServiceContext } from './context'

// The open gaps against the information security and privacy standards a client may already run
// (ADR-0009): each gap under every ISO/IEC 27001, ISO/IEC 27701 and NIST CSF reference of its
// control, as the knowledge base release of its cycle records them.

export const STANDARDS = [
  { key: 'iso27001', label: 'ISO/IEC 27001:2022', part: 'Annex A control' },
  { key: 'iso27701', label: 'ISO/IEC 27701:2019', part: 'Clause' },
  { key: 'nistCsf', label: 'NIST Cybersecurity Framework 2.0', part: 'Subcategory' },
] as const
export type StandardKey = (typeof STANDARDS)[number]['key']

type GapRow = {
  code: string
  title: string
  gapType: GapType
  controlCode: string
  releaseId: string
}
type ControlRefs = { releaseId: string; code: string } & Record<StandardKey, readonly string[]>

export type CrosswalkReference = {
  reference: string
  controls: string[]
  gaps: { code: string; title: string; gapType: GapType }[]
}

/** Natural order of references: 5.9 before 5.24, PR.AA-02 before PR.AA-10. */
const byReference = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true })

/** Groups gaps under each reference of their controls, per standard. Pure. */
export const groupByStandard = (gaps: readonly GapRow[], controls: readonly ControlRefs[]) =>
  STANDARDS.map((standard) => {
    const references = new Map<string, CrosswalkReference>()
    for (const gap of gaps) {
      const refs =
        controls.find((row) => row.releaseId === gap.releaseId && row.code === gap.controlCode)?.[
          standard.key
        ] ?? []
      for (const reference of refs) {
        const entry = references.get(reference) ?? { reference, controls: [], gaps: [] }
        if (!entry.controls.includes(gap.controlCode)) entry.controls.push(gap.controlCode)
        if (!entry.gaps.some((item) => item.code === gap.code)) {
          entry.gaps.push({ code: gap.code, title: gap.title, gapType: gap.gapType })
        }
        references.set(reference, entry)
      }
    }
    const rows = [...references.values()].sort((a, b) => byReference(a.reference, b.reference))
    return {
      ...standard,
      references: rows,
      /** Gaps whose controls name no reference in this standard. */
      unmapped: gaps.filter(
        (gap) =>
          !(
            controls.find(
              (row) => row.releaseId === gap.releaseId && row.code === gap.controlCode,
            )?.[standard.key] ?? []
          ).length,
      ).length,
    }
  })

/** The client's open gaps against each standard. */
export const standardsCrosswalk = async (ctx: ServiceContext, clientId: string) => {
  authorize(ctx.principal, 'assessment.view', { clientId })
  return inClient(ctx, clientId, async (tx) => {
    const gaps = await tx
      .select({
        code: finding.code,
        title: finding.title,
        gapType: finding.gapType,
        controlCode: finding.controlCode,
        releaseId: assessment.releaseId,
      })
      .from(finding)
      .innerJoin(assessment, eq(assessment.id, finding.assessmentId))
      .where(and(eq(finding.tenantId, clientId), eq(finding.status, 'open')))
      .orderBy(asc(finding.code))
    const releases = [...new Set(gaps.map((row) => row.releaseId))]
    const controls = releases.length
      ? await tx
          .select({
            releaseId: control.releaseId,
            code: control.code,
            iso27001: control.iso27001,
            iso27701: control.iso27701,
            nistCsf: control.nistCsf,
          })
          .from(control)
          .where(inArray(control.releaseId, releases))
      : []
    return { openGaps: gaps.length, standards: groupByStandard(gaps, controls) }
  })
}
export type StandardsCrosswalk = Awaited<ReturnType<typeof standardsCrosswalk>>
