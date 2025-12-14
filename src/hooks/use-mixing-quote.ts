import { useContext } from "react"
import { MixingQuoteData } from "~/lib/stores/mixing-quote"
import { MixingQuoteContext } from "~/components/quotes/mixing-calculator/mixing-quote-provider"
import { useStore } from "zustand"
import { useShallow } from "zustand/react/shallow"


export function useMixingQuote<T>(selector: (state: MixingQuoteData) => T): T {
  const store = useContext(MixingQuoteContext)
  if (!store) throw new Error('Missing BearContext.Provider in the tree')
  return useStore(store, selector)
}


// Selector hooks for optimized re-renders
export const useMixingCurrentStep = () => useMixingQuote(useShallow((state) => ({
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
})))
export const useMixingSongs = () => useMixingQuote(useShallow((state) => ({
    songs: state.songs,
    setSongs: state.setSongs,
})))
export const useMixingAddOns = () => useMixingQuote(useShallow((state) => ({
    addOns: state.addOns,
    setAddOns: state.setAddOns,
})))


export const useMixingDeliveryOptions = () => useMixingQuote(useShallow((state) => ({
    deliveryOptions: state.deliveryOptions,
    setDeliveryOptions: state.setDeliveryOptions
})))
export const useMixingQuoteData = () => useMixingQuote(useShallow((state) => ({
    quoteData: state.quoteData 
})))
export const useMixingPricingData = () => useMixingQuote(useShallow((state) => ({
    pricingData: state.pricingData,
    setPricingData: state.setPricingData
})))

