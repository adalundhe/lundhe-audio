import type { Product, ProductOption, Discount } from "~/server/db/types"
import type { PricingData, Song, AddOns, DeliveryOptions, QuoteData, SongPriceDetail } from "./pricing-types"
import { meetsThreshold } from "../meets-threshold"

// Helper to find a product by ID
function findProduct(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id)
}

// Helper to find an option by ID
function findOption(options: ProductOption[], id: string): ProductOption | undefined {
  return options.find((o) => o.id === id)
}

// Helper to find options by category
function findOptionsByCategory(options: ProductOption[], category: string): ProductOption[] {
  return options.filter((o) => o.category === category)
}

// Helper to find a discount by ID
function findDiscount(discounts: Discount[], id: string): Discount | undefined {
  return discounts.find((d) => d.id === id)
}

// Helper to find discounts by category
function findDiscountsByCategory(discounts: Discount[], category: string): Discount[] {
  return discounts.filter((d) => d.category === category)
}

// Get the applicable volume discount for songs
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

// Get the applicable option volume discount
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

// Get the applicable production deal discount
function getProductionDealDiscount(
  discounts: Discount[],
  addOns: AddOns,
): { discount: Discount | null; type: "none" | "production" | "premium" } {
  const hasVocal = addOns.vocalProductionSongs.length > 0
  const hasDrum = addOns.drumReplacementSongs.length > 0
  const hasGuitar = addOns.guitarReampSongs.length > 0
  const count = [hasVocal, hasDrum, hasGuitar].filter(Boolean).length

  if (count < 2) return { discount: null, type: "none" }

  // Production deals are in the "bundle" category
  const bundleDiscounts = findDiscountsByCategory(discounts, "bundle")

  // Check for premium first (all 3), then regular (2 of 3)
  if (count >= 3) {
    const premiumDeal = bundleDiscounts.find((d) => d.id === "premium_production_deal")
    if (premiumDeal) return { discount: premiumDeal, type: "premium" }
  }

  if (count >= 2) {
    const productionDeal = bundleDiscounts.find((d) => d.id === "production_deal")
    if (productionDeal) return { discount: productionDeal, type: "production" }
  }

  return { discount: null, type: "none" }
}

// Calculate base price for a song based on track count
function calculateSongBasePrice(
  products: Product[],
  options: ProductOption[],
  trackCount: number,
): { price: number; productId: string; productName: string; trackFee: number; isHighTrackCount: boolean } {
  const HIGH_TRACK_THRESHOLD = 50

  if (trackCount > HIGH_TRACK_THRESHOLD) {
    // High track count pricing
    const highTrackProduct = findProduct(products, "high_track_count_mix")
    const basePrice = highTrackProduct?.price ?? 500

    // Calculate additional track fees for high track count
    const trackFeeOptions = findOptionsByCategory(options, "track_fee").filter((o) =>
      o.id.startsWith("track_fee_high_"),
    )

    let trackFee = 0
    for (const opt of trackFeeOptions) {
      if (meetsThreshold(trackCount, opt.minThreshold, opt.maxThreshold)) {
        trackFee = opt.price
        break
      }
    }

    // If beyond defined tiers, extrapolate
    if (trackCount > 100) {
      const additionalTiers = Math.ceil((trackCount - 100) / 10)
      trackFee = 500 + additionalTiers * 100
    }

    return {
      price: basePrice,
      productId: "high_track_count_mix",
      productName: highTrackProduct?.name ?? "High Track Count Mix",
      trackFee,
      isHighTrackCount: true,
    }
  } else {
    // Standard pricing
    const songMixProduct = findProduct(products, "song_mix")
    const basePrice = songMixProduct?.price ?? 100

    // Calculate additional track fees
    const trackFeeOptions = findOptionsByCategory(options, "track_fee").filter(
      (o) => !o.id.startsWith("track_fee_high_"),
    )

    let trackFee = 0
    if (trackCount > 10) {
      // Find the right tier
      for (const opt of trackFeeOptions) {
        if (meetsThreshold(trackCount, opt.minThreshold, opt.maxThreshold)) {
          trackFee = opt.price
          break
        }
      }

      // If beyond defined tiers, extrapolate
      if (trackCount > 50 && trackFee === 0) {
        const additionalTiers = Math.ceil((trackCount - 10) / 10)
        trackFee = additionalTiers * 75
      }
    }

    return {
      price: basePrice,
      productId: "song_mix",
      productName: songMixProduct?.name ?? "Song Mix",
      trackFee,
      isHighTrackCount: false,
    }
  }
}

