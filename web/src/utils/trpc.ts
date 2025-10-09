import { createTRPCReact } from "@trpc/react-query"
import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../api/src"

export const trpc = createTRPCReact<AppRouter>()
export const { TRPCProvider, useTRPC, useTRPCClient } = createTRPCContext<AppRouter>()