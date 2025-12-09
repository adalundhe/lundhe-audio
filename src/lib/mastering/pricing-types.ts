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
    volumeDiscount: number
    volumeDiscountName: string | null
    vinylMasteringCost: number
    streamingMasteringCost: number
    redbookMasteringCost: number
    stemMasteringCost: number
    restorationRemasteringCost: number
    multimediaDealDiscount: number
    multimediaDealSongCount: number
    multimediaDealName: string | null
    virtualSessionCost: number
    virtualSessionHours: number
    highResMasterCost: number
    ddpImageCost: number
    isrcEncodingCost: number
    rushDeliveryCost: number
    distributionDealDiscount: number
    distributionDealName: string | null
    distributionDealSongCount: number
    subtotal: number
    total: number
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
    distributionDealSongCount: number
  }
}
