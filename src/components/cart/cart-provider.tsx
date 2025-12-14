"use client"

import { useUser } from "@clerk/nextjs"
import { createContext, useState } from "react"
import { string } from "zod"
import { CartInitData, createCartStore, type CartStoreApi } from "~/lib/stores/shopping-cart"
import { PricingData } from "~/server/db/types"


type CartStoreProviderProps = React.PropsWithChildren<{pricingData: PricingData, initData?: CartInitData}>

// Create context for the store
export const CartStoreContext = createContext<CartStoreApi | null>(null)


// Provider component that creates and provides the store
export function CartStoreProvider({ children, pricingData , initData }: CartStoreProviderProps) {

  const [store] = useState(() => createCartStore(pricingData, initData))
  

  return <CartStoreContext.Provider value={store}>{children}</CartStoreContext.Provider>
}
