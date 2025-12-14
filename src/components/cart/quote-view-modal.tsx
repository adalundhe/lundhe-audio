"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog"
import type { QuoteCartItem } from "~/lib/stores/shopping-cart"
import type { PricingData } from "~/server/db/types"
import type { QuoteData } from "~/lib/mixing/pricing-types"
import type { MasteringQuoteData } from "~/lib/mastering/pricing-types"
import { MixingSummaryView } from "~/components/quotes/mixing-calculator/summary-step"
import { MasteringSummaryView } from "~/components/quotes/mastering-calculator/mastering-summary-step"


interface QuoteViewModalProps {
  isOpen: boolean
  onClose: () => void
  item: QuoteCartItem | null
  pricingData: PricingData | null
}

export function QuoteViewModal({ isOpen, onClose, item, pricingData }: QuoteViewModalProps) {
  if (!item || !pricingData) return null

  const isMixing = item.type === "mixing"
  const quoteData = item.quote

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground capitalize">{item.type}</span>
            {item.name}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isMixing ? (
            <MixingSummaryView
              quoteData={quoteData as QuoteData}
            />
          ) : (
            <MasteringSummaryView quoteData={quoteData as MasteringQuoteData} />
          )}
        </div>  
      </DialogContent>
    </Dialog>
  )
}
