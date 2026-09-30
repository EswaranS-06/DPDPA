import { z } from 'zod'

const postgresUrl = z
  .string()
  .regex(/^postgres(ql)?:\/\/.+/, 'must be a postgres:// connection URL')

const port = z.coerce.number().int().min(1).max(65535)

export const databaseEnvSchema = z.object({ DATABASE_URL: postgresUrl })
export const appDatabaseEnvSchema = z.object({ APP_DATABASE_URL: postgresUrl })
export const testDatabaseEnvSchema = z.object({
  TEST_DATABASE_URL: postgresUrl,
  TEST_APP_DATABASE_URL: postgresUrl,
})

export const redisEnvSchema = z.object({
  REDIS_URL: z.string().regex(/^rediss?:\/\/.+/, 'must be a redis:// URL'),
})

export const storageEnvSchema = z.object({
  S3_ENDPOINT: z.url(),
  S3_ACCESS_KEY: z.string().min(3),
  S3_SECRET_KEY: z.string().min(8),
  S3_BUCKET_EVIDENCE: z.string().min(3),
  S3_BUCKET_REPORTS: z.string().min(3),
  /** Address of the object store as other machines see it; used in download links. */
  S3_PUBLIC_ENDPOINT: z.url().optional(),
})

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
})

export const seedEnvSchema = z.object({
  SEED_VAULT_PATH: z.string().default('seed/DPDP-DUATF-Vault'),
})

const httpUrl = z
  .url()
  .regex(/^https?:\/\//, 'must be an http(s) URL')
  .transform((value) => value.replace(/\/+$/, ''))

/** Signing in through Keycloak (OpenID Connect) and keeping server-side sessions. */
export const authEnvSchema = z.object({
  PUBLIC_WEB_URL: httpUrl,
  OIDC_ISSUER: httpUrl,
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(16),
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(72).default(12),
})

/** The service account the application uses to create client users in Keycloak. */
export const keycloakAdminEnvSchema = z.object({
  KEYCLOAK_URL: httpUrl,
  KEYCLOAK_REALM: z.string().min(1),
  KEYCLOAK_ADMIN_CLIENT_ID: z.string().min(1),
  KEYCLOAK_ADMIN_CLIENT_SECRET: z.string().min(16),
})

/** Master-realm administrator; used only by the realm setup and bootstrap tools. */
export const keycloakSetupEnvSchema = keycloakAdminEnvSchema.extend({
  PUBLIC_KEYCLOAK_URL: httpUrl,
  KEYCLOAK_MASTER_USER: z.string().min(1),
  KEYCLOAK_MASTER_PASSWORD: z.string().min(8),
  PUBLIC_WEB_URL: httpUrl,
  OIDC_CLIENT_ID: z.string().min(1),
  OIDC_CLIENT_SECRET: z.string().min(16),
})

export const apiEnvSchema = serverEnvSchema
  .extend({ API_PORT: port.default(54000) })
  .extend(appDatabaseEnvSchema.shape)
  .extend(redisEnvSchema.shape)
  .extend(storageEnvSchema.shape)

export const webEnvSchema = serverEnvSchema
  .extend({ WEB_PORT: port.default(53000) })
  .extend(appDatabaseEnvSchema.shape)
  .extend(authEnvSchema.shape)
  .extend(keycloakAdminEnvSchema.shape)
  .extend(storageEnvSchema.shape)

export type StorageEnv = z.infer<typeof storageEnvSchema>
export type AuthEnv = z.infer<typeof authEnvSchema>
export type KeycloakAdminEnv = z.infer<typeof keycloakAdminEnvSchema>
export type KeycloakSetupEnv = z.infer<typeof keycloakSetupEnvSchema>
export type ApiEnv = z.infer<typeof apiEnvSchema>
export type WebEnv = z.infer<typeof webEnvSchema>
