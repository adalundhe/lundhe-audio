"use client";

import * as React from "react";
import { type Table as ReactTable } from "@tanstack/react-table";
import { Plus } from "lucide-react";

import {
  AdminDataTable,
  type AdminDataTableColumnDef,
} from "~/app/admin/_components/admin-data-table";
import { Button } from "~/components/ui/button";
import { type ChartConfig } from "~/components/ui/chart";
import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";
import { SectionAccordionCard } from "./section-accordion-card";
import { WishlistGearSummarySection } from "./wishlist-gear-summary-section";
import type {
  WishlistGearItem,
} from "./wishlist-gear-manager-types";
import type {
  WishlistSpendByGroupAreaChart,
  WishlistSpendPoint,
  WishlistSummary,
  WishlistValuePoint,
} from "./wishlist-gear-summary-types";

interface WishlistGearSectionProps {
  items: WishlistGearItem[];
  loadError: string | null;
  isCreatingInline: boolean;
  openNewRow: () => void;
  summary: WishlistSummary;
  valueDistributionChartData: WishlistValuePoint[];
  manufacturerRadialChartData: ManufacturerRadialDatum[];
  valueChartConfig: ChartConfig;
  spendOverTimeChartData: WishlistSpendPoint[];
  spendTimelineChartConfig: ChartConfig;
  spendByGroupAreaChart: WishlistSpendByGroupAreaChart;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
  columns: AdminDataTableColumnDef<WishlistGearItem>[];
  selectedItemId: string | null;
  handleSelectRow: (item: WishlistGearItem) => void;
  filterTabs: Array<{
    value: string;
    label: string;
    render: (table: ReactTable<WishlistGearItem>) => React.ReactNode;
  }>;
  renderExpandedRow: (item: WishlistGearItem) => React.ReactNode;
}

export const WishlistGearSection = React.memo(function WishlistGearSection({
  items,
  loadError,
  isCreatingInline,
  openNewRow,
  summary,
  valueDistributionChartData,
  manufacturerRadialChartData,
  valueChartConfig,
  spendOverTimeChartData,
  spendTimelineChartConfig,
  spendByGroupAreaChart,
  formatCurrency,
  abbreviateCurrency,
  columns,
  selectedItemId,
  handleSelectRow,
  filterTabs,
  renderExpandedRow,
}: WishlistGearSectionProps) {
  return (
    <SectionAccordionCard
      value="wishlist"
      title="Wishlist / Acquisition Pipeline"
      description={`${items.length} item${items.length === 1 ? "" : "s"}. Track gear you want to buy, refine target pricing, and promote ready items into the studio inventory.`}
      contentClassName="min-w-0 px-0"
    >
      <div className="flex min-w-0 flex-col gap-6 px-0">
        {loadError ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {loadError}
          </div>
        ) : null}

        <WishlistGearSummarySection
          summary={summary}
          valueDistributionChartData={valueDistributionChartData}
          manufacturerRadialChartData={manufacturerRadialChartData}
          valueChartConfig={valueChartConfig}
          spendOverTimeChartData={spendOverTimeChartData}
          spendTimelineChartConfig={spendTimelineChartConfig}
          spendByGroupAreaChart={spendByGroupAreaChart}
          formatCurrency={formatCurrency}
          abbreviateCurrency={abbreviateCurrency}
        />

        <AdminDataTable
          data={items}
          columns={columns}
          footerControlsLayout="stacked-mobile"
          searchColumnId="search"
          searchPlaceholder="Search wishlist..."
          emptyMessage="No wishlist items yet."
          initialSorting={[{ id: "name", desc: false }]}
          initialColumnVisibility={{ search: false }}
          initialColumnOrder={[
            "status",
            "name",
            "description",
            "manufacturer",
            "type",
            "group",
            "targetPrice",
            "quantity",
            "search",
            "actions",
          ]}
          invisibleColumns={["search"]}
          columnLabels={{
            name: "name",
            description: "description",
            manufacturer: "manufacturer",
            type: "type",
            group: "group",
            targetPrice: "target price",
            quantity: "quantity",
          }}
          paginationStorageKey="admin-gear-wishlist-pagination"
          getRowClassName={(row) =>
            selectedItemId === row.original.id ? "bg-muted" : undefined
          }
          onRowClick={handleSelectRow}
          filterTabs={filterTabs}
          isRowExpanded={(row) => selectedItemId === row.original.id}
          renderExpandedRow={(row) => renderExpandedRow(row.original)}
          footerLeftContent={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openNewRow}
              disabled={isCreatingInline}
              className="border border-black dark:border-white"
            >
              <Plus className="mr-2 !h-[16px] !w-[16px]" />
              Add Row
            </Button>
          }
        />
      </div>
    </SectionAccordionCard>
  );
});
