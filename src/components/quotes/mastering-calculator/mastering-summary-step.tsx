"use client"

import type { MasteringPricingData } from "~/lib/mastering/pricing-types"
import type { MasteringQuoteData } from "~/lib/mastering/pricing-types"
import { Music, Clock, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"

type MasteringSummaryStepProps = {
  quoteData: MasteringQuoteData
  pricingData: MasteringPricingData
}

export function MasteringSummaryStep({ quoteData, pricingData }: MasteringSummaryStepProps) {
  const { songs, totals, costs, summary } = quoteData

  const hasAnyPerSongAddOns =
    summary.vinylMasteringCount > 0 ||
    summary.streamingMasteringCount > 0 ||
    summary.redbookMasteringCount > 0 ||
    summary.stemMasteringCount > 0 ||
    summary.restorationRemasteringCount > 0

  const hasAnyDeliveryOptions =
    summary.highResMasterCount > 0 ||
    summary.ddpImageCount > 0 ||
    summary.isrcEncodingCount > 0 ||
    summary.rushDeliveryCount > 0

  const formattedTotalLength = `${totals.totalLengthMinutes}m ${totals.totalLengthSeconds}s`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Summary</h2>
        <p className="text-muted-foreground">Review your project details before submitting.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Clock className="!w-[16px] !h-[16px] text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Length</p>
            <p className="text-xl font-semibold">{formattedTotalLength}</p>
          </div>
        </div>
      </div>

      {costs.volumeDiscountName && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{costs.volumeDiscountName} Applied!</span>{" "}
            {costs.volumeDiscount > 0 && (
              <span className="text-green-600 ml-1">(saving ${costs.volumeDiscount.toFixed(2)})</span>
            )}
          </span>
        </div>
      )}

      {costs.multimediaDealName && (
        <div className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-primary shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{costs.multimediaDealName} Applied!</span>
            {costs.multimediaDealDiscount > 0 && (
              <span className="text-green-600 ml-1">(saving ${costs.multimediaDealDiscount.toFixed(2)})</span>
            )}
          </span>
        </div>
      )}

      {costs.distributionDealName && (
        <div className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
          <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
          <span className="text-foreground">
            <span className="font-medium">{costs.distributionDealName} Applied!</span> discount on High Resolution, DDP,
            and ISRC for {costs.distributionDealSongCount} song{costs.distributionDealSongCount !== 1 ? "s" : ""}
            {costs.distributionDealDiscount > 0 && (
              <span className="text-green-600 ml-1">(saving ${costs.distributionDealDiscount.toFixed(2)})</span>
            )}
          </span>
        </div>
      )}

      {(hasAnyPerSongAddOns || costs.virtualSessionHours > 0 || hasAnyDeliveryOptions) && (
        <div className="space-y-4">
          {summary.vinylMasteringCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span>Vinyl Mastering</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.vinylMastering)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.streamingMasteringCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span>Streaming Mastering</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.streamingMastering)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.redbookMasteringCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-orange-600 shrink-0 mt-0.5" />
              <div>
                <span>Redbook CD Mastering</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.redbookMastering)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.stemMasteringCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
              <div>
                <span>Stem Mastering</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.stemMastering)
                    .map((s) => `${s.title} (${s.addOns.stemCount} stems)`)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.restorationRemasteringCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span>Restoration Remastering</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.addOns.restorationRemastering)
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
          {summary.highResMasterCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-green-600 shrink-0 mt-0.5" />
              <div>
                <span>High Resolution Master</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.highResMaster)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.ddpImageCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-pink-600 shrink-0 mt-0.5" />
              <div>
                <span>DDP Image</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.ddpImage)
                    .map((s) => s.title)
                    .join(", ")}
                </div>
              </div>
            </div>
          )}
          {summary.isrcEncodingCount > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="!w-[16px] !h-[16px] text-teal-600 shrink-0 mt-0.5" />
              <div>
                <span>ISRC Encoding</span>
                <div className="text-muted-foreground text-xs mt-1">
                  Applied to:{" "}
                  {songs
                    .filter((s) => s.delivery.isrcEncoding)
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
                {song.title}
                {song.isExtendedLength && (
                  <span className="ml-1 text-amber-600 text-xs">(+${song.extendedLengthFeeAmount} Extended)</span>
                )}
              </span>
              <span>${song.basePrice.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {costs.volumeDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{costs.volumeDiscountName}</span>
            <span>-${costs.volumeDiscount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-sm pt-1 border-t border-border/50">
          <span className="text-muted-foreground font-medium">Songs Subtotal</span>
          <span>${(costs.baseSongsCost - costs.volumeDiscount).toFixed(2)}</span>
        </div>

        {costs.vinylMasteringCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Vinyl Mastering ({summary.vinylMasteringCount} song{summary.vinylMasteringCount !== 1 ? "s" : ""})
              {costs.multimediaDealName && (
                <span className="text-primary text-xs ml-1">({costs.multimediaDealName})</span>
              )}
            </span>
            <span>${costs.vinylMasteringCost.toFixed(2)}</span>
          </div>
        )}
        {costs.streamingMasteringCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Streaming Mastering ({summary.streamingMasteringCount} song
              {summary.streamingMasteringCount !== 1 ? "s" : ""})
              {costs.multimediaDealName && (
                <span className="text-primary text-xs ml-1">({costs.multimediaDealName})</span>
              )}
            </span>
            <span>${costs.streamingMasteringCost.toFixed(2)}</span>
          </div>
        )}
        {costs.redbookMasteringCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Redbook CD Mastering ({summary.redbookMasteringCount} song{summary.redbookMasteringCount !== 1 ? "s" : ""}
              )
              {costs.multimediaDealName && (
                <span className="text-primary text-xs ml-1">({costs.multimediaDealName})</span>
              )}
            </span>
            <span>${costs.redbookMasteringCost.toFixed(2)}</span>
          </div>
        )}
        {costs.stemMasteringCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Stem Mastering ({summary.stemMasteringCount} song{summary.stemMasteringCount !== 1 ? "s" : ""})
            </span>
            <span>${costs.stemMasteringCost.toFixed(2)}</span>
          </div>
        )}
        {costs.restorationRemasteringCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Restoration Remastering ({summary.restorationRemasteringCount} song
              {summary.restorationRemasteringCount !== 1 ? "s" : ""})
            </span>
            <span>${costs.restorationRemasteringCost.toFixed(2)}</span>
          </div>
        )}

        {costs.multimediaDealDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{costs.multimediaDealName} Savings</span>
            <span>-${costs.multimediaDealDiscount.toFixed(2)}</span>
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
        {costs.highResMasterCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              High Resolution Master ({summary.highResMasterCount} song{summary.highResMasterCount !== 1 ? "s" : ""})
              {costs.distributionDealSongCount > 0 && (
                <span className="text-purple-600 text-xs ml-1">
                  ({costs.distributionDealSongCount} with Distribution Deal)
                </span>
              )}
            </span>
            <span>${costs.highResMasterCost.toFixed(2)}</span>
          </div>
        )}
        {costs.ddpImageCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              DDP Image ({summary.ddpImageCount} song{summary.ddpImageCount !== 1 ? "s" : ""})
              {costs.distributionDealSongCount > 0 && (
                <span className="text-purple-600 text-xs ml-1">
                  ({costs.distributionDealSongCount} with Distribution Deal)
                </span>
              )}
            </span>
            <span>${costs.ddpImageCost.toFixed(2)}</span>
          </div>
        )}
        {costs.isrcEncodingCost > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              ISRC Encoding ({summary.isrcEncodingCount} song{summary.isrcEncodingCount !== 1 ? "s" : ""})
              {costs.distributionDealSongCount > 0 && (
                <span className="text-purple-600 text-xs ml-1">
                  ({costs.distributionDealSongCount} with Distribution Deal)
                </span>
              )}
            </span>
            <span>${costs.isrcEncodingCost.toFixed(2)}</span>
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
        {costs.distributionDealDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Distribution Deal Savings</span>
            <span>-${costs.distributionDealDiscount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
          <span>Total</span>
          <span>${costs.total.toFixed(2)}</span>
        </div>
      </div>

      {summary.hasExtendedLengthSongs > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md text-sm">
          <AlertCircle className="!w-[16px] !h-[16px] text-amber-600 shrink-0 mt-0.5" />
          <span className="text-foreground">
            {summary.hasExtendedLengthSongs} {summary.hasExtendedLengthSongs === 1 ? "song has" : "songs have"} extended
            length pricing applied (over 10 minutes).
          </span>
        </div>
      )}
    </div>
  )
}
