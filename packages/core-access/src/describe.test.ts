import { describe, expect, it } from 'vitest'
import type { Principal } from './can'
import { CAPABILITIES } from './capabilities'
import { CAPABILITY_LABEL, describeDenial } from './describe'

const client = 'c1'
const owner: Principal = {
  userId: 'u1',
  email: 'owner@example.test',
  displayName: 'Owner',
  assignments: [{ role: 'department_owner', clientId: client, departmentId: 'admissions' }],
}

describe('permission explanations', () => {
  it('TC-C16.6-01 a refusal names the action, the reader’s role and the roles that may do it', () => {
    expect(describeDenial(owner, 'report.export', { clientId: client })).toEqual({
      action: 'download workbooks and reports',
      yourRoles: ['Department owner'],
      allowedRoles: ['Firm administrator', 'Lead auditor', 'Auditor', 'Client DPO', 'Viewer'],
      otherDepartment: false,
      ask: 'your organisation’s DPO or the ComplyX team',
    })
    // Answering for another department: the role fits, the department does not.
    const elsewhere = describeDenial(owner, 'assessment.answer', {
      clientId: client,
      departmentId: 'finance',
    })
    expect([elsewhere.action, elsewhere.otherDepartment]).toEqual([
      'answer assessment questions',
      true,
    ])
    // Roles held at other clients are not listed.
    const twoClients: Principal = {
      ...owner,
      assignments: [
        ...owner.assignments,
        { role: 'client_dpo', clientId: 'c2', departmentId: null },
      ],
    }
    expect(describeDenial(twoClients, 'risk.accept', { clientId: client }).yourRoles).toEqual([
      'Department owner',
    ])
    // Every capability has a plain-language description.
    expect(Object.keys(CAPABILITIES).filter((name) => !(name in CAPABILITY_LABEL))).toEqual([])
  })
})
