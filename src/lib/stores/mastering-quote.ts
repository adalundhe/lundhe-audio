import { createStore } from "zustand"
import { persist } from "zustand/middleware"
import type { 
    MasteringPricingData,
    MasteringQuoteData,
    MasteringAddOns,
    MasteringSong,
    MasteringDeliveryOptions,
} from "~/lib/mastering/pricing-types"
import {
  buildMasteringQuoteData,
} from "~/lib/mastering/mastering-pricing-calculator"

export type MasteringSteps = "Project Size" | "Add Ons" | "Delivery" | "Summary"
// State types
export interface MasteringState {
  // Pricing data from server
  pricingData: MasteringPricingData

  // Current step
  currentStep: number

  // Songs
  songs: MasteringSong[]

  // Add-ons
  addOns: MasteringAddOns

  // Delivery options
  deliveryOptions: MasteringDeliveryOptions

  // Computed quote data
  quoteData: MasteringQuoteData
  steps: MasteringSteps[]
}

// Action types
export interface MasteringActions {
  // Navigation
  setCurrentStep: (step: number) => void
  nextStep: () => void
  previousStep: () => void

  // Song management
  setSongs: (songs: MasteringSong[]) => void
  addSong: () => void
  removeSong: (songId: string) => void
  updateSong: (songId: string, field: keyof MasteringSong, value: string | number) => void

  // Add-ons management
  setAddOns: (addOns: MasteringAddOns) => void
  toggleVinylMastering: (songId: string) => void
  toggleStreamingMastering: (songId: string) => void
  toggleRedbookMastering: (songId: string) => void
  toggleStemMastering: (songId: string, stemCount?: number) => void
  updateStemCount: (songId: string, stemCount: number) => void
  toggleRestorationRemastering: (songId: string) => void
  setVirtualSessionHours: (hours: number) => void

  // Delivery options management
  setDeliveryOptions: (options: MasteringDeliveryOptions) => void
  toggleHighResMaster: (songId: string) => void
  toggleDdpImage: (songId: string) => void
  toggleIsrcEncoding: (songId: string) => void
  toggleRushDelivery: (songId: string) => void

  // Recalculate quote
  recalculateQuote: () => void

  // Reset
  reset: () => void
}

export type MasteringQuote = MasteringState & MasteringActions
export type MasteringStore = ReturnType<typeof createMasteringStore>



// Helper to toggle song in array
function toggleSongInArray(array: string[], songId: string): string[] {
  return array.includes(songId) ? array.filter((id) => id !== songId) : [...array, songId]
}

// Helper to clean up references when a song is removed
function cleanupSongReferences(
  songId: string,
  addOns: MasteringAddOns,
  deliveryOptions: MasteringDeliveryOptions,
): { addOns: MasteringAddOns; deliveryOptions: MasteringDeliveryOptions } {
  const newStemMasteringSongs = { ...addOns.stemMasteringSongs }
  delete newStemMasteringSongs[songId]

  return {
    addOns: {
      ...addOns,
      vinylMasteringSongs: addOns.vinylMasteringSongs.filter((id) => id !== songId),
      streamingMasteringSongs: addOns.streamingMasteringSongs.filter((id) => id !== songId),
      redbookMasteringSongs: addOns.redbookMasteringSongs.filter((id) => id !== songId),
      stemMasteringSongs: newStemMasteringSongs,
      restorationRemasteringSongs: addOns.restorationRemasteringSongs.filter((id) => id !== songId),
    },
    deliveryOptions: {
      ...deliveryOptions,
      highResMasterSongs: deliveryOptions.highResMasterSongs.filter((id) => id !== songId),
      ddpImageSongs: deliveryOptions.ddpImageSongs.filter((id) => id !== songId),
      isrcEncodingSongs: deliveryOptions.isrcEncodingSongs.filter((id) => id !== songId),
      rushDeliverySongs: deliveryOptions.rushDeliverySongs.filter((id) => id !== songId),
    },
  }
}

