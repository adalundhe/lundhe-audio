"use client"

import { useState } from "react"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Plus, Trash2, ChevronDown, ChevronRight, Info, HelpCircle } from "lucide-react"
import type { PricingData, Song } from "~/lib/mixing/pricing-types"
import { getVolumeDiscountInfo, getIncludedRevisions } from "~/lib/mixing/pricing-calculator"
import { Card, CardContent } from "~/components/ui/card"
import { meetsThreshold } from "~/lib/meets-threshold"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "~/components/ui/tooltip"
import { ProductOption } from "~/server/db/types"

type ProjectSizeStepProps = {
  songs: Song[]
  setSongs: (songs: Song[]) => void
  pricingData: PricingData
}

export function ProjectSizeStep({ songs, setSongs, pricingData }: ProjectSizeStepProps) {
  const [collapsedSongs, setCollapsedSongs] = useState<Set<string>>(new Set())
  const [inputValues, setInputValues] = useState<
    Record<string, { tracks?: string; minutes?: string; seconds?: string }>
  >({})

  const { products, options, discounts } = pricingData

  const songMixProduct = products.find((p) => p.id === "song_mix")
  const highTrackProduct = products.find((p) => p.id === "high_track_count_mix")
  const revisions = products.find((p) => p.id === "mix_revision")

  const { epDeal, lpDeal, xlpDeal } = getVolumeDiscountInfo(discounts)

  console.log(epDeal)

  const lengthFeeOptions = options
    .filter((o) => o.category === "length_fee")
    .sort((a, b) => (a.minThreshold ?? 0) - (b.minThreshold ?? 0))

  const trackFeeOption = options.find(o => o.id === "track_fee")
  const highTrackFeeOption = options.find(o => o.id === "high_track_fee")
  const highTrackFeeCost = highTrackFeeOption?.price ?? 150
  const highTrackFeeThreshold = trackFeeOption?.maxThreshold ?? 100
  const highTrackPerCount = highTrackFeeOption?.perCount ?? 25
  const highTrackCountLimit = highTrackFeeOption?.maxThreshold ?? 500

  // Determine which deal is active
  const songCount = songs.length
  const epDealActive = epDeal && meetsThreshold(songCount, epDeal.minThreshold, epDeal.maxThreshold)
  const lpDealActive = lpDeal && meetsThreshold(songCount, lpDeal.minThreshold, lpDeal.maxThreshold)
  const xlpDealActive = xlpDeal && meetsThreshold(songCount, xlpDeal.minThreshold, xlpDeal.maxThreshold)
  const activeDeal = xlpDealActive ? xlpDeal : lpDealActive ? lpDeal : epDealActive ?  epDeal : null


  const includedRevisions = getIncludedRevisions(songCount, discounts)

  const toggleCollapse = (id: string) => {
    setCollapsedSongs((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const addSong = () => {
    setSongs([...songs, { id: crypto.randomUUID(), title: "", tracks: 1, minutes: 3, seconds: 30 }])
  }

  const removeSong = (id: string) => {
    if (songs.length > 1) {
      setSongs(songs.filter((song) => song.id !== id))
      setCollapsedSongs((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const updateSong = (id: string, field: keyof Song, value: string | number) => {
    setSongs(songs.map((song) => (song.id === id ? { ...song, [field]: value } : song)))
  }

  const handleNumberInputChange = (
    songId: string,
    field: "tracks" | "minutes" | "seconds",
    value: string,
    min: number,
    max: number,
    defaultValue: number,
  ) => {
    setInputValues((prev) => ({
      ...prev,
      [songId]: {
        ...prev[songId],
        [field]: value,
      },
    }))

    if (value === "") {
      return
    }
    const parsed = Number.parseInt(value, 10)
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed))
      updateSong(songId, field, clamped)
    }
  }

  const handleNumberInputBlur = (
    songId: string,
    field: "tracks" | "minutes" | "seconds",
    min: number,
    defaultValue: number,
  ) => {
    const currentInput = inputValues[songId]?.[field]
    if (currentInput === "" || currentInput === undefined) {
      updateSong(songId, field, defaultValue)
      setInputValues((prev) => ({
        ...prev,
        [songId]: {
          ...prev[songId],
          [field]: undefined,
        },
      }))
    } else {
      setInputValues((prev) => ({
        ...prev,
        [songId]: {
          ...prev[songId],
          [field]: undefined,
        },
      }))
    }
  }

  const getInputValue = (songId: string, field: "tracks" | "minutes" | "seconds", actualValue: number) => {
    const intermediate = inputValues[songId]?.[field]
    if (intermediate !== undefined) {
      return intermediate
    }
    return actualValue.toString()
  }
  const hasHighTrackCount = (trackCount: number, options: ProductOption[]) => {
    const highTrackFeeOption = options.find(o => o.id === "high_track_fee")
    if (!highTrackFeeOption) return false;

    return meetsThreshold(trackCount, highTrackFeeOption.minThreshold, highTrackFeeOption.maxThreshold)

  }

  const hasExtendedLengthFee = (minutes: number, seconds: number) => {
    const totalMinutes = minutes + seconds / 60
    return lengthFeeOptions.some((opt) => totalMinutes > (opt.minThreshold ?? 0))
  }

  const getExtendedLengthFee = (minutes: number, seconds: number) => {
    const totalMinutes = minutes + seconds / 60
    const sortedDesc = [...lengthFeeOptions].sort((a, b) => (b.minThreshold ?? 0) - (a.minThreshold ?? 0))
    for (const opt of sortedDesc) {
      if (totalMinutes > (opt.minThreshold ?? 0)) {
        return opt.price
      }
    }
    return 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Project Size</h2>
        <p className="text-muted-foreground">Add songs to your project and specify the details for each.</p>
      </div>

      <Card className="bg-muted/50 border-border">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Info className="!w-[16px] !h-[16px] text-primary" />
            Pricing Overview
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Base Cost Per Song</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>
                  • 1-10 tracks: <span className="text-foreground font-medium">${songMixProduct?.price ?? 200}</span>
                </li>
                <li>
                  • 11-50 tracks:{" "}
                  <span className="text-foreground font-medium">${songMixProduct?.price ?? 200} + ${trackFeeOption?.price ?? 50}</span> per
                  additional 10 tracks
                </li>
                <li>
                  • 50+ tracks:{" "}
                  <span className="text-foreground font-medium">${highTrackProduct?.price ?? 600} + ${highTrackFeeCost}</span> per
                  additional {highTrackPerCount} tracks
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-foreground">Extended Length Fees</h4>
              <ul className="space-y-1 text-muted-foreground">
                {lengthFeeOptions.map((opt) => (
                  <li key={opt.id}>
                    • Over {opt.minThreshold} minutes:{" "}
                    <span className="text-foreground font-medium">+${opt.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {
            revisions && <div className="pt-2 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <h4 className="font-medium text-foreground">Project Revisions Included</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="!w-[16px] !h-[16px] text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>
                      A single revision allows you to request mix changes to any and/or all songs in the project. We do
                      not charge per-song for revisions.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              Each revision is valued at <span className="font-medium">${revisions.price}</span>. A single revision
              covers feedback for any or all songs in your project — we never charge per-song for revisions.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm lg:items-center lg:text-left text-center lg:w-fit w-full gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
                <span>
                  {includedRevisions} Revisions{" "}
                  (<span className="text-green-600/80 w-fit line-through">${includedRevisions * revisions.price}</span>){" "}
                  Free
                </span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Revisions are project-wide and apply to the entire project.
              {songCount < 5 && " Add more songs to unlock additional revisions."}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              <li className={songCount >= 1 && songCount <= 4 ? "text-green-600 font-medium" : ""}>
                • 1-4 songs: 3 project revisions
              </li>
              <li className={songCount >= 5 && songCount <= 9 ? "text-green-600 font-medium" : ""}>
                • 5-9 songs: 5 project revisions
              </li>
              <li className={songCount >= 10 ? "text-green-600 font-medium" : ""}>• 10+ songs: 8 project revisions</li>
            </ul>
          </div>
          }

          <div className="pt-2 border-t border-border">
            <h4 className="font-medium text-foreground mb-2">Volume Discounts</h4>
            <div className="flex flex-wrap gap-3 text-sm">
              {epDeal && (
                <span
                  className={`inline-flex lg:text-sm text-xs items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    epDealActive && !lpDeal && !xlpDealActive
                      ? "bg-green-500/20 text-green-600 border-green-500/40 ring-2 ring-green-500/20"
                      : "bg-green-500/10 text-green-600/30 border-green-500/20"
                  }`}
                >
                  {epDeal.minThreshold}-{epDeal.maxThreshold} songs:{" "}
                  <span className="font-semibold">{epDeal.discountPercentage}% off</span>
                  <span className="font-medium">({epDeal.name})</span>
                </span>
              )}
              {lpDeal && (
                <span
                  className={`inline-flex lg:text-sm text-xs items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    lpDealActive && !xlpDealActive
                      ? "bg-green-500/20 text-green-600 border-green-500/40 ring-2 ring-green-500/20"
                      : "bg-green-500/10 text-green-600/30 border-green-500/20"
                  }`}
                >
                  {lpDeal.minThreshold}+ songs:{" "}
                  <span className="font-semibold">{lpDeal.discountPercentage}% off</span>
                  <span className="font-medium">({lpDeal.name})</span>
                </span>
              )}
              {xlpDeal && (
                <span
                  className={`inline-flex lg:text-sm text-xs items-center gap-1.5 px-2.5 py-1 rounded-full border ${
                    xlpDealActive
                      ? "bg-green-500/20 text-green-600 border-green-500/40 ring-2 ring-green-500/20"
                      : "bg-green-500/10 text-green-600/30 border-green-500/20"
                  }`}
                >
                  {xlpDeal.minThreshold}+ songs:{" "}
                  <span className="font-semibold">{xlpDeal.discountPercentage}% off</span>
                  <span className="font-medium">({xlpDeal.name})</span>
                </span>
              )}
            </div>
            {activeDeal && (
              <div className="mt-3 flex lg:flex-row flex-col gap-2 text-sm text-green-600">
                <span className="font-medium">{activeDeal.name} Applied!</span>
                <span className="text-muted-foreground">
                  ({activeDeal.discountPercentage}% discount on base song costs)
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {songs.map((song, index) => {
          const isCollapsed = collapsedSongs.has(song.id)
          const isHighTrackCount = hasHighTrackCount(song.tracks, options)
          const isExtendedLength = hasExtendedLengthFee(song.minutes, song.seconds)
          const lengthFee = getExtendedLengthFee(song.minutes, song.seconds)

          return (
            <div key={song.id} className="border border-border rounded-lg bg-muted/30 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleCollapse(song.id)}
              >
                <div className="flex items-center gap-2">
                  {isCollapsed ? (
                    <ChevronRight className="!w-[16px] !h-[16px] text-muted-foreground" />
                  ) : (
                    <ChevronDown className="!w-[16px] !h-[16px] text-muted-foreground" />
                  )}
                  <h3 className="lg:max-w-[500px] max-w-[180px] text-nowrap overflow-hidden text-ellipsis font-medium">{song.title || `Song ${index + 1}`}</h3>
                  {isCollapsed && (
                    <span className="text-sm text-muted-foreground ml-2">
                      ({song.tracks} tracks, {song.minutes}:{song.seconds.toString().padStart(2, "0")})
                    </span>
                  )}
                  {isCollapsed && isHighTrackCount && (
                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">
                      High Track Fee
                    </span>
                  )}
                  {isCollapsed && isExtendedLength && (
                    <span className="text-xs bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded-full ml-1">
                      +${lengthFee} Length Fee
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeSong(song.id)
                  }}
                  disabled={songs.length === 1}
                  className="text-foreground hover:text-destructive"
                >
                  <Trash2 className="!w-[16px] !h-[16px]" />
                  <span className="sr-only">Remove song</span>
                </Button>
              </div>

              {!isCollapsed && (
                <div className="px-4 pb-4 space-y-4">
                  {isHighTrackCount && (
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
                      <Info className="!w-[16px] !h-[16px] text-primary shrink-0" />
                      <span className="text-foreground">
                        <strong>High track count fee applies.</strong> Songs with more than {highTrackFeeThreshold}{" "}
                        tracks incur a higher base rate of ${highTrackProduct?.price ?? 500} plus ${highTrackFeeCost} for every
                        additional {highTrackPerCount} tracks.
                      </span>
                    </div>
                  )}

                  {isExtendedLength && (
                    <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm">
                      <Info className="!w-[16px] !h-[16px] text-amber-600 shrink-0" />
                      <span className="text-foreground">
                        <strong>Extended length fee: +${lengthFee}</strong>
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${song.id}`}>Song Title</Label>
                      <Input
                        id={`title-${song.id}`}
                        placeholder="Enter song title"
                        value={song.title}
                        onChange={(e) => updateSong(song.id, "title", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`tracks-${song.id}`}>Number of Tracks</Label>
                      <Input
                        id={`tracks-${song.id}`}
                        type="number"
                        min={1}
                        max={500}
                        value={getInputValue(song.id, "tracks", song.tracks)}
                        onChange={(e) => handleNumberInputChange(song.id, "tracks", e.target.value, 1, highTrackCountLimit, 1)}
                        onBlur={() => handleNumberInputBlur(song.id, "tracks", 1, 1)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Song Length</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          value={getInputValue(song.id, "minutes", song.minutes)}
                          onChange={(e) => handleNumberInputChange(song.id, "minutes", e.target.value, 0, 59, 0)}
                          onBlur={() => handleNumberInputBlur(song.id, "minutes", 0, 0)}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">min</span>
                      </div>
                      <span className="text-muted-foreground">:</span>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={59}
                          value={getInputValue(song.id, "seconds", song.seconds)}
                          onChange={(e) => handleNumberInputChange(song.id, "seconds", e.target.value, 0, 59, 0)}
                          onBlur={() => handleNumberInputBlur(song.id, "seconds", 0, 0)}
                          className="w-20"
                        />
                        <span className="text-muted-foreground">sec</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
      

      <div className="w-full flex flex-col items-center">
        <Button onClick={addSong} className="w-fit bg-transparent flex border h-fit hover:bg-white hover:text-black">
          <Plus className="!w-[16px] !h-[16px] mr-2" />
          Add Song
        </Button>
      </div>
    </div>
  )
}
