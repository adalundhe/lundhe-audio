import type { Song, AddOns, DeliveryOptions } from "./pricing-types"

export const BASE_PRICE_1_TO_10_TRACKS = 100
export const ADDITIONAL_TIER_PRICE = 75
export const HIGH_TRACK_COUNT_THRESHOLD = 50
export const HIGH_TRACK_BASE_PRICE = 500
export const HIGH_TRACK_ADDITIONAL_TIER_PRICE = 100

// Song count discount constants
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

export const EXTENDED_LENGTH_FEES = {
  over5min: 50,
  over10min: 100,
  over15min: 200,
}

export const VOCAL_PRODUCTION_PRICE = 100
export const DRUM_REPLACEMENT_PRICE = 150
export const GUITAR_REAMP_PRICE = 50

export const VIRTUAL_SESSION_HOURLY_RATE = 100
export const VIRTUAL_SESSION_MIN_HOURS = 4

export const HIGH_RES_PRICE = 25
export const FILM_MIXDOWN_PRICE = 20
export const EXTENDED_ARCHIVAL_PRICE = 25
export const MIXED_STEMS_BASE_PRICE = 20
export const MIXED_STEMS_ADDITIONAL_TIER_PRICE = 5

export const OPTION_DISCOUNT_5_PLUS = 0.15 // 15% discount for 5+ songs with option
export const OPTION_DISCOUNT_10_PLUS = 0.25 // 25% discount for 10+ songs with option

export const PRODUCTION_DEAL_DISCOUNT = 0.15 // 15% discount for selecting 2 production add-ons
export const PREMIUM_PRODUCTION_DEAL_DISCOUNT = 0.25 // 25% discount for selecting all 3 production add-ons

export const MIXDOWN_BUNDLE_DISCOUNT = 0.1 // 10% discount when both High Res and Film Mixdown are selected for same song

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

export function hasMixdownBundle(songId: string, deliveryOptions: DeliveryOptions): boolean {
  return deliveryOptions.highResMixdownSongs.includes(songId) && deliveryOptions.filmMixdownSongs.includes(songId)
}

export function applyMixdownBundleDiscount(price: number, songId: string, deliveryOptions: DeliveryOptions): number {
  if (hasMixdownBundle(songId, deliveryOptions)) {
    return price * (1 - MIXDOWN_BUNDLE_DISCOUNT)
  }
  return price
}

export type ProductionDealType = "none" | "production" | "premium"

export function getProductionDealType(addOns: AddOns): ProductionDealType {
  const hasVocal = addOns.vocalProductionSongs.length > 0
  const hasDrum = addOns.drumReplacementSongs.length > 0
  const hasGuitar = addOns.guitarReampSongs.length > 0

  const count = [hasVocal, hasDrum, hasGuitar].filter(Boolean).length

  if (count >= 3) return "premium"
  if (count >= 2) return "production"
  return "none"
}

export function getProductionDealDiscount(dealType: ProductionDealType): number {
  if (dealType === "premium") return PREMIUM_PRODUCTION_DEAL_DISCOUNT
  if (dealType === "production") return PRODUCTION_DEAL_DISCOUNT
  return 0
}

export function applyAllAddOnDiscounts(
  price: number,
  selectedCount: number,
  productionDealType: ProductionDealType,
): number {
  // First apply volume discount
  const afterVolumeDiscount = applyOptionDiscount(price, selectedCount)
  // Then apply production deal discount on top
  const productionDiscount = getProductionDealDiscount(productionDealType)
  return afterVolumeDiscount * (1 - productionDiscount)
}

export type SongPricingDetail = {
  id: string
  title: string
  tracks: number
  minutes: number
  seconds: number
  baseTrackPrice: number
  extendedLengthFee: number
  hasHighTrackCount: boolean
  hasExtendedLengthFee: boolean
  hasMixdownBundle: boolean
  // Add-ons applied to this song
  addOns: {
    vocalProduction: boolean
    drumReplacement: boolean
    guitarReamp: boolean
  }
  // Delivery options applied to this song
  delivery: {
    highResolution: boolean
    filmMixdown: boolean
    mixedStems: boolean
    extendedArchival: boolean
    rushDelivery: boolean
  }
  // Per-song costs
  costs: {
    base: number
    vocalProduction: number
    drumReplacement: number
    guitarReamp: number
    highResolution: number
    filmMixdown: number
    mixedStems: number
    extendedArchival: number
    rushDelivery: number
    subtotal: number
  }
}

