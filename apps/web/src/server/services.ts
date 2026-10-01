import { AccessDeniedError, CAPABILITIES, CAPABILITY_LABEL, ROLE_LABEL } from '@duatf/core-access'
import {
  keycloakProvisioner,
  objectEvidenceStorage,
  type EvidenceStorage,
  NotFoundError,
  RuleError,
  ValidationError,
  type ServiceContext,
} from '@duatf/feature-compliance-api'
import {
  clientCredentials,
  createKeycloakAdmin,
  type KeycloakAdmin,
} from '@duatf/platform-identity'
import { createObjectStore } from '@duatf/platform-storage'
import { requireSession, type Session } from './auth'
import type { FormState } from '@/lib/formState'
import { database, env } from './runtime'

export type { FormState } from '@/lib/formState'

declare global {
  var duatfKeycloakAdmin: KeycloakAdmin | undefined
  var duatfEvidenceStorage: EvidenceStorage | undefined
}

const evidenceStorage = (): EvidenceStorage => {
  if (!globalThis.duatfEvidenceStorage) {
    const settings = env()
    globalThis.duatfEvidenceStorage = objectEvidenceStorage(
      createObjectStore(settings, settings.S3_BUCKET_EVIDENCE),
    )
  }
  return globalThis.duatfEvidenceStorage
}

const keycloakAdmin = (): KeycloakAdmin => {
  if (!globalThis.duatfKeycloakAdmin) {
    const settings = env()
    globalThis.duatfKeycloakAdmin = createKeycloakAdmin(
      settings.KEYCLOAK_URL,
      clientCredentials(
        settings.KEYCLOAK_URL,
        settings.KEYCLOAK_REALM,
        settings.KEYCLOAK_ADMIN_CLIENT_ID,
        settings.KEYCLOAK_ADMIN_CLIENT_SECRET,
      ),
    )
  }
  return globalThis.duatfKeycloakAdmin
}

/** The signed-in user's service context; redirects to sign-in when there is no session. */
export const serviceContext = async (): Promise<ServiceContext & { session: Session }> => {
  const session = await requireSession()
  return {
    session,
    db: database().db,
    principal: session.principal,
    provisioner: keycloakProvisioner(keycloakAdmin(), env().KEYCLOAK_REALM),
    storage: evidenceStorage(),
  }
}

/** Text fields of a submission (internal $ACTION fields left out). */
export const formValues = (formData: FormData): Record<string, string> => {
  const values: Record<string, string> = {}
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string' && !key.startsWith('$')) values[key] = value
  }
  return values
}

/** Turns expected service errors into form feedback; anything else is a real failure. */
export const failure = (error: unknown, values?: Record<string, string>): FormState => {
  if (error instanceof ValidationError) {
    return { status: 'error', message: error.message, fieldErrors: error.fieldErrors, values }
  }
  if (error instanceof AccessDeniedError) {
    const allowed = CAPABILITIES[error.capability].roles.map((role) => ROLE_LABEL[role])
    return {
      status: 'error',
      message: `You don't have permission to ${CAPABILITY_LABEL[error.capability]}. This is done by: ${allowed.join(', ')}.`,
      values,
    }
  }
  if (error instanceof RuleError || error instanceof NotFoundError) {
    return { status: 'error', message: error.message, values }
  }
  console.error('Unexpected error in a form action', error)
  return {
    status: 'error',
    message: 'Something went wrong on the server. Nothing was saved. Please try again.',
    values,
  }
}
