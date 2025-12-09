"use client"

import { useState } from "react"
import { Checkbox } from "~/components/ui/checkbox"
import { Button } from "~/components/ui/button"
import type { DeliveryOptions, Song, PricingData } from "~/lib/mixing/pricing-types"
import { meetsThreshold } from "~/lib/meets-threshold"
import { ChevronDown, ChevronUp, Info, Sparkles } from "lucide-react"

type DeliveryStepProps = {
  deliveryOptions: DeliveryOptions
  setDeliveryOptions: (options: DeliveryOptions) => void
  songs: Song[]
  pricingData: PricingData
}

type DeliveryOptionKey = keyof DeliveryOptions

export function DeliveryStep({ deliveryOptions, setDeliveryOptions, songs, pricingData }: DeliveryStepProps) {
  const [expandedOptions, setExpandedOptions] = useState<Record<DeliveryOptionKey, boolean>>({
    highResMixdownSongs: false,
    filmMixdownSongs: false,
    mixedStemsSongs: false,
    extendedArchivalSongs: false,
    rushDeliverySongs: false,
  })

  const { options, discounts } = pricingData

  // Get option prices from database
  const highResOption = options.find((o) => o.id === "high_res_mixdown")
  const filmMixdownOption = options.find((o) => o.id === "film_mixdown")
  const mixedStemsOption = options.find((o) => o.id === "mixed_stems")
  const extendedArchivalOption = options.find((o) => o.id === "extended_archival")
  const rushDeliveryOption = options.find((o) => o.id === "rush_delivery")

  const highResPrice = highResOption?.price ?? 25
  const filmMixdownPrice = filmMixdownOption?.price ?? 20
  const mixedStemsBasePrice = mixedStemsOption?.price ?? 20
  const extendedArchivalPrice = extendedArchivalOption?.price ?? 25

  // Get discounts from database
  const optionVolumeDiscounts = discounts.filter((d) => d.category === "option_volume")
  const hifiDealDiscount = discounts.find((d) => d.id === "hifi_deal")

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

  const calculateMixedStemsPrice = (trackCount: number) => {
    if (trackCount <= 10) return mixedStemsBasePrice
    const additionalTiers = Math.ceil((trackCount - 10) / 10)
    return mixedStemsBasePrice + additionalTiers * 5
  }

  const calculateSongBasePrice = (song: Song) => {
    const songMixProduct = pricingData.products.find((p) => p.id === "song_mix")
    const highTrackProduct = pricingData.products.find((p) => p.id === "high_track_count_mix")
    const HIGH_TRACK_THRESHOLD = 50

    if (song.tracks > HIGH_TRACK_THRESHOLD) {
      const basePrice = highTrackProduct?.price ?? 500
      const additionalTiers = Math.ceil((song.tracks - HIGH_TRACK_THRESHOLD) / 10)
      return basePrice + additionalTiers * 100
    } else {
      const basePrice = songMixProduct?.price ?? 100
      if (song.tracks <= 10) return basePrice
      const additionalTiers = Math.ceil((song.tracks - 10) / 10)
      return basePrice + additionalTiers * 75
    }
  }

  const hasMixdownBundle = (songId: string) => {
    return deliveryOptions.highResMixdownSongs.includes(songId) && deliveryOptions.filmMixdownSongs.includes(songId)
  }

  const DELIVERY_OPTIONS_CONFIG: {
    key: DeliveryOptionKey
    label: string
    description: string
    priceLabel: string
    getPrice?: (song: Song) => number
    fixedPrice?: number
    isMixdownOption?: boolean
  }[] = [
    {
      key: "highResMixdownSongs",
      label: highResOption?.name ?? "High Resolution Mixdown",
      description: highResOption?.description ?? "24-bit/96kHz WAV files for maximum quality",
      priceLabel: `$${highResPrice}/song`,
      fixedPrice: highResPrice,
      isMixdownOption: true,
    },
    {
      key: "filmMixdownSongs",
      label: filmMixdownOption?.name ?? "Film Mixdown",
      description: filmMixdownOption?.description ?? "Broadcast-ready mixes with proper loudness standards",
      priceLabel: `$${filmMixdownPrice}/song`,
      fixedPrice: filmMixdownPrice,
      isMixdownOption: true,
    },
    {
      key: "mixedStemsSongs",
      label: mixedStemsOption?.name ?? "Mixed Stems",
      description: mixedStemsOption?.description ?? "Individual stem exports - price scales with track count",
      priceLabel: `$${mixedStemsBasePrice} base + $5/10 tracks`,
      getPrice: (song: Song) => calculateMixedStemsPrice(song.tracks),
    },
    {
      key: "extendedArchivalSongs",
      label: extendedArchivalOption?.name ?? "Extended Archival",
      description: extendedArchivalOption?.description ?? "Extended cloud storage for your project files (1 year)",
      priceLabel: `$${extendedArchivalPrice}/song`,
      fixedPrice: extendedArchivalPrice,
    },
    {
      key: "rushDeliverySongs",
      label: rushDeliveryOption?.name ?? "Rush Delivery",
      description:
        rushDeliveryOption?.description ?? "Priority processing with 48-hour turnaround - doubles the song cost",
      priceLabel: "2x song cost",
      getPrice: (song: Song) => calculateSongBasePrice(song),
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

  const songsWithMixdownBundle = songs.filter((song) => hasMixdownBundle(song.id)).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Delivery</h2>
        <p className="text-muted-foreground">Choose how you want your final project delivered.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
        <Info className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
        <span className="text-foreground">
          <span className="font-medium">Volume Discounts:</span> Select 5+ songs for 15% off, or 10+ songs for 25% off
          on per-song delivery options.
        </span>
      </div>

      <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
        <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
        <span className="text-foreground">
          <span className="font-medium">Hi-Fi Deal:</span> Select both High Resolution Mixdown and Film Mixdown for the
          same song to get {hifiDealDiscount?.discountPercentage ?? 10}% off each option for that song.
          {songsWithMixdownBundle > 0 && (
            <span className="ml-1 text-purple-600 font-medium">
              ({songsWithMixdownBundle} song{songsWithMixdownBundle !== 1 ? "s" : ""} with deal applied!)
            </span>
          )}
        </span>
      </div>

      <div className="space-y-4">
        {DELIVERY_OPTIONS_CONFIG.map((option) => {
          const selectedSongs = deliveryOptions[option.key]
          const isExpanded = expandedOptions[option.key]
          const hasSelections = selectedSongs.length > 0
          const selectedCount = selectedSongs.length
          const discountPercentage = getOptionVolumeDiscount(selectedCount)

          return (
            <div key={option.key} className="border border-border rounded-lg overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpanded(option.key)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">{option.label}</span>
                    {option.isMixdownOption && songsWithMixdownBundle > 0 && (
                      <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="!w-[16px] !h-[16px]" />
                        Hi-Fi
                      </span>
                    )}
                    {hasSelections && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {selectedSongs.length} song{selectedSongs.length !== 1 ? "s" : ""}
                        {discountPercentage > 0 && (
                          <span className="ml-1 text-green-600">({discountPercentage}% off)</span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-primary">{option.priceLabel}</span>
                  {isExpanded ? (
                    <ChevronUp className="!w-[16px] !h-[16px] text-muted-foreground" />
                  ) : (
                    <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="flex gap-2 mb-3">
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
                  {selectedCount > 0 && selectedCount < 5 && (
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded">
                      Select {5 - selectedCount} more song{5 - selectedCount !== 1 ? "s" : ""} for 15% discount
                    </div>
                  )}
                  {selectedCount >= 5 && selectedCount < 10 && (
                    <div className="text-xs text-green-600 mb-3 p-2 bg-green-500/10 rounded">
                      15% discount applied! Select {10 - selectedCount} more song{10 - selectedCount !== 1 ? "s" : ""}{" "}
                      for 25% discount
                    </div>
                  )}
                  {selectedCount >= 10 && (
                    <div className="text-xs text-green-600 mb-3 p-2 bg-green-500/10 rounded">
                      25% maximum discount applied!
                    </div>
                  )}
                  <div className="space-y-2">
                    {songs.map((song, index) => {
                      const isSelected = selectedSongs.includes(song.id)
                      const basePrice = option.getPrice ? option.getPrice(song) : option.fixedPrice || 0
                      let discountedPrice = basePrice * (1 - discountPercentage / 100)

                      const songHasMixdownBundle = hasMixdownBundle(song.id)
                      const showMixdownBundle = option.isMixdownOption && songHasMixdownBundle
                      if (showMixdownBundle && hifiDealDiscount) {
                        discountedPrice = discountedPrice * (1 - hifiDealDiscount.discountPercentage / 100)
                      }

                      const hasAnyDiscount = discountPercentage > 0 || showMixdownBundle

                      return (
                        <div key={song.id} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`${option.key}-${song.id}`}
                              checked={isSelected}
                              onCheckedChange={() => toggleSongForOption(option.key, song.id)}
                            />
                            <label
                              htmlFor={`${option.key}-${song.id}`}
                              className="text-sm cursor-pointer flex items-center gap-2"
                            >
                              {song.title || `Song ${index + 1}`}
                              <span className="text-muted-foreground">
                                ({song.tracks} tracks, {song.minutes}:{song.seconds.toString().padStart(2, "0")})
                              </span>
                              {showMixdownBundle && (
                                <span className="text-xs bg-purple-500/10 text-purple-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <Sparkles className="!w-[16px] !h-[16px]" />
                                  Hi-Fi -{hifiDealDiscount?.discountPercentage ?? 10}%
                                </span>
                              )}
                            </label>
                          </div>
                          <span className="text-sm font-medium">
                            {hasAnyDiscount ? (
                              <>
                                <span className="line-through text-muted-foreground">${basePrice.toFixed(0)}</span>
                                <span className="text-green-600 ml-1">${discountedPrice.toFixed(0)}</span>
                              </>
                            ) : (
                              `$${basePrice.toFixed(0)}`
                            )}
                          </span>
                        </div>
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
