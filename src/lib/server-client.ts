import "server-only"
import { createCaller } from "../server/api/root"
import { createTRPCContext } from "../server/api/trpc"
import { cache } from "react"

const createContext = cache(() => {
  return createTRPCContext({
    req: {}
  })
})

export const api = cache(async () => {
  const ctx = await createContext()
  return createCaller(ctx)
})