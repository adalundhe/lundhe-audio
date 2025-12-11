"use client"

import type { MasteringPricingData } from "~/lib/mastering/pricing-types"
import type { MasteringQuoteData } from "~/lib/mastering/pricing-types"
import { Music, Clock, CheckCircle2, AlertCircle, Sparkles, Gift, RotateCcw } from "lucide-react"

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

      <div className="flex lg:flex-row flex-col items-center lg:items-start lg:justify-center justify-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-md text-sm">
        <Gift className="!w-[16px] !h-[16px] text-green-600 shrink-0" />
        <div className="flex flex-col lg:gap-1 gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <span className="text-foreground lg:w-fit w-full lg:text-left text-center">
              <span className="font-medium">{summary.includedRevisions} Project Revisions Included</span>
            </span>
            <span className="flex gap-2 lg:w-fit w-full flex justify-center">
              <span className="text-muted-foreground line-through">${costs.includedRevisionsCost}</span>
              <span className="text-green-600 font-medium">Free</span>
            </span>
          </div>
          {costs.additionalRevisionsCost > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-foreground text-sm w-full">
              <span className="font-medium">+{summary.additionalRevisions} Revisions Purchased</span>
              {costs.additionalRevisionsDiscountPercentage > 0 && (
                <span className="flex gap-2 lg:text-left">
                  <span className="text-muted-foreground line-through">${costs.preDiscountRevisionPrice}</span>
                  <span className="text-green-600 font-medium">
                    ${costs.additionalRevisionsCost.toFixed(0)} ({costs.additionalRevisionsDiscountPercentage}% off)
                  </span>
                </span>
              )}
              {costs.additionalRevisionsDiscountPercentage === 0 && (
                <span className="text-primary">${costs.additionalRevisionsCost.toFixed(0)}</span>
              )}
            </div>
          )}
          <span className="text-muted-foreground text-xs mt-1 lg:text-left text-center">
            Total: {summary.includedRevisions + summary.additionalRevisions} revisions available for your project
          </span>
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

      <>
        {
          Object.keys(costs.multiMediaDeals).map((deal, idx) =>     
            <div key={`distro-deal-${idx}`} className="flex items-start gap-2 p-3 bg-primary/10 border border-primary/20 rounded-md text-sm">
              <Sparkles className="!w-[16px] !h-[16px] text-primary shrink-0 mt-0.5" />
              <span className="text-foreground">
                <span className="font-bold">{deal} Applied!</span> discount on High Resolution, DDP,
                and ISRC for {costs.multiMediaDeals[deal]} song{costs.multiMediaDeals[deal] !== 1 ? "s" : ""}
                {deal.toLocaleLowerCase().includes("premium") ? costs.premiumMultiMediaDealDiscount > 0 && (
                  <span className="text-green-600 ml-1">(saving ${costs.premiumMultiMediaDealDiscount.toFixed(2)})</span>
                ) : 
                costs.standardMultiMediaDealDiscount > 0 ?
                <span className="text-green-600 ml-1">(saving ${costs.standardMultiMediaDealDiscount.toFixed(2)})</span>
                :
                null
              }
              </span>
            </div>
          )
        }
        </> 

      <>
        {
          Object.keys(costs.distributionDeals).map((deal, idx) =>     
            <div key={`distro-deal-${idx}`} className="flex items-start gap-2 p-3 bg-purple-500/10 border border-purple-500/20 rounded-md text-sm">
              <Sparkles className="!w-[16px] !h-[16px] text-purple-600 shrink-0 mt-0.5" />
              <span className="text-foreground">
                <span className="font-bold">{deal} Applied!</span> discount on High Resolution, DDP,
                and ISRC for {costs.distributionDeals[deal]} song{costs.distributionDeals[deal] !== 1 ? "s" : ""}
                {deal.toLocaleLowerCase().includes("premium") ? costs.premiumDistributionDealDiscount > 0 && (
                  <span className="text-green-600 ml-1">(saving ${costs.premiumDistributionDealDiscount.toFixed(2)})</span>
                ) : 
                costs.standardDistributionDealDiscount > 0 ?
                <span className="text-green-600 ml-1">(saving ${costs.standardDistributionDealDiscount.toFixed(2)})</span>
                :
                null
              }
              </span>
            </div>
          )
        }
        </> 

      {(hasAnyPerSongAddOns || costs.virtualSessionHours > 0 || summary.additionalRevisions > 0 || hasAnyDeliveryOptions) && (
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
          {summary.additionalRevisions > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <RotateCcw className="!w-[16px] !h-[16px] text-amber-600 shrink-0" />
              <div>
                <span> Additional Project Revisions </span>
                <div className="text-muted-foreground text-xs mt-1">
                  {summary.additionalRevisions} revision{summary.additionalRevisions !== 1 ? "s" : ""}
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

      <div className="border-t border-border pt-4 space-y-2 flex flex-col lg:gap-0 gap-2">
        <h3 className="font-medium mb-3">Cost Breakdown</h3>

        <div className="space-y-1 mb-3">
          {songs.map((song) => (
            <div key={song.songId} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                <div className="lg:max-w-[440px] max-w-[220px] text-nowrap overflow-hidden text-ellipsis">
                  <span>{song.title}</span>
                </div>
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

        {summary.additionalRevisions > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              Additional Revisions ({summary.additionalRevisions} × ${costs.perRevisionPrice}/each)
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.additionalRevisionsDiscountPercentage > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  (${costs.revisionDiscount} with {summary.additionalRevisionsDiscountName})
                </span>
              }
              </span>
            </span>
            <span className="flex items-center gap-2">
              {costs.additionalRevisionsDiscountPercentage > 0 && (
                <span className="line-through text-muted-foreground">${costs.preDiscountRevisionPrice}</span>
              )}
              <span>${costs.additionalRevisionsCost.toFixed(2)} {
              costs.revisionDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.revisionDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
            </span>
          </div>
        )}

        {costs.vinylMasteringCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Vinyl Mastering ({summary.vinylMasteringCount} song{summary.vinylMasteringCount !== 1 ? "s" : ""})
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.vinyl.premium > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.vinyl.premium} with {summary.premiumMultimediaDealName})
                </span>
              }
              </span>
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.vinyl.standard > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.vinyl.standard} with {summary.multimediaDealName})
                </span>
              }
              </span>
            </span>
            <span>${costs.vinylMasteringCost.toFixed(2)} {
              costs.vinylMasteringDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.vinylMasteringDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.streamingMasteringCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Streaming Mastering ({summary.streamingMasteringCount} song
              {summary.streamingMasteringCount !== 1 ? "s" : ""})
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.streaming.premium > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.streaming.premium} with {summary.premiumMultimediaDealName})
                </span>
              }
              </span>
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.streaming.standard > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.streaming.standard} with {summary.multimediaDealName})
                </span>
              }
              </span>
            </span>
            <span>${costs.streamingMasteringCost.toFixed(2)} {
              costs.streamingMasteringDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.streamingMasteringDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.redbookMasteringCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              Redbook CD Mastering ({summary.redbookMasteringCount} song{summary.redbookMasteringCount !== 1 ? "s" : ""})
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.redbook.premium > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.redbook.premium} with {summary.premiumMultimediaDealName})
                </span>
              }
              </span>
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.redbook.standard > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.redbook.standard} with {summary.multimediaDealName})
                </span>
              }
              </span>
            </span>
            <span>${costs.redbookMasteringCost.toFixed(2)} {
              costs.redbookMasteringDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.redbookMasteringDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.stemMasteringCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground">
              Stem Mastering ({summary.stemMasteringCount} song{summary.stemMasteringCount !== 1 ? "s" : ""})
            </span>
            <span>${costs.stemMasteringCost.toFixed(2)} {
              costs.stemMasteringDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.stemMasteringDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.restorationRemasteringCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground">
              Restoration Remastering ({summary.restorationRemasteringCount} song
              {summary.restorationRemasteringCount !== 1 ? "s" : ""})
            </span>
            <span>${costs.restorationRemasteringCost.toFixed(2)} {
              costs.restorationRemasteringDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.restorationRemasteringDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}

        {costs.multimediaDealDiscount > 0 && (summary.multimediaDealName || summary.premiumMultimediaDealName) && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{
            [summary.multimediaDealName, summary.premiumMultimediaDealName].filter(name => name !== undefined).join(" and ")
            } Savings</span>
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
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              High Resolution Master ({summary.highResMasterCount} song{summary.highResMasterCount !== 1 ? "s" : ""})
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.highres.premium > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.highres.premium} with {summary.premiumDistributionDealName})
                </span>
              }
              </span>
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.highres.standard > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.highres.standard} with {summary.distributionDealName})
                </span>
              }
              </span>
            </span>
            <span>${costs.highResMasterCost.toFixed(2)} {
              costs.highResMasterDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.highResMasterDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.ddpImageCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground flex flex-col">
              DDP Image ({summary.ddpImageCount} song{summary.ddpImageCount !== 1 ? "s" : ""})
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.ddpimage.premium > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.ddpimage.premium} with {summary.premiumDistributionDealName})
                </span>
              }
              </span>
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.ddpimage.standard > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.ddpimage.standard} with {summary.distributionDealName})
                </span>
              }
              </span>
            </span>
            <span>${costs.ddpImageCost.toFixed(2)} {
              costs.ddpImageDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.ddpImageDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.isrcEncodingCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground lg:block flex flex-col">
              ISRC Encoding ({summary.isrcEncodingCount} song{summary.isrcEncodingCount !== 1 ? "s" : ""})
             <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.isrcencode.premium > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.isrcencode.premium} with {summary.premiumDistributionDealName})
                </span>
              }
              </span>
              <span className="flex lg:flex-row flex-col gap-2">
              {
                costs.dealBreakdown.isrcencode.standard > 0 &&
                <span className="text-purple-600 text-xs lg:ml-1">
                  ({costs.dealBreakdown.isrcencode.standard} with {summary.distributionDealName})
                </span>
              }
              </span>
            </span>
            <span>${costs.isrcEncodingCost.toFixed(2)} {
              costs.isrcEncodingDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.isrcEncodingDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.rushDeliveryCost > 0 && (
          <div className="flex lg:flex-row flex-col lg:gap-0 gap-2 justify-between text-sm">
            <span className="text-muted-foreground">
              Rush Delivery ({summary.rushDeliveryCount} song{summary.rushDeliveryCount !== 1 ? "s" : ""}, 2x song cost)
            </span>
            <span>${costs.rushDeliveryCost.toFixed(2)} {
              costs.rushDeliveryDiscount > 0
              ?
              <>
                {" "}
                <span className="text-sm text-green-600">(-${costs.rushDeliveryDiscount.toFixed(2)} off)</span>
              </>
              : null
            }</span>
          </div>
        )}
        {costs.distributionDealDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>{
              [summary.distributionDealName, summary.premiumDistributionDealName].filter(name => name !== undefined).join(" and ")
            }  Savings</span>
            <span>-${costs.distributionDealDiscount.toFixed(2)}</span>
          </div>
        )}
        {
          costs.optionsDiscounts > 0 && 
          <div className="flex justify-between text-sm text-green-600 font-bold">
            <span>Total Add-On/Delivery Discounts</span>
            <span>-${costs.optionsDiscounts.toFixed(2)}</span>
          </div>
        }
        <div className="flex flex-col border-t border-border gap-2">
          <span className="text-sm flex pt-2 lg:items-center items-start">
            <span className="text-muted-foreground flex lg:flex-row flex-col">
              Included Revisions <span>({summary.includedRevisions} × ${costs.perRevisionPrice}/each)</span>
            </span>
            <span className="flex items-center gap-2 ml-auto">
              <span className="line-through text-muted-foreground">${costs.includedRevisionsCost}</span>
              <span className="text-green-600 font-medium">Free</span>
            </span>
          </span>
          
          <span className="flex flex-col">
            <span className="flex justify-between text-sm font-bold pt-2 text-muted-foreground">
              <span>Subtotal</span>
              <span>${costs.preDiscountsTotal.toFixed(2)}</span>
            </span>
            <span className="flex justify-between text-sm font-bold pt-2 text-green-600">
              <span>Discounts</span>
              <span>${costs.discountsTotal.toFixed(2)}</span>
            </span>
          </span>
          <span className="flex justify-between text-lg font-bold pt-2">
            <span>Total</span>
            <span>${costs.total.toFixed(2)}</span>
          </span>
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
