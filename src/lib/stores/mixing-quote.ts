import { createStore } from "zustand"
import { buildQuoteDataFromDb } from "~/lib/mixing/pricing-calculator"
import type { PricingData, Song, AddOns, DeliveryOptions, QuoteData } from "~/lib/mixing/pricing-types"
import { persist, createJSONStorage } from "zustand/middleware"

// Store state interface
interface MixingStoreState {
  // Pricing data from server
  pricingData: PricingData

  // Current step
  currentStep: number

  // Songs
  songs: Song[]

  // Add-ons
  addOns: AddOns

  // Delivery options
  deliveryOptions: DeliveryOptions

  // Computed quote data
  quoteData: QuoteData
  steps: MixingCalculatorSteps[]
}

// Store actions interface
interface MixingStoreActions {
  // Initialize store with pricing data
  initialize: (pricingData: PricingData) => void

  // Reset store to initial state
  reset: () => void

  // Step navigation
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void

  // Song management
  setSongs: (songs: Song[] | ((prev: Song[]) => Song[])) => void
  addSong: () => void
  removeSong: (songId: string) => void
  updateSong: (songId: string, field: keyof Song, value: string | number) => void

  // Add-ons management
  setAddOns: (addOns: AddOns | ((prev: AddOns) => AddOns)) => void
  toggleSongAddOn: (
    addOnType: "vocalProductionSongs" | "drumReplacementSongs" | "guitarReampSongs",
    songId: string,
  ) => void
  setVirtualSessionHours: (hours: number) => void
  setAdditionalRevisions: (revisions: number) => void
  setPricingData: (pricingData: PricingData) => void

  // Delivery options management
  setDeliveryOptions: (options: DeliveryOptions | ((prev: DeliveryOptions) => DeliveryOptions)) => void
  toggleSongDeliveryOption: (optionType: keyof DeliveryOptions, songId: string) => void

  // Quote calculation
  recalculateQuote: () => void
}

export type MixingStore = ReturnType<typeof createMixingCalculator>
export type MixingQuoteData = MixingStoreState & MixingStoreActions

export type MixingCalculatorSteps = "Project Size" | "Add Ons" | "Delivery" | "Summary"


