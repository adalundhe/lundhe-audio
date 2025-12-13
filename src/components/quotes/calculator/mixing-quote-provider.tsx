"use client"
import { useState, createContext } from "react"
import { PricingData } from "~/lib/mixing/pricing-types"
import { createMixingCalculator, MixingStore } from "~/lib/stores/mixing-quote"

type MixingProviderProps = React.PropsWithChildren<{pricingData: PricingData}>


export const MixingQuoteContext = createContext<MixingStore | null>(null)

export function MixingQuoteProvider({ children, ...props }: MixingProviderProps) {
  const [store] = useState(() => createMixingCalculator(props.pricingData))


    return (
        <MixingQuoteContext.Provider value={store}>
            {children}
        </MixingQuoteContext.Provider>
    )
}