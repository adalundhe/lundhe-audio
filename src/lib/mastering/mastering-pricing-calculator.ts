import type { Product, ProductOption, Discount } from "~/server/db/types"
import type { MasteringPricingData, MasteringQuoteData } from "./pricing-types"
import { meetsThreshold } from "../meets-threshold"


// Mastering-specific types
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

// Helper functions
function findProduct(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

function findOption(options: ProductOption[], id: string): ProductOption | undefined {
  return options.find((o) => o.id === id)
}

function findDiscountsByCategory(discounts: Discount[], category: string): Discount[] {
  return discounts.filter((d) => d.category === category)
}

function getVolumeDiscount(discounts: Discount[], songCount: number): Discount | null {
  const volumeDiscounts = findDiscountsByCategory(discounts, "volume")
  let bestDiscount: Discount | null = null

  for (const discount of volumeDiscounts) {
    if (meetsThreshold(songCount, discount.minThreshold, discount.maxThreshold)) {
      if (!bestDiscount || discount.discountPercentage > bestDiscount.discountPercentage) {
        bestDiscount = discount
      }
    }
  }

  return bestDiscount
}

function getOptionVolumeDiscount(discounts: Discount[], selectedCount: number): Discount | null {
  const optionDiscounts = findDiscountsByCategory(discounts, "option_volume")
  let bestDiscount: Discount | null = null

  for (const discount of optionDiscounts) {
    if (meetsThreshold(selectedCount, discount.minThreshold, discount.maxThreshold)) {
      if (!bestDiscount || discount.discountPercentage > bestDiscount.discountPercentage) {
        bestDiscount = discount
      }
    }
  }

  return bestDiscount
}

function getMultimediaDealDiscount(
  discounts: Discount[],
  addOns: MasteringAddOns,
): { discount: Discount | null; type: "none" | "multimedia" | "premium_multimedia" } {
  const hasVinyl = addOns.vinylMasteringSongs.length > 0
  const hasStreaming = addOns.streamingMasteringSongs.length > 0
  const hasRedbook = addOns.redbookMasteringSongs.length > 0
  const count = [hasVinyl, hasStreaming, hasRedbook].filter(Boolean).length

  if (count < 2) return { discount: null, type: "none" }

  const bundleDiscounts = findDiscountsByCategory(discounts, "bundle")

  if (count >= 3) {
    const premiumDeal = bundleDiscounts.find((d) => d.id === "premium_multimedia_deal")
    if (premiumDeal) return { discount: premiumDeal, type: "premium_multimedia" }
  }

  if (count >= 2) {
    const deal = bundleDiscounts.find((d) => d.id === "multimedia_deal")
    if (deal) return { discount: deal, type: "multimedia" }
  }

  return { discount: null, type: "none" }
}

function applyDiscount(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100)
}

function getStemMasteringPrice(options: ProductOption[], stemCount: number): number {
  if (stemCount >= 25) return findOption(options, "stem_master_25_32")?.price ?? 200
  if (stemCount >= 17) return findOption(options, "stem_master_17_24")?.price ?? 150
  if (stemCount >= 9) return findOption(options, "stem_master_9_16")?.price ?? 100
  if (stemCount >= 2) return findOption(options, "stem_master_2_8")?.price ?? 50
  return 0
}

// Calculate base price for mastering based on song length
function calculateMasteringBasePrice(
  products: Product[],
  minutes: number,
  seconds: number,
): {
  price: number
  productId: string
  productName: string
  isExtendedLength: boolean
  extendedLengthFeeAmount: number
} {
  const totalMinutes = minutes + seconds / 60
  const EXTENDED_LENGTH_THRESHOLD = 10

  if (totalMinutes > EXTENDED_LENGTH_THRESHOLD) {
    const extendedProduct = findProduct(products, "extended_length_master")
    const basePrice = extendedProduct?.price ?? 150
    const standardProduct = findProduct(products, "standard_master")
    const standardPrice = standardProduct?.price ?? 75

    return {
      price: basePrice,
      productId: "extended_length_master",
      productName: extendedProduct?.name ?? "Extended Length Master",
      isExtendedLength: true,
      extendedLengthFeeAmount: basePrice - standardPrice,
    }
  } else {
    const standardProduct = findProduct(products, "standard_master")
    return {
      price: standardProduct?.price ?? 75,
      productId: "standard_master",
      productName: standardProduct?.name ?? "Standard Master",
      isExtendedLength: false,
      extendedLengthFeeAmount: 0,
    }
  }
}

