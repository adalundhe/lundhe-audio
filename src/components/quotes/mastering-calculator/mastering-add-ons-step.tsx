"use client"

import type React from "react"

import { useState } from "react"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import type { PricingData } from "~/lib/mixing/pricing-types"
import type { MasteringSong, MasteringAddOns } from "~/lib//mastering/mastering-pricing-calculator"
import { getOptionVolumeDiscountInfo } from "~/lib/mastering/mastering-pricing-calculator"
import { meetsThreshold } from "~/lib/meets-threshold"
import { ChevronDown, ChevronUp, Check, Info, Sparkles } from "lucide-react"

type MasteringAddOnsStepProps = {
  addOns: MasteringAddOns
  setAddOns: React.Dispatch<React.SetStateAction<MasteringAddOns>>
  songs: MasteringSong[]
  pricingData: PricingData
}

export function MasteringAddOnsStep({ addOns, setAddOns, songs, pricingData }: MasteringAddOnsStepProps) {
  const [openAddOns, setOpenAddOns] = useState<Record<string, boolean>>({})
  const [virtualSessionOpen, setVirtualSessionOpen] = useState(false)

  const { fivePlus, tenPlus } = getOptionVolumeDiscountInfo(pricingData.discounts)
  const fivePlusDiscount = fivePlus?.discountPercentage ?? 15
  const tenPlusDiscount = tenPlus?.discountPercentage ?? 25

  // Get option prices from data
  const vinylOption = pricingData.options.find((o) => o.id === "vinyl_master")
  const streamingOption = pricingData.options.find((o) => o.id === "streaming_master")
  const redbookOption = pricingData.options.find((o) => o.id === "redbook_master")
  const restorationOption = pricingData.options.find((o) => o.id === "restoration_remaster")
  const virtualSessionOption = pricingData.options.find((o) => o.id === "virtual_session")

  // Stem mastering tiers
  const stemTiers = [
    pricingData.options.find((o) => o.id === "stem_master_2_8"),
    pricingData.options.find((o) => o.id === "stem_master_9_16"),
    pricingData.options.find((o) => o.id === "stem_master_17_24"),
    pricingData.options.find((o) => o.id === "stem_master_25_32"),
  ].filter(Boolean)

  const vinylPrice = vinylOption?.price ?? 50
  const streamingPrice = streamingOption?.price ?? 25
  const redbookPrice = redbookOption?.price ?? 25
  const restorationPrice = restorationOption?.price ?? 350
  const virtualSessionHourlyRate = virtualSessionOption?.price ?? 100
  const virtualSessionMinHours = virtualSessionOption?.minThreshold ?? 4

  // Check for multimedia bundle (vinyl, streaming, redbook)
  const hasVinyl = addOns.vinylMasteringSongs.length > 0
  const hasStreaming = addOns.streamingMasteringSongs.length > 0
  const hasRedbook = addOns.redbookMasteringSongs.length > 0
  const activeMultimediaAddOns = [hasVinyl, hasStreaming, hasRedbook].filter(Boolean).length

  const bundleDiscounts = pricingData.discounts.filter((d) => d.category === "bundle")
  const premiumMultimediaDeal = bundleDiscounts.find((d) => d.id === "premium_multimedia_deal")
  const multimediaDeal = bundleDiscounts.find((d) => d.id === "multimedia_deal")

  const hasPremiumMultimediaDeal = activeMultimediaAddOns >= 3 && premiumMultimediaDeal
  const hasMultimediaDeal = activeMultimediaAddOns >= 2 && !hasPremiumMultimediaDeal && multimediaDeal

  let multimediaDealType: "none" | "standard" | "premium" = "none"
  let multimediaDealDiscount = 0
  let multimediaDealName = ""

  if (hasPremiumMultimediaDeal) {
    multimediaDealType = "premium"
    multimediaDealDiscount = premiumMultimediaDeal?.discountPercentage ?? 25
    multimediaDealName = premiumMultimediaDeal?.name ?? "Premium Multimedia Deal"
  } else if (hasMultimediaDeal) {
    multimediaDealType = "standard"
    multimediaDealDiscount = multimediaDeal?.discountPercentage ?? 15
    multimediaDealName = multimediaDeal?.name ?? "Multimedia Deal"
  }

  const getOptionVolumeDiscount = (count: number) => {
    if (meetsThreshold(count, tenPlus?.minThreshold ?? 10, tenPlus?.maxThreshold ?? null)) {
      return tenPlusDiscount
    } else if (meetsThreshold(count, fivePlus?.minThreshold ?? 5, fivePlus?.maxThreshold ?? 9)) {
      return fivePlusDiscount
    }
    return 0
  }

  // Check if add-on is part of multimedia bundle
  const isMultimediaAddon = (addOnKey: string) => {
    return ["vinylMasteringSongs", "streamingMasteringSongs", "redbookMasteringSongs"].includes(addOnKey)
  }

  const getStemPrice = (stemCount: number): number => {
    if (stemCount >= 25) return stemTiers.find((t) => t?.id === "stem_master_25_32")?.price ?? 200
    if (stemCount >= 17) return stemTiers.find((t) => t?.id === "stem_master_17_24")?.price ?? 150
    if (stemCount >= 9) return stemTiers.find((t) => t?.id === "stem_master_9_16")?.price ?? 100
    if (stemCount >= 2) return stemTiers.find((t) => t?.id === "stem_master_2_8")?.price ?? 50
    return 0
  }

  const getStemTierName = (stemCount: number): string => {
    if (stemCount >= 25) return "25-32 stems"
    if (stemCount >= 17) return "17-24 stems"
    if (stemCount >= 9) return "9-16 stems"
    if (stemCount >= 2) return "2-8 stems"
    return ""
  }

  const PER_SONG_ADD_ONS: {
    key: "vinylMasteringSongs" | "streamingMasteringSongs" | "redbookMasteringSongs" | "restorationRemasteringSongs"
    label: string
    description: string
    price: number
  }[] = [
    {
      key: "vinylMasteringSongs",
      label: vinylOption?.name ?? "Vinyl Mastering",
      description: vinylOption?.description ?? "Optimized mastering for vinyl pressing",
      price: vinylPrice,
    },
    {
      key: "streamingMasteringSongs",
      label: streamingOption?.name ?? "Streaming Mastering",
      description: streamingOption?.description ?? "Optimized for Spotify, Tidal, and other streaming platforms",
      price: streamingPrice,
    },
    {
      key: "redbookMasteringSongs",
      label: redbookOption?.name ?? "Redbook CD Mastering",
      description: redbookOption?.description ?? "CD-quality mastering to Redbook specifications",
      price: redbookPrice,
    },
    {
      key: "restorationRemasteringSongs",
      label: restorationOption?.name ?? "Restoration Remastering",
      description: restorationOption?.description ?? "Audio restoration and remastering for archival recordings",
      price: restorationPrice,
    },
  ]

  const toggleAddOnOpen = (key: string) => {
    setOpenAddOns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSongForAddOn = (
    addOnKey:
      | "vinylMasteringSongs"
      | "streamingMasteringSongs"
      | "redbookMasteringSongs"
      | "restorationRemasteringSongs",
    songId: string,
  ) => {
    const currentSongs = addOns[addOnKey]
    if (currentSongs.includes(songId)) {
      setAddOns({ ...addOns, [addOnKey]: currentSongs.filter((id) => id !== songId) })
    } else {
      setAddOns({ ...addOns, [addOnKey]: [...currentSongs, songId] })
    }
  }

  const selectAllForAddOn = (
    addOnKey:
      | "vinylMasteringSongs"
      | "streamingMasteringSongs"
      | "redbookMasteringSongs"
      | "restorationRemasteringSongs",
  ) => {
    setAddOns({ ...addOns, [addOnKey]: songs.map((s) => s.id) })
  }

  const deselectAllForAddOn = (
    addOnKey:
      | "vinylMasteringSongs"
      | "streamingMasteringSongs"
      | "redbookMasteringSongs"
      | "restorationRemasteringSongs",
  ) => {
    setAddOns({ ...addOns, [addOnKey]: [] })
  }

  const toggleStemMastering = (songId: string) => {
    const newStems = { ...addOns.stemMasteringSongs }
    if (songId in newStems) {
      delete newStems[songId]
    } else {
      newStems[songId] = 2
    }
    setAddOns({ ...addOns, stemMasteringSongs: newStems })
  }

  const updateStemCount = (songId: string, count: number) => {
    const clampedCount = Math.max(2, Math.min(32, count))
    setAddOns({
      ...addOns,
      stemMasteringSongs: { ...addOns.stemMasteringSongs, [songId]: clampedCount },
    })
  }

  const handleVirtualSessionHoursChange = (value: string) => {
    const hours = Number.parseInt(value) || 0
    if (hours === 0) {
      setAddOns({ ...addOns, virtualSessionHours: 0 })
    } else {
      setAddOns({ ...addOns, virtualSessionHours: Math.max(hours, virtualSessionMinHours) })
    }
  }

  const virtualSessionCost = addOns.virtualSessionHours * virtualSessionHourlyRate

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Add Ons</h2>
        <p className="text-muted-foreground">Select additional mastering services to enhance your project.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
        <Info className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
        <span className="text-foreground">
          <span className="font-medium">Volume Discounts:</span> Select 5+ songs for {fivePlusDiscount}% off, or 10+
          songs for {tenPlusDiscount}% off on per-song add-ons.
        </span>
      </div>

      {multimediaDealType !== "none" && (
        <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-primary shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{multimediaDealName} Applied!</span> {multimediaDealDiscount}% additional
            discount on all multimedia add-ons.
          </span>
        </div>
      )}

      {activeMultimediaAddOns === 1 && (
        <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Add 1 more format (Vinyl, Streaming, or Redbook) to unlock the{" "}
            <span className="font-medium">Multimedia Deal</span> (15% off), or all 3 for the{" "}
            <span className="font-medium">Premium Multimedia Deal</span> (25% off)!
          </span>
        </div>
      )}

      {activeMultimediaAddOns === 2 && (
        <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Add the last format to upgrade to the <span className="font-medium">Premium Multimedia Deal</span> (25%
            off)!
          </span>
        </div>
      )}

      <div className="space-y-4">
        {PER_SONG_ADD_ONS.map((addon) => {
          const isOpen = openAddOns[addon.key] ?? false
          const selectedCount = addOns[addon.key].length
          const volumeDiscountPercentage = getOptionVolumeDiscount(selectedCount)
          const isMultimedia = isMultimediaAddon(addon.key)
          const afterVolumeDiscount = addon.price * (1 - volumeDiscountPercentage / 100)
          const finalPrice = isMultimedia
            ? afterVolumeDiscount * (1 - multimediaDealDiscount / 100)
            : afterVolumeDiscount
          const addonCost = selectedCount * finalPrice
          const hasAnyDiscount =
            selectedCount > 0 && (volumeDiscountPercentage > 0 || (isMultimedia && multimediaDealDiscount > 0))

          return (
            <div key={addon.key} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAddOnOpen(addon.key)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium">{addon.label}</span>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1">
                        {selectedCount} song{selectedCount !== 1 ? "s" : ""} selected
                        {hasAnyDiscount && (
                          <span className="text-green-600">
                            ({volumeDiscountPercentage > 0 && `${volumeDiscountPercentage}%`}
                            {volumeDiscountPercentage > 0 && isMultimedia && multimediaDealDiscount > 0 && " + "}
                            {isMultimedia && multimediaDealDiscount > 0 && `${multimediaDealDiscount}%`} off)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">
                    {hasAnyDiscount ? (
                      <>
                        <span className="line-through text-muted-foreground">${addon.price}</span>
                        <span className="text-green-600 ml-1">${finalPrice.toFixed(0)}/song</span>
                      </>
                    ) : (
                      <span>+${addon.price}/song</span>
                    )}
                    {addonCost > 0 && <span className="text-primary ml-1">(${addonCost.toFixed(0)})</span>}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="!w-[16px] !h-[16px] text-muted-foreground" />
                  ) : (
                    <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
                  )}
                </div>
              </button>

              {isOpen && (
                <div className="border-t border-border p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">
                      Select songs to apply {addon.label.toLowerCase()}:
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => selectAllForAddOn(addon.key)} className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => deselectAllForAddOn(addon.key)} className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  {selectedCount > 0 && selectedCount < 5 && (
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded">
                      Select {5 - selectedCount} more song{5 - selectedCount !== 1 ? "s" : ""} for {fivePlusDiscount}%
                      volume discount
                    </div>
                  )}
                  {selectedCount >= 5 && selectedCount < 10 && (
                    <div className="text-xs text-green-600 mb-3 p-2 bg-green-500/10 rounded">
                      {fivePlusDiscount}% volume discount applied! Select {10 - selectedCount} more song
                      {10 - selectedCount !== 1 ? "s" : ""} for {tenPlusDiscount}% discount
                    </div>
                  )}
                  {selectedCount >= 10 && (
                    <div className="text-xs text-green-600 mb-3 p-2 bg-green-500/10 rounded">
                      {tenPlusDiscount}% maximum volume discount applied!
                    </div>
                  )}
                  <div className="space-y-2">
                    {songs.map((song, index) => {
                      const isSelected = addOns[addon.key].includes(song.id)
                      return (
                        <button
                          key={song.id}
                          type="button"
                          onClick={() => toggleSongForAddOn(addon.key, song.id)}
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
                                <span className="line-through">${addon.price}</span>
                                <span className="text-green-600 ml-1">${finalPrice.toFixed(0)}</span>
                              </>
                            ) : (
                              `+$${addon.price}`
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

        {/* Stem Mastering */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => toggleAddOnOpen("stemMastering")}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">Stem Mastering</span>
                {Object.keys(addOns.stemMasteringSongs).length > 0 && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {Object.keys(addOns.stemMasteringSongs).length} song
                    {Object.keys(addOns.stemMasteringSongs).length !== 1 ? "s" : ""} selected
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Mastering from individual stems for enhanced control</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">$50-$200/song</span>
              {openAddOns["stemMastering"] ? (
                <ChevronUp className="!w-[16px] !h-[16px] text-muted-foreground" />
              ) : (
                <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
              )}
            </div>
          </button>

          {openAddOns["stemMastering"] && (
            <div className="border-t border-border p-4 bg-muted/30">
              <div className="bg-muted/50 p-3 rounded-md mb-4">
                <p className="text-sm font-medium mb-2">Stem Pricing Tiers:</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>2-8 stems: $50/song</span>
                  <span>9-16 stems: $100/song</span>
                  <span>17-24 stems: $150/song</span>
                  <span>25-32 stems: $200/song</span>
                </div>
              </div>
              <div className="space-y-2">
                {songs.map((song, index) => {
                  const isSelected = song.id in addOns.stemMasteringSongs
                  const stemCount = addOns.stemMasteringSongs[song.id] ?? 2
                  const stemPrice = getStemPrice(stemCount)

                  return (
                    <div
                      key={song.id}
                      className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => toggleStemMastering(song.id)}
                          className={`!w-[16px] !h-[16px] rounded border flex items-center justify-center ${
                            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                          }`}
                        >
                          {isSelected && <Check className="!w-[16px] !h-[16px] text-primary-foreground" />}
                        </button>
                        <span className="text-sm font-medium">{song.title || `Song ${index + 1}`}</span>
                        <span className="text-xs text-muted-foreground">
                          ({song.minutes}:{song.seconds.toString().padStart(2, "0")})
                        </span>
                      </div>
                      {isSelected ? (
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min={2}
                            max={32}
                            value={stemCount}
                            onChange={(e) => updateStemCount(song.id, Number.parseInt(e.target.value, 10) || 2)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-20 h-8"
                          />
                          <span className="text-xs text-muted-foreground">stems</span>
                          <span className="text-sm font-medium">${stemPrice}</span>
                          <span className="text-xs text-muted-foreground">({getStemTierName(stemCount)})</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">+$50-$200</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Virtual In-Person Session */}
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setVirtualSessionOpen(!virtualSessionOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">
                  {virtualSessionOption?.name ?? "Virtual In-Person Session"}
                </span>
                {addOns.virtualSessionHours > 0 && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                    {addOns.virtualSessionHours} hour{addOns.virtualSessionHours !== 1 ? "s" : ""} booked
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {virtualSessionOption?.description ?? "Join remotely via video call during your session"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                ${virtualSessionHourlyRate}/hour
                {virtualSessionCost > 0 && <span className="text-primary ml-1">(${virtualSessionCost})</span>}
              </span>
              {virtualSessionOpen ? (
                <ChevronUp className="!w-[16px] !h-[16px] text-muted-foreground" />
              ) : (
                <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
              )}
            </div>
          </button>

          {virtualSessionOpen && (
            <div className="border-t border-border p-4 bg-muted/30">
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm mb-4">
                <Info className="!w-[16px] !h-[16px] text-blue-600 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  Virtual sessions are billed at ${virtualSessionHourlyRate}/hour with a minimum of{" "}
                  {virtualSessionMinHours} hours required.
                </span>
              </div>

              <div className="flex items-center gap-4">
                <Label htmlFor="virtualSessionHours" className="text-sm text-muted-foreground whitespace-nowrap">
                  Number of hours:
                </Label>
                <Input
                  id="virtualSessionHours"
                  type="number"
                  min={0}
                  value={addOns.virtualSessionHours || ""}
                  onChange={(e) => handleVirtualSessionHoursChange(e.target.value)}
                  placeholder={`Min ${virtualSessionMinHours} hours`}
                  className="w-32"
                />
                {addOns.virtualSessionHours > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      Total: <span className="text-primary">${virtualSessionCost}</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddOns({ ...addOns, virtualSessionHours: 0 })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
