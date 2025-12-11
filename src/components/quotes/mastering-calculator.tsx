"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Breadcrumbs } from "~/components/quotes/calculator/breadcrumbs"
import { MasteringProjectSizeStep } from "~/components/quotes/mastering-calculator/mastering-project-size-step"
import { MasteringAddOnsStep } from "~/components/quotes/mastering-calculator/mastering-add-ons-step"
import { MasteringDeliveryStep } from "~/components/quotes/mastering-calculator/mastering-delivery-step"
import { MasteringSummaryStep } from "~/components/quotes/mastering-calculator/mastering-summary-step"
import {
  buildMasteringQuoteData,
  type MasteringSong,
  type MasteringAddOns,
  type MasteringDeliveryOptions,
} from "~/lib/mastering/mastering-pricing-calculator"
import type { MasteringPricingData, MasteringQuoteData } from "~/lib/mastering/pricing-types"

const STEPS = ["Project Size", "Add Ons", "Delivery", "Summary"]

type MasteringCalculatorProps = {
  pricingData: MasteringPricingData
}

export function MasteringCalculator({ pricingData }: MasteringCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [songs, setSongs] = useState<MasteringSong[]>([{ id: crypto.randomUUID(), title: "", minutes: 3, seconds: 30 }])
  const [addOns, setAddOns] = useState<MasteringAddOns>({
    vinylMasteringSongs: [],
    streamingMasteringSongs: [],
    redbookMasteringSongs: [],
    stemMasteringSongs: {},
    restorationRemasteringSongs: [],
    virtualSessionHours: 0,
    revisions: 0,
  })
  const [deliveryOptions, setDeliveryOptions] = useState<MasteringDeliveryOptions>({
    highResMasterSongs: [],
    ddpImageSongs: [],
    isrcEncodingSongs: [],
    rushDeliverySongs: [],
  })

  const quoteData: MasteringQuoteData = useMemo(
    () => buildMasteringQuoteData(pricingData, songs, addOns, deliveryOptions),
    [pricingData, songs, addOns, deliveryOptions],
  )

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = () => {
    console.log("Mastering Quote Data:", quoteData)
    alert("Mastering quote submitted! Total: $" + quoteData.costs.total.toFixed(2))
  }

  const isSummaryStep = currentStep === STEPS.length - 1

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <Breadcrumbs steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

        <div className="mt-8 min-h-[400px]">
          {currentStep === 0 && (
            <MasteringProjectSizeStep songs={songs} setSongs={setSongs} pricingData={pricingData} />
          )}
          {currentStep === 1 && (
            <MasteringAddOnsStep addOns={addOns} setAddOns={setAddOns} songs={songs} pricingData={pricingData} />
          )}
          {currentStep === 2 && (
            <MasteringDeliveryStep
              deliveryOptions={deliveryOptions}
              setDeliveryOptions={setDeliveryOptions}
              songs={songs}
              pricingData={pricingData}
            />
          )}
          {currentStep === 3 && <MasteringSummaryStep quoteData={quoteData} pricingData={pricingData} />}
        </div>

        <div className="flex flex-col justify-center gap-4 items-center justify-between mt-8 pt-6 border-t border-border">

          <div className="flex items-center gap-4">
            <Button size="lg" onClick={handlePrevious} disabled={currentStep === 0} className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
              Prev
            </Button>
            {isSummaryStep ? (
              <Button onClick={handleSubmit} size="lg" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                Add to Cart
              </Button>
            ) : (
              <Button onClick={handleNext} size="lg" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">Next</Button>
            )}
          </div>

          {!isSummaryStep && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Estimated Total</p>
              <p className="text-2xl font-bold">${quoteData.costs.total.toFixed(2)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
