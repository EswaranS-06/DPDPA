import { CAPABILITIES, type Capability } from './capabilities'
import type { AccessScope, Principal } from './can'
import { isFirmRole, ROLE_LABEL, type Role } from './roles'

/** What each capability lets a person do, as the end of "You don't have permission to …". */
export const CAPABILITY_LABEL: Record<Capability, string> = {
  'platform.admin': 'administer DUATF',
  'client.create': 'onboard clients',
  'client.view': 'open this client',
  'client.edit': "edit this client's profile",
  'client.assign_staff': 'assign ComplyX staff to clients',
  'department.manage': 'manage departments',
  'user.invite': 'add people and manage their logins',
  'assessment.create': 'start assessments',
  'assessment.view': 'view assessments',
  'assessment.assign': 'assign questions to departments',
  'assessment.answer': 'answer assessment questions',
  'assessment.review': 'review answers',
  'evidence.view': 'view evidence',
  'evidence.upload': 'upload evidence',
  'evidence.review': 'review evidence',
  'finding.manage': 'manage findings',
  'risk.manage': 'rate risks',
  'risk.accept': 'accept risks on behalf of the client',
  'action.manage': 'plan remediation actions',
  'action.update': 'update remediation actions',
  'action.verify': 'verify and close remediation actions',
  'report.view': 'view reports',
  'report.export': 'download workbooks and reports',
  'audit.view': 'view the audit log',
  'kb.view': 'open the knowledge base',
  'kb.edit': 'edit the knowledge base draft',
  'kb.publish': 'review and publish knowledge base releases',
}

export type Denial = {
  /** "answer assessment questions" */
  action: string
  /** The user's roles at this client (or firm-wide), as labels. */
  yourRoles: string[]
  /** The roles that may do it, as labels. */
  allowedRoles: string[]
  /** True when the capability is limited to a department and the user holds it elsewhere. */
  otherDepartment: boolean
  /** Whom to ask: the firm's administrator for staff, the DPO or ComplyX for client people. */
  ask: string
}

/** Explains a refusal: what was refused, the user's role and the roles that are allowed. */
export const describeDenial = (
  principal: Principal,
  capability: Capability,
  scope: AccessScope = {},
): Denial => {
  const relevant = principal.assignments.filter(
    (assignment) => assignment.clientId === null || assignment.clientId === scope.clientId,
  )
  const allowed: readonly Role[] = CAPABILITIES[capability].roles
  return {
    action: CAPABILITY_LABEL[capability],
    yourRoles: [...new Set(relevant.map((assignment) => ROLE_LABEL[assignment.role]))],
    allowedRoles: allowed.map((role) => ROLE_LABEL[role]),
    otherDepartment:
      CAPABILITIES[capability].scope === 'department' &&
      relevant.some(
        (assignment) => allowed.includes(assignment.role) && assignment.departmentId !== null,
      ),
    ask: principal.assignments.some((assignment) => isFirmRole(assignment.role))
      ? 'your DUATF administrator'
      : 'the ComplyX audit team',
  }
}
