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
})

export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  HOST: z.string().default('0.0.0.0'),
})

export const seedEnvSchema = z.object({
  SEED_VAULT_PATH: z.string().default('seed/DPDP-DUATF-Vault'),
})

export const apiEnvSchema = serverEnvSchema
  .extend({ API_PORT: port.default(54000) })
  .extend(appDatabaseEnvSchema.shape)
  .extend(redisEnvSchema.shape)
  .extend(storageEnvSchema.shape)

export const webEnvSchema = serverEnvSchema
  .extend({ WEB_PORT: port.default(53000) })
  .extend(appDatabaseEnvSchema.shape)

export type StorageEnv = z.infer<typeof storageEnvSchema>
export type ApiEnv = z.infer<typeof apiEnvSchema>
export type WebEnv = z.infer<typeof webEnvSchema>
