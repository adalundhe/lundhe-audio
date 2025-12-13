"use client"

import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Breadcrumbs } from "~/components/quotes/calculator/breadcrumbs"
import { MasteringProjectSizeStep } from "~/components/quotes/mastering-calculator/mastering-project-size-step"
import { MasteringAddOnsStep } from "~/components/quotes/mastering-calculator/mastering-add-ons-step"
import { MasteringDeliveryStep } from "~/components/quotes/mastering-calculator/mastering-delivery-step"
import { MasteringSummaryStep } from "~/components/quotes/mastering-calculator/mastering-summary-step"
import { useMasteringQuote } from "~/hooks/use-mastering-quote"
import { useShallow } from "zustand/react/shallow"
import { CalculatorToolbar } from "./toolbar"
import { useCartActions } from "~/hooks/use-shopping-cart"

const STEPS = ["Project Size", "Add Ons", "Delivery", "Summary"]


export function MasteringCalculator() {

  const { quoteData, currentStep, setCurrentStep, reset } = useMasteringQuote(useShallow(state => state))
  const { addQuote } = useCartActions()

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
    if (quoteData) {
      const quoteName = `Mastring Session (${quoteData.totals.songCount} song${quoteData.totals.songCount !== 1 ? "s" : ""})`
      addQuote("mastering", quoteName, quoteData)
      reset()
    }
  }

  const isSummaryStep = currentStep === STEPS.length - 1

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <CalculatorToolbar reset={reset}/>
        <Breadcrumbs steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />

        <div className="mt-8 min-h-[400px]">
          {currentStep === 0 && (
            <MasteringProjectSizeStep />
          )}
          {currentStep === 1 && (
            <MasteringAddOnsStep />
          )}
          {currentStep === 2 && (
            <MasteringDeliveryStep />
          )}
          {currentStep === 3 && <MasteringSummaryStep/>}
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
