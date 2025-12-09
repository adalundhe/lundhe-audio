"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Breadcrumbs } from "~/components/quotes/calculator/breadcrumbs"
import { ProjectSizeStep } from "~/components/quotes/calculator/project-size-step"
import { AddOnsStep } from "~/components/quotes/calculator/add-ons-step"
import { DeliveryStep } from "~/components/quotes/calculator/delivery-step"
import { SummaryStep } from "~/components/quotes/calculator/summary-step"
import { buildQuoteDataFromDb } from "~/lib/mixing/pricing-calculator"
import type { PricingData, Song, AddOns, DeliveryOptions, QuoteData } from "~/lib/mixing/pricing-types"

export type { Song, AddOns, DeliveryOptions }

const STEPS = ["Project Size", "Add Ons", "Delivery", "Summary"]

type StudioCalculatorProps = {
  pricingData: PricingData
}

export function StudioCalculator({ pricingData }: StudioCalculatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [songs, setSongs] = useState<Song[]>([
    { id: crypto.randomUUID(), title: "", tracks: 1, minutes: 3, seconds: 30 },
  ])
  const [addOns, setAddOns] = useState<AddOns>({
    vocalProductionSongs: [],
    drumReplacementSongs: [],
    guitarReampSongs: [],
    virtualSessionHours: 0,
  })
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOptions>({
    highResMixdownSongs: [],
    filmMixdownSongs: [],
    mixedStemsSongs: [],
    extendedArchivalSongs: [],
    rushDeliverySongs: [],
  })

  const quoteData: QuoteData = useMemo(
    () => buildQuoteDataFromDb(pricingData, songs, addOns, deliveryOptions),
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
    console.log("Quote Data:", quoteData)
    alert("Quote submitted! Total: $" + quoteData.costs.total.toFixed(2))
  }

  const isSummaryStep = currentStep === STEPS.length - 1

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <Breadcrumbs steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

        <div className="mt-8 min-h-[400px]">
          {currentStep === 0 && <ProjectSizeStep songs={songs} setSongs={setSongs} pricingData={pricingData} />}
          {currentStep === 1 && (
            <AddOnsStep addOns={addOns} setAddOns={setAddOns} songs={songs} pricingData={pricingData} />
          )}
          {currentStep === 2 && (
            <DeliveryStep
              deliveryOptions={deliveryOptions}
              setDeliveryOptions={setDeliveryOptions}
              songs={songs}
              pricingData={pricingData}
            />
          )}
          {currentStep === 3 && <SummaryStep quoteData={quoteData} pricingData={pricingData} />}
        </div>

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button size="lg" onClick={handlePrevious} disabled={currentStep === 0} className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
            Previous
          </Button>

          <div className="flex items-center gap-4">
            {!isSummaryStep && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">${quoteData.costs.total.toFixed(2)}</p>
              </div>
            )}

            {isSummaryStep ? (
              <Button onClick={handleSubmit} size="lg" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                Submit Project
              </Button>
            ) : (
              <Button onClick={handleNext} className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">Next</Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
