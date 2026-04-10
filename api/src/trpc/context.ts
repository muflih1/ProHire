import type { CreateExpressContextOptions } from "@trpc/server/adapters/express"
import { db } from "../db/index.js"

export async function createContext({ req }: CreateExpressContextOptions) {
  return {
    session: req.session,
    db
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>