import type { MasteringSong, MasteringAddOns, MasteringDeliveryOptions } from "./pricing-types"

// Base prices for mastering
export const STANDARD_MASTER_PRICE = 75
export const EXTENDED_LENGTH_MASTER_PRICE = 150
export const EXTENDED_LENGTH_THRESHOLD_MINUTES = 10

// Song count discount constants (EP/Album deals)
export const DISCOUNT_5_TO_9_SONGS = 0.1 // 10% discount - EP Deal
export const DISCOUNT_10_PLUS_SONGS = 0.25 // 25% discount - Album Deal

export const EP_DEAL_DISCOUNT = DISCOUNT_5_TO_9_SONGS
export const ALBUM_DEAL_DISCOUNT = DISCOUNT_10_PLUS_SONGS

export type SongCountDealType = "none" | "ep" | "album"

export function getSongCountDealType(songCount: number): SongCountDealType {
  if (songCount >= 10) return "album"
  if (songCount >= 5) return "ep"
  return "none"
}

export function getSongCountDealName(dealType: SongCountDealType): string {
  if (dealType === "album") return "Album Deal"
  if (dealType === "ep") return "EP Deal"
  return ""
}

// Add-on prices
export const VINYL_MASTERING_PRICE = 50
export const STREAMING_MASTERING_PRICE = 25
export const REDBOOK_MASTERING_PRICE = 25
export const RESTORATION_REMASTERING_PRICE = 350

// Stem mastering prices by tier
export const STEM_MASTER_2_8_PRICE = 50
export const STEM_MASTER_9_16_PRICE = 100
export const STEM_MASTER_17_24_PRICE = 150
export const STEM_MASTER_25_32_PRICE = 200
export const MAX_STEM_COUNT = 32

// Virtual session
export const VIRTUAL_SESSION_HOURLY_RATE = 100
export const VIRTUAL_SESSION_MIN_HOURS = 4

// Delivery prices
export const HIGH_RES_MASTER_PRICE = 25
export const DDP_IMAGE_PRICE = 25
export const ISRC_ENCODING_PRICE = 10

// Option volume discounts
export const OPTION_DISCOUNT_5_PLUS = 0.15 // 15% discount for 5+ songs with option
export const OPTION_DISCOUNT_10_PLUS = 0.25 // 25% discount for 10+ songs with option

// Multimedia deal discounts (for vinyl, streaming, redbook combination)
export const MULTIMEDIA_DEAL_DISCOUNT = 0.15 // 15% discount for selecting 2 multimedia add-ons
export const PREMIUM_MULTIMEDIA_DEAL_DISCOUNT = 0.25 // 25% discount for selecting all 3 multimedia add-ons

// Distribution deal discounts (for high-res, DDP, ISRC combination)
export const DISTRIBUTION_DEAL_DISCOUNT = 0.1 // 10% discount for selecting 2 distribution options
export const PREMIUM_DISTRIBUTION_DEAL_DISCOUNT = 0.25 // 25% discount for selecting all 3 distribution options

// Helper to calculate discount for per-song options
export function getOptionDiscount(selectedCount: number): number {
  if (selectedCount >= 10) return OPTION_DISCOUNT_10_PLUS
  if (selectedCount >= 5) return OPTION_DISCOUNT_5_PLUS
  return 0
}

export function applyOptionDiscount(price: number, selectedCount: number): number {
  const discount = getOptionDiscount(selectedCount)
  return price * (1 - discount)
}

// Multimedia deal helpers
export type MultimediaDealType = "none" | "multimedia" | "premium_multimedia"

export function getMultimediaDealType(addOns: MasteringAddOns): MultimediaDealType {
  const hasVinyl = addOns.vinylMasteringSongs.length > 0
  const hasStreaming = addOns.streamingMasteringSongs.length > 0
  const hasRedbook = addOns.redbookMasteringSongs.length > 0

  const count = [hasVinyl, hasStreaming, hasRedbook].filter(Boolean).length

  if (count >= 3) return "premium_multimedia"
  if (count >= 2) return "multimedia"
  return "none"
}

