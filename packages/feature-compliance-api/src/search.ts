import {
  and,
  asc,
  assessment,
  department,
  desc,
  eq,
  evidence,
  finding,
  ilike,
  or,
  remediationAction,
  tenant,
} from '@duatf/platform-db'
import { inUserScope, type ServiceContext } from './context'

export type WorkspaceHit = {
  kind: 'client' | 'assessment' | 'finding' | 'action' | 'evidence' | 'department'
  code: string
  title: string
  clientCode: string
  clientName: string
  href: string
}

const PER_KIND = 6

const likePattern = (text: string) => `%${text.replace(/[\\%_]/g, (match) => `\\${match}`)}%`

/**
 * Records the user can open whose code or title contains the query: clients, assessments,
 * findings, actions, evidence and departments. Row-level security limits every query to the
 * user's clients, so nothing from another client can appear.
 */
export const searchWorkspace = async (
  ctx: ServiceContext,
  rawQuery: string,
): Promise<WorkspaceHit[]> => {
  const query = rawQuery.trim().replace(/\s+/g, ' ').slice(0, 100)
  if (query.length < 2) return []
  const pattern = likePattern(query)
  return inUserScope(ctx, async (tx) => {
    const clients = await tx
      .select({ code: tenant.code, name: tenant.name })
      .from(tenant)
      .where(or(ilike(tenant.code, pattern), ilike(tenant.name, pattern)))
      .orderBy(asc(tenant.name))
      .limit(PER_KIND)
    const owned = <
      Row extends { code: string; title: string; clientCode: string; clientName: string },
    >(
      rows: Row[],
      kind: WorkspaceHit['kind'],
      path: (row: Row) => string,
    ): WorkspaceHit[] =>
      rows.map((row) => ({
        kind,
        code: row.code,
        title: row.title,
        clientCode: row.clientCode,
        clientName: row.clientName,
        href: `/clients/${row.clientCode}/${path(row)}`,
      }))
    const client = { clientCode: tenant.code, clientName: tenant.name }

    const assessments = await tx
      .select({ code: assessment.code, title: assessment.title, ...client })
      .from(assessment)
      .innerJoin(tenant, eq(tenant.id, assessment.tenantId))
      .where(or(ilike(assessment.code, pattern), ilike(assessment.title, pattern)))
      .orderBy(desc(assessment.createdAt))
      .limit(PER_KIND)
    const findings = await tx
      .select({ code: finding.code, title: finding.title, ...client })
      .from(finding)
      .innerJoin(tenant, eq(tenant.id, finding.tenantId))
      .where(
        or(
          ilike(finding.code, pattern),
          ilike(finding.title, pattern),
          ilike(finding.questionCode, pattern),
        ),
      )
      .orderBy(asc(finding.status), desc(finding.openedAt))
      .limit(PER_KIND)
    const actions = await tx
      .select({ code: remediationAction.code, title: remediationAction.title, ...client })
      .from(remediationAction)
      .innerJoin(tenant, eq(tenant.id, remediationAction.tenantId))
      .where(or(ilike(remediationAction.code, pattern), ilike(remediationAction.title, pattern)))
      .orderBy(desc(remediationAction.createdAt))
      .limit(PER_KIND)
    const files = await tx
      .select({ code: evidence.code, title: evidence.title, ...client })
      .from(evidence)
      .innerJoin(tenant, eq(tenant.id, evidence.tenantId))
      .where(
        or(
          ilike(evidence.code, pattern),
          ilike(evidence.title, pattern),
          ilike(evidence.fileName, pattern),
        ),
      )
      .orderBy(desc(evidence.uploadedAt))
      .limit(PER_KIND)
    const departments = await tx
      .select({ code: department.code, title: department.name, ...client })
      .from(department)
      .innerJoin(tenant, eq(tenant.id, department.tenantId))
      .where(
        and(
          eq(department.active, true),
          or(ilike(department.code, pattern), ilike(department.name, pattern)),
        ),
      )
      .orderBy(asc(department.name))
      .limit(PER_KIND)

    return [
      ...clients.map((row): WorkspaceHit => ({
        kind: 'client',
        code: row.code,
        title: row.name,
        clientCode: row.code,
        clientName: row.name,
        href: `/clients/${row.code}`,
      })),
      ...owned(assessments, 'assessment', (row) => `assessments/${row.code}`),
      ...owned(findings, 'finding', (row) => `findings/${row.code}`),
      ...owned(actions, 'action', (row) => `actions/${row.code}`),
      ...owned(files, 'evidence', (row) => `evidence/${row.code}`),
      ...owned(departments, 'department', (row) => `departments/${row.code}`),
    ]
  })
}
