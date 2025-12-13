"use client"

import { useState } from "react"
import { Label } from "~/components/ui/label"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import type { AddOns, Song, PricingData } from "~/lib/mixing/pricing-types"
import { meetsThreshold } from "~/lib/meets-threshold"
import { ChevronDown, ChevronUp, Check, Info, Sparkles, RotateCcw } from "lucide-react"
import { getOptionVolumeDiscountInfo } from "~/lib/mixing/pricing-calculator"
import { Discount } from "~/server/db/types"
import { useMixingAddOns, useMixingPricingData, useMixingSongs } from "~/hooks/use-mixing-quote"

const getRevisionVolumeDiscount = (count: number, discounts: Discount[]) => {

  const standardRevisionDiscount = discounts.find((p) => p.id === "standard_revision_bundle")
  const deluxeRevisionDiscount = discounts.find((p) => p.id === "deluxe_revision_bundle")
  const premiumRevisionDiscount = discounts.find((p) => p.id === "premium_revision_bundle")

  const revisionVolumeDiscounts = [
    standardRevisionDiscount,
    deluxeRevisionDiscount,
    premiumRevisionDiscount,
  ]

  let bestDiscount = 0
  for (const discount of revisionVolumeDiscounts) {
    if (discount && meetsThreshold(count, discount.minThreshold, discount.maxThreshold)) {
      if (discount.discountPercentage > bestDiscount) {
        bestDiscount = discount.discountPercentage
      }
    }
  }
  return bestDiscount
}