export function getMultimediaDealDiscount(dealType: MultimediaDealType): number {
  if (dealType === "premium_multimedia") return PREMIUM_MULTIMEDIA_DEAL_DISCOUNT
  if (dealType === "multimedia") return MULTIMEDIA_DEAL_DISCOUNT
  return 0
}

export function getMultimediaDealName(dealType: MultimediaDealType): string {
  if (dealType === "premium_multimedia") return "Premium Multimedia Deal"
  if (dealType === "multimedia") return "Multimedia Deal"
  return ""
}

// Distribution deal helpers
export type DistributionDealType = "none" | "distribution" | "premium_distribution"

export function hasDistributionDeal(
  songId: string,
  deliveryOptions: MasteringDeliveryOptions,
): { type: DistributionDealType; discount: number } {
  const hasHighRes = deliveryOptions.highResMasterSongs.includes(songId)
  const hasDdp = deliveryOptions.ddpImageSongs.includes(songId)
  const hasIsrc = deliveryOptions.isrcEncodingSongs.includes(songId)

  const count = [hasHighRes, hasDdp, hasIsrc].filter(Boolean).length

  if (count >= 3) return { type: "premium_distribution", discount: PREMIUM_DISTRIBUTION_DEAL_DISCOUNT }
  if (count >= 2) return { type: "distribution", discount: DISTRIBUTION_DEAL_DISCOUNT }
  return { type: "none", discount: 0 }
}

export function getDistributionDealName(dealType: DistributionDealType): string {
  if (dealType === "premium_distribution") return "Premium Distribution Deal"
  if (dealType === "distribution") return "Distribution Deal"
  return ""
}

export function applyAllAddOnDiscounts(
  price: number,
  selectedCount: number,
  multimediaDealType: MultimediaDealType,
): number {
  // First apply volume discount
  const afterVolumeDiscount = applyOptionDiscount(price, selectedCount)
  // Then apply multimedia deal discount on top
  const multimediaDiscount = getMultimediaDealDiscount(multimediaDealType)
  return afterVolumeDiscount * (1 - multimediaDiscount)
}

// Calculate stem mastering price based on stem count
export function getStemMasteringPrice(stemCount: number): number {
  if (stemCount >= 25) return STEM_MASTER_25_32_PRICE
  if (stemCount >= 17) return STEM_MASTER_17_24_PRICE
  if (stemCount >= 9) return STEM_MASTER_9_16_PRICE
  if (stemCount >= 2) return STEM_MASTER_2_8_PRICE
  return 0
}

export function getStemMasteringTier(stemCount: number): string {
  if (stemCount >= 25) return "25-32 stems"
  if (stemCount >= 17) return "17-24 stems"
  if (stemCount >= 9) return "9-16 stems"
  if (stemCount >= 2) return "2-8 stems"
  return ""
}

// Calculate base price for mastering based on song length
export function isExtendedLength(minutes: number, seconds: number): boolean {
  const totalMinutes = minutes + seconds / 60
  return totalMinutes > EXTENDED_LENGTH_THRESHOLD_MINUTES
}

export function getMasteringBasePrice(minutes: number, seconds: number): number {
  return isExtendedLength(minutes, seconds) ? EXTENDED_LENGTH_MASTER_PRICE : STANDARD_MASTER_PRICE
}

export function getExtendedLengthFee(minutes: number, seconds: number): number {
  if (isExtendedLength(minutes, seconds)) {
    return EXTENDED_LENGTH_MASTER_PRICE - STANDARD_MASTER_PRICE
  }
  return 0
}

// Song price detail type for mastering
export type MasteringSongPricingDetail = {
  id: string
  title: string
  minutes: number
  seconds: number
  basePrice: number
  isExtendedLength: boolean
  extendedLengthFee: number
  // Add-ons applied to this song
  addOns: {
    vinylMastering: boolean
    streamingMastering: boolean
    redbookMastering: boolean
    stemMastering: boolean
    stemCount: number
    restorationRemastering: boolean
  }
  // Delivery options applied to this song
  delivery: {
    highResMaster: boolean
    ddpImage: boolean
    isrcEncoding: boolean
    rushDelivery: boolean
    distributionDealType: DistributionDealType
  }
  // Per-song costs
  costs: {
    base: number
    vinylMastering: number
    streamingMastering: number
    redbookMastering: number
    stemMastering: number
    restorationRemastering: number
    highResMaster: number
    ddpImage: number
    isrcEncoding: number
    rushDelivery: number
    subtotal: number
  }
}