export type QuoteData = {
  // Project totals
  totalSongs: number
  totalTracks: number
  totalLengthMinutes: number
  totalLengthSeconds: number
  formattedTotalLength: string

  // Discount info
  volumeDiscount: number
  volumeDiscountPercentage: number

  productionDealType: ProductionDealType
  productionDealDiscount: number

  songCountDealType: SongCountDealType
  songCountDealName: string

  // Virtual session
  virtualSessionHours: number
  virtualSessionCost: number

  // Per-song details
  songs: SongPricingDetail[]

  // Cost breakdown
  costs: {
    baseSongsCost: number
    discountAmount: number
    afterDiscountCost: number
    vocalProductionTotal: number
    drumReplacementTotal: number
    guitarReampTotal: number
    productionDealSavings: number
    addOnsTotal: number
    highResolutionTotal: number
    filmMixdownTotal: number
    mixdownBundleSavings: number
    mixedStemsTotal: number
    extendedArchivalTotal: number
    rushDeliveryTotal: number
    deliveryTotal: number
    virtualSession: number
    grandTotal: number
  }

  // Summary counts
  summary: {
    songsWithVocalProduction: number
    songsWithDrumReplacement: number
    songsWithGuitarReamp: number
    songsWithHighResolution: number
    songsWithFilmMixdown: number
    songsWithMixedStems: number
    songsWithExtendedArchival: number
    songsWithRushDelivery: number
    songsWithHighTrackCount: number
    songsWithExtendedLength: number
    songsWithMixdownBundle: number
  }

  optionDiscounts: {
    vocalProduction: { count: number; discount: number; discountPercentage: number }
    drumReplacement: { count: number; discount: number; discountPercentage: number }
    guitarReamp: { count: number; discount: number; discountPercentage: number }
    highResolution: { count: number; discount: number; discountPercentage: number }
    filmMixdown: { count: number; discount: number; discountPercentage: number }
    mixedStems: { count: number; discount: number; discountPercentage: number }
    extendedArchival: { count: number; discount: number; discountPercentage: number }
    rushDelivery: { count: number; discount: number; discountPercentage: number }
  }
}

export function calculateMixedStemsPrice(trackCount: number): number {
  if (trackCount <= 10) return MIXED_STEMS_BASE_PRICE
  const additionalTiers = Math.ceil((trackCount - 10) / 10)
  return MIXED_STEMS_BASE_PRICE + additionalTiers * MIXED_STEMS_ADDITIONAL_TIER_PRICE
}

export function getExtendedLengthFee(minutes: number, seconds: number): number {
  const totalMinutes = minutes + seconds / 60
  if (totalMinutes > 15) return EXTENDED_LENGTH_FEES.over15min
  if (totalMinutes > 10) return EXTENDED_LENGTH_FEES.over10min
  if (totalMinutes > 5) return EXTENDED_LENGTH_FEES.over5min
  return 0
}

export function hasExtendedLengthFee(minutes: number, seconds: number): boolean {
  const totalMinutes = minutes + seconds / 60
  return totalMinutes > 5
}

export function calculateSingleSongPrice(trackCount: number): number {
  if (trackCount <= 0) return 0

  if (trackCount > HIGH_TRACK_COUNT_THRESHOLD) {
    const additionalTracks = trackCount - HIGH_TRACK_COUNT_THRESHOLD
    const additionalTiers = Math.ceil(additionalTracks / 10)
    return HIGH_TRACK_BASE_PRICE + additionalTiers * HIGH_TRACK_ADDITIONAL_TIER_PRICE
  } else {
    if (trackCount <= 10) {
      return BASE_PRICE_1_TO_10_TRACKS
    }
    const additionalTracks = trackCount - 10
    const additionalTiers = Math.ceil(additionalTracks / 10)
    return BASE_PRICE_1_TO_10_TRACKS + additionalTiers * ADDITIONAL_TIER_PRICE
  }
}

