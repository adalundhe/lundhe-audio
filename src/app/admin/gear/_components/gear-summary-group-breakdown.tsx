"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { Progress } from "~/components/ui/progress";

type InventorySummaryGroup = {
  label: string;
  uniqueItemCount: number;
  fullyCataloguedCount: number;
  cataloguedPercent: number;
  totalQuantity: number;
  totalCost: number;
  types: Array<{ label: string; totalQuantity: number; totalCost: number }>;
};

interface GearSummaryGroupBreakdownProps {
  groups: InventorySummaryGroup[];
  formatCurrency: (value: number) => string;
}

export const GearSummaryGroupBreakdown = React.memo(
  function GearSummaryGroupBreakdown({
    groups,
    formatCurrency,
  }: GearSummaryGroupBreakdownProps) {
    return (
      <div className="rounded-md border">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-medium">Items by Group and Type</div>
          <div className="text-xs text-muted-foreground">
            Counts below reflect quantity, not just unique rows.
          </div>
        </div>
        {groups.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No gear inventory yet.
          </div>
        ) : (
          <div className="p-4">
            <Accordion type="multiple" className="w-full rounded-md border">
              {groups.map((group) => (
                <AccordionItem
                  key={group.label}
                  value={group.label}
                  className="w-full last:border-b-0"
                >
                  <AccordionTrigger
                    chevronSide="none"
                    className="w-full justify-between items-start px-4 py-3 hover:no-underline sm:items-center"
                  >
                    <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-medium">{group.label}</div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(group.totalCost)}
                        </div>
                        <Badge variant="outline">
                          {group.totalQuantity.toLocaleString()} items
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0 pt-0">
                    <div className="border-t px-4 py-3">
                      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                            Cataloguing Progress
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {group.fullyCataloguedCount.toLocaleString()} of{" "}
                            {group.uniqueItemCount.toLocaleString()} items are fully
                            catalogued.
                          </div>
                        </div>
                        <div className="text-sm font-medium sm:text-right">
                          {group.cataloguedPercent.toFixed(1)}%
                        </div>
                      </div>
                      <Progress value={group.cataloguedPercent} className="mt-2 h-2" />
                    </div>
                    <div className="divide-y border-t">
                      {group.types.map((type) => (
                        <div
                          key={`${group.label}-${type.label}`}
                          className="flex flex-col items-start gap-2 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="text-muted-foreground">{type.label}</span>
                          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end sm:gap-4">
                            <span className="text-muted-foreground">
                              {formatCurrency(type.totalCost)}
                            </span>
                            <Badge variant="outline">
                              {type.totalQuantity.toLocaleString()} items
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </div>
    );
  },
);

