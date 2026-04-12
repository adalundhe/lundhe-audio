"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import {
  type WishlistSummaryGroup,
} from "./wishlist-gear-summary-types";

interface WishlistGearSummaryGroupBreakdownProps {
  groups: WishlistSummaryGroup[];
  formatCurrency: (value: number) => string;
}

export const WishlistGearSummaryGroupBreakdown = React.memo(
  function WishlistGearSummaryGroupBreakdown({
    groups,
    formatCurrency,
  }: WishlistGearSummaryGroupBreakdownProps) {
    return (
      <div className="rounded-md border">
        <div className="border-b px-4 py-3">
          <div className="text-sm font-medium">Wishlist by Group and Type</div>
          <div className="text-xs text-muted-foreground">
            Counts below reflect desired quantity, not just unique rows.
          </div>
        </div>
        {groups.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground">
            No wishlist items yet.
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
                    className="items-start justify-between px-4 py-3 hover:no-underline sm:items-center"
                  >
                    <div className="flex w-full flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="font-medium">{group.label}</div>
                      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(group.totalValue)}
                        </div>
                        <Badge variant="outline">
                          {group.totalQuantity.toLocaleString()} items
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-0 pb-0 pt-0">
                    <div className="divide-y border-t">
                      {group.types.map((type) => (
                        <div
                          key={`${group.label}-${type.label}`}
                          className="flex flex-col items-start gap-2 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between"
                        >
                          <span className="text-muted-foreground">{type.label}</span>
                          <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto sm:justify-end sm:gap-4">
                            <span className="text-muted-foreground">
                              {formatCurrency(type.totalValue)}
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
