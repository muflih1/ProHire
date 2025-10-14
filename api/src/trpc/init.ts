import { initTRPC } from "@trpc/server";
import type { Context } from "./context.js";
import superjson from "superjson"

export const t = initTRPC.context<Context>().create({transformer: superjson})