import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createServerSideHelpers } from "@trpc/react-query/server"
import { AppRouter } from "../../../api/src";
import superjson from "superjson"

export function createTRPCSSRHelpers(req: any) {
  const client = createTRPCClient<AppRouter>({
    links: [httpBatchLink({
      url: 'http://localhost:3000/api/trpc',
      headers: {
        cookie: req.headers.cookie ?? ''
      },
      fetch: (url, options) => fetch(url, { ...options, credentials: 'include', mode: 'cors' }),
      transformer: superjson
    })]
  })

  return createServerSideHelpers({
    client,
  })
}

export const isServer = typeof window === 'undefined'