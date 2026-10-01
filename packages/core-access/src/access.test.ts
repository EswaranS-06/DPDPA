import { describe, expect, it } from 'vitest'
import { accessibleClientIds, authorize, can, AccessDeniedError, type Principal } from './can'
import { CAPABILITIES, type Capability } from './capabilities'
import { ROLES, type Role } from './roles'

// Golden permission table (docs: ADR-0002). Y = allowed for a user holding only that role,
// in scope. Columns: firm_admin, lead_auditor, auditor, client_dpo, department_owner, client_viewer.
const GOLDEN: Record<Capability, string> = {
  'platform.admin': 'Y.....',
  'client.create': 'YY....',
  'client.view': 'YYYYYY',
  'client.edit': 'YY.Y..',
  'client.assign_staff': 'Y.....',
  'department.manage': 'YYYY..',
  'user.invite': 'YY.Y..',
  'assessment.create': 'YY....',
  'assessment.view': 'YYYYYY',
  'assessment.assign': 'YYYY..',
  'assessment.answer': '.YYYY.',
  'assessment.review': '.YY...',
  'evidence.view': 'YYYYYY',
  'evidence.upload': '.YYYY.',
  'evidence.review': '.YY...',
  'finding.manage': '.YY...',
  'risk.manage': '.YY...',
  'risk.accept': '...Y..',
  'action.manage': '.YYY..',
  'action.update': '.YYYY.',
  'action.verify': '.YY...',
  'report.view': 'YYYYYY',
  'report.export': 'YYYY.Y',
  'audit.view': 'YY.Y..',
  'kb.view': 'YYYYYY',
  'kb.edit': 'YY....',
  'kb.publish': 'Y.....',
}

const CLIENT = 'client-a'
const OTHER_CLIENT = 'client-b'
const DEPARTMENT = 'dept-hr'

const principalWith = (
  role: Role,
  clientId: string | null,
  departmentId: string | null = null,
): Principal => ({
  userId: 'u1',
  email: 'u1@example.test',
  displayName: 'User One',
  assignments: [{ role, clientId, departmentId }],
})

// Firm roles are granted firm-wide or per client; client roles always per client.
const inScope = (role: Role): Principal =>
  role === 'firm_admin'
    ? principalWith(role, null)
    : role === 'department_owner'
      ? principalWith(role, CLIENT, DEPARTMENT)
      : principalWith(role, CLIENT)

describe('permission matrix', () => {
  it('TC-C3.3-01 grants exactly the documented capabilities to each role', () => {
    expect(Object.keys(GOLDEN).sort()).toEqual(Object.keys(CAPABILITIES).sort())
    const mismatches: string[] = []
    for (const [capability, row] of Object.entries(GOLDEN) as [Capability, string][]) {
      ROLES.forEach((role, index) => {
        const expected = row[index] === 'Y'
        const actual = can(inScope(role), capability, {
          clientId: CLIENT,
          departmentId: DEPARTMENT,
        })
        if (actual !== expected) mismatches.push(`${capability} ${role}: expected ${expected}`)
      })
    }
    expect(mismatches).toEqual([])
  })
})

describe('scoping', () => {
  it('TC-C3.3-02 refuses an auditor on an unassigned client and a department owner elsewhere', () => {
    const auditor = principalWith('auditor', CLIENT)
    expect(can(auditor, 'assessment.review', { clientId: CLIENT })).toBe(true)
    expect(can(auditor, 'assessment.review', { clientId: OTHER_CLIENT })).toBe(false)
    expect(() => authorize(auditor, 'client.view', { clientId: OTHER_CLIENT })).toThrow(
      AccessDeniedError,
    )

    const owner = principalWith('department_owner', CLIENT, DEPARTMENT)
    expect(can(owner, 'assessment.answer', { clientId: CLIENT, departmentId: DEPARTMENT })).toBe(
      true,
    )
    expect(can(owner, 'assessment.answer', { clientId: CLIENT, departmentId: 'dept-it' })).toBe(
      false,
    )
    expect(can(owner, 'assessment.answer', { clientId: CLIENT })).toBe(false)
    expect(can(owner, 'client.view', { clientId: CLIENT })).toBe(true)
    expect(can(owner, 'client.view', { clientId: OTHER_CLIENT })).toBe(false)
  })

  it('lets a firm-wide role act on any client but needs a client for client capabilities', () => {
    const lead = principalWith('lead_auditor', null)
    expect(can(lead, 'assessment.create', { clientId: OTHER_CLIENT })).toBe(true)
    expect(
      can(lead, 'assessment.answer', { clientId: OTHER_CLIENT, departmentId: DEPARTMENT }),
    ).toBe(true)
    expect(accessibleClientIds(lead)).toBe('all')
    expect(accessibleClientIds(principalWith('auditor', CLIENT))).toEqual([CLIENT])
  })
})
