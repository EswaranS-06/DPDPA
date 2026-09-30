import { accessibleClientIds, type Principal, type Role } from '@duatf/core-access'
import { eq, roleAssignment, type Executor, type TenantScope } from '@duatf/platform-db'
import type { SessionUser } from './sessions'

/** Builds the principal (who the user is and every role they hold) for authorization checks. */
export const loadPrincipal = async (
  db: Executor,
  user: Pick<SessionUser, 'userId' | 'email' | 'displayName'>,
): Promise<Principal> => {
  const rows = await db
    .select({
      role: roleAssignment.role,
      clientId: roleAssignment.tenantId,
      departmentId: roleAssignment.departmentId,
    })
    .from(roleAssignment)
    .where(eq(roleAssignment.userId, user.userId))
  return {
    userId: user.userId,
    email: user.email,
    displayName: user.displayName,
    assignments: rows.map((row) => ({ ...row, role: row.role as Role })),
  }
}

/** The tenants row-level security should expose to this principal. */
export const tenantScope = (principal: Principal): TenantScope => accessibleClientIds(principal)
