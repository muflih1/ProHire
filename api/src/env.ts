type Envirorment = {
  NODE_ENV: 'production' | 'development'
  PORT: string
  DATABASE_URL: string
  SESSION_SECRET: string
  HASHIDS_SALT: string
}

export function getEnv<Key extends keyof Envirorment>(key: Key, fallback?: Envirorment[Key]): Envirorment[Key] {
  const value = process.env[key] as Envirorment[Key] | undefined
  if (value === undefined) {
    if (fallback !== undefined) return fallback
    throw new Error('Missing envirorment variable ' + key)
  }
  return value
}