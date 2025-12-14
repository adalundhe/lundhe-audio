"use client"

import { createContext, useState } from "react"
import { createCartStore, type CartStoreApi } from "~/lib/stores/shopping-cart"
import { PricingData } from "~/server/db/types"


type CartStoreProviderProps = React.PropsWithChildren<{pricingData: PricingData}>

// Create context for the store
export const CartStoreContext = createContext<CartStoreApi | null>(null)


// Provider component that creates and provides the store
export function CartStoreProvider({ children, pricingData }: CartStoreProviderProps) {
  const [store] = useState(() => createCartStore(pricingData))

  return <CartStoreContext.Provider value={store}>{children}</CartStoreContext.Provider>
}