function getDistributionDealDiscount(
  discounts: Discount[],
  deliveryOptions: MasteringDeliveryOptions,
  songId: string,
): { discount: Discount | null; type: "none" | "distribution" | "premium_distribution" } {
  const hasHighRes = deliveryOptions.highResMasterSongs.includes(songId)
  const hasDdp = deliveryOptions.ddpImageSongs.includes(songId)
  const hasIsrc = deliveryOptions.isrcEncodingSongs.includes(songId)
  const count = [hasHighRes, hasDdp, hasIsrc].filter(Boolean).length

  if (count < 2) return { discount: null, type: "none" }

  const bundleDiscounts = findDiscountsByCategory(discounts, "delivery_bundle")

  if (count >= 3) {
    const premiumDeal = bundleDiscounts.find((d) => d.id === "premium_distribution_deal")
    if (premiumDeal) return { discount: premiumDeal, type: "premium_distribution" }
  }

  if (count >= 2) {
    const deal = bundleDiscounts.find((d) => d.id === "distribution_deal")
    if (deal) return { discount: deal, type: "distribution" }
  }

  return { discount: null, type: "none" }
}

// Main function to build mastering quote data
export function buildMasteringQuoteData(
  pricingData: MasteringPricingData,
  songs: MasteringSong[],
  addOns: MasteringAddOns,
  deliveryOptions: MasteringDeliveryOptions,
): MasteringQuoteData {
  const { products, options, discounts } = pricingData

  // Calculate totals
  const songCount = songs.length
  const totalSeconds = songs.reduce((sum, s) => sum + s.minutes * 60 + s.seconds, 0)
  const totalLengthMinutes = Math.floor(totalSeconds / 60)
  const totalLengthSeconds = totalSeconds % 60

  // Get volume discount
  const volumeDiscount = getVolumeDiscount(discounts, songCount)
  const volumeDiscountPercentage = volumeDiscount?.discountPercentage ?? 0
  const volumeDiscountName = volumeDiscount?.name ?? null

  // Get multimedia deal discount
  const { discount: multimediaDealObj } = getMultimediaDealDiscount(discounts, addOns)
  const multimediaDealPercentage = multimediaDealObj?.discountPercentage ?? 0
  const multimediaDealName = multimediaDealObj?.name ?? null

  // Get option counts
  const vinylCount = addOns.vinylMasteringSongs.length
  const streamingCount = addOns.streamingMasteringSongs.length
  const redbookCount = addOns.redbookMasteringSongs.length
  const stemCount = Object.keys(addOns.stemMasteringSongs).length
  const restorationCount = addOns.restorationRemasteringSongs.length
  const highResCount = deliveryOptions.highResMasterSongs.length
  const ddpImageCount = deliveryOptions.ddpImageSongs.length
  const isrcEncodingCount = deliveryOptions.isrcEncodingSongs.length
  const rushDeliveryCount = deliveryOptions.rushDeliverySongs.length

  // Get option-specific volume discounts
  const vinylVolumeDiscount = getOptionVolumeDiscount(discounts, vinylCount)
  const streamingVolumeDiscount = getOptionVolumeDiscount(discounts, streamingCount)
  const redbookVolumeDiscount = getOptionVolumeDiscount(discounts, redbookCount)
  const stemVolumeDiscount = getOptionVolumeDiscount(discounts, stemCount)
  const restorationVolumeDiscount = getOptionVolumeDiscount(discounts, restorationCount)
  const highResVolumeDiscount = getOptionVolumeDiscount(discounts, highResCount)
  const ddpImageVolumeDiscount = getOptionVolumeDiscount(discounts, ddpImageCount)
  const isrcEncodingVolumeDiscount = getOptionVolumeDiscount(discounts, isrcEncodingCount)
  const rushDeliveryVolumeDiscount = getOptionVolumeDiscount(discounts, rushDeliveryCount)

  // Get option prices
  const vinylOption = findOption(options, "vinyl_master")
  const streamingOption = findOption(options, "streaming_master")
  const redbookOption = findOption(options, "redbook_master")
  const restorationOption = findOption(options, "restoration_remaster")
  const virtualSessionOption = findOption(options, "virtual_session")
  const highResOption = findOption(options, "high_res_master")
  const ddpImageOption = findOption(options, "ddp_image")
  const isrcEncodingOption = findOption(options, "isrc_encoding")

  const vinylPrice = vinylOption?.price ?? 50
  const streamingPrice = streamingOption?.price ?? 25
  const redbookPrice = redbookOption?.price ?? 25
  const restorationPrice = restorationOption?.price ?? 350
  const virtualSessionHourlyRate = virtualSessionOption?.price ?? 100
  const highResPrice = highResOption?.price ?? 25
  const ddpImagePrice = ddpImageOption?.price ?? 25
  const isrcEncodingPrice = isrcEncodingOption?.price ?? 10

  // Build per-song details
  const songDetails: MasteringSongPriceDetail[] = songs.map((song, index) => {
    const {
      price: basePrice,
      productId,
      productName,
      isExtendedLength,
      extendedLengthFeeAmount,
    } = calculateMasteringBasePrice(products, song.minutes, song.seconds)

    const hasVinyl = addOns.vinylMasteringSongs.includes(song.id)
    const hasStreaming = addOns.streamingMasteringSongs.includes(song.id)
    const hasRedbook = addOns.redbookMasteringSongs.includes(song.id)
    const hasStem = song.id in addOns.stemMasteringSongs
    const songStemCount = addOns.stemMasteringSongs[song.id] ?? 0
    const hasRestoration = addOns.restorationRemasteringSongs.includes(song.id)

    const hasHighRes = deliveryOptions.highResMasterSongs.includes(song.id)
    const hasDdpImage = deliveryOptions.ddpImageSongs.includes(song.id)
    const hasIsrcEncoding = deliveryOptions.isrcEncodingSongs.includes(song.id)
    const hasRushDelivery = deliveryOptions.rushDeliverySongs.includes(song.id)

    return {
      songId: song.id,
      title: song.title || `Song ${index + 1}`,
      lengthMinutes: song.minutes + song.seconds / 60,
      productId,
      productName,
      basePrice,
      isExtendedLength,
      extendedLengthFeeAmount,
      addOns: {
        vinylMastering: hasVinyl,
        streamingMastering: hasStreaming,
        redbookMastering: hasRedbook,
        stemMastering: hasStem,
        stemCount: songStemCount,
        restorationRemastering: hasRestoration,
      },
      delivery: {
        highResMaster: hasHighRes,
        ddpImage: hasDdpImage,
        isrcEncoding: hasIsrcEncoding,
        rushDelivery: hasRushDelivery,
      },
      songSubtotal: basePrice,
    }
  })

  // Calculate costs
  const baseSongsCost = songDetails.reduce((sum, s) => sum + s.songSubtotal, 0)
  const volumeDiscountAmount = baseSongsCost * (volumeDiscountPercentage / 100)

  // Calculate add-on costs
  let vinylMasteringCost = 0
  let streamingMasteringCost = 0
  let redbookMasteringCost = 0
  let stemMasteringCost = 0
  let restorationRemasteringCost = 0

  for (const song of songDetails) {
    // Vinyl mastering (multimedia deal eligible)
    if (song.addOns.vinylMastering) {
      let price = vinylPrice
      if (vinylVolumeDiscount) price = applyDiscount(price, vinylVolumeDiscount.discountPercentage)
      if (multimediaDealPercentage > 0) price = applyDiscount(price, multimediaDealPercentage)
      vinylMasteringCost += price
    }
    // Streaming mastering (multimedia deal eligible)
    if (song.addOns.streamingMastering) {
      let price = streamingPrice
      if (streamingVolumeDiscount) price = applyDiscount(price, streamingVolumeDiscount.discountPercentage)
      if (multimediaDealPercentage > 0) price = applyDiscount(price, multimediaDealPercentage)
      streamingMasteringCost += price
    }
    // Redbook mastering (multimedia deal eligible)
    if (song.addOns.redbookMastering) {
      let price = redbookPrice
      if (redbookVolumeDiscount) price = applyDiscount(price, redbookVolumeDiscount.discountPercentage)
      if (multimediaDealPercentage > 0) price = applyDiscount(price, multimediaDealPercentage)
      redbookMasteringCost += price
    }
    // Stem mastering
    if (song.addOns.stemMastering && song.addOns.stemCount > 0) {
      let price = getStemMasteringPrice(options, song.addOns.stemCount)
      if (stemVolumeDiscount) price = applyDiscount(price, stemVolumeDiscount.discountPercentage)
      stemMasteringCost += price
    }
    // Restoration remastering
    if (song.addOns.restorationRemastering) {
      let price = restorationPrice
      if (restorationVolumeDiscount) price = applyDiscount(price, restorationVolumeDiscount.discountPercentage)
      restorationRemasteringCost += price
    }
  }

  // Calculate multimedia deal savings
  const vinylWithoutDeal =
    vinylCount * (vinylVolumeDiscount ? applyDiscount(vinylPrice, vinylVolumeDiscount.discountPercentage) : vinylPrice)
  const streamingWithoutDeal =
    streamingCount *
    (streamingVolumeDiscount
      ? applyDiscount(streamingPrice, streamingVolumeDiscount.discountPercentage)
      : streamingPrice)
  const redbookWithoutDeal =
    redbookCount *
    (redbookVolumeDiscount ? applyDiscount(redbookPrice, redbookVolumeDiscount.discountPercentage) : redbookPrice)
  const totalWithoutDeal = vinylWithoutDeal + streamingWithoutDeal + redbookWithoutDeal
  const totalWithDeal = vinylMasteringCost + streamingMasteringCost + redbookMasteringCost
  const multimediaDealDiscount = totalWithoutDeal - totalWithDeal

  // Virtual session cost
  const virtualSessionHours = addOns.virtualSessionHours
  const virtualSessionCost = virtualSessionHours * virtualSessionHourlyRate

  // Calculate delivery costs
  let highResMasterCost = 0
  let ddpImageCost = 0
  let isrcEncodingCost = 0
  let rushDeliveryCost = 0
  let distributionDealDiscount = 0
  let distributionDealName: string | null = null

  for (const song of songDetails) {
    if (song.delivery.highResMaster) {
      let price = highResPrice
      if (highResVolumeDiscount) price = applyDiscount(price, highResVolumeDiscount.discountPercentage)
      highResMasterCost += price
    }
    if (song.delivery.ddpImage) {
      let price = ddpImagePrice
      if (ddpImageVolumeDiscount) price = applyDiscount(price, ddpImageVolumeDiscount.discountPercentage)
      ddpImageCost += price
    }
    if (song.delivery.isrcEncoding) {
      let price = isrcEncodingPrice
      if (isrcEncodingVolumeDiscount) price = applyDiscount(price, isrcEncodingVolumeDiscount.discountPercentage)
      isrcEncodingCost += price
    }
    if (song.delivery.rushDelivery) {
      let price = song.songSubtotal * 2 // 100% surcharge (doubles the price)
      if (rushDeliveryVolumeDiscount) price = applyDiscount(price, rushDeliveryVolumeDiscount.discountPercentage)
      rushDeliveryCost += price
    }

    // Distribution deal discount
    const { discount: distributionDealObj } = getDistributionDealDiscount(discounts, deliveryOptions, song.songId)
    const distributionDealPercentage = distributionDealObj?.discountPercentage ?? 0
    const currentDistributionDealName = distributionDealObj?.name ?? null

    if (distributionDealPercentage > 0) {
      distributionDealDiscount += song.songSubtotal * (distributionDealPercentage / 100)
      distributionDealName = currentDistributionDealName
    }
  }

  const subtotal =
    baseSongsCost -
    volumeDiscountAmount +
    vinylMasteringCost +
    streamingMasteringCost +
    redbookMasteringCost +
    stemMasteringCost +
    restorationRemasteringCost +
    virtualSessionCost +
    highResMasterCost +
    ddpImageCost +
    isrcEncodingCost +
    rushDeliveryCost -
    distributionDealDiscount

  return {
    songs: songDetails,
    totals: {
      songCount,
      totalLengthMinutes,
      totalLengthSeconds,
    },
    costs: {
      baseSongsCost,
      volumeDiscount: volumeDiscountAmount,
      volumeDiscountName,
      vinylMasteringCost,
      streamingMasteringCost,
      redbookMasteringCost,
      stemMasteringCost,
      restorationRemasteringCost,
      multimediaDealDiscount,
      multimediaDealSongCount: streamingCount + redbookCount + vinylCount,
      multimediaDealName,
      virtualSessionCost,
      virtualSessionHours,
      highResMasterCost,
      ddpImageCost,
      isrcEncodingCost,
      rushDeliveryCost,
      distributionDealDiscount,
      distributionDealName,
      distributionDealSongCount: highResCount + ddpImageCount + isrcEncodingCount,
      subtotal,
      total: subtotal,
    },
    summary: {
      hasExtendedLengthSongs: songDetails.filter((s) => s.isExtendedLength).length,
      vinylMasteringCount: vinylCount,
      streamingMasteringCount: streamingCount,
      redbookMasteringCount: redbookCount,
      stemMasteringCount: stemCount,
      restorationRemasteringCount: restorationCount,
      highResMasterCount: highResCount,
      ddpImageCount: ddpImageCount,
      isrcEncodingCount: isrcEncodingCount,
      rushDeliveryCount: rushDeliveryCount,
      distributionDealSongCount: highResCount + ddpImageCount + isrcEncodingCount,
    },
  }
}

export function getVolumeDiscountInfo(discounts: Discount[]): { epDeal: Discount | null; albumDeal: Discount | null } {
  const volumeDiscounts = findDiscountsByCategory(discounts, "volume")
  return {
    epDeal: volumeDiscounts.find((d) => d.id === "ep_deal") ?? null,
    albumDeal: volumeDiscounts.find((d) => d.id === "album_deal") ?? null,
  }
}

export function getOptionVolumeDiscountInfo(discounts: Discount[]): {
  fivePlus: Discount | null
  tenPlus: Discount | null
} {
  const optionDiscounts = findDiscountsByCategory(discounts, "option_volume")
  return {
    fivePlus: optionDiscounts.find((d) => d.id === "option_volume_5") ?? null,
    tenPlus: optionDiscounts.find((d) => d.id === "option_volume_10") ?? null,
  }
}