export type MasteringQuoteDataLocal = {
  // Project totals
  totalSongs: number
  totalLengthMinutes: number
  totalLengthSeconds: number
  formattedTotalLength: string

  // Discount info
  volumeDiscount: number
  volumeDiscountPercentage: number

  multimediaDealType: MultimediaDealType
  multimediaDealDiscount: number
  multimediaDealName: string

  songCountDealType: SongCountDealType
  songCountDealName: string

  // Virtual session
  virtualSessionHours: number
  virtualSessionCost: number

  // Per-song details
  songs: MasteringSongPricingDetail[]

  // Cost breakdown
  costs: {
    baseSongsCost: number
    discountAmount: number
    afterDiscountCost: number
    vinylMasteringTotal: number
    streamingMasteringTotal: number
    redbookMasteringTotal: number
    stemMasteringTotal: number
    restorationRemasteringTotal: number
    multimediaDealSavings: number
    addOnsTotal: number
    highResMasterTotal: number
    ddpImageTotal: number
    isrcEncodingTotal: number
    rushDeliveryTotal: number
    distributionDealSavings: number
    deliveryTotal: number
    virtualSession: number
    grandTotal: number
  }

  // Summary counts
  summary: {
    songsWithVinylMastering: number
    songsWithStreamingMastering: number
    songsWithRedbookMastering: number
    songsWithStemMastering: number
    songsWithRestorationRemastering: number
    songsWithHighResMaster: number
    songsWithDdpImage: number
    songsWithIsrcEncoding: number
    songsWithRushDelivery: number
    songsWithExtendedLength: number
    songsWithDistributionDeal: number
  }

  optionDiscounts: {
    vinylMastering: { count: number; discount: number; discountPercentage: number }
    streamingMastering: { count: number; discount: number; discountPercentage: number }
    redbookMastering: { count: number; discount: number; discountPercentage: number }
    stemMastering: { count: number; discount: number; discountPercentage: number }
    restorationRemastering: { count: number; discount: number; discountPercentage: number }
    highResMaster: { count: number; discount: number; discountPercentage: number }
    ddpImage: { count: number; discount: number; discountPercentage: number }
    isrcEncoding: { count: number; discount: number; discountPercentage: number }
    rushDelivery: { count: number; discount: number; discountPercentage: number }
  }
}

export function calculateMasteringSongCost(songs: MasteringSong[]): number {
  if (songs.length === 0) return 0

  let totalBaseCost = songs.reduce((sum, song) => sum + getMasteringBasePrice(song.minutes, song.seconds), 0)

  // Apply volume discount based on song count
  if (songs.length >= 10) {
    totalBaseCost = totalBaseCost * (1 - DISCOUNT_10_PLUS_SONGS)
  } else if (songs.length >= 5) {
    totalBaseCost = totalBaseCost * (1 - DISCOUNT_5_TO_9_SONGS)
  }

  return totalBaseCost
}

