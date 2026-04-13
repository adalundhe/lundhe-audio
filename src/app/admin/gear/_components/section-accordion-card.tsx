"use client";

import * as React from "react";

import { AccordionContent, AccordionItem, AccordionTrigger } from "~/components/ui/accordion";
import { Card, CardContent } from "~/components/ui/card";
import { cn } from "~/lib/utils";

export function SectionAccordionCard({
  value,
  title,
  description,
  contentClassName,
  children,
}: React.PropsWithChildren<{
  value: string;
  title: string;
  description: React.ReactNode;
  contentClassName?: string;
}>) {
  return (
    <AccordionItem value={value} className="border-none">
      <div className="min-w-0 border-none flex flex-col gap-2">
        <AccordionTrigger
          chevronSide="none"
          className="w-full justify-between py-6 px-4 hover:no-underline border rounded-sm"
        >
          <div className="flex min-w-0 flex-col items-start gap-1 text-left">
            <div className="text-lg font-semibold leading-none tracking-tight">
              {title}
            </div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pb-0 pt-0">
          <CardContent className={cn("min-w-0", contentClassName)}>
            {children}
          </CardContent>
        </AccordionContent>
      </div>
    </AccordionItem>
  );
}
