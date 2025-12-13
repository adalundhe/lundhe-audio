"use client"
import { useState, createContext } from "react"
import { MasteringPricingData } from "~/lib/mastering/pricing-types"
import { createMasteringStore, MasteringStore } from "~/lib/stores/mastering-quote"

type MasteringProviderProps = React.PropsWithChildren<{pricingData: MasteringPricingData}>


export const MasteringQuoteContext = createContext<MasteringStore | null>(null)

export function MasteringQuoteProvider({ children, ...props }: MasteringProviderProps) {
  const [store] = useState(() => createMasteringStore(props.pricingData))


    return (
        <MasteringQuoteContext.Provider value={store}>
            {children}
        </MasteringQuoteContext.Provider>
    )
}