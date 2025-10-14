import { z } from "zod"

const schema = z.object({
  NODE_ENV: z.enum(['production', 'development']).optional(),
  PORT: z.string().optional(),
  DATABASE_URL: z.url(),
  SESSION_SECRET: z.string().nonempty(),
  HASHIDS_SALT: z.string().nonempty()
})

export type Environment = z.infer<typeof schema>

const parsedEnv = schema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format())
  throw new Error('Invalid environment variables')
}

export const env = parsedEnv.data

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