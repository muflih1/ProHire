import { z } from "zod"

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development']).optional(),
  PORT: z.string().optional(),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().nonempty(),
  HASHIDS_SALT: z.string().nonempty(),
  CLOUDFLARE_ACCOUNT_ID: z.string().nonempty(),
  R2_TOKEN_VALUE: z.string().nonempty(),
  R2_ACCESS_KEY_ID: z.string().nonempty(),
  R2_SECRET_ACCESS_KEY: z.string().nonempty(),
  R2_BUCKET_NAME: z.string().nonempty(),
  R2_ENDPOINT: z.string().nonempty(),
})

export type Environment = z.infer<typeof schema>

const {success, data, error} = schema.safeParse(process.env)

if (!success) {
  console.error('Invalid environment variables:', error.format())
  throw new Error('Invalid environment variables')
}

export const env = data

export function getEnv<Key extends keyof Environment>(key: Key, fallback?: Environment[Key]): Environment[Key] {
  const value = env[key]
  if (value === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error('Missing environment variable ' + key)
  }
  return value
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Environment { }
  }
}