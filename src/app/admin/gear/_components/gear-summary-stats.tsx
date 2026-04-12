"use client";

import * as React from "react";

import { Progress } from "~/components/ui/progress";

type InventorySummary = {
  totalQuantity: number;
  uniqueItemCount: number;
  manufacturerCount: number;
  totalCost: number;
  fullyCataloguedCount: number;
  cataloguedPercent: number;
};

interface GearSummaryStatsProps {
  inventorySummary: InventorySummary;
  formatCurrency: (value: number) => string;
}

export const GearSummaryStats = React.memo(function GearSummaryStats({
  inventorySummary,
  formatCurrency,
}: GearSummaryStatsProps) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Items
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {inventorySummary.totalQuantity.toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Unique Items
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {inventorySummary.uniqueItemCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Manufacturers
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {inventorySummary.manufacturerCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Inventory Value
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrency(inventorySummary.totalCost)}
          </div>
        </div>
      </div>

      <div className="rounded-md border px-4 py-4">
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-medium">Cataloguing Progress</div>
            <div className="text-xs text-muted-foreground">
              {inventorySummary.fullyCataloguedCount.toLocaleString()} of{" "}
              {inventorySummary.uniqueItemCount.toLocaleString()} items are fully
              catalogued.
            </div>
          </div>
          <div className="text-sm font-medium sm:text-right">
            {inventorySummary.cataloguedPercent.toFixed(1)}%
          </div>
        </div>
        <Progress value={inventorySummary.cataloguedPercent} className="mt-3 h-3" />
        <div className="mt-2 text-xs text-muted-foreground">
          An item is fully catalogued when all fields are present and price is
          greater than $0.00.
        </div>
      </div>
    </>
  );
});

