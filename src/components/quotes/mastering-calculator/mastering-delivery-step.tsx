"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import type { MasteringPricingData } from "~/lib/mastering/pricing-types"
import type { MasteringSong, MasteringDeliveryOptions } from "~/lib/mastering/mastering-pricing-calculator"
import { getOptionVolumeDiscountInfo } from "~/lib/mastering/mastering-pricing-calculator"
import { meetsThreshold } from "~/lib/meets-threshold"
import { ChevronDown, ChevronUp, Check, Info, Sparkles } from "lucide-react"
import { getDiscountLable } from "~/lib/discounts"

type MasteringDeliveryStepProps = {
  deliveryOptions: MasteringDeliveryOptions
  setDeliveryOptions: React.Dispatch<React.SetStateAction<MasteringDeliveryOptions>>
  songs: MasteringSong[]
  pricingData: MasteringPricingData
}

type DeliveryOptionKey = keyof MasteringDeliveryOptions


const checkIsDistributionOption = (optionKey: string) => {
  return ["highResMasterSongs", "ddpImageSongs", "isrcEncodingSongs", "rushDeliverySongs"].includes(optionKey)
}

export function MasteringDeliveryStep({
  deliveryOptions,
  setDeliveryOptions,
  songs,
  pricingData,
}: MasteringDeliveryStepProps) {
  const [expandedOptions, setExpandedOptions] = useState<Record<DeliveryOptionKey, boolean>>({
    highResMasterSongs: false,
    ddpImageSongs: false,
    isrcEncodingSongs: false,
    rushDeliverySongs: false,
  })

  const { options, discounts } = pricingData
  const { fivePlus, tenPlus } = getOptionVolumeDiscountInfo(discounts)

  const highResOption = options.find((o) => o.id === "high_res_master")
  const ddpImageOption = options.find((o) => o.id === "ddp_image")
  const isrcEncodingOption = options.find((o) => o.id === "isrc_encoding")
  const rushDeliveryOption = options.find((o) => o.id === "rush_master")

  const highResPrice = highResOption?.price ?? 25
  const ddpImagePrice = ddpImageOption?.price ?? 25
  const isrcEncodingPrice = isrcEncodingOption?.price ?? 10

  const optionVolumeDiscounts = discounts.filter((d) => d.category === "option_volume")

  const getOptionVolumeDiscount = (count: number) => {
    let bestDiscount = 0
    for (const discount of optionVolumeDiscounts) {
      if (meetsThreshold(count, discount.minThreshold, discount.maxThreshold)) {
        if (discount.discountPercentage > bestDiscount) {
          bestDiscount = discount.discountPercentage
        }
      }
    }
    return bestDiscount
  }

  const calculateSongBasePrice = (song: MasteringSong) => {
    const standardMaster = pricingData.products.find((p) => p.id === "standard_master")
    const extendedMaster = pricingData.products.find((p) => p.id === "extended_length_master")
    const totalMinutes = song.minutes + song.seconds / 60

    if (totalMinutes > 10) {
      return extendedMaster?.price ?? 150
    }
    return standardMaster?.price ?? 75
  }

  // Distribution deal logic
  const bundleDiscounts = discounts.filter((d) => d.category === "delivery_bundle")
  const distributionDeal = bundleDiscounts.find((d) => d.id === "distribution_deal")
  const premiumDistributionDeal = bundleDiscounts.find((d) => d.id === "premium_distribution_deal")

  const hasHighRes = deliveryOptions.highResMasterSongs.length > 0
  const hasDDPImage = deliveryOptions.ddpImageSongs.length > 0
  const hasISRC = deliveryOptions.isrcEncodingSongs.length > 0

  const activeDistributionOptions = [hasHighRes, hasDDPImage, hasISRC].filter(Boolean).length
  const hasPremiumDistributionDeal = activeDistributionOptions >= 3 && premiumDistributionDeal
  const hasDistributionDeal = activeDistributionOptions >= 2 && distributionDeal

  let distributionDealType: "none" | "standard" | "premium" = "none"
  let distributionDealDiscount = 0
  let distributionDealName = ""

  if (hasPremiumDistributionDeal) {
    distributionDealType = "premium"
    distributionDealDiscount = premiumDistributionDeal.discountPercentage 
    distributionDealName = premiumDistributionDeal.name
  } else if (hasDistributionDeal) {
    distributionDealType = "standard"
    distributionDealDiscount = distributionDeal.discountPercentage
    distributionDealName = distributionDeal.name
  }

  const getSongDistributionDeal = (songId: string) => {
    const hasHighRes = deliveryOptions.highResMasterSongs.includes(songId)
    const hasDdp = deliveryOptions.ddpImageSongs.includes(songId)
    const hasIsrc = deliveryOptions.isrcEncodingSongs.includes(songId)
    const count = [hasHighRes, hasDdp, hasIsrc].filter(Boolean).length

    if (count >= 3) return { hasDeal: true, isPremium: true }
    if (count >= 2) return { hasDeal: true, isPremium: false }
    return { hasDeal: false, isPremium: false }
  }


  const songsWithDistributionDeal = songs.filter((s) => getSongDistributionDeal(s.id).hasDeal).length

  const DELIVERY_OPTIONS_CONFIG: {
    key: DeliveryOptionKey
    label: string
    description: string
    priceLabel: string
    getPrice?: (song: MasteringSong) => number
    fixedPrice?: number
    isDistributionOption?: boolean
  }[] = [
    {
      key: "highResMasterSongs",
      label: highResOption?.name ?? "High Resolution Master",
      description: highResOption?.description ?? "96kHz/24-bit high resolution master files",
      priceLabel: `$${highResPrice}/song`,
      fixedPrice: highResPrice,
      isDistributionOption: true,
    },
    {
      key: "ddpImageSongs",
      label: ddpImageOption?.name ?? "DDP Image",
      description: ddpImageOption?.description ?? "DDP image for CD replication",
      priceLabel: `$${ddpImagePrice}/song`,
      fixedPrice: ddpImagePrice,
      isDistributionOption: true,
    },
    {
      key: "isrcEncodingSongs",
      label: isrcEncodingOption?.name ?? "ISRC Encoding",
      description: isrcEncodingOption?.description ?? "ISRC code embedding for distribution",
      priceLabel: `$${isrcEncodingPrice}/song`,
      fixedPrice: isrcEncodingPrice,
      isDistributionOption: true,
    },
    {
      key: "rushDeliverySongs",
      label: rushDeliveryOption?.name ?? "Rush Delivery",
      description:
        rushDeliveryOption?.description ?? "Priority processing with 48-hour turnaround - doubles the song cost",
      priceLabel: "2x/song",
      getPrice: (song: MasteringSong) => calculateSongBasePrice(song),
    },
  ]

  const toggleExpanded = (key: DeliveryOptionKey) => {
    setExpandedOptions((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSongForOption = (key: DeliveryOptionKey, songId: string) => {
    const current = deliveryOptions[key]
    if (current.includes(songId)) {
      setDeliveryOptions({
        ...deliveryOptions,
        [key]: current.filter((id) => id !== songId),
      })
    } else {
      setDeliveryOptions({
        ...deliveryOptions,
        [key]: [...current, songId],
      })
    }
  }

  const selectAllForOption = (key: DeliveryOptionKey) => {
    setDeliveryOptions({
      ...deliveryOptions,
      [key]: songs.map((s) => s.id),
    })
  }

  const deselectAllForOption = (key: DeliveryOptionKey) => {
    setDeliveryOptions({
      ...deliveryOptions,
      [key]: [],
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Delivery</h2>
        <p className="text-muted-foreground">Choose how you want your masters delivered.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
        <Info className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
        <span className="text-foreground">
          <span className="font-medium">Volume Discounts:</span> Select 5+ songs for{" "}
          {fivePlus?.discountPercentage ?? 15}% off, or 10+ songs for {tenPlus?.discountPercentage ?? 25}% off on
          per-song delivery options.
        </span>
      </div>

      {distributionDealType !== "none" && (
          <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
            <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
            <span className="text-foreground">
              <span className="font-medium">{distributionDealName} Applied!</span> {distributionDealDiscount}% additional
              discount on all distribution add-ons.
            </span>
          </div>
        )}
  
        {activeDistributionOptions === 1 && (
          <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
            <Sparkles className="!w-[16px] !h-[16px] text-purple-600  shrink-0 mt-0.5" />
            <span className="text-foreground">
              Add 1 more format (High Resolution, DDP Image, or ISRC) to unlock the{" "}
              <span className="font-medium">Distribution Deal</span> (15% off), or all 3 for the{" "}
              <span className="font-medium">Premium Distribution Deal</span> (25% off)!
            </span>
          </div>
        )}
  
        {activeDistributionOptions === 2 && (
          <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
            <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
            <span className="text-foreground">
              Add the last format to upgrade to the <span className="font-medium">Premium Distribution Deal</span> (25%
              off)!
            </span>
          </div>
        )}

        {/* <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
        <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
        <span className="text-foreground">
          <span className="font-medium">Distribution Deal:</span> Select 2 of High Resolution, DDP Image, or ISRC for a
          song to get {distributionDeal?.discountPercentage ?? 10}% off each. Select all 3 for the Premium Distribution
          Deal at {premiumDistributionDeal?.discountPercentage ?? 25}% off!
          {songsWithDistributionDeal > 0 && (
            <span className="ml-1 text-purple-600 font-medium">
              ({songsWithDistributionDeal} song{songsWithDistributionDeal !== 1 ? "s" : ""} with deal applied!)
            </span>
          )}
        </span>
      </div> */}

      <div className="space-y-4">
        {DELIVERY_OPTIONS_CONFIG.map((option) => {
          const selectedSongs = deliveryOptions[option.key]
          const isExpanded = expandedOptions[option.key]
          const hasSelections = selectedSongs.length > 0
          const selectedCount = selectedSongs.length
          const discountPercentage = getOptionVolumeDiscount(selectedCount)
          const isDistribution= checkIsDistributionOption(option.key)
          const isRushDelivery = option.key === "rushDeliverySongs"

          const totalDiscount = discountPercentage + (
            isDistribution ? distributionDealDiscount : 0
          )


          const optionPrice = option.fixedPrice ?? songs.map(
            song => option.getPrice ? option.getPrice(song) : 0
          ).reduce((prev, cur) => prev + cur, 0)/Math.max(songs.length, 1)

          const finalPrice = optionPrice * (1 - totalDiscount/100)      
          const addonCost =  optionPrice * selectedCount * (1 - totalDiscount/100)

          const hasAnyDiscount =
            selectedCount > 0 && (discountPercentage > 0 || (isDistribution && distributionDealDiscount > 0))
          
          const songsWithDealForThisOption = option.isDistributionOption
            ? songs.filter((s) => {
                const deal = getSongDistributionDeal(s.id)
                return deal.hasDeal && selectedSongs.includes(s.id)
              }).length
            : 0

          const activePremiumDistributionDeal = option.isDistributionOption
          ? songs.filter((s) => {
            const deal = getSongDistributionDeal(s.id)
            return deal.isPremium
          }).length > 0: false

          const distroSongs = songs.map(
            song =>
            option.isDistributionOption
                ? getSongDistributionDeal(song.id)
                : undefined
            ).filter(song => song !== undefined && song.hasDeal)

          
          const standardDistroSongs = distroSongs.filter(song => song !== undefined && !song.isPremium)
          const premiumDistroSongs = distroSongs.filter(song => song !== undefined && song.isPremium)


          return (
            <div key={option.key} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleExpanded(option.key)}
                className="w-full flex lg:flex-row flex-col lg:gap-0 gap-4 justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex flex-col gap-2">
                    <span className="text-base font-medium">{option.label}</span>
                    <div className="flex lg:flex-row flex-col gap-2">
                      {option.isDistributionOption && songsWithDealForThisOption > 0 && (
                        <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full w-fit flex items-center gap-1">
                          <Sparkles className="!w-[16px] !h-[16px]" />
                          {
                            activePremiumDistributionDeal
                            ?
                            "Premium Distro."
                            : "Distro. Deal"
                          }
                        </span>
                      )}
                      {hasSelections && (
                        <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full w-fit">
                          {selectedCount} song{selectedCount !== 1 ? "s" : ""} selected
                          {hasAnyDiscount && (
                            <>
                              {" "}
                              <span className="text-green-600">
                                ({discountPercentage > 0 && `${discountPercentage}%`}
                                {discountPercentage > 0 && isDistribution && distributionDealDiscount > 0 && " + "}
                                {isDistribution && distributionDealDiscount > 0 && `${distributionDealDiscount}%`} off)
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {hasAnyDiscount ? (
                      <>
                        <span className="line-through text-muted-foreground">{option.priceLabel}</span>
                        <span className="text-green-600 ml-1">${finalPrice.toFixed(0)}/song</span>
                      </>
                    ) : (
                      <span>+{option.priceLabel}/song</span>
                    )}
                    {addonCost > 0 && <span className="text-primary ml-1">(${addonCost.toFixed(0)})</span>}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="!w-[16px] !h-[16px] text-muted-foreground" />
                  ) : (
                    <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/30 flex flex-col gap-2 lg:items-start items-center">
                  <div className="flex lg:flex-row lg:my-0 my-2 lg:gap-0 gap-4 flex-col items-center justify-between mb-3">
                    <span className="text-sm lg:text-left text-center text-muted-foreground">
                      Select songs to apply {option.label.toLowerCase()}:
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          selectAllForOption(option.key)
                        }}
                        className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deselectAllForOption(option.key)
                        }}
                        className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  {!isRushDelivery && selectedCount > 0 && selectedCount < 5 && (
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded lg:w-fit w-full lg:text-left text-center">
                      Select {5 - selectedCount} more song{5 - selectedCount !== 1 ? "s" : ""} for{" "}
                      {fivePlus?.discountPercentage ?? 15}% volume discount
                    </div>
                  )}
                  {!isRushDelivery && selectedCount >= 5 && selectedCount < 10 && (
                    <div className="text-xs text-green-600 mb-3 p-2 bg-green-500/10 rounded lg:w-fit w-full lg:text-left text-center">
                      {fivePlus?.discountPercentage ?? 15}% volume discount applied! Select {10 - selectedCount} more
                      song{10 - selectedCount !== 1 ? "s" : ""} for {tenPlus?.discountPercentage ?? 25}% discount
                    </div>
                  )}
                  {!isRushDelivery && selectedCount >= 10 && (
                    <div className="text-xs text-green-600 mb-3 p-2 bg-green-500/10 rounded lg:w-fit w-full lg:text-left text-center">
                      {tenPlus?.discountPercentage ?? 25}% maximum volume discount applied!
                    </div>
                  )}
                  {option.isDistributionOption && standardDistroSongs.length > 0 && distributionDeal && (
                    <span className="flex lg:flex-row flex-col lg:gap-0 gap-2 text-xs bg-purple-500/10 text-purple-600 mb-3 p-2 rounded flex items-center gap-1 lg:w-fit w-full lg:text-left text-center">
                      <Sparkles className="!w-[16px] !h-[16px]" />
                      {standardDistroSongs.length} songs with {distributionDeal.name} applied for -{distributionDeal?.discountPercentage}% off!
                    </span>
                  )}
                  {option.isDistributionOption && premiumDistroSongs.length > 0 && premiumDistributionDeal && (
                    <span className="flex lg:flex-row flex-col lg:gap-0 gap-2 text-xs bg-purple-500/10 text-purple-600 mb-3 p-2 rounded flex items-center gap-1 lg:w-fit w-full lg:text-left text-center">
                      <Sparkles className="!w-[16px] !h-[16px]" />
                      {premiumDistroSongs.length} songs with {premiumDistributionDeal.name} applied for -{premiumDistributionDeal?.discountPercentage}% off!
                    </span>
                  )}
                  <div className="space-y-2 w-full">
                    {songs.map((song, index) => {
                      const isSelected = selectedSongs.includes(song.id)
                      const basePrice = option.getPrice ? option.getPrice(song) : option.fixedPrice || 0
                      const songDeal = option.isDistributionOption
                        ? getSongDistributionDeal(song.id)
                        : { hasDeal: false, isPremium: false }
                      const distributionDealPercent = songDeal.isPremium
                        ? (premiumDistributionDeal?.discountPercentage ?? 25)
                        : songDeal.hasDeal
                          ? (distributionDeal?.discountPercentage ?? 10)
                          : 0

                      let discountedPrice = basePrice
                      if (isRushDelivery && discountPercentage > 0) {
                        discountedPrice = discountedPrice * (1 - discountPercentage / 100)
                      }
                      if (option.isDistributionOption && distributionDealPercent > 0) {
                        discountedPrice = discountedPrice * (1 - distributionDealPercent / 100)
                      }

                      const hasAnyDiscount =
                        (isRushDelivery && discountPercentage > 0) ||
                        (option.isDistributionOption && distributionDealPercent > 0)

                      return (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => toggleSongForOption(option.key, song.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-md border transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`!w-[16px] !h-[16px] rounded border flex items-center justify-center ${
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                              }`}
                            >
                              {isSelected && <Check className="!w-[16px] !h-[16px] text-primary-foreground" />}
                            </div>
                            <span className="text-sm font-medium">{song.title || `Song ${index + 1}`}</span>

                            <span className="text-xs text-muted-foreground">
                              ({song.minutes}:{song.seconds.toString().padStart(2, "0")})
                            </span>
                            
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {hasAnyDiscount ? (
                              <>
                                <span className="line-through">${basePrice.toFixed(0)}</span>
                                <span className="text-green-600 ml-1">${discountedPrice.toFixed(0)}</span>
                              </>
                            ) : (
                              `$${basePrice.toFixed(0)}`
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
