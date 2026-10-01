import { CAPABILITIES, type Capability } from './capabilities'
import type { Role } from './roles'

/** A role granted to a user: firm-wide (clientId null), for one client, or for one department. */
export type Assignment = {
  role: Role
  clientId: string | null
  departmentId: string | null
}

export type Principal = {
  userId: string
  email: string
  displayName: string
  assignments: Assignment[]
}

export type AccessScope = { clientId?: string; departmentId?: string | null }

export class AccessDeniedError extends Error {
  readonly capability: Capability

  constructor(capability: Capability) {
    super(`You do not have permission for this action (${capability}).`)
    this.name = 'AccessDeniedError'
    this.capability = capability
  }
}

const matchesScope = (assignment: Assignment, capability: Capability, scope: AccessScope) => {
  const kind = CAPABILITIES[capability].scope
  if (kind === 'firm') return true
  if (assignment.clientId !== null && assignment.clientId !== scope.clientId) return false
  if (assignment.clientId === null && scope.clientId === undefined) return kind !== 'department'
  if (kind === 'department' && assignment.departmentId !== null) {
    return assignment.departmentId === scope.departmentId
  }
  return true
}

export const can = (
  principal: Principal,
  capability: Capability,
  scope: AccessScope = {},
): boolean => {
  const roles: readonly Role[] = CAPABILITIES[capability].roles
  return principal.assignments.some(
    (assignment) => roles.includes(assignment.role) && matchesScope(assignment, capability, scope),
  )
}

export const authorize = (
  principal: Principal,
  capability: Capability,
  scope: AccessScope = {},
): void => {
  if (!can(principal, capability, scope)) throw new AccessDeniedError(capability)
}

/** True when the user holds a role firm-wide (not limited to specific clients). */
export const hasGlobal = (principal: Principal, role: Role): boolean =>
  principal.assignments.some(
    (assignment) => assignment.role === role && assignment.clientId === null,
  )

/** Client ids the user may open, or "all" for firm-wide roles. */
export const accessibleClientIds = (principal: Principal): 'all' | string[] => {
  if (principal.assignments.some((assignment) => assignment.clientId === null)) return 'all'
  return [
    ...new Set(
      principal.assignments.map((assignment) => assignment.clientId).filter((id) => id !== null),
    ),
  ]
}