export function calculateFullSongPrice(song: Song): number {
  const trackPrice = calculateSingleSongPrice(song.tracks)
  const lengthFee = getExtendedLengthFee(song.minutes, song.seconds)
  return trackPrice + lengthFee
}

export function hasHighTrackCount(trackCount: number): boolean {
  return trackCount > HIGH_TRACK_COUNT_THRESHOLD
}

export function calculateSongCost(songs: Song[]): number {
  if (songs.length === 0) return 0

  let totalBaseCost = songs.reduce((sum, song) => sum + calculateFullSongPrice(song), 0)

  // Apply volume discount based on song count
  if (songs.length >= 10) {
    totalBaseCost = totalBaseCost * (1 - DISCOUNT_10_PLUS_SONGS)
  } else if (songs.length >= 5) {
    totalBaseCost = totalBaseCost * (1 - DISCOUNT_5_TO_9_SONGS)
  }

  return totalBaseCost
}

export function calculateDeliveryCost(songs: Song[], deliveryOptions: DeliveryOptions): number {
  let total = 0

  const highResCount = deliveryOptions.highResMixdownSongs.length
  const filmMixdownCount = deliveryOptions.filmMixdownSongs.length
  const extendedArchivalCount = deliveryOptions.extendedArchivalSongs.length
  const mixedStemsCount = deliveryOptions.mixedStemsSongs.length
  const rushDeliveryCount = deliveryOptions.rushDeliverySongs.length

  // High Resolution: $25/song with volume discount
  total += highResCount * applyOptionDiscount(HIGH_RES_PRICE, highResCount)

  // Film Mixdown: $20/song with volume discount
  total += filmMixdownCount * applyOptionDiscount(FILM_MIXDOWN_PRICE, filmMixdownCount)

  // Extended Archival: $25/song with volume discount
  total += extendedArchivalCount * applyOptionDiscount(EXTENDED_ARCHIVAL_PRICE, extendedArchivalCount)

  // Mixed Stems: scales with track count, with volume discount
  for (const songId of deliveryOptions.mixedStemsSongs) {
    const song = songs.find((s) => s.id === songId)
    if (song) {
      total += applyOptionDiscount(calculateMixedStemsPrice(song.tracks), mixedStemsCount)
    }
  }

  // Rush Delivery: doubles the song cost, with volume discount
  for (const songId of deliveryOptions.rushDeliverySongs) {
    const song = songs.find((s) => s.id === songId)
    if (song) {
      total += applyOptionDiscount(calculateFullSongPrice(song), rushDeliveryCount)
    }
  }

  return total
}

export function calculateTotalPrice(songs: Song[], addOns: AddOns, deliveryOptions: DeliveryOptions): number {
  const songCost = calculateSongCost(songs)

  const vocalCount = addOns.vocalProductionSongs.length
  const drumCount = addOns.drumReplacementSongs.length
  const guitarCount = addOns.guitarReampSongs.length

  const vocalProductionCost = vocalCount * applyOptionDiscount(VOCAL_PRODUCTION_PRICE, vocalCount)
  const drumReplacementCost = drumCount * applyOptionDiscount(DRUM_REPLACEMENT_PRICE, drumCount)
  const guitarReampCost = guitarCount * applyOptionDiscount(GUITAR_REAMP_PRICE, guitarCount)
  const perSongAddOnsCost = vocalProductionCost + drumReplacementCost + guitarReampCost

  const virtualSessionCost = addOns.virtualSessionHours * VIRTUAL_SESSION_HOURLY_RATE

  const deliveryCost = calculateDeliveryCost(songs, deliveryOptions)

  return songCost + perSongAddOnsCost + virtualSessionCost + deliveryCost
}

