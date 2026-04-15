import * as React from "react"

import { cn } from "~/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const isDateInput = type === "date"

    return (
      <input
        type={type}
        className={cn(
          "box-border rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50",
          isDateInput &&
            "appearance-none overflow-hidden text-ellipsis whitespace-nowrap [&::-webkit-date-and-time-value]:min-h-[1.25rem] [&::-webkit-date-and-time-value]:text-left [&::-webkit-date-and-time-value]:leading-none [&::-webkit-datetime-edit]:block [&::-webkit-datetime-edit]:overflow-hidden [&::-webkit-datetime-edit]:p-0 [&::-webkit-calendar-picker-indicator]:shrink-0",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
