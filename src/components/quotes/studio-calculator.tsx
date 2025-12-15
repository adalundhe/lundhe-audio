"use client"

import { Card, CardContent } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Breadcrumbs } from "~/components/quotes/mixing-calculator/breadcrumbs"
import { ProjectSizeStep } from "~/components/quotes/mixing-calculator/project-size-step"
import { AddOnsStep } from "~/components/quotes/mixing-calculator/add-ons-step"
import { DeliveryStep } from "~/components/quotes/mixing-calculator/delivery-step"
import { SummaryStep } from "~/components/quotes/mixing-calculator/summary-step"
import type { Song, AddOns, DeliveryOptions } from "~/lib/mixing/pricing-types"
import { useMixingQuote} from "~/hooks/use-mixing-quote"
import { useShallow } from "zustand/react/shallow"
import { CalculatorToolbar } from "./toolbar"
import { useCartActions, useCartState } from "~/hooks/use-shopping-cart"
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs"
import { redirect, useRouter } from "next/navigation"
import { createOrUpdateCart } from "~/actions/cart/create-or-update-cart"

export type { Song, AddOns, DeliveryOptions }

const STEPS = ["Project Size", "Add Ons", "Delivery", "Summary"]


export function StudioCalculator() {

  const router = useRouter()
  const { quoteData, currentStep, setCurrentStep, reset } = useMixingQuote(useShallow(state => state))

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

  const {
    userId,
    items,
    ...cart
  } = useCartState()
  const { isSignedIn } = useUser()


  const handleSubmit = () => {
    if (quoteData) {
      addQuote({
        type: "mixing", 
        name: `Mixing Session (${quoteData.totals.songCount} song${quoteData.totals.songCount !== 1 ? "s" : ""})`, 
        quote: quoteData,
        submit: async (items, totals) => {
          if (userId && isSignedIn) {
            await createOrUpdateCart({
              ...cart,
              ...totals,
              items,
              userId: userId,
            })
          }
        }
      })

      if (!userId || !isSignedIn) {
        router.push("/sign-in")
      }

      reset()
    }
  }


  const isSummaryStep = currentStep === STEPS.length - 1

  return (
    <Card className="shadow-lg">
      <CardContent className="p-6">
        <CalculatorToolbar reset={reset} />
        <Breadcrumbs steps={STEPS} currentStep={currentStep} onStepClick={setCurrentStep} />
        <div className="mt-8 min-h-[400px]">
            {currentStep === 0 && <ProjectSizeStep />}
            {currentStep === 1 && (
              <AddOnsStep />
            )}
            {currentStep === 2 && (
              <DeliveryStep  />
            )}
            {currentStep === 3 && <SummaryStep />}
          </div>

          <div className="flex flex-col justify-center gap-4 items-center justify-between mt-8 pt-6 border-t border-border">

            <div className="flex justify-center items-center gap-4 w-full">
              <Button size="lg" onClick={handlePrevious} disabled={currentStep === 0} className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                Prev
              </Button>

              {isSummaryStep ? (
                <>
                <SignedIn>
                  <Button onClick={() => {
                    handleSubmit()
                    reset()
                    redirect("/checkount")
                  }} size="lg" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                    Add to Cart
                  </Button>
                </SignedIn>
                <SignedOut>
                  <Button onClick={() => {
                    handleSubmit()
                    reset()
                    redirect("/sign-in")
                  }} size="lg" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                    Add to Cart
                  </Button>
                </SignedOut>
                </>
              ) : (
                <Button onClick={handleNext} size="lg" className="border hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">Next</Button>
              )}
            </div>
            {!isSummaryStep && (
              <div className="text-center w-full">
                <p className="text-sm text-muted-foreground">Estimated Total</p>
                <p className="text-2xl font-bold">${quoteData.costs.total.toFixed(2)}</p>
              </div>
            )}
          </div>
      </CardContent>
    </Card>
  )
}
