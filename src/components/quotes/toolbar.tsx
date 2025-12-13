"use client"

import { Button } from "~/components/ui/button"
import { RotateCcw } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog"


export function CalculatorToolbar({
    reset
}: {
    reset: () => void
}) {

  return (
    <div className="flex items-center justify-center gap-2 pb-6 mb-6 border-b border-border">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button className="text-red-600 hover:bg-red-600/30 border border-red-600" >
            <RotateCcw className="!w-[16px] !h-[16px] mr-2 mt-0" />
            Reset
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-3/4 rounded-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center">Reset Quote?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              This will clear all your selections and start a new quote.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="!justify-center mt-2 w-full">
            <AlertDialogCancel className="border border-black hover:bg-black hover:text-white dark:border-white dark:hover:text-black dark:hover:bg-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={reset} className="text-red-600 hover:bg-red-600/30 border border-red-600">Reset</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
