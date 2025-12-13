// Shared types for pricing data
import type { Product, ProductOption, Discount } from "~/server/db/types"

export type { Product, ProductOption, Discount }
export interface MasteringPricingData {
  products: Product[]
  options: ProductOption[]
  discounts: Discount[]
}

export interface MasteringSong {
  id: string
  title: string
  minutes: number
  seconds: number
}

export interface MasteringAddOns {
  vinylMasteringSongs: string[]
  streamingMasteringSongs: string[]
  redbookMasteringSongs: string[]
  stemMasteringSongs: Record<string, number> // songId -> stem count
  restorationRemasteringSongs: string[]
  virtualSessionHours: number
  revisions: number
}

export interface MasteringDeliveryOptions {
  highResMasterSongs: string[]
  ddpImageSongs: string[]
  isrcEncodingSongs: string[]
  rushDeliverySongs: string[]
}

export interface MasteringSongPriceDetail {
  songId: string
  title: string
  lengthMinutes: number
  productId: string
  productName: string
  basePrice: number
  isExtendedLength: boolean
  extendedLengthFeeAmount: number
  addOns: {
    vinylMastering: boolean
    streamingMastering: boolean
    redbookMastering: boolean
    stemMastering: boolean
    stemCount: number
    restorationRemastering: boolean
  }
  delivery: {
    highResMaster: boolean
    ddpImage: boolean
    isrcEncoding: boolean
    rushDelivery: boolean
  }
  songSubtotal: number
}

export interface MasteringQuoteData {
  songs: MasteringSongPriceDetail[]
  totals: {
    songCount: number
    totalLengthMinutes: number
    totalLengthSeconds: number
  }
  costs: {
    baseSongsCost: number
    lengthFeesCost: number,
    volumeDiscount: number
    volumeDiscountName: string | null
    vinylMasteringCost: number
    vinylMasteringDiscount: number
    streamingMasteringCost: number
    streamingMasteringDiscount: number
    redbookMasteringCost: number
    redbookMasteringDiscount: number
    stemMasteringCost: number
    stemMasteringDiscount: number
    restorationRemasteringCost: number
    restorationRemasteringDiscount: number
    multimediaDealDiscount: number
    multimediaDealSongCount: number
    virtualSessionCost: number
    virtualSessionHours: number
    highResMasterCost: number
    highResMasterDiscount: number
    ddpImageCost: number
    ddpImageDiscount: number
    isrcEncodingCost: number
    isrcEncodingDiscount: number
    rushDeliveryCost: number
    rushDeliveryDiscount: number
    distributionDealDiscount: number
    distributionDeals: MasteringDiscountDealSet
    distributionDealSongCount: number
    subtotal: number
    total: number,
    preDiscountsTotal: number
    discountsTotal: number
    optionsDiscounts: number
    dealBreakdown: MasteringDealBreakdown
    multiMediaDeals: MasteringDiscountDealSet
    premiumDistributionDealDiscount: number
    standardDistributionDealDiscount: number
    premiumMultiMediaDealDiscount: number
    standardMultiMediaDealDiscount: number,
    additionalRevisionsCost: number
    preDiscountRevisionPrice: number
    revisionDiscount: number
    includedRevisionsCost: number
    additionalRevisionsDiscountPercentage: number
    perRevisionPrice: number
    optionsAndAddonsTotal: number
    optionsAndAddonsPreDiscountsTotal: number
  }
  summary: {
    hasExtendedLengthSongs: number
    vinylMasteringCount: number
    streamingMasteringCount: number
    redbookMasteringCount: number
    stemMasteringCount: number
    restorationRemasteringCount: number
    highResMasterCount: number
    ddpImageCount: number
    isrcEncodingCount: number
    rushDeliveryCount: number
    multimediaDealSongCount: number
    distributionDealSongCount: number
    distributionDealName?: string
    premiumDistributionDealName?: string
    multimediaDealName?: string
    premiumMultimediaDealName?: string,
    additionalRevisionsDiscountName?: string
    includedRevisions: number
    additionalRevisions: number
  }
}


export interface MasteringDiscountDealSet {
  [key: string]: number
}

export type MasteringDealBreakdown = Record<
  'vinyl'
  | 'streaming'
  | 'redbook'
  | 'restoration'
  | 'stems'
  | 'highres'
  | 'ddpimage'
  | 'isrcencode'
  | 'rush'
  ,
  Record<'premium' | 'standard', number>
>