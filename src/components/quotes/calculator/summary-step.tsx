"use client"

import type { QuoteData, PricingData } from "~/lib/mixing/pricing-types"
import { getVolumeDiscountInfo } from "~/lib/mixing/pricing-calculator"
import { Music, Clock, Layers, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"

type SummaryStepProps = {
  quoteData: QuoteData
  pricingData: PricingData
}

export function SummaryStep({ quoteData, pricingData }: SummaryStepProps) {
  const { songs, costs, totals, summary } = quoteData
  const { discounts } = pricingData

  const { epDeal, albumDeal } = getVolumeDiscountInfo(discounts)

  const volumeDiscountName = costs.volumeDiscountName
  const volumeDiscountAmount = costs.volumeDiscount

  const productionDealName = costs.productionDealName
  const productionDealSavings = costs.productionDealDiscount

  const hasAnyPerSongAddOns =
    summary.vocalProductionCount > 0 || summary.drumReplacementCount > 0 || summary.guitarReampCount > 0

  const hasAnyDeliveryOptions =
    summary.highResMixdownCount > 0 ||
    summary.filmMixdownCount > 0 ||
    summary.mixedStemsCount > 0 ||
    summary.extendedArchivalCount > 0 ||
    summary.rushDeliveryCount > 0

  const formattedTotalLength = `${totals.totalLengthMinutes}m ${totals.totalLengthSeconds}s`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p className="text-muted-foreground">Review your project details before submitting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Music className="!w-[16px] !h-[16px] text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Songs</p>
            <p className="text-xl font-semibold">{totals.songCount}</p>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Layers className="!w-[16px] !h-[16px] text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Tracks</p>
            <p className="text-xl font-semibold">{totals.trackCount}</p>
          </div>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Clock className="!w-[16px] !h-[16px] text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Length</p>
            <p className="text-xl font-semibold">{formattedTotalLength}</p>
          </div>
        </div>
      </div>

      {volumeDiscountName && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{volumeDiscountName} Applied!</span>{" "}
            {volumeDiscountAmount > 0 && (
              <span className="text-green-600 ml-1">(saving ${volumeDiscountAmount.toFixed(2)})</span>
            )}
          </span>
        </div>
      )}

      {productionDealName && (
        <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-primary shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{productionDealName} Applied!</span>
            {productionDealSavings > 0 && (
              <span className="text-green-600 ml-1">(saving ${productionDealSavings.toFixed(2)})</span>
            )}
          </span>
        </div>
      )}

      {costs.hifiDealSongCount > 0 && (
        <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">Hi-Fi Deal Applied!</span> 10% discount on High Resolution and Film Mixdown
            for {costs.hifiDealSongCount} song{costs.hifiDealSongCount !== 1 ? "s" : ""}
            {costs.hifiDealDiscount > 0 && (
              <span className="text-green-600 ml-1">(saving ${costs.hifiDealDiscount.toFixed(2)})</span>
            )}
          </span>
        </div>
      )}

      {(hasAnyPerSongAddOns || costs.virtualSessionHours > 0 || hasAnyDeliveryOptions) && (
        <div className="space-y-4">
          {summary.vocalProductionCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
              <div>
                <span>Vocal Production Mixing/Editing</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.vocalProduction)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.drumReplacementCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span>Drum Replacement/Production</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.drumReplacement)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.guitarReampCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span>Guitar Re-Amplification/Production</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.guitarReamp)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {costs.virtualSessionHours > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-primary" />
              <span>
                Virtual In-Person Session ({costs.virtualSessionHours} hour{costs.virtualSessionHours !== 1 ? "s" : ""})
              </span>
            </div>
          )}
          {summary.highResMixdownCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span>High Resolution Mixdown</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.highResMixdown)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.filmMixdownCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span>Film Mixdown</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.filmMixdown)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.mixedStemsCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-pink-600 shrink-0 mt-0.5" />
              <div>
                <span>Mixed Stems</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.mixedStems)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.extendedArchivalCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span>Extended Archival</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.extendedArchival)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.rushDeliveryCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-red-600 shrink-0 mt-0.5" />
              <div>
                <span>Rush Delivery</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.rushDelivery)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-2">
        <h3 className="font-medium mb-3">Cost Breakdown</h3>

        <div className="space-y-1 mb-3">
          {songs.map((song) => (
            <div key={song.songId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {song.title} ({song.tracks} tracks)
                {song.hasHighTrackCount && <span className="ml-1 text-primary text-xs">(High Track)</span>}
                {song.hasExtendedLength && (
                  <span className="ml-1 text-amber-600 text-xs">(+${song.extendedLengthFeeAmount} Length)</span>
                )}
              </span>
              <span>${song.songSubtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {volumeDiscountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{volumeDiscountName}</span>
            <span>-${volumeDiscountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm pt-1 border-t border-border/50">
          <span className="text-muted-foreground font-medium">Songs Subtotal</span>
          <span>${(costs.baseSongsCost - volumeDiscountAmount).toFixed(2)}</span>
        </div>

        {costs.vocalProductionCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Vocal Production ({summary.vocalProductionCount} song
              {summary.vocalProductionCount !== 1 ? "s" : ""})
              {productionDealName && <span className="text-primary text-xs lg:ml-1">({productionDealName})</span>}
            </span>
            <span>${costs.vocalProductionCost.toFixed(2)}</span>
          </div>
        )}
        {costs.drumReplacementCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Drum Replacement ({summary.drumReplacementCount} song
              {summary.drumReplacementCount !== 1 ? "s" : ""})
              {productionDealName && <span className="text-primary text-xs lg:ml-1">({productionDealName})</span>}
            </span>
            <span>${costs.drumReplacementCost.toFixed(2)}</span>
          </div>
        )}
        {costs.guitarReampCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Guitar Re-Amp ({summary.guitarReampCount} song{summary.guitarReampCount !== 1 ? "s" : ""})
              {productionDealName && <span className="text-primary text-xs lg:ml-1">({productionDealName})</span>}
            </span>
            <span>${costs.guitarReampCost.toFixed(2)}</span>
          </div>
        )}

        {productionDealSavings > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{productionDealName} Savings</span>
            <span>-${productionDealSavings.toFixed(2)}</span>
          </div>
        )}

        {costs.virtualSessionCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Virtual Session ({costs.virtualSessionHours} hour{costs.virtualSessionHours !== 1 ? "s" : ""})
            </span>
            <span>${costs.virtualSessionCost.toFixed(2)}</span>
          </div>
        )}
        {costs.highResMixdownCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              High Resolution Mixdown ({summary.highResMixdownCount} song
              {summary.highResMixdownCount !== 1 ? "s" : ""})
              {costs.hifiDealSongCount > 0 && (
                <span className="text-purple-600 text-xs lg:ml-1">({costs.hifiDealSongCount} with Hi-Fi Deal)</span>
              )}
            </span>
            <span>${costs.highResMixdownCost.toFixed(2)}</span>
          </div>
        )}
        {costs.filmMixdownCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Film Mixdown ({summary.filmMixdownCount} song{summary.filmMixdownCount !== 1 ? "s" : ""})
              {costs.hifiDealSongCount > 0 && (
                <span className="text-purple-600 text-xs lg:ml-1">({costs.hifiDealSongCount} with Hi-Fi Deal)</span>
              )}
            </span>
            <span>${costs.filmMixdownCost.toFixed(2)}</span>
          </div>
        )}
        {costs.mixedStemsCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Mixed Stems ({summary.mixedStemsCount} song{summary.mixedStemsCount !== 1 ? "s" : ""}, track-based)
            </span>
            <span>${costs.mixedStemsCost.toFixed(2)}</span>
          </div>
        )}
        {costs.extendedArchivalCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Extended Archival ({summary.extendedArchivalCount} song
              {summary.extendedArchivalCount !== 1 ? "s" : ""})
            </span>
            <span>${costs.extendedArchivalCost.toFixed(2)}</span>
          </div>
        )}
        {costs.rushDeliveryCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Rush Delivery ({summary.rushDeliveryCount} song{summary.rushDeliveryCount !== 1 ? "s" : ""}, 2x song cost)
            </span>
            <span>${costs.rushDeliveryCost.toFixed(2)}</span>
          </div>
        )}
        {costs.hifiDealDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Hi-Fi Deal Savings (10%)</span>
            <span>-${costs.hifiDealDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
          <span>Total</span>
          <span>${costs.total.toFixed(2)}</span>
        </div>
      </div>

      {summary.hasHighTrackCountSongs > 0 && (
        <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <AlertCircle className="!w-[16px] !h-[16px] text-primary shrink-0 mt-0.5" />
          <span className="text-foreground">
            {summary.hasHighTrackCountSongs} {summary.hasHighTrackCountSongs === 1 ? "song has" : "songs have"} high
            track count fees applied (50+ tracks).
          </span>
        </div>
      )}

      {summary.hasExtendedLengthSongs > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm">
          <AlertCircle className="!w-[16px] !h-[16px] text-amber-600 shrink-0 mt-0.5" />
          <span className="text-foreground">
            {summary.hasExtendedLengthSongs} {summary.hasExtendedLengthSongs === 1 ? "song has" : "songs have"} extended
            length fees applied.
          </span>
        </div>
      )}
    </div>
  )
}
