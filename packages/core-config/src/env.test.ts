import { describe, expect, it } from 'vitest'
import { EnvError, parseEnv } from './env'
import { apiEnvSchema } from './schemas'

const valid = {
  APP_DATABASE_URL: 'postgres://app:secret@127.0.0.1:55432/duatf',
  REDIS_URL: 'redis://:secret@127.0.0.1:56379/0',
  S3_ENDPOINT: 'http://127.0.0.1:59000',
  S3_ACCESS_KEY: 'duatf',
  S3_SECRET_KEY: 'secret-secret',
  S3_BUCKET_EVIDENCE: 'duatf-evidence',
  S3_BUCKET_REPORTS: 'duatf-reports',
}

describe('environment validation', () => {
  it('applies defaults for host and port', () => {
    const env = parseEnv(apiEnvSchema, valid)
    expect(env.HOST).toBe('0.0.0.0')
    expect(env.API_PORT).toBe(54000)
  })

  it('TC-C1.1-01 names every missing or invalid variable', () => {
    const broken = { ...valid, APP_DATABASE_URL: 'mysql://nope', API_PORT: '99999' }
    delete (broken as Partial<typeof valid>).REDIS_URL
    let error: unknown
    try {
      parseEnv(apiEnvSchema, broken)
    } catch (caught) {
      error = caught
    }
    expect(error).toBeInstanceOf(EnvError)
    expect((error as EnvError).variables.sort()).toEqual([
      'API_PORT',
      'APP_DATABASE_URL',
      'REDIS_URL',
    ])
    expect((error as EnvError).message).toContain('APP_DATABASE_URL')
  })
})
