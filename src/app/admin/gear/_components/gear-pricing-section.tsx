"use client";

import * as React from "react";
import { type Table as ReactTable } from "@tanstack/react-table";
import {
  AdminDataTable,
  type AdminDataTableColumnDef,
} from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import type { PriceGuideMatch } from "./gear-manager-types";

type FilterTab = {
  value: string;
  label: string;
  render: (table: ReactTable<PriceGuideMatch>) => React.ReactNode;
};

interface GearPricingSectionProps {
  pricingError: string | null;
  priceGuideMatches: PriceGuideMatch[];
  priceGuideColumns: AdminDataTableColumnDef<PriceGuideMatch>[];
  priceGuideTableResetKey: string | number;
  priceGuideFilterTabs: FilterTab[];
  selectedPriceGuideIds: string[];
  selectedPriceGuideCount: number;
  selectedAveragePrice: number | null;
  handleApplyAveragePrice: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  handleTogglePriceGuide: (matchId: string, checked: boolean) => void;
  formatCurrency: (value: number) => string;
  historySection: React.ReactNode;
}

export const GearPricingSection = React.memo(function GearPricingSection({
  pricingError,
  priceGuideMatches,
  priceGuideColumns,
  priceGuideTableResetKey,
  priceGuideFilterTabs,
  selectedPriceGuideIds,
  selectedPriceGuideCount,
  selectedAveragePrice,
  handleApplyAveragePrice,
  handleTogglePriceGuide,
  formatCurrency,
  historySection,
}: GearPricingSectionProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 sm:col-span-2">
      <div className="flex flex-col gap-1.5">
        <Label>Reverb Pricing</Label>
        <p className="text-xs text-muted-foreground">
          Search runs automatically from the current manufacturer + title. Selection
          uses each price guide row&apos;s Reverb `price_high` and each listing
          row&apos;s current listing price. The applied gear price is the average
          of the selected rows.
        </p>
      </div>
      {pricingError ? (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {pricingError}
        </div>
      ) : null}
      <AdminDataTable
        data={priceGuideMatches}
        columns={priceGuideColumns}
        stateResetKey={priceGuideTableResetKey}
        footerControlsLayout="stacked-mobile"
        searchColumnId="search"
        searchPlaceholder="Search fetched prices..."
        emptyMessage="No Reverb matches returned for the current automatic search."
        initialSorting={[]}
        initialColumnVisibility={{ search: false }}
        initialColumnOrder={[
          "selected",
          "title",
          "manufacturer",
          "model",
          "year",
          "condition",
          "categories",
          "priceValue",
          "search",
        ]}
        invisibleColumns={["search"]}
        columnLabels={{
          selected: "use",
          title: "title",
          manufacturer: "manufacturer",
          model: "model",
          year: "year",
          condition: "condition",
          categories: "categories",
          priceValue: "price",
        }}
        getRowClassName={(row) =>
          [
            "cursor-pointer motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-1 motion-safe:duration-300",
            row.original.id && selectedPriceGuideIds.includes(row.original.id)
              ? "bg-muted hover:bg-muted/70"
              : "hover:bg-muted/50",
          ].join(" ")
        }
        onRowClick={(match) => {
          handleTogglePriceGuide(
            match.id,
            !selectedPriceGuideIds.includes(match.id),
          );
        }}
        filterTabs={priceGuideFilterTabs}
      />
      <div
        className="flex min-w-0 flex-col gap-2 rounded-md border px-3 py-3 text-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-muted-foreground">
          {priceGuideMatches.length === 0
            ? "No Reverb matches loaded."
            : `${priceGuideMatches.length} match${
                priceGuideMatches.length === 1 ? "" : "es"
              } loaded. ${selectedPriceGuideCount} selected.`}
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <span className="min-w-0 text-muted-foreground">
            {selectedAveragePrice === null
              ? selectedPriceGuideCount > 0
                ? "Selected rows without a price are ignored in the average."
                : "Select one or more rows to calculate the average."
              : `Average price: ${formatCurrency(selectedAveragePrice)}`}
          </span>
          <Button
            type="button"
            size="sm"
            onClick={handleApplyAveragePrice}
            disabled={selectedAveragePrice === null}
            className="align-middle flex gap-1 border border-black hover:bg-black hover:text-black dark:border-white dark:hover:bg-white dark:hover:text-black"
          >
            Use Average
          </Button>
        </div>
      </div>
      <div className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300">
        {historySection}
      </div>
    </div>
  );
});