// Calculate extended length fee
function calculateLengthFee(
  options: ProductOption[],
  minutes: number,
  seconds: number,
): { fee: number; hasExtendedLength: boolean; feeAmount: number } {
  const totalMinutes = minutes + seconds / 60
  const lengthFeeOptions = findOptionsByCategory(options, "length_fee").sort(
    (a, b) => (b.minThreshold ?? 0) - (a.minThreshold ?? 0),
  )

  for (const opt of lengthFeeOptions) {
    const minThreshold = opt.minThreshold ?? 0
    if (totalMinutes > minThreshold) {
      return { fee: opt.price, hasExtendedLength: true, feeAmount: opt.price }
    }
  }

  return { fee: 0, hasExtendedLength: false, feeAmount: 0 }
}

// Calculate mixed stems price based on track count
function calculateMixedStemsPrice(options: ProductOption[], trackCount: number): number {
  const mixedStemsOption = findOption(options, "mixed_stems")
  if (!mixedStemsOption) return 20

  const basePrice = mixedStemsOption.price
  if (trackCount <= 10) return basePrice

  const additionalTiers = Math.ceil((trackCount - 10) / 10)
  return basePrice + additionalTiers * 5 // $5 per additional 10 tracks
}

// Apply discount percentage to a price
function applyDiscount(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100)
}