export const createMixingCalculator = (pricingData: PricingData) => createStore<MixingStoreState & MixingStoreActions>()(persist(
    (set, get) => {

        const initialSongs: Song[] = [{ id: crypto.randomUUID(), title: "", tracks: 1, minutes: 3, seconds: 30 }]

        const initialAddOns: AddOns = {
            vocalProductionSongs: [],
            drumReplacementSongs: [],
            guitarReampSongs: [],
            virtualSessionHours: 0,
            revisions: 0,
        }

        const initialDeliveryOptions: DeliveryOptions = {
            highResMixdownSongs: [],
            filmMixdownSongs: [],
            mixedStemsSongs: [],
            extendedArchivalSongs: [],
            rushDeliverySongs: [],
        }

        return ({
            // Initial state
            pricingData: pricingData,
            currentStep: 0,
            songs: initialSongs,
            addOns: initialAddOns,
            deliveryOptions: initialDeliveryOptions,
            steps: ["Project Size", "Add Ons", "Delivery", "Summary"],
            quoteData: buildQuoteDataFromDb(pricingData, initialSongs, initialAddOns, initialDeliveryOptions),

            // Initialize store with pricing data
            initialize: (pricingData: PricingData) => {
                set({ pricingData })
                get().recalculateQuote()
            },

            // Reset store to initial state
            reset: () => {
                set((state) => ({
                    pricingData: state.pricingData,
                    currentStep: 0,
                    songs: initialSongs,
                    addOns: { ...initialAddOns },
                    deliveryOptions: { ...initialDeliveryOptions },
                    quoteData: buildQuoteDataFromDb(state.pricingData, initialSongs, initialAddOns, initialDeliveryOptions),
                }))
                get().recalculateQuote()
            },

            // Step navigation
            setCurrentStep: (step: number) => {
                if (step >= 0 && step < get().steps.length) {
                set({ currentStep: step })
                }
            },

            nextStep: () => {
                const { currentStep, steps } = get()
                if (currentStep < steps.length - 1) {
                set({ currentStep: currentStep + 1 })
                }
            },

            previousStep: () => {
                const { currentStep } = get()
                set({ currentStep: Math.max(currentStep - 1, 0) })
            },

            // Song management
            setSongs: (songsOrUpdater) => {
                set((state) => {
                const newSongs = typeof songsOrUpdater === "function" ? songsOrUpdater(state.songs) : songsOrUpdater
                return { songs: newSongs }
                })
                get().recalculateQuote()
            },

            addSong: () => {
                const newSong: Song = {
                id: crypto.randomUUID(),
                title: "",
                tracks: 1,
                minutes: 3,
                seconds: 30,
                }
                set((state) => ({ songs: [...state.songs, newSong] }))
                get().recalculateQuote()
            },

            removeSong: (songId: string) => {
                set((state) => {
                const newSongs = state.songs.filter((s) => s.id !== songId)
                // Also remove from add-ons and delivery options
                const newAddOns = {
                    ...state.addOns,
                    vocalProductionSongs: state.addOns.vocalProductionSongs.filter((id) => id !== songId),
                    drumReplacementSongs: state.addOns.drumReplacementSongs.filter((id) => id !== songId),
                    guitarReampSongs: state.addOns.guitarReampSongs.filter((id) => id !== songId),
                }
                const newDeliveryOptions = {
                    highResMixdownSongs: state.deliveryOptions.highResMixdownSongs.filter((id) => id !== songId),
                    filmMixdownSongs: state.deliveryOptions.filmMixdownSongs.filter((id) => id !== songId),
                    mixedStemsSongs: state.deliveryOptions.mixedStemsSongs.filter((id) => id !== songId),
                    extendedArchivalSongs: state.deliveryOptions.extendedArchivalSongs.filter((id) => id !== songId),
                    rushDeliverySongs: state.deliveryOptions.rushDeliverySongs.filter((id) => id !== songId),
                }
                return { songs: newSongs, addOns: newAddOns, deliveryOptions: newDeliveryOptions }
                })
                get().recalculateQuote()
            },

            updateSong: (songId: string, field: keyof Song, value: string | number) => {
                set((state) => ({
                songs: state.songs.map((song) => (song.id === songId ? { ...song, [field]: value } : song)),
                }))
                get().recalculateQuote()
            },

            // Add-ons management
            setAddOns: (addOnsOrUpdater) => {
                set((state) => {
                const newAddOns = typeof addOnsOrUpdater === "function" ? addOnsOrUpdater(state.addOns) : addOnsOrUpdater
                return { addOns: newAddOns }
                })
                get().recalculateQuote()
            },

            toggleSongAddOn: (addOnType, songId) => {
                set((state) => {
                const currentList = state.addOns[addOnType]
                const newList = currentList.includes(songId)
                    ? currentList.filter((id) => id !== songId)
                    : [...currentList, songId]
                return {
                    addOns: {
                    ...state.addOns,
                    [addOnType]: newList,
                    },
                }
                })
                get().recalculateQuote()
            },

            setPricingData: (pricingData: PricingData) => set((state) => ({ 
                pricingData,
                quoteData: buildQuoteDataFromDb(pricingData, state.songs, state.addOns, state.deliveryOptions)
            })),

            setVirtualSessionHours: (hours: number) => {
                set((state) => ({
                addOns: { ...state.addOns, virtualSessionHours: hours },
                }))
                get().recalculateQuote()
            },

            setAdditionalRevisions: (revisions: number) => {
                set((state) => ({
                addOns: { ...state.addOns, additionalRevisions: revisions },
                }))
                get().recalculateQuote()
            },

            // Delivery options management
            setDeliveryOptions: (optionsOrUpdater) => {
                set((state) => {
                const newOptions =
                    typeof optionsOrUpdater === "function" ? optionsOrUpdater(state.deliveryOptions) : optionsOrUpdater
                return { deliveryOptions: newOptions }
                })
                get().recalculateQuote()
            },

            toggleSongDeliveryOption: (optionType, songId) => {
                set((state) => {
                const currentList = state.deliveryOptions[optionType]
                const newList = currentList.includes(songId)
                    ? currentList.filter((id) => id !== songId)
                    : [...currentList, songId]
                return {
                    deliveryOptions: {
                    ...state.deliveryOptions,
                    [optionType]: newList,
                    },
                }
                })
                get().recalculateQuote()
            },

            // Quote calculation
            recalculateQuote: () => {
                const { pricingData, songs, addOns, deliveryOptions } = get()
                if (!pricingData) return

                const quoteData = buildQuoteDataFromDb(pricingData, songs, addOns, deliveryOptions)
                set({ quoteData })
            },
            })
    },
    {
        name: "mixing-quote-storage",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
            currentStep: state.currentStep,
            songs: state.songs,
            addOns: state.addOns,
            deliveryOptions: state.deliveryOptions,
        }),
        onRehydrateStorage: () => (state) => {
            if (state) {
            state.recalculateQuote()
            }
        },
    },
))
