// Creates the evidence and report buckets this instance is configured for: pnpm storage:setup
import { loadRootEnvFile, parseEnv, storageEnvSchema } from '@duatf/core-config'
import { createObjectStore } from '../objectStore'

loadRootEnvFile()
const env = parseEnv(storageEnvSchema)
for (const bucket of [env.S3_BUCKET_EVIDENCE, env.S3_BUCKET_REPORTS]) {
  const created = await createObjectStore(env, bucket).ensureBucket()
  console.log(`Bucket ${bucket} ${created ? 'created' : 'already exists'}.`)
}
