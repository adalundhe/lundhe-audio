"use client";

import * as React from "react";

import { type ChartConfig } from "~/components/ui/chart";
import { ManufacturerRadialChartCard } from "./manufacturer-radial-chart-card";
import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";
import { StackedAreaByGroupCard } from "./stacked-area-by-group-card";
import { TimeScatterChartCard, type TimeScatterPoint } from "./time-scatter-chart-card";
import { ValueDistributionRadarCard } from "./value-distribution-radar-card";

type InventoryValuePoint = {
  group: string;
  groupLabel: string;
  inventoryValue: number;
};

type SpendByGroupAreaChart = {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  series: Array<{ key: string; color: string }>;
};

interface GearSummaryChartsProps {
  inventoryValueDistributionChartData: InventoryValuePoint[];
  inventoryManufacturerRadialChartData: ManufacturerRadialDatum[];
  inventoryValueChartConfig: ChartConfig;
  spendOverTimeChartData: TimeScatterPoint[];
  spendTimelineChartConfig: ChartConfig;
  spendByGroupAreaChart: SpendByGroupAreaChart;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const GearSummaryCharts = React.memo(function GearSummaryCharts({
  inventoryValueDistributionChartData,
  inventoryManufacturerRadialChartData,
  inventoryValueChartConfig,
  spendOverTimeChartData,
  spendTimelineChartConfig,
  spendByGroupAreaChart,
  formatCurrency,
  abbreviateCurrency,
}: GearSummaryChartsProps) {
  return (
    <>
      <div className="grid gap-4 xl:grid-cols-2">
        <ValueDistributionRadarCard
          title="Inventory Value Distribution"
          description="Group-level value distribution based on price multiplied by quantity."
          data={inventoryValueDistributionChartData}
          dataKey="inventoryValue"
          labelKey="groupLabel"
          titleKey="group"
          config={inventoryValueChartConfig}
          emptyMessage="No grouped inventory value available yet."
          formatCurrency={formatCurrency}
        />
        <TimeScatterChartCard
          title="Spend Over Time"
          description="Each point shows a gear row's inventory value on its created date."
          data={spendOverTimeChartData}
          config={spendTimelineChartConfig}
          valueLabel="Inventory Value"
          quantityLabel="Quantity"
          emptyMessage="No dated inventory history available yet."
          formatCurrency={formatCurrency}
          abbreviateCurrency={abbreviateCurrency}
        />
      </div>

      <ManufacturerRadialChartCard
        title="Manufacturer Value Distribution"
        description="Manufacturer-level inventory value using the same value basis as the rest of the summary."
        data={inventoryManufacturerRadialChartData}
        valueLabel="Inventory Value"
        quantityLabel="Quantity"
        centerLabel="Manufacturers"
        emptyMessage="No manufacturer value available yet."
        formatCurrency={formatCurrency}
      />

      <StackedAreaByGroupCard
        title="Spend Over Time by Group"
        description="Stacked monthly inventory value grouped by created date and gear group."
        chart={spendByGroupAreaChart}
        emptyMessage="No grouped spend history available yet."
        formatCurrency={formatCurrency}
        abbreviateCurrency={abbreviateCurrency}
      />
    </>
  );
});