// Main function to build quote data from database pricing
export function buildQuoteDataFromDb(
  pricingData: PricingData,
  songs: Song[],
  addOns: AddOns,
  deliveryOptions: DeliveryOptions,
): QuoteData {
  const { products, options, discounts } = pricingData

  // Calculate totals
  const songCount = songs.length
  const trackCount = songs.reduce((sum, s) => sum + s.tracks, 0)
  const totalSeconds = songs.reduce((sum, s) => sum + s.minutes * 60 + s.seconds, 0)
  const totalLengthMinutes = Math.floor(totalSeconds / 60)
  const totalLengthSeconds = totalSeconds % 60

  // Get volume discount
  const volumeDiscount = getVolumeDiscount(discounts, songCount)
  const volumeDiscountPercentage = volumeDiscount?.discountPercentage ?? 0
  const volumeDiscountName = volumeDiscount?.name ?? null

  // Get production deal discount
  const { discount: productionDealDiscountObj, type: productionDealType } = getProductionDealDiscount(discounts, addOns)
  const productionDealPercentage = productionDealDiscountObj?.discountPercentage ?? 0
  const productionDealName = productionDealDiscountObj?.name ?? null

  // Get hi-fi deal discount
  const hifiDealDiscountObj = findDiscount(discounts, "hifi_deal")
  const hifiDealPercentage = hifiDealDiscountObj?.discountPercentage ?? 0

  // Get option counts for volume discounts
  const vocalCount = addOns.vocalProductionSongs.length
  const drumCount = addOns.drumReplacementSongs.length
  const guitarCount = addOns.guitarReampSongs.length
  const highResCount = deliveryOptions.highResMixdownSongs.length
  const filmMixdownCount = deliveryOptions.filmMixdownSongs.length
  const mixedStemsCount = deliveryOptions.mixedStemsSongs.length
  const extendedArchivalCount = deliveryOptions.extendedArchivalSongs.length
  const rushDeliveryCount = deliveryOptions.rushDeliverySongs.length

  // Get option-specific volume discounts
  const vocalVolumeDiscount = getOptionVolumeDiscount(discounts, vocalCount)
  const drumVolumeDiscount = getOptionVolumeDiscount(discounts, drumCount)
  const guitarVolumeDiscount = getOptionVolumeDiscount(discounts, guitarCount)
  const highResVolumeDiscount = getOptionVolumeDiscount(discounts, highResCount)
  const filmMixdownVolumeDiscount = getOptionVolumeDiscount(discounts, filmMixdownCount)
  const mixedStemsVolumeDiscount = getOptionVolumeDiscount(discounts, mixedStemsCount)
  const extendedArchivalVolumeDiscount = getOptionVolumeDiscount(discounts, extendedArchivalCount)
  const rushDeliveryVolumeDiscount = getOptionVolumeDiscount(discounts, rushDeliveryCount)

  // Get option prices from database
  const vocalOption = findOption(options, "vocal_production")
  const drumOption = findOption(options, "drum_replacement")
  const guitarOption = findOption(options, "guitar_reamp")
  const virtualSessionOption = findOption(options, "virtual_session")
  const highResOption = findOption(options, "high_res_mixdown")
  const filmMixdownOption = findOption(options, "film_mixdown")
  const extendedArchivalOption = findOption(options, "extended_archival")
  const rushDeliveryOption = findOption(options, "rush_delivery")

  const vocalPrice = vocalOption?.price ?? 100
  const drumPrice = drumOption?.price ?? 150
  const guitarPrice = guitarOption?.price ?? 50
  const virtualSessionHourlyRate = virtualSessionOption?.price ?? 100
  const highResPrice = highResOption?.price ?? 25
  const filmMixdownPrice = filmMixdownOption?.price ?? 20
  const extendedArchivalPrice = extendedArchivalOption?.price ?? 25

  // Build per-song details
  const songDetails: SongPriceDetail[] = songs.map((song, index) => {
    const {
      price: basePrice,
      productId,
      productName,
      trackFee,
      isHighTrackCount,
    } = calculateSongBasePrice(products, options, song.tracks)
    const {
      fee: lengthFee,
      hasExtendedLength,
      feeAmount: extendedLengthFeeAmount,
    } = calculateLengthFee(options, song.minutes, song.seconds)

    const hasVocal = addOns.vocalProductionSongs.includes(song.id)
    const hasDrum = addOns.drumReplacementSongs.includes(song.id)
    const hasGuitar = addOns.guitarReampSongs.includes(song.id)

    const hasHighRes = deliveryOptions.highResMixdownSongs.includes(song.id)
    const hasFilmMixdown = deliveryOptions.filmMixdownSongs.includes(song.id)
    const hasMixedStems = deliveryOptions.mixedStemsSongs.includes(song.id)
    const hasExtendedArchival = deliveryOptions.extendedArchivalSongs.includes(song.id)
    const hasRushDelivery = deliveryOptions.rushDeliverySongs.includes(song.id)

    // Check for hi-fi deal (both high res and film mixdown on same song)
    const hasHifiBundleOnSong = hasHighRes && hasFilmMixdown

    const songSubtotal = basePrice + trackFee + lengthFee

    return {
      songId: song.id,
      title: song.title || `Song ${index + 1}`,
      tracks: song.tracks,
      lengthMinutes: song.minutes + song.seconds / 60,
      productId,
      productName,
      basePrice,
      trackFee,
      lengthFee,
      hasHighTrackCount: isHighTrackCount,
      hasExtendedLength,
      extendedLengthFeeAmount,
      addOns: {
        vocalProduction: hasVocal,
        drumReplacement: hasDrum,
        guitarReamp: hasGuitar,
      },
      delivery: {
        highResMixdown: hasHighRes,
        filmMixdown: hasFilmMixdown,
        mixedStems: hasMixedStems,
        extendedArchival: hasExtendedArchival,
        rushDelivery: hasRushDelivery,
      },
      songSubtotal,
    }
  })

  // Calculate costs
  const baseSongsCost = songDetails.reduce((sum, s) => sum + s.songSubtotal, 0)
  const trackFeesCost = songDetails.reduce((sum, s) => sum + s.trackFee, 0)
  const lengthFeesCost = songDetails.reduce((sum, s) => sum + s.lengthFee, 0)
  const volumeDiscountAmount = baseSongsCost * (volumeDiscountPercentage / 100)

  // Calculate add-on costs with discounts
  let vocalProductionCost = 0
  let drumReplacementCost = 0
  let guitarReampCost = 0

  for (const song of songDetails) {
    if (song.addOns.vocalProduction) {
      let price = vocalPrice
      if (vocalVolumeDiscount) price = applyDiscount(price, vocalVolumeDiscount.discountPercentage)
      if (productionDealPercentage > 0) price = applyDiscount(price, productionDealPercentage)
      vocalProductionCost += price
    }
    if (song.addOns.drumReplacement) {
      let price = drumPrice
      if (drumVolumeDiscount) price = applyDiscount(price, drumVolumeDiscount.discountPercentage)
      if (productionDealPercentage > 0) price = applyDiscount(price, productionDealPercentage)
      drumReplacementCost += price
    }
    if (song.addOns.guitarReamp) {
      let price = guitarPrice
      if (guitarVolumeDiscount) price = applyDiscount(price, guitarVolumeDiscount.discountPercentage)
      if (productionDealPercentage > 0) price = applyDiscount(price, productionDealPercentage)
      guitarReampCost += price
    }
  }

  // Calculate production deal savings
  const vocalWithoutDeal =
    vocalCount * (vocalVolumeDiscount ? applyDiscount(vocalPrice, vocalVolumeDiscount.discountPercentage) : vocalPrice)
  const drumWithoutDeal =
    drumCount * (drumVolumeDiscount ? applyDiscount(drumPrice, drumVolumeDiscount.discountPercentage) : drumPrice)
  const guitarWithoutDeal =
    guitarCount *
    (guitarVolumeDiscount ? applyDiscount(guitarPrice, guitarVolumeDiscount.discountPercentage) : guitarPrice)
  const totalWithoutProductionDeal = vocalWithoutDeal + drumWithoutDeal + guitarWithoutDeal
  const totalWithProductionDeal = vocalProductionCost + drumReplacementCost + guitarReampCost
  const productionDealDiscount = totalWithoutProductionDeal - totalWithProductionDeal

  // Virtual session cost
  const virtualSessionHours = addOns.virtualSessionHours
  const virtualSessionCost = virtualSessionHours * virtualSessionHourlyRate

  // Calculate delivery costs with discounts
  let highResMixdownCost = 0
  let filmMixdownCost = 0
  let mixedStemsCost = 0
  let extendedArchivalCost = 0
  let rushDeliveryCost = 0
  let hifiDealDiscountAmount = 0
  let hifiDealSongCount = 0

  for (const song of songDetails) {
    const hasHifiBundleOnSong = song.delivery.highResMixdown && song.delivery.filmMixdown

    if (song.delivery.highResMixdown) {
      let price = highResPrice
      if (highResVolumeDiscount) price = applyDiscount(price, highResVolumeDiscount.discountPercentage)
      if (hasHifiBundleOnSong) {
        const beforeBundle = price
        price = applyDiscount(price, hifiDealPercentage)
        hifiDealDiscountAmount += beforeBundle - price
        hifiDealSongCount++
      }
      highResMixdownCost += price
    }

    if (song.delivery.filmMixdown) {
      let price = filmMixdownPrice
      if (filmMixdownVolumeDiscount) price = applyDiscount(price, filmMixdownVolumeDiscount.discountPercentage)
      if (hasHifiBundleOnSong) {
        const beforeBundle = price
        price = applyDiscount(price, hifiDealPercentage)
        hifiDealDiscountAmount += beforeBundle - price
      }
      filmMixdownCost += price
    }

    if (song.delivery.mixedStems) {
      const songData = songs.find((s) => s.id === song.songId)
      let price = calculateMixedStemsPrice(options, songData?.tracks ?? 0)
      if (mixedStemsVolumeDiscount) price = applyDiscount(price, mixedStemsVolumeDiscount.discountPercentage)
      mixedStemsCost += price
    }

    if (song.delivery.extendedArchival) {
      let price = extendedArchivalPrice
      if (extendedArchivalVolumeDiscount)
        price = applyDiscount(price, extendedArchivalVolumeDiscount.discountPercentage)
      extendedArchivalCost += price
    }

    if (song.delivery.rushDelivery) {
      let price = song.songSubtotal // Rush doubles the base cost
      if (rushDeliveryVolumeDiscount) price = applyDiscount(price, rushDeliveryVolumeDiscount.discountPercentage)
      rushDeliveryCost += price
    }
  }

  const subtotal =
    baseSongsCost -
    volumeDiscountAmount +
    vocalProductionCost +
    drumReplacementCost +
    guitarReampCost +
    virtualSessionCost +
    highResMixdownCost +
    filmMixdownCost +
    mixedStemsCost +
    extendedArchivalCost +
    rushDeliveryCost

  const total = subtotal

  return {
    songs: songDetails,
    totals: {
      songCount,
      trackCount,
      totalLengthMinutes,
      totalLengthSeconds,
    },
    costs: {
      baseSongsCost,
      trackFeesCost,
      lengthFeesCost,
      volumeDiscount: volumeDiscountAmount,
      volumeDiscountName,
      vocalProductionCost,
      drumReplacementCost,
      guitarReampCost,
      productionDealDiscount,
      productionDealName,
      virtualSessionCost,
      virtualSessionHours,
      highResMixdownCost,
      filmMixdownCost,
      hifiDealDiscount: hifiDealDiscountAmount,
      hifiDealSongCount,
      mixedStemsCost,
      extendedArchivalCost,
      rushDeliveryCost,
      subtotal,
      total,
    },
    summary: {
      hasHighTrackCountSongs: songDetails.filter((s) => s.hasHighTrackCount).length,
      hasExtendedLengthSongs: songDetails.filter((s) => s.hasExtendedLength).length,
      vocalProductionCount: vocalCount,
      drumReplacementCount: drumCount,
      guitarReampCount: guitarCount,
      highResMixdownCount: highResCount,
      filmMixdownCount: filmMixdownCount,
      mixedStemsCount,
      extendedArchivalCount,
      rushDeliveryCount,
    },
  }
}

// Helper function to get volume discount info for display
export function getVolumeDiscountInfo(discounts: Discount[]): { epDeal: Discount | null; albumDeal: Discount | null } {
  const volumeDiscounts = findDiscountsByCategory(discounts, "volume")
  return {
    epDeal: volumeDiscounts.find((d) => d.id === "ep_deal") ?? null,
    albumDeal: volumeDiscounts.find((d) => d.id === "album_deal") ?? null,
  }
}

// Helper function to get option volume discount info for display
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