export function calculateMasteringTotalPrice(
  songs: MasteringSong[],
  addOns: MasteringAddOns,
  deliveryOptions: MasteringDeliveryOptions,
): number {
  const songCost = calculateMasteringSongCost(songs)

  const multimediaDealType = getMultimediaDealType(addOns)

  const vinylCount = addOns.vinylMasteringSongs.length
  const streamingCount = addOns.streamingMasteringSongs.length
  const redbookCount = addOns.redbookMasteringSongs.length
  const stemCount = Object.keys(addOns.stemMasteringSongs).length
  const restorationCount = addOns.restorationRemasteringSongs.length

  const vinylCost = vinylCount * applyAllAddOnDiscounts(VINYL_MASTERING_PRICE, vinylCount, multimediaDealType)
  const streamingCost =
    streamingCount * applyAllAddOnDiscounts(STREAMING_MASTERING_PRICE, streamingCount, multimediaDealType)
  const redbookCost = redbookCount * applyAllAddOnDiscounts(REDBOOK_MASTERING_PRICE, redbookCount, multimediaDealType)

  let stemCost = 0
  for (const songId in addOns.stemMasteringSongs) {
    const stemCountForSong = addOns.stemMasteringSongs[songId]
    stemCost += applyOptionDiscount(getStemMasteringPrice(stemCountForSong ?? 0), stemCount)
  }

  const restorationCost = restorationCount * applyOptionDiscount(RESTORATION_REMASTERING_PRICE, restorationCount)

  const virtualSessionCost = addOns.virtualSessionHours * VIRTUAL_SESSION_HOURLY_RATE

  // Delivery costs
  const highResCount = deliveryOptions.highResMasterSongs.length
  const ddpCount = deliveryOptions.ddpImageSongs.length
  const isrcCount = deliveryOptions.isrcEncodingSongs.length
  const rushCount = deliveryOptions.rushDeliverySongs.length

  let highResCost = 0
  let ddpCost = 0
  let isrcCost = 0
  let rushCost = 0

  for (const songId of deliveryOptions.highResMasterSongs) {
    const { discount } = hasDistributionDeal(songId, deliveryOptions)
    let price = applyOptionDiscount(HIGH_RES_MASTER_PRICE, highResCount)
    price = price * (1 - discount)
    highResCost += price
  }

  for (const songId of deliveryOptions.ddpImageSongs) {
    const { discount } = hasDistributionDeal(songId, deliveryOptions)
    let price = applyOptionDiscount(DDP_IMAGE_PRICE, ddpCount)
    price = price * (1 - discount)
    ddpCost += price
  }

  for (const songId of deliveryOptions.isrcEncodingSongs) {
    const { discount } = hasDistributionDeal(songId, deliveryOptions)
    let price = applyOptionDiscount(ISRC_ENCODING_PRICE, isrcCount)
    price = price * (1 - discount)
    isrcCost += price
  }

  // Rush delivery doubles the base song price
  for (const songId of deliveryOptions.rushDeliverySongs) {
    const song = songs.find((s) => s.id === songId)
    if (song) {
      rushCost += getMasteringBasePrice(song.minutes, song.seconds) * 2
    }
  }

  return (
    songCost +
    vinylCost +
    streamingCost +
    redbookCost +
    stemCost +
    restorationCost +
    virtualSessionCost +
    highResCost +
    ddpCost +
    isrcCost +
    rushCost
  )
}

