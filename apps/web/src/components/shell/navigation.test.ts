import { randomUUID } from 'node:crypto'
import type { Principal, Role } from '@duatf/core-access'
import type { ClientSummary } from '@duatf/feature-compliance-api'
import { describe, expect, it } from 'vitest'
import { navigationFor } from '../../server/navigation'
import { clientCodeIn, clientSections, crumbsFor } from './navigation'

const clientId = randomUUID()

const person = (role: Role, scoped = false): Principal => ({
  userId: randomUUID(),
  email: `${role}@example.test`,
  displayName: role,
  assignments: [{ role, clientId: scoped ? clientId : null, departmentId: null }],
})

const clients = [
  { id: clientId, code: 'AMMA', name: 'AMMA', status: 'active' },
] as unknown as ClientSummary[]

const hrefs = (principal: Principal) =>
  navigationFor(principal, clients).groups.flatMap((group) => group.links.map((link) => link.href))

describe('navigation', () => {
  it('TC-C16.2-01 the sidebar offers each role only the sections it may open', () => {
    expect(hrefs(person('firm_admin'))).toEqual([
      '/',
      '/clients',
      '/knowledge-base',
      '/admin/team',
      '/admin/risk-bands',
    ])
    expect(hrefs(person('auditor'))).toEqual(['/', '/clients', '/knowledge-base'])
    // Client people work inside their own client: no portfolio, no administration.
    expect(hrefs(person('client_dpo', true))).toEqual(['/knowledge-base'])
    expect(navigationFor(person('client_dpo', true), clients).firm).toBe(false)

    // Inside a client, its sections are grouped, and the breadcrumb names the client.
    expect(clientCodeIn('/clients/amma/findings/FND-AMMA-003')).toBe('AMMA')
    expect(clientCodeIn('/clients/new')).toBeNull()
    expect(
      clientSections('AMMA').map((group) => [group.label, group.links.map((link) => link.label)]),
    ).toEqual([
      ['Compliance', ['Overview', 'Departments', 'Data mapping', 'Assessments', 'Evidence']],
      ['Risk and remediation', ['Findings', 'Risk register', 'Remediation']],
      ['Reporting', ['Reports']],
      ['Organisation', ['People', 'Control owners']],
    ])
    const navigation = navigationFor(person('lead_auditor'), clients)
    const labels = (path: string) => crumbsFor(path, navigation).map((crumb) => crumb.label)
    // A question is answered per department, so its crumb names both.
    expect(labels('/clients/AMMA/assessments/ASM-AMMA-001/items/HR/A1.1')).toEqual([
      'Clients',
      'AMMA',
      'Assessments',
      'ASM-AMMA-001',
      'HR, A1.1',
    ])
    expect(labels('/clients/AMMA/departments/HR/edit')).toEqual([
      'Clients',
      'AMMA',
      'Departments',
      'HR',
      'Edit',
    ])
    // A department's personal data page sits under the department.
    expect(labels('/clients/AMMA/departments/HR/data')).toEqual([
      'Clients',
      'AMMA',
      'Departments',
      'HR',
      'Personal data',
    ])
    expect(labels('/clients/AMMA/data-mapping')).toEqual(['Clients', 'AMMA', 'Data mapping'])
    expect(labels('/clients/AMMA/data-mapping/activities/PA-004')).toEqual([
      'Clients',
      'AMMA',
      'Data mapping',
      'Record of processing',
      'PA-004',
    ])
    expect(labels('/clients/AMMA/data-mapping/activities/new')).toEqual([
      'Clients',
      'AMMA',
      'Data mapping',
      'Record of processing',
      'Add activity',
    ])
    expect(labels('/clients/AMMA/data-mapping/catalogue')).toEqual([
      'Clients',
      'AMMA',
      'Data mapping',
      'Process catalogue',
    ])
    expect(labels('/clients/AMMA/departments/new')).toEqual([
      'Clients',
      'AMMA',
      'Departments',
      'Add department',
    ])
    expect(labels('/account/password')).toEqual(['Account', 'Change password'])
    expect(
      crumbsFor('/clients/AMMA/reports/executive/ASM-AMMA-001', navigation).map((crumb) => [
        crumb.label,
        crumb.href,
      ]),
    ).toEqual([
      ['Clients', '/clients'],
      ['AMMA', '/clients/AMMA'],
      ['Reports', '/clients/AMMA/reports'],
      ['Executive report, ASM-AMMA-001', '/clients/AMMA/reports/executive/ASM-AMMA-001'],
    ])
  })
})
