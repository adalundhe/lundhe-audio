import type { Product, ProductOption, Discount } from "~/server/db/types"
import type { 
  MasteringPricingData,
  MasteringQuoteData,
  MasteringDiscountDealSet,
  MasteringDealBreakdown,
  MasteringAddOns,
  MasteringDeliveryOptions,
  MasteringSong,
} from "./pricing-types"
import { meetsThreshold } from "../meets-threshold"



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

export function getIncludedRevisions(songCount: number, discounts: Discount[]): number {

  const standardRevisionDiscount = discounts.find((p) => p.id === "standard_revision_bundle")
  const deluxeRevisionDiscount = discounts.find((p) => p.id === "deluxe_revision_bundle")
  const premiumRevisionDiscount = discounts.find((p) => p.id === "premium_revision_bundle")
  

  if (songCount >= 10) return premiumRevisionDiscount?.minThreshold ?? 8
  if (songCount >= 5) return deluxeRevisionDiscount?.minThreshold ?? 5
  return standardRevisionDiscount?.minThreshold ?? 3
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
  const volumeDiscounts = findDiscountsByCategory(discounts, "volume").filter(discount => ![
    discounts.find(d => d.id === "standard_revision_bundle")?.id ?? "",
    discounts.find(d => d.id === "deluxe_revision_bundle")?.id ?? "",
    discounts.find(d => d.id === "premium_revision_bundle")?.id ?? "",

  ].includes(discount.id))

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
  songId: string
): { discount: Discount | null; type: "none" | "multimedia" | "premium_multimedia" } {
  const hasVinyl = addOns.vinylMasteringSongs.includes(songId)
  const hasStreaming = addOns.streamingMasteringSongs.includes(songId)
  const hasRedbook = addOns.redbookMasteringSongs.includes(songId)
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

function applyDiscount(price: number, discountPercentage: number): number {
  return price * (1 - discountPercentage / 100)
}

export function getStemMasteringPrice(options: ProductOption[], stemCount: number): number {

  const stemMasterOption = findOption(options, "stem_master")

  if (!stemMasterOption){
    return 0
  }


  return stemMasterOption.price * Math.max(Math.ceil(stemCount/stemMasterOption.perCount), 1)
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

    const multimedialDealCount = [hasVinyl, hasStreaming, hasRedbook].filter(Boolean).length
    const distroDealCount = [hasHighRes, hasDdpImage, hasRedbook].filter(Boolean).length

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
        multimedialDeal: multimedialDealCount >= 3 ? 'premium' : multimedialDealCount == 2 ? 'standard' : 'none'
      },
      delivery: {
        highResMaster: hasHighRes,
        ddpImage: hasDdpImage,
        isrcEncoding: hasIsrcEncoding,
        rushDelivery: hasRushDelivery,
        distributionDeal: distroDealCount >= 3 ? 'premium' : distroDealCount == 2 ? 'standard' : 'none'
      },
      songSubtotal: basePrice + extendedLengthFeeAmount,
    }
  })

  // Calculate costs
  const baseSongsCost = songDetails.reduce((sum, s) => sum + s.songSubtotal, 0)
  const lengthFeesCost = songDetails.reduce((sum, s) => sum + s.extendedLengthFeeAmount, 0)
  const volumeDiscountAmount = baseSongsCost * (volumeDiscountPercentage / 100)

  // Calculate add-on costs
  let vinylMasteringCost = 0
  let vinylMasteringPreDiscountCost = 0
  let vinylMasteringDiscountAmount = 0
  let streamingMasteringCost = 0
  let streamingMasteringPreDiscountCost = 0
  let streamingMasteringDiscountAmount = 0
  let redbookMasteringCost = 0
  let redbookMasteringPreDiscountCost = 0
  let redbookMasteringDiscountAmount = 0
  let stemMasteringCost = 0
  let stemMasteringPreDiscountCost = 0
  let stemMasteringDiscountAmount = 0
  let restorationRemasteringCost = 0
  let restorationRemastringPreDiscountCost = 0
  let restorationRemasteringDiscountAmount = 0

  let multimediaDealName = undefined
  let premiumMultimediaDealName = undefined
  let multimediaDealSongCount = 0
  let multiMediaDeals: MasteringDiscountDealSet = {}
  let premiumMultiMdediaDealDiscountAmount = 0
  let standardMultiMediaDealDiscountAmount = 0
  let premiumDistributionDealDiscountAmount = 0
  let standardDistributionDealDiscountAmount = 0

  const masteringDealBreakdown: MasteringDealBreakdown = {
    vinyl: {
      premium: 0,
      standard: 0
    },
    streaming: {
      premium: 0,
      standard: 0
    },
    redbook: {
      premium: 0,
      standard: 0
    },
    restoration: {
      premium: 0,
      standard: 0
    },
    stems: {
      premium: 0,
      standard: 0
    },
    highres: {
      premium: 0,
      standard: 0
    },
    ddpimage: {
      premium: 0,
      standard: 0
    },
    isrcencode: {
      premium: 0,
      standard: 0
    },
    rush: {
      premium: 0,
      standard: 0
    }
  }

  const revisionProduct = findProduct(products, "revision")
    const revisionPrice = revisionProduct?.price ?? 250
  
    const includedRevisions = getIncludedRevisions(songCount, discounts)
    const includedRevisionsCost = includedRevisions * revisionPrice
  
    const additionalRevisions = addOns.revisions ?? 0
    const revisionVolumeDiscounts = findDiscountsByCategory(discounts, "volume").filter(
      discount => [
        "standard_revision_bundle",
        "deluxe_revision_bundle",
        "premium_revision_bundle"
      ].includes(discount.id)
    )
    let revisionDiscountPercentage = 0
    let revisionDealName: string | undefined = undefined
    for (const discount of revisionVolumeDiscounts) {
      if (meetsThreshold(additionalRevisions, discount.minThreshold, discount.maxThreshold)) {
        if (discount.discountPercentage > revisionDiscountPercentage) {
          revisionDiscountPercentage = discount.discountPercentage
          revisionDealName = discount.name
        }
      }
    }
  
    const preDiscountRevisionPrice = additionalRevisions * revisionPrice
    const additionalRevisionsCost = additionalRevisions * revisionPrice * (1 - revisionDiscountPercentage / 100)
    const revisionsDiscountAmount = preDiscountRevisionPrice - additionalRevisionsCost

  for (const song of songDetails) {

    // Get multimedia deal discount
    const { discount: multimediaDealObj } = getMultimediaDealDiscount(discounts, addOns, song.songId)
    const multimediaDealPercentage = multimediaDealObj?.discountPercentage ?? 0

    if (multimediaDealObj?.id.includes("premium")) {
      premiumMultimediaDealName = multimediaDealObj.name

    } else if (multimediaDealObj) {
      multimediaDealName = multimediaDealObj.name
    }

    // Vinyl mastering (multimedia deal eligible)
    if (song.addOns.vinylMastering) {
      let price = vinylPrice
      let vinylMasteringDiscounts = 0
      vinylMasteringPreDiscountCost += vinylPrice

      if (vinylVolumeDiscount) {
        vinylMasteringDiscounts += vinylVolumeDiscount.discountPercentage
      }

      if (multimediaDealPercentage > 0 && multimediaDealObj) {
        vinylMasteringDiscounts += multimediaDealPercentage
        multimediaDealSongCount += 1

        multiMediaDeals[multimediaDealObj.name] = (
            multiMediaDeals[multimediaDealObj.name] ?? 0
        ) + 1
      }

      if (multimediaDealObj?.id.includes("premium") && multimediaDealPercentage > 0) {
        masteringDealBreakdown.vinyl.premium += 1
      } else if (multimediaDealObj && multimediaDealPercentage > 0) {
        masteringDealBreakdown.vinyl.standard += 1
      }

      if (vinylMasteringDiscounts > 0) {
        price = applyDiscount(vinylPrice, vinylMasteringDiscounts)
        vinylMasteringDiscountAmount += vinylPrice - price
      }

      if (vinylMasteringDiscounts > 0 && multimediaDealObj?.id.includes("premium")) {
        premiumMultiMdediaDealDiscountAmount += vinylPrice - price
      } else if (vinylMasteringDiscounts > 0 && multimediaDealObj) {
        standardMultiMediaDealDiscountAmount += vinylPrice - price
      }

      vinylMasteringCost += price
    }
    // Streaming mastering (multimedia deal eligible)
    if (song.addOns.streamingMastering) {
      let price = streamingPrice
      let streamingMasteringDiscounts = 0
      streamingMasteringPreDiscountCost += streamingPrice

      if (streamingVolumeDiscount) {
        streamingMasteringDiscounts += streamingVolumeDiscount.discountPercentage
      }

      if (multimediaDealPercentage > 0){
        streamingMasteringDiscounts += multimediaDealPercentage
      }

      if (streamingMasteringDiscounts > 0) {
        price = applyDiscount(streamingPrice, streamingMasteringDiscounts)
        streamingMasteringDiscountAmount += streamingPrice - price
      }

      if (streamingMasteringDiscounts > 0 && multimediaDealObj?.id.includes("premium")) {
        premiumMultiMdediaDealDiscountAmount += streamingPrice - price
      } else if (streamingMasteringDiscounts > 0 && multimediaDealObj) {
        standardMultiMediaDealDiscountAmount += streamingPrice - price
      }

      if (multimediaDealObj?.id.includes("premium") && multimediaDealPercentage > 0) {
        masteringDealBreakdown.streaming.premium += 1
      } else if (multimediaDealObj && multimediaDealPercentage > 0) {
        masteringDealBreakdown.streaming.standard += 1
      }

      streamingMasteringCost += price
    }
    // Redbook mastering (multimedia deal eligible)
    if (song.addOns.redbookMastering) {
      let price = redbookPrice
      let redbookMasteringDiscounts = 0
      redbookMasteringPreDiscountCost += redbookPrice

      if (redbookVolumeDiscount) {
        redbookMasteringDiscounts += redbookVolumeDiscount.discountPercentage
      }

      if (multimediaDealPercentage > 0) {
        redbookMasteringDiscounts += multimediaDealPercentage
      }

      if (redbookMasteringDiscounts > 0) {
        price = applyDiscount(redbookPrice, redbookMasteringDiscounts)
        redbookMasteringDiscountAmount += redbookPrice - price
      }

      if (redbookMasteringDiscounts > 0 && multimediaDealObj?.id.includes("premium")) {
        premiumMultiMdediaDealDiscountAmount += redbookPrice - price
      } else if (redbookMasteringDiscounts > 0 && multimediaDealObj) {
        standardMultiMediaDealDiscountAmount += redbookPrice - price
      }

      if (multimediaDealObj?.id.includes("premium") && multimediaDealPercentage > 0) {
        masteringDealBreakdown.redbook.premium += 1
      } else if (multimediaDealObj && multimediaDealPercentage > 0) {
        masteringDealBreakdown.redbook.standard += 1
      }


      redbookMasteringCost += price
    }

    // Stem mastering
    if (song.addOns.stemMastering && song.addOns.stemCount > 0) {
      let stemsPrice = getStemMasteringPrice(options, song.addOns.stemCount)
      let price = stemsPrice

      stemMasteringPreDiscountCost += stemsPrice


      if (stemVolumeDiscount) {
        let discountedPrice = applyDiscount(price, stemVolumeDiscount.discountPercentage)
        stemMasteringDiscountAmount += stemsPrice - discountedPrice
        price = discountedPrice
      }

      if (multimediaDealObj?.id.includes("premium") && multimediaDealPercentage > 0) {
        masteringDealBreakdown.stems.premium += 1
      } else if (multimediaDealObj && multimediaDealPercentage > 0) {
        masteringDealBreakdown.stems.standard += 1
      }

      stemMasteringCost += price
    }

    // Restoration remastering
    if (song.addOns.restorationRemastering) {
      let price = restorationPrice
      restorationRemastringPreDiscountCost += restorationPrice

      if (restorationVolumeDiscount) {
        price = applyDiscount(restorationPrice, restorationVolumeDiscount.discountPercentage)
        restorationRemasteringDiscountAmount += restorationPrice - price
      }


      if (multimediaDealObj?.id.includes("premium") && multimediaDealPercentage > 0) {
        masteringDealBreakdown.restoration.premium += 1
      } else if (multimediaDealObj && multimediaDealPercentage > 0) {
        masteringDealBreakdown.restoration.standard += 1
      }

      restorationRemasteringCost += price
    }
  }

  // Calculate multimedia deal savings
  const vinylWithoutDeal = vinylCount * vinylPrice
  const streamingWithoutDeal = streamingCount * streamingPrice
  const redbookWithoutDeal = redbookCount * redbookPrice
  const totalWithoutDeal = vinylWithoutDeal + streamingWithoutDeal + redbookWithoutDeal
  const totalWithDeal = vinylMasteringCost + streamingMasteringCost + redbookMasteringCost
  const multimediaDealDiscount = totalWithoutDeal - totalWithDeal

  // Virtual session cost
  const virtualSessionHours = addOns.virtualSessionHours
  const virtualSessionCost = virtualSessionHours * virtualSessionHourlyRate

  // Calculate delivery costs
  let highResMasterCost = 0
  let highResMasterPreDiscountCost = 0
  let highResMasterDiscountAmount = 0
  let ddpImageCost = 0
  let ddpImagePreDiscountCost = 0
  let ddpImageDiscountAmount = 0
  let isrcEncodingCost = 0
  let isrcEncodingPreDiscountCost = 0
  let isrcEncodingDiscountAmount = 0

  let rushDeliveryCost = 0
  let rushDeliveryPreDiscountCost = 0
  let rushDeliveryDiscountAmount = 0
  let distributionDeals: MasteringDiscountDealSet = {}

  let distributionDealSongCount = 0
  let distributionDealName = undefined;
  let premiumDistributionDealName = undefined



  for (const song of songDetails) {

    // Distribution deal discount
    const { discount: distributionDealObj } = getDistributionDealDiscount(discounts, deliveryOptions, song.songId)
    const distributionDealPercentage = distributionDealObj?.discountPercentage ?? 0

    if (distributionDealObj?.id.includes("premium")) {
      premiumDistributionDealName = distributionDealObj.name
    } else if (distributionDealObj) {
      distributionDealName = distributionDealObj.name
    }


    if (song.delivery.highResMaster) {
      let price = highResPrice
      let highResMasterDiscounts = 0
      highResMasterPreDiscountCost += highResPrice

      if (highResVolumeDiscount) {
        highResMasterDiscounts += highResVolumeDiscount.discountPercentage
      }

      if (distributionDealPercentage > 0 && distributionDealObj) {
        highResMasterDiscounts += distributionDealPercentage
        distributionDealSongCount += 1
        
        distributionDeals[distributionDealObj?.name] = (
            distributionDeals[distributionDealObj?.name] ?? 0
        ) + 1
      }

      if (highResMasterDiscounts > 0) {
        price = applyDiscount(highResPrice, highResMasterDiscounts)
        highResMasterDiscountAmount += highResPrice - price
      }

      if (highResMasterDiscounts > 0 && distributionDealObj?.id.includes("premium")) {
        premiumDistributionDealDiscountAmount += highResPrice - price
      } else if (highResMasterDiscounts > 0 && distributionDealObj) {
        standardDistributionDealDiscountAmount += highResPrice - price
      }  

      if (distributionDealObj?.id.includes("premium") && distributionDealPercentage > 0) {
        masteringDealBreakdown.highres.premium += 1
      } else if (distributionDealObj && distributionDealPercentage > 0) {
        masteringDealBreakdown.highres.standard += 1
      }

      highResMasterCost += price
    }

    if (song.delivery.ddpImage) {
      let price = ddpImagePrice
      let ddpImageMasterDiscounts = 0
      ddpImagePreDiscountCost += ddpImagePrice

      if (ddpImageVolumeDiscount) {
        ddpImageMasterDiscounts += ddpImageVolumeDiscount.discountPercentage
      }

      if (distributionDealPercentage > 0) {
        ddpImageMasterDiscounts += distributionDealPercentage
      } 

      if (ddpImageMasterDiscounts > 0) {
        price = applyDiscount(ddpImagePrice, ddpImageMasterDiscounts)
        ddpImageDiscountAmount += ddpImagePrice - price
      }

      if (ddpImageMasterDiscounts > 0 && distributionDealObj?.id.includes("premium")) {
        premiumDistributionDealDiscountAmount += ddpImagePrice - price
      } else if (ddpImageMasterDiscounts > 0 && distributionDealObj) {
        standardDistributionDealDiscountAmount += ddpImagePrice - price
      }

      if (distributionDealObj?.id.includes("premium") && distributionDealPercentage > 0) {
        masteringDealBreakdown.ddpimage.premium += 1
      } else if (distributionDealObj && distributionDealPercentage > 0) {
        masteringDealBreakdown.ddpimage.standard += 1
      }


      ddpImageCost += price
    }

    if (song.delivery.isrcEncoding) {
      let price = isrcEncodingPrice
      let isrcEncodingDiscounts = 0
      isrcEncodingPreDiscountCost += isrcEncodingPrice

      if (isrcEncodingVolumeDiscount) {
        isrcEncodingDiscounts += isrcEncodingVolumeDiscount.discountPercentage
      }

      if (distributionDealPercentage > 0) {
        isrcEncodingDiscounts += distributionDealPercentage
      }

      if (isrcEncodingDiscounts > 0) {
        price = applyDiscount(isrcEncodingPrice, isrcEncodingDiscounts)
        isrcEncodingDiscountAmount += isrcEncodingPrice - price
      }

      if (isrcEncodingDiscounts > 0 && distributionDealObj?.id.includes("premium")) {
        premiumDistributionDealDiscountAmount += isrcEncodingPrice - price
      } else if (isrcEncodingDiscounts > 0 && distributionDealObj) {
        standardDistributionDealDiscountAmount += isrcEncodingPrice - price
      }

      if (distributionDealObj?.id.includes("premium") && distributionDealPercentage > 0) {
        masteringDealBreakdown.isrcencode.premium += 1
      } else if (distributionDealObj && distributionDealPercentage > 0) {
        masteringDealBreakdown.isrcencode.standard += 1
      }

      isrcEncodingCost += price
    }

    if (song.delivery.rushDelivery) {
      let price = song.songSubtotal * 2 // 100% surcharge (doubles the price)
      rushDeliveryPreDiscountCost += song.songSubtotal

      if (rushDeliveryVolumeDiscount) {
        price = applyDiscount(song.songSubtotal, rushDeliveryVolumeDiscount.discountPercentage)
        rushDeliveryDiscountAmount += song.songSubtotal - price
      }

      if (distributionDealObj?.id.includes("premium") && distributionDealPercentage > 0) {
        masteringDealBreakdown.rush.premium += 1
      } else if (distributionDealObj && distributionDealPercentage > 0) {
        masteringDealBreakdown.rush.standard += 1
      }

      rushDeliveryCost += price
    }


  }


  const highResWithoutDeal = highResCount * highResPrice
  const ddpWithoutDeal = ddpImageCount * ddpImagePrice
  const isrcWithoutDeal = isrcEncodingCount * isrcEncodingPrice
  const optionsTotalWithoutDeal = highResWithoutDeal + ddpWithoutDeal + isrcWithoutDeal
  const optionsTotalWithDeal = highResMasterCost + ddpImageCost + isrcEncodingCost

  const distributionDealDiscount = optionsTotalWithoutDeal - optionsTotalWithDeal

  const subtotal =
    baseSongsCost -
    volumeDiscountAmount +
    vinylMasteringCost +
    streamingMasteringCost +
    redbookMasteringCost +
    stemMasteringCost +
    additionalRevisionsCost +
    restorationRemasteringCost +
    virtualSessionCost +
    highResMasterCost +
    ddpImageCost +
    isrcEncodingCost +
    rushDeliveryCost

  const preDiscountsTotal = [
    baseSongsCost,
    vinylMasteringPreDiscountCost,
    streamingMasteringPreDiscountCost,
    redbookMasteringPreDiscountCost,
    stemMasteringPreDiscountCost,
    restorationRemastringPreDiscountCost,
    virtualSessionCost,
    highResMasterPreDiscountCost,
    ddpImagePreDiscountCost,
    isrcEncodingPreDiscountCost,
    rushDeliveryPreDiscountCost,
    preDiscountRevisionPrice,
  ].reduce((prev, cur) => prev + cur, 0)

  const optionsDiscountAmount = [
    vinylMasteringDiscountAmount,
    streamingMasteringDiscountAmount,
    redbookMasteringDiscountAmount,
    stemMasteringDiscountAmount,
    restorationRemasteringDiscountAmount,
    highResMasterDiscountAmount,
    ddpImageDiscountAmount,
    isrcEncodingDiscountAmount,
    rushDeliveryDiscountAmount,
    revisionsDiscountAmount,
  ].reduce((prev, cur) => prev + cur, 0)

    const optionsAndAddonsPreDiscountsTotal = [
    vinylMasteringPreDiscountCost,
    streamingMasteringPreDiscountCost,
    redbookMasteringPreDiscountCost,
    stemMasteringPreDiscountCost,
    restorationRemastringPreDiscountCost,
    virtualSessionCost,
    highResMasterPreDiscountCost,
    ddpImagePreDiscountCost,
    isrcEncodingPreDiscountCost,
    rushDeliveryPreDiscountCost,
    preDiscountRevisionPrice,
  ].reduce((prev, cur) => prev + cur, 0)

  const optionsAndAddonsTotal = [
    vinylMasteringCost +
    streamingMasteringCost +
    redbookMasteringCost +
    stemMasteringCost +
    additionalRevisionsCost +
    virtualSessionCost +
    restorationRemasteringCost +
    highResMasterCost +
    ddpImageCost +
    isrcEncodingCost +
    rushDeliveryCost
  ].reduce((prev, cur) => prev + cur, 0)


  return {
    songs: songDetails,
    totals: {
      songCount,
      totalLengthMinutes,
      totalLengthSeconds,
    },
    costs: {
      baseSongsCost,
      lengthFeesCost,
      volumeDiscount: volumeDiscountAmount,
      volumeDiscountName,
      vinylMasteringCost,
      vinylMasteringDiscount: vinylMasteringDiscountAmount,
      streamingMasteringCost,
      streamingMasteringDiscount: streamingMasteringDiscountAmount,
      redbookMasteringCost,
      redbookMasteringDiscount: redbookMasteringDiscountAmount,
      stemMasteringCost,
      stemMasteringDiscount: stemMasteringDiscountAmount,
      restorationRemasteringCost,
      restorationRemasteringDiscount: restorationRemasteringDiscountAmount,
      multimediaDealDiscount,
      multimediaDealSongCount: multimediaDealSongCount,
      virtualSessionCost,
      virtualSessionHours,
      highResMasterCost,
      highResMasterDiscount: highResMasterDiscountAmount,
      ddpImageCost,
      ddpImageDiscount: ddpImageDiscountAmount,
      isrcEncodingCost,
      isrcEncodingDiscount: isrcEncodingDiscountAmount,
      rushDeliveryCost,
      rushDeliveryDiscount: rushDeliveryDiscountAmount,
      distributionDealDiscount,
      multiMediaDeals: multiMediaDeals,
      distributionDeals: distributionDeals,
      distributionDealSongCount: distributionDealSongCount,
      subtotal,
      total: subtotal,
      preDiscountsTotal,
      discountsTotal: preDiscountsTotal - subtotal,
      optionsDiscounts: optionsDiscountAmount,
      dealBreakdown: masteringDealBreakdown,
      premiumDistributionDealDiscount: premiumDistributionDealDiscountAmount,
      standardDistributionDealDiscount: standardDistributionDealDiscountAmount,
      premiumMultiMediaDealDiscount: premiumMultiMdediaDealDiscountAmount,
      standardMultiMediaDealDiscount: standardMultiMediaDealDiscountAmount,
      preDiscountRevisionPrice,
      revisionDiscount: revisionsDiscountAmount,
      additionalRevisionsCost,
      includedRevisionsCost,
      additionalRevisionsDiscountPercentage: revisionDiscountPercentage,
      perRevisionPrice: revisionPrice,
      optionsAndAddonsTotal,
      optionsAndAddonsPreDiscountsTotal,
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
      multimediaDealSongCount: multimediaDealSongCount,
      distributionDealSongCount: distributionDealSongCount,
      distributionDealName: distributionDealName,
      premiumDistributionDealName: premiumDistributionDealName,
      multimediaDealName: multimediaDealName,
      premiumMultimediaDealName: premiumMultimediaDealName,
      includedRevisions,
      additionalRevisions,
      additionalRevisionsDiscountName: revisionDealName
    },
  }
}

export function getVolumeDiscountInfo(discounts: Discount[]): { epDeal: Discount | null; lpDeal: Discount | null, xlpDeal: Discount | null } {
  const volumeDiscounts = findDiscountsByCategory(discounts, "volume")
  return {
    epDeal: volumeDiscounts.find((d) => d.id === "ep_deal") ?? null,
    lpDeal: volumeDiscounts.find((d) => d.id == "lp_deal") ?? null,
    xlpDeal: volumeDiscounts.find((d) => d.id === "xlp_deal") ?? null,
  }
}

export function getOptionVolumeDiscountInfo(discounts: Discount[]): {
  threePlus: Discount | null
  fivePlus: Discount | null
  tenPlus: Discount | null
} {
  const optionDiscounts = findDiscountsByCategory(discounts, "option_volume")
  return {
    threePlus: optionDiscounts.find((d) => d.id === "option_volume_3") ?? null,
    fivePlus: optionDiscounts.find((d) => d.id === "option_volume_5") ?? null,
    tenPlus: optionDiscounts.find((d) => d.id === "option_volume_10") ?? null,
  }
}
