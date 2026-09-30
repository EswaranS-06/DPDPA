import { and, appendAudit, appUser, eq, isNull, type Database } from '@duatf/platform-db'
import { LoginError, type IdentityClaims } from './oidc'

export type SignedInUser = { userId: string; email: string; displayName: string }

/**
 * Matches a Keycloak identity to a DUATF user: by Keycloak id, or on first sign-in by the
 * invited email address. Unknown and disabled users are refused.
 */
export const resolveSignIn = (db: Database, claims: IdentityClaims): Promise<SignedInUser> =>
  db.transaction(async (tx) => {
    const [linked] = await tx
      .select()
      .from(appUser)
      .where(eq(appUser.keycloakId, claims.subject))
      .limit(1)
    const [invited] = linked
      ? [linked]
      : await tx
          .select()
          .from(appUser)
          .where(and(eq(appUser.email, claims.email), isNull(appUser.keycloakId)))
          .limit(1)
    if (!invited) {
      throw new LoginError('not_registered', 'This account has not been given access to DUATF.')
    }
    if (invited.status === 'disabled') {
      throw new LoginError('disabled', 'This account has been disabled.')
    }
    await tx
      .update(appUser)
      .set({ keycloakId: claims.subject, status: 'active', lastLoginAt: new Date() })
      .where(eq(appUser.id, invited.id))
    await appendAudit(tx, {
      actorUserId: invited.id,
      tenantId: null,
      action: 'auth.sign_in',
      entity: 'app_user',
      entityId: invited.id,
    })
    return { userId: invited.id, email: invited.email, displayName: invited.displayName }
  })
