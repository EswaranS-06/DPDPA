import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from 'node:crypto'

// Passwords are stored as scrypt$N$r$p$salt$hash (salt and hash in base64url), so the cost can be
// raised later without breaking existing hashes.

const scrypt = (password: string, salt: Buffer, length: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, length, options, (error, key) =>
      error ? reject(error) : resolve(key),
    )
  })

const COST = { N: 2 ** 15, r: 8, p: 1 } as const
const KEY_LENGTH = 64
const MAX_MEMORY = 64 * 1024 * 1024

export const MIN_PASSWORD_LENGTH = 12

/** Hashes a password with a fresh random salt. */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16)
  const key = await scrypt(password, salt, KEY_LENGTH, { ...COST, maxmem: MAX_MEMORY })
  return ['scrypt', COST.N, COST.r, COST.p, salt.toString('base64url'), key.toString('base64url')]
    .map(String)
    .join('$')
}

/** True when the password matches the stored hash (compared in constant time). */
export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [scheme, n, r, p, salt, hash] = stored.split('$')
  if (scheme !== 'scrypt' || !n || !r || !p || !salt || !hash) return false
  const expected = Buffer.from(hash, 'base64url')
  const key = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: MAX_MEMORY,
  })
  return key.length === expected.length && timingSafeEqual(key, expected)
}

let decoy: Promise<string> | undefined

/** A hash of a random password, checked when the username is unknown so timing gives nothing away. */
export const decoyHash = (): Promise<string> =>
  (decoy ??= hashPassword(randomBytes(18).toString('base64url')))

/** Problems with a new password, or null when it is acceptable. */
export const passwordProblem = (password: string, username: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
  }
  if (password.length > 200) return 'Use at most 200 characters.'
  if (password.toLowerCase().includes(username.toLowerCase())) {
    return 'Do not include your username.'
  }
  if (new Set(password).size < 5) return 'Use a less repetitive password.'
  return null
}

/** A one-time password for first sign-in: 20 characters from an unambiguous alphabet. */
export const generateOneTimePassword = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  // Bytes at or above the largest multiple of the alphabet size are skipped, so every
  // character is equally likely.
  const limit = 256 - (256 % alphabet.length)
  let result = ''
  while (result.length < 20) {
    for (const byte of randomBytes(32)) {
      if (byte < limit && result.length < 20) result += alphabet[byte % alphabet.length]
    }
  }
  return result
}
