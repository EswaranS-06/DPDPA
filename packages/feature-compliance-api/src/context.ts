import type { Principal } from '@duatf/core-access'
import {
  appendAudit,
  withTenant,
  withTenants,
  type AuditEntry,
  type Database,
  type Executor,
  type Transaction,
} from '@duatf/platform-db'
import { tenantScope } from '@duatf/platform-identity'

/** Creates and updates sign-in accounts (Keycloak in production, a fake in tests). */
export type UserProvisioner = {
  /** Creates the account, or resets it when the email exists; returns the account id. */
  provision: (input: {
    email: string
    displayName: string
    temporaryPassword: string
  }) => Promise<string>
  setEnabled: (accountId: string, enabled: boolean) => Promise<void>
}

/** Everything a service call needs: the database, who is acting, and account provisioning. */
export type ServiceContext = {
  db: Database
  principal: Principal
  provisioner: UserProvisioner
}

/** Runs work limited (by row-level security) to the clients the user may see. */
export const inUserScope = <Result>(
  ctx: ServiceContext,
  work: (tx: Transaction) => Promise<Result>,
): Promise<Result> => withTenants(ctx.db, tenantScope(ctx.principal), work)

/** Runs work for one client. Call only after the capability check for that client. */
export const inClient = <Result>(
  ctx: ServiceContext,
  clientId: string,
  work: (tx: Transaction) => Promise<Result>,
): Promise<Result> => withTenant(ctx.db, clientId, work)

/** Runs work across all clients; for firm-level operations that were authorised first. */
export const firmWide = <Result>(
  ctx: ServiceContext,
  work: (tx: Transaction) => Promise<Result>,
): Promise<Result> => withTenants(ctx.db, 'all', work)

/** Records who did what, in the same transaction as the change. */
export const audit = (
  tx: Executor,
  ctx: ServiceContext,
  entry: Omit<AuditEntry, 'actorUserId'>,
): Promise<void> => appendAudit(tx, { ...entry, actorUserId: ctx.principal.userId })
