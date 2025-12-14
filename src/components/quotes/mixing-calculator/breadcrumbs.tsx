"use client"

import { cn } from "~/lib/utils"
import { Check } from "lucide-react"

type BreadcrumbsProps = {
  steps: string[]
  currentStep: number
  onStepClick: (step: number) => void
}

export function Breadcrumbs({ steps, currentStep, onStepClick }: BreadcrumbsProps) {
  return (
    <nav aria-label="Progress" className="w-full">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep

          return (
            <li key={step} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => onStepClick(index)}
                className={cn(
                  "flex items-center gap-2 group",
                  isCompleted || isCurrent ? "cursor-pointer" : "cursor-default",
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                    isCompleted && "bg-primary text-primary-foreground",
                    isCurrent &&
                      "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background",
                    !isCompleted && !isCurrent && "bg-muted text-muted-foreground",
                  )}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
                </span>
                <span
                  className={cn(
                    "text-sm font-medium hidden sm:block",
                    isCurrent && "text-foreground",
                    !isCurrent && "text-muted-foreground",
                  )}
                >
                  {step}
                </span>
              </button>
              {index < steps.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-4", isCompleted ? "bg-primary" : "bg-muted")} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