export function buildQuoteData(songs: Song[], addOns: AddOns, deliveryOptions: DeliveryOptions): QuoteData {
  const totalSongs = songs.length
  const totalTracks = songs.reduce((sum, s) => sum + s.tracks, 0)
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

  const productionDealType = getProductionDealType(addOns)
  const productionDealDiscount = getProductionDealDiscount(productionDealType)

  const songCountDealType = getSongCountDealType(totalSongs)
  const songCountDealName = getSongCountDealName(songCountDealType)

  const vocalCount = addOns.vocalProductionSongs.length
  const drumCount = addOns.drumReplacementSongs.length
  const guitarCount = addOns.guitarReampSongs.length
  const highResCount = deliveryOptions.highResMixdownSongs.length
  const filmMixdownCount = deliveryOptions.filmMixdownSongs.length
  const mixedStemsCount = deliveryOptions.mixedStemsSongs.length
  const extendedArchivalCount = deliveryOptions.extendedArchivalSongs.length
  const rushDeliveryCount = deliveryOptions.rushDeliverySongs.length

  const optionDiscounts = {
    vocalProduction: {
      count: vocalCount,
      discount: getOptionDiscount(vocalCount),
      discountPercentage: getOptionDiscount(vocalCount) * 100,
    },
    drumReplacement: {
      count: drumCount,
      discount: getOptionDiscount(drumCount),
      discountPercentage: getOptionDiscount(drumCount) * 100,
    },
    guitarReamp: {
      count: guitarCount,
      discount: getOptionDiscount(guitarCount),
      discountPercentage: getOptionDiscount(guitarCount) * 100,
    },
    highResolution: {
      count: highResCount,
      discount: getOptionDiscount(highResCount),
      discountPercentage: getOptionDiscount(highResCount) * 100,
    },
    filmMixdown: {
      count: filmMixdownCount,
      discount: getOptionDiscount(filmMixdownCount),
      discountPercentage: getOptionDiscount(filmMixdownCount) * 100,
    },
    mixedStems: {
      count: mixedStemsCount,
      discount: getOptionDiscount(mixedStemsCount),
      discountPercentage: getOptionDiscount(mixedStemsCount) * 100,
    },
    extendedArchival: {
      count: extendedArchivalCount,
      discount: getOptionDiscount(extendedArchivalCount),
      discountPercentage: getOptionDiscount(extendedArchivalCount) * 100,
    },
    rushDelivery: {
      count: rushDeliveryCount,
      discount: getOptionDiscount(rushDeliveryCount),
      discountPercentage: getOptionDiscount(rushDeliveryCount) * 100,
    },
  }

  // Build per-song details
  const songDetails: SongPricingDetail[] = songs.map((song) => {
    const baseTrackPrice = calculateSingleSongPrice(song.tracks)
    const extendedLengthFee = getExtendedLengthFee(song.minutes, song.seconds)
    const songHasHighTrackCount = hasHighTrackCount(song.tracks)
    const songHasExtendedLengthFee = hasExtendedLengthFee(song.minutes, song.seconds)
    const songHasMixdownBundle = hasMixdownBundle(song.id, deliveryOptions)

    const hasVocalProduction = addOns.vocalProductionSongs.includes(song.id)
    const hasDrumReplacement = addOns.drumReplacementSongs.includes(song.id)
    const hasGuitarReamp = addOns.guitarReampSongs.includes(song.id)

    const hasHighResolution = deliveryOptions.highResMixdownSongs.includes(song.id)
    const hasFilmMixdown = deliveryOptions.filmMixdownSongs.includes(song.id)
    const hasMixedStems = deliveryOptions.mixedStemsSongs.includes(song.id)
    const hasExtendedArchival = deliveryOptions.extendedArchivalSongs.includes(song.id)
    const hasRushDelivery = deliveryOptions.rushDeliverySongs.includes(song.id)

    const baseCost = baseTrackPrice + extendedLengthFee

    const vocalProductionCost = hasVocalProduction
      ? applyAllAddOnDiscounts(VOCAL_PRODUCTION_PRICE, vocalCount, productionDealType)
      : 0
    const drumReplacementCost = hasDrumReplacement
      ? applyAllAddOnDiscounts(DRUM_REPLACEMENT_PRICE, drumCount, productionDealType)
      : 0
    const guitarReampCost = hasGuitarReamp
      ? applyAllAddOnDiscounts(GUITAR_REAMP_PRICE, guitarCount, productionDealType)
      : 0

    let highResolutionCost = hasHighResolution ? applyOptionDiscount(HIGH_RES_PRICE, highResCount) : 0
    let filmMixdownCost = hasFilmMixdown ? applyOptionDiscount(FILM_MIXDOWN_PRICE, filmMixdownCount) : 0

    // Apply mixdown bundle discount on top of volume discount
    if (songHasMixdownBundle) {
      highResolutionCost = highResolutionCost * (1 - MIXDOWN_BUNDLE_DISCOUNT)
      filmMixdownCost = filmMixdownCost * (1 - MIXDOWN_BUNDLE_DISCOUNT)
    }

    const mixedStemsCost = hasMixedStems
      ? applyOptionDiscount(calculateMixedStemsPrice(song.tracks), mixedStemsCount)
      : 0
    const extendedArchivalCost = hasExtendedArchival
      ? applyOptionDiscount(EXTENDED_ARCHIVAL_PRICE, extendedArchivalCount)
      : 0
    const rushDeliveryCost = hasRushDelivery ? applyOptionDiscount(baseCost, rushDeliveryCount) : 0

    const subtotal =
      baseCost +
      vocalProductionCost +
      drumReplacementCost +
      guitarReampCost +
      highResolutionCost +
      filmMixdownCost +
      mixedStemsCost +
      extendedArchivalCost +
      rushDeliveryCost

    return {
      id: song.id,
      title: song.title || `Song ${songs.indexOf(song) + 1}`,
      tracks: song.tracks,
      minutes: song.minutes,
      seconds: song.seconds,
      baseTrackPrice,
      extendedLengthFee,
      hasHighTrackCount: songHasHighTrackCount,
      hasExtendedLengthFee: songHasExtendedLengthFee,
      hasMixdownBundle: songHasMixdownBundle,
      addOns: {
        vocalProduction: hasVocalProduction,
        drumReplacement: hasDrumReplacement,
        guitarReamp: hasGuitarReamp,
      },
      delivery: {
        highResolution: hasHighResolution,
        filmMixdown: hasFilmMixdown,
        mixedStems: hasMixedStems,
        extendedArchival: hasExtendedArchival,
        rushDelivery: hasRushDelivery,
      },
      costs: {
        base: baseCost,
        vocalProduction: vocalProductionCost,
        drumReplacement: drumReplacementCost,
        guitarReamp: guitarReampCost,
        highResolution: highResolutionCost,
        filmMixdown: filmMixdownCost,
        mixedStems: mixedStemsCost,
        extendedArchival: extendedArchivalCost,
        rushDelivery: rushDeliveryCost,
        subtotal,
      },
    }
  })

  // Calculate totals
  const baseSongsCost = songDetails.reduce((sum, s) => sum + s.costs.base, 0)
  const discountAmount = baseSongsCost * volumeDiscountPercentage
  const afterDiscountCost = baseSongsCost - discountAmount

  const vocalProductionTotal = songDetails.reduce((sum, s) => sum + s.costs.vocalProduction, 0)
  const drumReplacementTotal = songDetails.reduce((sum, s) => sum + s.costs.drumReplacement, 0)
  const guitarReampTotal = songDetails.reduce((sum, s) => sum + s.costs.guitarReamp, 0)

  const vocalWithoutDeal = vocalCount * applyOptionDiscount(VOCAL_PRODUCTION_PRICE, vocalCount)
  const drumWithoutDeal = drumCount * applyOptionDiscount(DRUM_REPLACEMENT_PRICE, drumCount)
  const guitarWithoutDeal = guitarCount * applyOptionDiscount(GUITAR_REAMP_PRICE, guitarCount)
  const totalWithoutDeal = vocalWithoutDeal + drumWithoutDeal + guitarWithoutDeal
  const totalWithDeal = vocalProductionTotal + drumReplacementTotal + guitarReampTotal
  const productionDealSavings = totalWithoutDeal - totalWithDeal

  const addOnsTotal = vocalProductionTotal + drumReplacementTotal + guitarReampTotal

  const highResolutionTotal = songDetails.reduce((sum, s) => sum + s.costs.highResolution, 0)
  const filmMixdownTotal = songDetails.reduce((sum, s) => sum + s.costs.filmMixdown, 0)

  let mixdownBundleSavings = 0
  songDetails.forEach((song) => {
    if (song.hasMixdownBundle) {
      // Calculate what it would have been without bundle discount
      const highResWithoutBundle = applyOptionDiscount(HIGH_RES_PRICE, highResCount)
      const filmWithoutBundle = applyOptionDiscount(FILM_MIXDOWN_PRICE, filmMixdownCount)
      const totalWithoutBundle = highResWithoutBundle + filmWithoutBundle
      const totalWithBundle = song.costs.highResolution + song.costs.filmMixdown
      mixdownBundleSavings += totalWithoutBundle - totalWithBundle
    }
  })

  const mixedStemsTotal = songDetails.reduce((sum, s) => sum + s.costs.mixedStems, 0)
  const extendedArchivalTotal = songDetails.reduce((sum, s) => sum + s.costs.extendedArchival, 0)
  const rushDeliveryTotal = songDetails.reduce((sum, s) => sum + s.costs.rushDelivery, 0)
  const deliveryTotal =
    highResolutionTotal + filmMixdownTotal + mixedStemsTotal + extendedArchivalTotal + rushDeliveryTotal

  const virtualSessionCost = addOns.virtualSessionHours * VIRTUAL_SESSION_HOURLY_RATE

  const grandTotal = afterDiscountCost + addOnsTotal + deliveryTotal + virtualSessionCost

  return {
    totalSongs,
    totalTracks,
    totalLengthMinutes,
    totalLengthSeconds,
    formattedTotalLength,
    volumeDiscount: discountAmount,
    volumeDiscountPercentage,
    productionDealType,
    productionDealDiscount,
    songCountDealType,
    songCountDealName,
    virtualSessionHours: addOns.virtualSessionHours,
    virtualSessionCost,
    songs: songDetails,
    optionDiscounts,
    costs: {
      baseSongsCost,
      discountAmount,
      afterDiscountCost,
      vocalProductionTotal,
      drumReplacementTotal,
      guitarReampTotal,
      productionDealSavings,
      addOnsTotal,
      highResolutionTotal,
      filmMixdownTotal,
      mixdownBundleSavings,
      mixedStemsTotal,
      extendedArchivalTotal,
      rushDeliveryTotal,
      deliveryTotal,
      virtualSession: virtualSessionCost,
      grandTotal,
    },
    summary: {
      songsWithVocalProduction: songDetails.filter((s) => s.addOns.vocalProduction).length,
      songsWithDrumReplacement: songDetails.filter((s) => s.addOns.drumReplacement).length,
      songsWithGuitarReamp: songDetails.filter((s) => s.addOns.guitarReamp).length,
      songsWithHighResolution: songDetails.filter((s) => s.delivery.highResolution).length,
      songsWithFilmMixdown: songDetails.filter((s) => s.delivery.filmMixdown).length,
      songsWithMixedStems: songDetails.filter((s) => s.delivery.mixedStems).length,
      songsWithExtendedArchival: songDetails.filter((s) => s.delivery.extendedArchival).length,
      songsWithRushDelivery: songDetails.filter((s) => s.delivery.rushDelivery).length,
      songsWithHighTrackCount: songDetails.filter((s) => s.hasHighTrackCount).length,
      songsWithExtendedLength: songDetails.filter((s) => s.hasExtendedLengthFee).length,
      songsWithMixdownBundle: songDetails.filter((s) => s.hasMixdownBundle).length,
    },
  }
}
