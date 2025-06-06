import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "@radix-ui/react-icons"

import { cn } from "~/lib/utils"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & {
    chevronSide: 'left' | 'right' | 'none' | 'fit'
  }
>(({ className, children, chevronSide, ...props }, ref) => (
  <AccordionPrimitive.Header className='flex'>
    {
      chevronSide === 'left' ? <>
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "flex flex-1 items-center justify-start py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>.chevron-div]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <div className="chevron-div w-[1vmax] h-[1vmax] flex flex-col items-center justify-center ml-2 shrink-0 text-muted-foreground transition-transform duration-200">
          <ChevronDownIcon  />
        </div>
      </AccordionPrimitive.Trigger>
      </> 
      : 
      chevronSide === 'right' ?
      <>
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex flex-1 items-center justify-end py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>.chevron-div]:rotate-180",
            className
          )}
          {...props}
        >
          <div className="chevron-div w-[1vmax] h-[1vmax] flex flex-col items-center justify-center mr-2 shrink-0 text-muted-foreground transition-transform duration-200">
            <ChevronDownIcon  />
          </div>
          {children}
        </AccordionPrimitive.Trigger>
      </>
      :
      <>
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex flex-1 space-x-2 items-center justify-end py-4 text-sm font-medium transition-all hover:underline [&[data-state=open]>.chevron-div]:rotate-180",
            className
          )}
          {...props}
        >
          {children}
          <div className="chevron-div flex flex-col items-center justify-center mr-2 shrink-0 text-muted-foreground transition-transform duration-200">
            <ChevronDownIcon  />
          </div>
        </AccordionPrimitive.Trigger>
      </>
    }
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
    {...props}
  >
    <div className={cn("pb-4 pt-0", className)}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
