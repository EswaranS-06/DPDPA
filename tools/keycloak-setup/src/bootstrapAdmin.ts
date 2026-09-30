import { chmodSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import {
  and,
  appendAudit,
  appUser,
  eq,
  isNull,
  roleAssignment,
  type Database,
} from '@duatf/platform-db'
import {
  generateTemporaryPassword,
  provisionUser,
  type KeycloakAdmin,
} from '@duatf/platform-identity'

export type BootstrapInput = {
  email: string
  displayName: string
  realm: string
  /** Where the one-time password is written (created with mode 600). */
  passwordFile: string
}

/**
 * Creates the first firm administrator in Keycloak and DUATF. Running it again resets the
 * one-time password; it never creates a second user for the same email.
 */
export const bootstrapFirmAdmin = async (
  db: Database,
  keycloak: KeycloakAdmin,
  input: BootstrapInput,
): Promise<{ userId: string }> => {
  const email = input.email.trim().toLowerCase()
  const temporaryPassword = generateTemporaryPassword()
  const keycloakId = await provisionUser(keycloak, input.realm, {
    email,
    displayName: input.displayName,
    temporaryPassword,
  })
  const userId = await db.transaction(async (tx) => {
    const [existing] = await tx.select().from(appUser).where(eq(appUser.email, email)).limit(1)
    const [user] = existing
      ? await tx
          .update(appUser)
          .set({ keycloakId, displayName: input.displayName, kind: 'firm' })
          .where(eq(appUser.id, existing.id))
          .returning({ id: appUser.id })
      : await tx
          .insert(appUser)
          .values({ email, displayName: input.displayName, kind: 'firm', keycloakId })
          .returning({ id: appUser.id })
    const id = user?.id ?? ''
    const [granted] = await tx
      .select({ id: roleAssignment.id })
      .from(roleAssignment)
      .where(
        and(
          eq(roleAssignment.userId, id),
          eq(roleAssignment.role, 'firm_admin'),
          isNull(roleAssignment.tenantId),
        ),
      )
    if (!granted) await tx.insert(roleAssignment).values({ userId: id, role: 'firm_admin' })
    await appendAudit(tx, {
      actorUserId: null,
      tenantId: null,
      action: 'user.bootstrap_admin',
      entity: 'app_user',
      entityId: id,
      detail: { email },
    })
    return id
  })
  mkdirSync(dirname(input.passwordFile), { recursive: true, mode: 0o700 })
  writeFileSync(
    input.passwordFile,
    `email=${email}\ntemporary_password=${temporaryPassword}\n` +
      '# One-time password: Keycloak asks for a new password and an authenticator app at first sign-in.\n',
    { mode: 0o600 },
  )
  chmodSync(input.passwordFile, 0o600)
  return { userId }
}
