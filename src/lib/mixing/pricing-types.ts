// Shared types for pricing data
import type { Product, ProductOption, Discount } from "~/server/db/types"


export interface PricingData {
  products: Product[]
  options: ProductOption[]
  discounts: Discount[]
}

export interface Song {
  id: string
  title: string
  tracks: number
  minutes: number
  seconds: number
}

export interface AddOns {
  vocalProductionSongs: string[]
  drumReplacementSongs: string[]
  guitarReampSongs: string[]
  virtualSessionHours: number
  revisions: number
}

export interface DeliveryOptions {
  highResMixdownSongs: string[]
  filmMixdownSongs: string[]
  mixedStemsSongs: string[]
  extendedArchivalSongs: string[]
  rushDeliverySongs: string[]
}

export interface SongPriceDetail {
  songId: string
  title: string
  tracks: number
  lengthMinutes: number
  productId: string
  productName: string
  basePrice: number
  trackFee: number
  lengthFee: number
  hasHighTrackCount: boolean
  hasExtendedLength: boolean
  extendedLengthFeeAmount: number
  addOns: {
    vocalProduction: boolean
    drumReplacement: boolean
    guitarReamp: boolean
  }
  delivery: {
    highResMixdown: boolean
    filmMixdown: boolean
    mixedStems: boolean
    extendedArchival: boolean
    rushDelivery: boolean
    hifiBundle: boolean
  }
  songSubtotal: number
}

export interface QuoteData {
  songs: SongPriceDetail[]
  totals: {
    songCount: number
    trackCount: number
    totalLengthMinutes: number
    totalLengthSeconds: number
  }
  costs: {
    baseSongsCost: number
    trackFeesCost: number
    lengthFeesCost: number
    volumeDiscount: number
    volumeDiscountName: string | null
    vocalProductionCost: number
    vocalProductionDiscount: number
    drumReplacementCost: number
    drumReplacementDiscount: number
    guitarReampCost: number
    guitarReampDiscount: number
    productionDealDiscount: number
    productionDealSongCount: number
    virtualSessionCost: number
    virtualSessionHours: number
    highResMixdownCost: number
    highResDiscount: number
    filmMixdownCost: number
    filmMixdownDiscount: number
    hifiDealDiscount: number
    hifiDealSongCount: number
    mixedStemsCost: number
    mixedStemsdDiscount: number
    extendedArchivalCost: number
    extendedArchivalDiscount: number
    rushDeliveryCost: number
    rushDeliveryDiscount: number
    subtotal: number
    total: number
    preDiscountsTotal: number
    discountsTotal: number
    optionsDiscounts: number
    dealBreakdown: MixingDealBreakdown
    productionDeals: MixingDiscountDealSet
    premiumProductionDealDiscount: number
    standardProductionDealDiscount: number
    additionalRevisionsCost: number
    preDiscountRevisionPrice: number
    revisionDiscount: number
    includedRevisionsCost: number
    additionalRevisionsDiscountPercentage: number
    perRevisionPrice: number
  }
  summary: {
    hasHighTrackCountSongs: number
    hasExtendedLengthSongs: number
    vocalProductionCount: number
    drumReplacementCount: number
    guitarReampCount: number
    highResMixdownCount: number
    filmMixdownCount: number
    mixedStemsCount: number
    extendedArchivalCount: number
    rushDeliveryCount: number
    productionDealSongCount: number
    productionDealName?: string
    premiumProductionDealName?: string
    additionalRevisionsDiscountName?: string
    includedRevisions: number
    additionalRevisions: number
  }
}


export interface MixingDiscountDealSet {
  [key: string]: number
}

export type MixingDealBreakdown = Record<
  'vocals'
  | 'drums'
  | 'guitar'
  | 'hires'
  | 'film'
  | 'stems'
  | 'archival'
  | 'rush'
  ,
  Record<'premium' | 'standard', number>
>