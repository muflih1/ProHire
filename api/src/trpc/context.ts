import type { CreateExpressContextOptions } from "@trpc/server/adapters/express"

export async function createContext({ req }: CreateExpressContextOptions) {
  return {
    session: req.session
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>