// Create store factory
export const createMasteringStore = (pricingData: MasteringPricingData) => {
    const initialSongs: MasteringSong[] = [{
        id: crypto.randomUUID(),
        title: "",
        minutes: 3,
        seconds: 30,
    }]

    const initialAddOns: MasteringAddOns = {
        vinylMasteringSongs: [],
        streamingMasteringSongs: [],
        redbookMasteringSongs: [],
        stemMasteringSongs: {},
        restorationRemasteringSongs: [],
        virtualSessionHours: 0,
        revisions: 0
    }

    const initialDeliveryOptions: MasteringDeliveryOptions = {
        highResMasterSongs: [],
        ddpImageSongs: [],
        isrcEncodingSongs: [],
        rushDeliverySongs: [],
    }


    return createStore<MasteringQuote>()(persist(
        (set, get) => ({
            songs: initialSongs,
            addOns: initialAddOns,
            deliveryOptions: initialDeliveryOptions,
            currentStep: 0,
            steps: ["Project Size", "Add Ons", "Delivery", "Summary"],
            quoteData: buildMasteringQuoteData(pricingData, initialSongs, initialAddOns, initialDeliveryOptions),
            pricingData,

            // Navigation
            setCurrentStep: (step) => set({ currentStep: step }),

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
            setSongs: (songs) => {
            set({ songs })
            get().recalculateQuote()
            },

            addSong: () => {
            const { songs } = get()
            const newSong: MasteringSong = {
                id: crypto.randomUUID(),
                title: "",
                minutes: 3,
                seconds: 30,
            }
            set({ songs: [...songs, newSong] })
            get().recalculateQuote()
            },

            removeSong: (songId) => {
            const { songs, addOns, deliveryOptions } = get()
            if (songs.length <= 1) return

            const newSongs = songs.filter((s) => s.id !== songId)
            const cleaned = cleanupSongReferences(songId, addOns, deliveryOptions)

            set({
                songs: newSongs,
                addOns: cleaned.addOns,
                deliveryOptions: cleaned.deliveryOptions,
            })
            get().recalculateQuote()
            },

            updateSong: (songId, field, value) => {
            const { songs } = get()
            const newSongs = songs.map((song) => (song.id === songId ? { ...song, [field]: value } : song))
            set({ songs: newSongs })
            get().recalculateQuote()
            },

            // Add-ons management
            setAddOns: (addOns) => {
            set({ addOns })
            get().recalculateQuote()
            },

            toggleVinylMastering: (songId) => {
            const { addOns } = get()
            set({
                addOns: {
                ...addOns,
                vinylMasteringSongs: toggleSongInArray(addOns.vinylMasteringSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            toggleStreamingMastering: (songId) => {
            const { addOns } = get()
            set({
                addOns: {
                ...addOns,
                streamingMasteringSongs: toggleSongInArray(addOns.streamingMasteringSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            toggleRedbookMastering: (songId) => {
            const { addOns } = get()
            set({
                addOns: {
                ...addOns,
                redbookMasteringSongs: toggleSongInArray(addOns.redbookMasteringSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            toggleStemMastering: (songId, stemCount = 2) => {
            const { addOns } = get()
            const newStemMasteringSongs = { ...addOns.stemMasteringSongs }

            if (songId in newStemMasteringSongs) {
                delete newStemMasteringSongs[songId]
            } else {
                newStemMasteringSongs[songId] = stemCount
            }

            set({
                addOns: {
                ...addOns,
                stemMasteringSongs: newStemMasteringSongs,
                },
            })
            get().recalculateQuote()
            },

            updateStemCount: (songId, stemCount) => {
            const { addOns } = get()
            if (!(songId in addOns.stemMasteringSongs)) return

            set({
                addOns: {
                ...addOns,
                stemMasteringSongs: {
                    ...addOns.stemMasteringSongs,
                    [songId]: stemCount,
                },
                },
            })
            get().recalculateQuote()
            },

            toggleRestorationRemastering: (songId) => {
            const { addOns } = get()
            set({
                addOns: {
                ...addOns,
                restorationRemasteringSongs: toggleSongInArray(addOns.restorationRemasteringSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            setVirtualSessionHours: (hours) => {
            const { addOns } = get()
            set({
                addOns: {
                ...addOns,
                virtualSessionHours: hours,
                },
            })
            get().recalculateQuote()
            },

            // Delivery options management
            setDeliveryOptions: (options) => {
            set({ deliveryOptions: options })
            get().recalculateQuote()
            },

            toggleHighResMaster: (songId) => {
            const { deliveryOptions } = get()
            set({
                deliveryOptions: {
                ...deliveryOptions,
                highResMasterSongs: toggleSongInArray(deliveryOptions.highResMasterSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            toggleDdpImage: (songId) => {
            const { deliveryOptions } = get()
            set({
                deliveryOptions: {
                ...deliveryOptions,
                ddpImageSongs: toggleSongInArray(deliveryOptions.ddpImageSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            toggleIsrcEncoding: (songId) => {
            const { deliveryOptions } = get()
            set({
                deliveryOptions: {
                ...deliveryOptions,
                isrcEncodingSongs: toggleSongInArray(deliveryOptions.isrcEncodingSongs, songId),
                },
            })
            get().recalculateQuote()
            },

            toggleRushDelivery: (songId) => {
            const { deliveryOptions } = get()
            set({
                deliveryOptions: {
                ...deliveryOptions,
                rushDeliverySongs: toggleSongInArray(deliveryOptions.rushDeliverySongs, songId),
                },
            })
            get().recalculateQuote()
            },

            // Recalculate quote
            recalculateQuote: () => {
            const { pricingData, songs, addOns, deliveryOptions } = get()
            const quoteData = buildMasteringQuoteData(pricingData, songs, addOns, deliveryOptions)
            set({ quoteData })
            },

            // Reset
            reset: () => {
                set((state) => ({
                    pricingData: state.pricingData,
                    currentStep: 0,
                    songs: initialSongs,
                    addOns: { ...initialAddOns },
                    deliveryOptions: { ...initialDeliveryOptions },
                    quoteData: buildMasteringQuoteData(state.pricingData, initialSongs, initialAddOns, initialDeliveryOptions),
                }))
                get().recalculateQuote()
            },
        }),
        {
            name: "mastering-quote-storage",
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
    ),
  )
}

export type MasteringStoreApi = ReturnType<typeof createMasteringStore>
