"use client"

import { createContext, useState } from "react"
import { createCartStore, type CartStoreApi } from "~/lib/stores/shopping-cart"
import { Discount } from "~/server/db/types"


type CartStoreProviderProps = React.PropsWithChildren<{discountData: Discount[]}>

// Create context for the store
export const CartStoreContext = createContext<CartStoreApi | null>(null)


// Provider component that creates and provides the store
export function CartStoreProvider({ children, discountData }: CartStoreProviderProps) {
  const [store] = useState(() => createCartStore(discountData))

  return <CartStoreContext.Provider value={store}>{children}</CartStoreContext.Provider>
}
