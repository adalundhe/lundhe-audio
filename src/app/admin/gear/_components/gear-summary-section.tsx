"use client";

import * as React from "react";
import { type ChartConfig } from "~/components/ui/chart";
import { GearSummaryCharts } from "./gear-summary-charts";
import { GearSummaryGroupBreakdown } from "./gear-summary-group-breakdown";
import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";
import { GearSummaryStats } from "./gear-summary-stats";
import { SectionAccordionCard } from "./section-accordion-card";

type InventorySummaryGroup = {
  label: string;
  uniqueItemCount: number;
  fullyCataloguedCount: number;
  cataloguedPercent: number;
  totalQuantity: number;
  totalCost: number;
  types: Array<{ label: string; totalQuantity: number; totalCost: number }>;
};

type InventorySummary = {
  totalQuantity: number;
  uniqueItemCount: number;
  manufacturerCount: number;
  totalCost: number;
  fullyCataloguedCount: number;
  cataloguedPercent: number;
  groups: InventorySummaryGroup[];
};

type InventoryValuePoint = {
  group: string;
  groupLabel: string;
  inventoryValue: number;
};

type SpendPoint = {
  name: string;
  quantity: number;
  itemValue: number;
  createdAtMs: number;
  createdAtTooltipLabel: string;
};

type SpendByGroupAreaChart = {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  series: Array<{ key: string; color: string }>;
};

export const GearSummarySection = React.memo(function GearSummarySection({
  inventorySummary,
  inventoryValueDistributionChartData,
  inventoryManufacturerRadialChartData,
  inventoryValueChartConfig,
  spendOverTimeChartData,
  spendTimelineChartConfig,
  spendByGroupAreaChart,
  formatCurrency,
  abbreviateCurrency,
  inventorySection,
}: {
  inventorySummary: InventorySummary;
  inventoryValueDistributionChartData: InventoryValuePoint[];
  inventoryManufacturerRadialChartData: ManufacturerRadialDatum[];
  inventoryValueChartConfig: ChartConfig;
  spendOverTimeChartData: SpendPoint[];
  spendTimelineChartConfig: ChartConfig;
  spendByGroupAreaChart: SpendByGroupAreaChart;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
  inventorySection?: React.ReactNode;
}) {
  return (
    <SectionAccordionCard
      value="summary"
      title="Inventory Summary"
      description="Live totals across the current studio gear inventory."
      contentClassName="flex min-w-0 flex-col gap-4 px-0"
    >
      <GearSummaryStats
        inventorySummary={inventorySummary}
        formatCurrency={formatCurrency}
      />
      <GearSummaryCharts
        inventoryValueDistributionChartData={inventoryValueDistributionChartData}
        inventoryManufacturerRadialChartData={inventoryManufacturerRadialChartData}
        inventoryValueChartConfig={inventoryValueChartConfig}
        spendOverTimeChartData={spendOverTimeChartData}
        spendTimelineChartConfig={spendTimelineChartConfig}
        spendByGroupAreaChart={spendByGroupAreaChart}
        formatCurrency={formatCurrency}
        abbreviateCurrency={abbreviateCurrency}
      />
      <GearSummaryGroupBreakdown
        groups={inventorySummary.groups}
        formatCurrency={formatCurrency}
      />
      {inventorySection}
    </SectionAccordionCard>
  );
});
