"use client";

import * as React from "react";

import { type WishlistSummary } from "./wishlist-gear-summary-types";

interface WishlistGearSummaryStatsProps {
  summary: WishlistSummary;
  formatCurrency: (value: number) => string;
}

export const WishlistGearSummaryStats = React.memo(
  function WishlistGearSummaryStats({
    summary,
    formatCurrency,
  }: WishlistGearSummaryStatsProps) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Desired Items
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.totalQuantity.toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Unique Items
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.uniqueItemCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border px-4 py-4">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Manufacturers
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {summary.manufacturerCount.toLocaleString()}
          </div>
        </div>
        <div className="rounded-md border px-4 py-3">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Total Target Value
          </div>
          <div className="mt-2 text-2xl font-semibold">
            {formatCurrency(summary.totalValue)}
          </div>
        </div>
      </div>
    );
  },
);