export function AddOnsStep() {

  const {addOns, setAddOns } = useMixingAddOns()
  const {songs } = useMixingSongs()
  const { pricingData } = useMixingPricingData()

  const [openAddOns, setOpenAddOns] = useState<Record<string, boolean>>({})
  const [virtualSessionOpen, setVirtualSessionOpen] = useState(false)
  const [revisionsOpen, setRevisionsOpen] = useState(false)

  const { options, discounts } = pricingData


    const { threePlus, fivePlus, tenPlus } = getOptionVolumeDiscountInfo(pricingData.discounts)
    const threePlusDiscount = threePlus?.discountPercentage ?? 10
    const fivePlusDiscount = fivePlus?.discountPercentage ?? 20
    const tenPlusDiscount = tenPlus?.discountPercentage ?? 30
  

  // Get option prices from database
  const vocalOption = options.find((o) => o.id === "vocal_production")
  const drumOption = options.find((o) => o.id === "drum_replacement")
  const guitarOption = options.find((o) => o.id === "guitar_reamp")
  const virtualSessionOption = options.find((o) => o.id === "virtual_session")
  const revisionOption = options.find((o) => o.id === 'mix_revision')

  const vocalPrice = vocalOption?.price ?? 100
  const drumPrice = drumOption?.price ?? 150
  const guitarPrice = guitarOption?.price ?? 50

  const revisionPrice = revisionOption?.price ?? 250
  const revisionCount = addOns.revisions
  const revisionsMax = revisionOption?.maxThreshold ?? 10
  const revisionDiscountPercent = getRevisionVolumeDiscount(revisionCount, discounts)
  const revisionSubtotal = revisionCount * revisionPrice
  const revisionDiscount = revisionSubtotal * (revisionDiscountPercent / 100)
  const revisionTotal = revisionSubtotal - revisionDiscount
  
  const virtualSessionHourlyRate = virtualSessionOption?.price ?? 100
  const virtualSessionMinHours = virtualSessionOption?.minThreshold ?? 4

  // Get option volume discounts from database
  const optionVolumeDiscounts = discounts.filter((d) => d.category === "option_volume")
  // Get bundle discounts from database
  const bundleDiscounts = discounts.filter((d) => d.category === "bundle")

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

  // Determine production deal
  const hasVocal = addOns.vocalProductionSongs.length > 0
  const hasDrum = addOns.drumReplacementSongs.length > 0
  const hasGuitar = addOns.guitarReampSongs.length > 0
  const activeProductionAddOns = [hasVocal, hasDrum, hasGuitar].filter(Boolean).length

  let productionDealType: "none" | "production" | "premium" = "none"
  let productionDealDiscount = 0
  let productionDealName = ""

  if (activeProductionAddOns >= 3) {
    const premiumDeal = bundleDiscounts.find((d) => d.id === "premium_production_deal")
    if (premiumDeal) {
      productionDealType = "premium"
      productionDealDiscount = premiumDeal.discountPercentage
      productionDealName = premiumDeal.name
    }
  } else if (activeProductionAddOns >= 2) {
    const productionDeal = bundleDiscounts.find((d) => d.id === "production_deal")
    if (productionDeal) {
      productionDealType = "production"
      productionDealDiscount = productionDeal.discountPercentage
      productionDealName = productionDeal.name
    }
  }

  const PER_SONG_ADD_ONS: {
    key: "vocalProductionSongs" | "drumReplacementSongs" | "guitarReampSongs"
    label: string
    description: string
    price: number
  }[] = [
    {
      key: "vocalProductionSongs",
      label: vocalOption?.name ?? "Vocal Production Mixing/Editing",
      description: vocalOption?.description ?? "Professional vocal tuning, comping, and effects processing",
      price: vocalPrice,
    },
    {
      key: "drumReplacementSongs",
      label: drumOption?.name ?? "Drum Replacement/Production",
      description: drumOption?.description ?? "Replace or enhance drum tracks with professional samples",
      price: drumPrice,
    },
    {
      key: "guitarReampSongs",
      label: guitarOption?.name ?? "Guitar Re-Amplification/Production",
      description: guitarOption?.description ?? "Re-amp guitar DI tracks through premium analog gear",
      price: guitarPrice,
    },
  ]

  const toggleAddOnOpen = (key: string) => {
    setOpenAddOns((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleSongForAddOn = (
    addOnKey: "vocalProductionSongs" | "drumReplacementSongs" | "guitarReampSongs",
    songId: string,
  ) => {
    const currentSongs = addOns[addOnKey]
    if (currentSongs.includes(songId)) {
      setAddOns({ ...addOns, [addOnKey]: currentSongs.filter((id) => id !== songId) })
    } else {
      setAddOns({ ...addOns, [addOnKey]: [...currentSongs, songId] })
    }
  }

  const selectAllForAddOn = (addOnKey: "vocalProductionSongs" | "drumReplacementSongs" | "guitarReampSongs") => {
    setAddOns({ ...addOns, [addOnKey]: songs.map((s) => s.id) })
  }

  const deselectAllForAddOn = (addOnKey: "vocalProductionSongs" | "drumReplacementSongs" | "guitarReampSongs") => {
    setAddOns({ ...addOns, [addOnKey]: [] })
  }

  const handleVirtualSessionHoursChange = (value: string) => {
    const hours = Number.parseInt(value) || 0
    if (hours === 0) {
      setAddOns({ ...addOns, virtualSessionHours: 0 })
    } else {
      setAddOns({ ...addOns, virtualSessionHours: Math.max(hours, virtualSessionMinHours) })
    }
  }


  const handleAdditionalRevisionsChange = (value: string) => {
    const count = Number.parseInt(value) || 0
    setAddOns({ ...addOns, revisions: Math.min(Math.max(0, count), revisionsMax) })
  }

    // Check if add-on is part of multimedia bundle
  const isProductionAddOn = (addOnKey: string) => {
    return ["vocalProductionSongs", "drumReplacementSongs", "guitarReampSongs"].includes(addOnKey)
  }

  const virtualSessionCost = addOns.virtualSessionHours * virtualSessionHourlyRate

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Add Ons</h2>
        <p className="text-muted-foreground">Select additional services to enhance your project.</p>
      </div>

      <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
        <Info className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
        <span className="text-foreground">
          <span className="font-medium">Volume Discounts:</span> Select 3+ songs for {threePlusDiscount}% off, 5+ songs for {fivePlusDiscount}% off, or 10+
          songs for {tenPlusDiscount}% off on per-song add-ons.
        </span>
      </div>

      {productionDealType !== "none" && (
        <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-primary shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{productionDealName} Applied!</span> {productionDealDiscount}% additional
            discount on all production add-ons.
          </span>
        </div>
      )}

      {activeProductionAddOns === 1 && (
        <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Add 1 more production add-on to unlock the <span className="font-medium">Production Deal</span> (15% off),
            or all 3 for the <span className="font-medium">Premium Production Deal</span> (25% off)!
          </span>
        </div>
      )}

      {activeProductionAddOns === 2 && (
        <div className="flex items-start gap-2 p-3 bg-muted border border-border rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground">
            Add the last production add-on to upgrade to the{" "}
            <span className="font-medium">Premium Production Deal</span> (25% off)!
          </span>
        </div>
      )}

      <div className="space-y-4">
        {PER_SONG_ADD_ONS.map((addon) => {
          const isOpen = openAddOns[addon.key] ?? false
          const selectedCount = addOns[addon.key].length
          const volumeDiscountPercentage = getOptionVolumeDiscount(selectedCount)
          const isProductionDeal = isProductionAddOn(addon.key)

          const totalDiscount = volumeDiscountPercentage + (
            isProductionDeal ? productionDealDiscount : 0
          )


          const finalPrice = addon.price * (1 - totalDiscount/100)      

          const addonCost =  addon.price * selectedCount * (1 - totalDiscount/100)   
          const hasAnyDiscount =
            selectedCount > 0 && (volumeDiscountPercentage > 0 || (isProductionDeal && productionDealDiscount > 0))

          return (
            <div key={addon.key} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => toggleAddOnOpen(addon.key)}
                className="w-full flex flex-wrap items-start justify-between lg:flex-row flex-col lg:items-center lg:gap-2 gap-4 p-4 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-medium">{addon.label}</span>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full flex items-center gap-1 whitespace-nowrap">
                        {selectedCount} song{selectedCount !== 1 ? "s" : ""} selected
                        {hasAnyDiscount && (
                          <span className="text-green-600 ml-1">
                            ({volumeDiscountPercentage > 0 && `${volumeDiscountPercentage}%`}
                            {volumeDiscountPercentage > 0 && productionDealDiscount > 0 && " + "}
                            {productionDealDiscount > 0 && `${productionDealDiscount}%`} off)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{addon.description}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-sm font-medium whitespace-nowrap">
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
                <div className="border-t border-border p-4 bg-muted/30 flex flex-col gap-2">
                  <div className="flex lg:flex-row lg:my-0 my-2 lg:gap-0 gap-4 flex-col items-center justify-between mb-3">
                    <span className="text-sm lg:text-left text-center text-muted-foreground">
                      Select songs to apply {addon.label.toLowerCase()}:
                    </span>
                    <div className="flex gap-2 lg:ml-auto lg:w-fit w-full lg:items-start items-center justify-center">
                      <Button variant="outline" size="sm" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" onClick={() => selectAllForAddOn(addon.key)}>
                        Select All
                      </Button>
                      <Button variant="outline" size="sm" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black" onClick={() => deselectAllForAddOn(addon.key)}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  {selectedCount > 0 && selectedCount < 3 && (
                    <div className="text-xs text-muted-foreground mb-3 p-2 bg-muted rounded">
                      Select {3 - selectedCount} more song{3 - selectedCount !== 1 ? "s" : ""} for {threePlusDiscount}%
                      volume discount
                    </div>
                  )}
                  {selectedCount >= 3 && selectedCount < 5 && (
                    <div className="text-xs lg:text-center text-green-600 mb-3 p-2 bg-green-500/10 rounded">
                      {threePlusDiscount}% volume discount applied! Select {5 - selectedCount} more song
                      {5 - selectedCount !== 1 ? "s" : ""} for {fivePlusDiscount}% discount
                    </div>
                  )}
                  {selectedCount >= 5 && selectedCount < 10 && (
                    <div className="text-xs lg:text-center text-green-600 mb-3 p-2 bg-green-500/10 rounded">
                      {fivePlusDiscount}% volume discount applied! Select {10 - selectedCount} more song
                      {10 - selectedCount !== 1 ? "s" : ""} for {tenPlusDiscount}% discount
                    </div>
                  )}
                  {selectedCount >= 10 && (
                    <div className="text-xs lg:text-center text-green-600 mb-3 p-2 bg-green-500/10 rounded">
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
                          className={`w-full flex flex-wrap items-start justify-between gap-2 p-3 rounded-md border transition-colors ${
                            isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`!w-[16px] !h-[16px] rounded border flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-primary border-primary" : "border-muted-foreground"
                              }`}
                            >
                              {isSelected && <Check className="!w-[16px] !h-[16px] text-primary-foreground" />}
                            </div>
                            <div className="lg:max-w-[320px] max-w-[72px] text-nowrap overflow-hidden text-ellipsis">
                              <span className="text-sm font-medium">{song.title || `Song ${index + 1}`}</span>
                            </div>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              ({song.tracks} tracks, {song.minutes}:{song.seconds.toString().padStart(2, "0")})
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
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
        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setRevisionsOpen(!revisionsOpen)}
            className="w-full flex lg:flex-row flex-col lg:items-center lg:gap-0 gap-4 justify-between p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex-1">
              <div className="flex lg:flex-row flex-col lg:items-center gap-2">
                <span className="text-base font-medium">Additional Project Revisions</span>
                {revisionCount > 0 && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full w-fit">
                    {revisionCount} revision{revisionCount !== 1 ? "s" : ""}
                    {revisionDiscountPercent > 0 && (
                      <span className="text-green-600 ml-1">({revisionDiscountPercent}% off)</span>
                    )}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Additional project revisions beyond your included revisions
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">
                {revisionDiscountPercent > 0 ? (
                  <>
                    <span className="line-through text-muted-foreground">${revisionPrice}</span>
                    <span className="text-green-600 ml-1">
                      ${(revisionPrice * (1 - revisionDiscountPercent / 100)).toFixed(0)}/revision
                    </span>
                  </>
                ) : (
                  <span>+${revisionPrice}/revision</span>
                )}
                {revisionTotal > 0 && <span className="text-primary ml-1">(${revisionTotal.toFixed(0)})</span>}
              </span>
              {revisionsOpen ? (
                <ChevronUp className="!w-[16px] !h-[16px] text-muted-foreground" />
              ) : (
                <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
              )}
            </div>
          </button>

          {revisionsOpen && (
            <div className="border-t border-border p-4 bg-muted/30">
              <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm mb-4">
                <Info className="!w-[16px] !h-[16px] text-blue-600 shrink-0 mt-0.5" />
                <div className="text-foreground">
                  <p>
                    A single revision allows you to request mix changes to <strong>any and/or all songs</strong> in the
                    project.We do not charge revisions per-song.
                  </p>
                  <br/>
                  <p>
                    The maximum number of revisions you may purchase is {revisionsMax}.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm mb-4">
                <RotateCcw className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
                <span className="text-foreground">
                  <span className="font-medium">Volume Discounts:</span> Purchase 3+ revisions for 15% off, 5+ for 25%
                  off, or 8+ for 40% off.
                </span>
              </div>

              <div className="flex lg:flex-row flex-col items-center justify-center gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="additionalRevisions" className="text-sm text-muted-foreground lg:text-left text-center">
                    Number of revisions:
                  </Label>
                </div>
                <Input
                  id="additionalRevisions"
                  type="number"
                  min={0}
                  max={revisionsMax}
                  value={addOns.revisions || ""}
                  onChange={(e) => handleAdditionalRevisionsChange(e.target.value)}
                  placeholder="0"
                  className="w-24 bg-black/80"
                />
                {revisionCount > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {revisionDiscountPercent > 0 ? (
                        <>
                          <span className="line-through text-muted-foreground">${revisionSubtotal}</span>
                          <span className="text-green-600 ml-1">${revisionTotal.toFixed(0)}</span>
                        </>
                      ) : (
                        <span className="text-primary">${revisionTotal.toFixed(0)}</span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAddOns({ ...addOns, revisions: 0 })}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {revisionCount > 0 && revisionCount < 3 && (
                <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted rounded">
                  Add {3 - revisionCount} more revision{3 - revisionCount !== 1 ? "s" : ""} for 15% discount
                </div>
              )}
              {revisionCount >= 3 && revisionCount < 5 && (
                <div className="text-xs text-green-600 mt-3 p-2 bg-green-500/10 rounded">
                  15% discount applied! Add {5 - revisionCount} more revision{5 - revisionCount !== 1 ? "s" : ""} for
                  25% discount
                </div>
              )}
              {revisionCount >= 5 && revisionCount < 8 && (
                <div className="text-xs text-green-600 mt-3 p-2 bg-green-500/10 rounded">
                  25% discount applied! Add {8 - revisionCount} more revision{8 - revisionCount !== 1 ? "s" : ""} for
                  40% discount
                </div>
              )}
              {revisionCount >= 8 && (
                <div className="text-xs text-green-600 mt-3 p-2 bg-green-500/10 rounded">
                  40% maximum discount applied!
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setVirtualSessionOpen(!virtualSessionOpen)}
            className="w-full flex lg:flex-row flex-col lg:items-center lg:gap-0 gap-4 justify-between p-4 hover:bg-muted/50 transition-colors text-left"
          >
            <div className="flex-1">
              <div className="flex lg:flex-row flex-col lg:items-center lg:gap-2 gap-4">
                <span className="text-base font-medium">
                  {virtualSessionOption?.name ?? "Virtual In-Person Session"}
                </span>
                {addOns.virtualSessionHours > 0 && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs lg:rounded-full rounded-md w-fit flex items-center gap-1">
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

              <div className="flex lg:flex-row flex-col items-center justify-center gap-2">
                <Label htmlFor="virtualSessionHours" className="text-sm text-muted-foreground lg:text-left text-center">
                  Number of hours:
                </Label>
                <Input
                  id="virtualSessionHours"
                  type="number"
                  min={0}
                  value={addOns.virtualSessionHours || ""}
                  onChange={(e) => handleVirtualSessionHoursChange(e.target.value)}
                  placeholder={`Min ${virtualSessionMinHours} hours`}
                  className="w-36 bg-black/80"
                />
                {addOns.virtualSessionHours > 0 && (
                  <div className="flex lg:flex-row flex-col items-center gap-2">
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
