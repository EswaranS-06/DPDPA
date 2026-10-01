import type { Role } from './roles'

/**
 * scope "firm": not tied to a client. "client": needs the client in scope.
 * "department": needs the department in scope; a department-restricted role matches only there.
 */
type Scope = 'firm' | 'client' | 'department'

const define = (scope: Scope, roles: readonly Role[]) => ({ scope, roles })

export const CAPABILITIES = {
  'platform.admin': define('firm', ['firm_admin']),
  'client.create': define('firm', ['firm_admin', 'lead_auditor']),
  'client.view': define('client', [
    'firm_admin',
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
    'client_viewer',
  ]),
  'client.edit': define('client', ['firm_admin', 'lead_auditor', 'client_dpo']),
  'client.assign_staff': define('client', ['firm_admin']),
  'department.manage': define('client', ['firm_admin', 'lead_auditor', 'auditor', 'client_dpo']),
  'user.invite': define('client', ['firm_admin', 'lead_auditor', 'client_dpo']),
  'assessment.create': define('client', ['firm_admin', 'lead_auditor']),
  'assessment.view': define('client', [
    'firm_admin',
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
    'client_viewer',
  ]),
  'assessment.assign': define('client', ['firm_admin', 'lead_auditor', 'auditor', 'client_dpo']),
  'assessment.answer': define('department', [
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
  ]),
  'assessment.review': define('client', ['lead_auditor', 'auditor']),
  'evidence.view': define('client', [
    'firm_admin',
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
    'client_viewer',
  ]),
  'evidence.upload': define('department', [
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
  ]),
  'evidence.review': define('client', ['lead_auditor', 'auditor']),
  'finding.manage': define('client', ['lead_auditor', 'auditor']),
  'risk.manage': define('client', ['lead_auditor', 'auditor']),
  'risk.accept': define('client', ['client_dpo']),
  'action.manage': define('client', ['lead_auditor', 'auditor', 'client_dpo']),
  'action.update': define('department', [
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
  ]),
  'action.verify': define('client', ['lead_auditor', 'auditor']),
  'report.view': define('client', [
    'firm_admin',
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
    'client_viewer',
  ]),
  'report.export': define('client', [
    'firm_admin',
    'lead_auditor',
    'auditor',
    'client_dpo',
    'client_viewer',
  ]),
  'audit.view': define('client', ['firm_admin', 'lead_auditor', 'client_dpo']),
  'kb.view': define('firm', [
    'firm_admin',
    'lead_auditor',
    'auditor',
    'client_dpo',
    'department_owner',
    'client_viewer',
  ]),
  'kb.edit': define('firm', ['firm_admin', 'lead_auditor']),
  'kb.publish': define('firm', ['firm_admin']),
} as const satisfies Record<string, { scope: Scope; roles: readonly Role[] }>

export type Capability = keyof typeof CAPABILITIES

export const MATRIX: Record<Capability, readonly Role[]> = Object.fromEntries(
  Object.entries(CAPABILITIES).map(([name, definition]) => [name, definition.roles]),
) as Record<Capability, readonly Role[]>

export const capabilityScope = (capability: Capability): Scope => CAPABILITIES[capability].scope