export function buildMasteringQuoteDataLocal(
  songs: MasteringSong[],
  addOns: MasteringAddOns,
  deliveryOptions: MasteringDeliveryOptions,
): MasteringQuoteDataLocal {
  const totalSongs = songs.length
  const totalSeconds = songs.reduce((sum, s) => sum + s.minutes * 60 + s.seconds, 0)
  const totalLengthMinutes = Math.floor(totalSeconds / 60)
  const totalLengthSeconds = totalSeconds % 60
  const formattedTotalLength = `${totalLengthMinutes}m ${totalLengthSeconds}s`

  // Calculate volume discount
  let volumeDiscountPercentage = 0
  if (totalSongs >= 10) {
    volumeDiscountPercentage = DISCOUNT_10_PLUS_SONGS
  } else if (totalSongs >= 5) {
    volumeDiscountPercentage = DISCOUNT_5_TO_9_SONGS
  }

  const multimediaDealType = getMultimediaDealType(addOns)
  const multimediaDealDiscount = getMultimediaDealDiscount(multimediaDealType)
  const multimediaDealName = getMultimediaDealName(multimediaDealType)

  const songCountDealType = getSongCountDealType(totalSongs)
  const songCountDealName = getSongCountDealName(songCountDealType)

  const vinylCount = addOns.vinylMasteringSongs.length
  const streamingCount = addOns.streamingMasteringSongs.length
  const redbookCount = addOns.redbookMasteringSongs.length
  const stemCount = Object.keys(addOns.stemMasteringSongs).length
  const restorationCount = addOns.restorationRemasteringSongs.length
  const highResCount = deliveryOptions.highResMasterSongs.length
  const ddpCount = deliveryOptions.ddpImageSongs.length
  const isrcCount = deliveryOptions.isrcEncodingSongs.length
  const rushCount = deliveryOptions.rushDeliverySongs.length

  const optionDiscounts = {
    vinylMastering: {
      count: vinylCount,
      discount: getOptionDiscount(vinylCount),
      discountPercentage: getOptionDiscount(vinylCount) * 100,
    },
    streamingMastering: {
      count: streamingCount,
      discount: getOptionDiscount(streamingCount),
      discountPercentage: getOptionDiscount(streamingCount) * 100,
    },
    redbookMastering: {
      count: redbookCount,
      discount: getOptionDiscount(redbookCount),
      discountPercentage: getOptionDiscount(redbookCount) * 100,
    },
    stemMastering: {
      count: stemCount,
      discount: getOptionDiscount(stemCount),
      discountPercentage: getOptionDiscount(stemCount) * 100,
    },
    restorationRemastering: {
      count: restorationCount,
      discount: getOptionDiscount(restorationCount),
      discountPercentage: getOptionDiscount(restorationCount) * 100,
    },
    highResMaster: {
      count: highResCount,
      discount: getOptionDiscount(highResCount),
      discountPercentage: getOptionDiscount(highResCount) * 100,
    },
    ddpImage: {
      count: ddpCount,
      discount: getOptionDiscount(ddpCount),
      discountPercentage: getOptionDiscount(ddpCount) * 100,
    },
    isrcEncoding: {
      count: isrcCount,
      discount: getOptionDiscount(isrcCount),
      discountPercentage: getOptionDiscount(isrcCount) * 100,
    },
    rushDelivery: {
      count: rushCount,
      discount: getOptionDiscount(rushCount),
      discountPercentage: getOptionDiscount(rushCount) * 100,
    },
  }

  // Build per-song details
  const songDetails: MasteringSongPricingDetail[] = songs.map((song, index) => {
    const basePrice = getMasteringBasePrice(song.minutes, song.seconds)
    const songIsExtendedLength = isExtendedLength(song.minutes, song.seconds)
    const extendedLengthFee = getExtendedLengthFee(song.minutes, song.seconds)

    const hasVinylMastering = addOns.vinylMasteringSongs.includes(song.id)
    const hasStreamingMastering = addOns.streamingMasteringSongs.includes(song.id)
    const hasRedbookMastering = addOns.redbookMasteringSongs.includes(song.id)
    const hasStemMastering = song.id in addOns.stemMasteringSongs
    const songStemCount = addOns.stemMasteringSongs[song.id] ?? 0
    const hasRestorationRemastering = addOns.restorationRemasteringSongs.includes(song.id)

    const hasHighResMaster = deliveryOptions.highResMasterSongs.includes(song.id)
    const hasDdpImage = deliveryOptions.ddpImageSongs.includes(song.id)
    const hasIsrcEncoding = deliveryOptions.isrcEncodingSongs.includes(song.id)
    const hasRushDelivery = deliveryOptions.rushDeliverySongs.includes(song.id)

    const { type: distributionDealType, discount: distributionDiscount } = hasDistributionDeal(song.id, deliveryOptions)

    // Calculate per-song costs
    const vinylMasteringCost = hasVinylMastering
      ? applyAllAddOnDiscounts(VINYL_MASTERING_PRICE, vinylCount, multimediaDealType)
      : 0
    const streamingMasteringCost = hasStreamingMastering
      ? applyAllAddOnDiscounts(STREAMING_MASTERING_PRICE, streamingCount, multimediaDealType)
      : 0
    const redbookMasteringCost = hasRedbookMastering
      ? applyAllAddOnDiscounts(REDBOOK_MASTERING_PRICE, redbookCount, multimediaDealType)
      : 0
    const stemMasteringCost = hasStemMastering
      ? applyOptionDiscount(getStemMasteringPrice(songStemCount), stemCount)
      : 0
    const restorationRemasteringCost = hasRestorationRemastering
      ? applyOptionDiscount(RESTORATION_REMASTERING_PRICE, restorationCount)
      : 0

    let highResMasterCost = hasHighResMaster ? applyOptionDiscount(HIGH_RES_MASTER_PRICE, highResCount) : 0
    let ddpImageCost = hasDdpImage ? applyOptionDiscount(DDP_IMAGE_PRICE, ddpCount) : 0
    let isrcEncodingCost = hasIsrcEncoding ? applyOptionDiscount(ISRC_ENCODING_PRICE, isrcCount) : 0

    // Apply distribution deal discount
    if (distributionDiscount > 0) {
      highResMasterCost = highResMasterCost * (1 - distributionDiscount)
      ddpImageCost = ddpImageCost * (1 - distributionDiscount)
      isrcEncodingCost = isrcEncodingCost * (1 - distributionDiscount)
    }

    const rushDeliveryCost = hasRushDelivery ? basePrice * 2 : 0

    const subtotal =
      basePrice +
      vinylMasteringCost +
      streamingMasteringCost +
      redbookMasteringCost +
      stemMasteringCost +
      restorationRemasteringCost +
      highResMasterCost +
      ddpImageCost +
      isrcEncodingCost +
      rushDeliveryCost

    return {
      id: song.id,
      title: song.title || `Song ${index + 1}`,
      minutes: song.minutes,
      seconds: song.seconds,
      basePrice,
      isExtendedLength: songIsExtendedLength,
      extendedLengthFee,
      addOns: {
        vinylMastering: hasVinylMastering,
        streamingMastering: hasStreamingMastering,
        redbookMastering: hasRedbookMastering,
        stemMastering: hasStemMastering,
        stemCount: songStemCount,
        restorationRemastering: hasRestorationRemastering,
      },
      delivery: {
        highResMaster: hasHighResMaster,
        ddpImage: hasDdpImage,
        isrcEncoding: hasIsrcEncoding,
        rushDelivery: hasRushDelivery,
        distributionDealType,
      },
      costs: {
        base: basePrice,
        vinylMastering: vinylMasteringCost,
        streamingMastering: streamingMasteringCost,
        redbookMastering: redbookMasteringCost,
        stemMastering: stemMasteringCost,
        restorationRemastering: restorationRemasteringCost,
        highResMaster: highResMasterCost,
        ddpImage: ddpImageCost,
        isrcEncoding: isrcEncodingCost,
        rushDelivery: rushDeliveryCost,
        subtotal,
      },
    }
  })

  // Calculate totals
  const baseSongsCost = songDetails.reduce((sum, s) => sum + s.basePrice, 0)
  const discountAmount = baseSongsCost * volumeDiscountPercentage
  const afterDiscountCost = baseSongsCost - discountAmount

  const vinylMasteringTotal = songDetails.reduce((sum, s) => sum + s.costs.vinylMastering, 0)
  const streamingMasteringTotal = songDetails.reduce((sum, s) => sum + s.costs.streamingMastering, 0)
  const redbookMasteringTotal = songDetails.reduce((sum, s) => sum + s.costs.redbookMastering, 0)
  const stemMasteringTotal = songDetails.reduce((sum, s) => sum + s.costs.stemMastering, 0)
  const restorationRemasteringTotal = songDetails.reduce((sum, s) => sum + s.costs.restorationRemastering, 0)

  // Calculate multimedia deal savings
  const vinylWithoutDeal = vinylCount * applyOptionDiscount(VINYL_MASTERING_PRICE, vinylCount)
  const streamingWithoutDeal = streamingCount * applyOptionDiscount(STREAMING_MASTERING_PRICE, streamingCount)
  const redbookWithoutDeal = redbookCount * applyOptionDiscount(REDBOOK_MASTERING_PRICE, redbookCount)
  const totalWithoutMultimediaDeal = vinylWithoutDeal + streamingWithoutDeal + redbookWithoutDeal
  const totalWithMultimediaDeal = vinylMasteringTotal + streamingMasteringTotal + redbookMasteringTotal
  const multimediaDealSavings = totalWithoutMultimediaDeal - totalWithMultimediaDeal

  const addOnsTotal =
    vinylMasteringTotal +
    streamingMasteringTotal +
    redbookMasteringTotal +
    stemMasteringTotal +
    restorationRemasteringTotal

  const highResMasterTotal = songDetails.reduce((sum, s) => sum + s.costs.highResMaster, 0)
  const ddpImageTotal = songDetails.reduce((sum, s) => sum + s.costs.ddpImage, 0)
  const isrcEncodingTotal = songDetails.reduce((sum, s) => sum + s.costs.isrcEncoding, 0)
  const rushDeliveryTotal = songDetails.reduce((sum, s) => sum + s.costs.rushDelivery, 0)

  // Calculate distribution deal savings
  let distributionDealSavings = 0
  songDetails.forEach((song) => {
    if (song.delivery.distributionDealType !== "none") {
      const { discount } = hasDistributionDeal(song.id, deliveryOptions)
      const highResWithoutDeal = song.delivery.highResMaster
        ? applyOptionDiscount(HIGH_RES_MASTER_PRICE, highResCount)
        : 0
      const ddpWithoutDeal = song.delivery.ddpImage ? applyOptionDiscount(DDP_IMAGE_PRICE, ddpCount) : 0
      const isrcWithoutDeal = song.delivery.isrcEncoding ? applyOptionDiscount(ISRC_ENCODING_PRICE, isrcCount) : 0
      const totalWithoutDeal = highResWithoutDeal + ddpWithoutDeal + isrcWithoutDeal
      const totalWithDeal = song.costs.highResMaster + song.costs.ddpImage + song.costs.isrcEncoding
      distributionDealSavings += totalWithoutDeal - totalWithDeal
    }
  })

  const deliveryTotal = highResMasterTotal + ddpImageTotal + isrcEncodingTotal + rushDeliveryTotal

  const virtualSessionCost = addOns.virtualSessionHours * VIRTUAL_SESSION_HOURLY_RATE

  const grandTotal = afterDiscountCost + addOnsTotal + deliveryTotal + virtualSessionCost

  return {
    totalSongs,
    totalLengthMinutes,
    totalLengthSeconds,
    formattedTotalLength,
    volumeDiscount: discountAmount,
    volumeDiscountPercentage,
    multimediaDealType,
    multimediaDealDiscount,
    multimediaDealName,
    songCountDealType,
    songCountDealName,
    virtualSessionHours: addOns.virtualSessionHours,
    virtualSessionCost,
    songs: songDetails,
    costs: {
      baseSongsCost,
      discountAmount,
      afterDiscountCost,
      vinylMasteringTotal,
      streamingMasteringTotal,
      redbookMasteringTotal,
      stemMasteringTotal,
      restorationRemasteringTotal,
      multimediaDealSavings,
      addOnsTotal,
      highResMasterTotal,
      ddpImageTotal,
      isrcEncodingTotal,
      rushDeliveryTotal,
      distributionDealSavings,
      deliveryTotal,
      virtualSession: virtualSessionCost,
      grandTotal,
    },
    summary: {
      songsWithVinylMastering: vinylCount,
      songsWithStreamingMastering: streamingCount,
      songsWithRedbookMastering: redbookCount,
      songsWithStemMastering: stemCount,
      songsWithRestorationRemastering: restorationCount,
      songsWithHighResMaster: highResCount,
      songsWithDdpImage: ddpCount,
      songsWithIsrcEncoding: isrcCount,
      songsWithRushDelivery: rushCount,
      songsWithExtendedLength: songDetails.filter((s) => s.isExtendedLength).length,
      songsWithDistributionDeal: songDetails.filter((s) => s.delivery.distributionDealType !== "none").length,
    },
    optionDiscounts,
  }
}