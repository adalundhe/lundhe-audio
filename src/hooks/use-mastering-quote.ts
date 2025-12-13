import { useContext } from "react"
import { MasteringQuote } from "~/lib/stores/mastering-quote"
import { MasteringQuoteContext } from "~/components/quotes/mastering-calculator/mastering-quote-provider"
import { useStore } from "zustand"
import { useShallow } from "zustand/react/shallow"


export function useMasteringQuote<T>(selector: (state: MasteringQuote) => T): T {
  const store = useContext(MasteringQuoteContext)
  if (!store) throw new Error('Missing BearContext.Provider in the tree')
  return useStore(store, selector)
}


// Selector hooks for optimized re-renders
export const useMasteringCurrentStep = () => useMasteringQuote(useShallow((state) => ({
    currentStep: state.currentStep,
    setCurrentStep: state.setCurrentStep,
})))
export const useMasteringSongs = () => useMasteringQuote(useShallow((state) => ({
    songs: state.songs,
    setSongs: state.setSongs,
})))
export const useMasteringAddOns = () => useMasteringQuote(useShallow((state) => ({
    addOns: state.addOns,
    setAddOns: state.setAddOns,
})))


export const useMasteringDeliveryOptions = () => useMasteringQuote(useShallow((state) => ({
    deliveryOptions: state.deliveryOptions,
    setDeliveryOptions: state.setDeliveryOptions
})))
export const useMasteringQuoteData = () => useMasteringQuote(useShallow((state) => ({
    quoteData: state.quoteData 
})))
export const useMasteringPricingData = () => useMasteringQuote(useShallow((state) => ({
    pricingData: state.pricingData,
})))

