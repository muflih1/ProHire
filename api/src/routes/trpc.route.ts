import { Router } from "express";
import * as trpcExpress from "@trpc/server/adapters/express";
import { appRouter } from "../trpc/routers/index.js";
import { createContext } from "../trpc/context.js";

const router: Router = Router()

router.use(trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext
}))

export default router