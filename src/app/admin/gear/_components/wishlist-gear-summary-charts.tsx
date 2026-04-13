"use client";

import * as React from "react";

import { type ChartConfig } from "~/components/ui/chart";
import { ManufacturerRadialChartCard } from "./manufacturer-radial-chart-card";
import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";
import { StackedAreaByGroupCard } from "./stacked-area-by-group-card";
import { TimeScatterChartCard, type TimeScatterPoint } from "./time-scatter-chart-card";
import { ValueDistributionRadarCard } from "./value-distribution-radar-card";
import {
  type WishlistSpendByGroupAreaChart,
  type WishlistValuePoint,
} from "./wishlist-gear-summary-types";

interface WishlistGearSummaryChartsProps {
  valueDistributionChartData: WishlistValuePoint[];
  manufacturerRadialChartData: ManufacturerRadialDatum[];
  valueChartConfig: ChartConfig;
  spendOverTimeChartData: TimeScatterPoint[];
  spendTimelineChartConfig: ChartConfig;
  spendByGroupAreaChart: WishlistSpendByGroupAreaChart;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const WishlistGearSummaryCharts = React.memo(
  function WishlistGearSummaryCharts({
    valueDistributionChartData,
    manufacturerRadialChartData,
    valueChartConfig,
    spendOverTimeChartData,
    spendTimelineChartConfig,
    spendByGroupAreaChart,
    formatCurrency,
    abbreviateCurrency,
  }: WishlistGearSummaryChartsProps) {
    return (
      <>
        <div className="grid gap-4 xl:grid-cols-2">
          <ValueDistributionRadarCard
            title="Target Value Distribution"
            description="Group-level target value based on target price multiplied by desired quantity."
            data={valueDistributionChartData}
            dataKey="targetValue"
            labelKey="groupLabel"
            titleKey="group"
            config={valueChartConfig}
            emptyMessage="No grouped wishlist value available yet."
            formatCurrency={formatCurrency}
          />
          <TimeScatterChartCard
            title="Target Spend Over Time"
            description="Each point shows a wishlist row's target value on its created date."
            data={spendOverTimeChartData}
            config={spendTimelineChartConfig}
            valueLabel="Target Value"
            quantityLabel="Desired Quantity"
            emptyMessage="No dated wishlist history available yet."
            formatCurrency={formatCurrency}
            abbreviateCurrency={abbreviateCurrency}
          />
        </div>

        <ManufacturerRadialChartCard
          title="Manufacturer Target Value"
          description="Manufacturer-level target value across the current wishlist."
          data={manufacturerRadialChartData}
          valueLabel="Target Value"
          quantityLabel="Desired Quantity"
          centerLabel="Manufacturers"
          emptyMessage="No manufacturer target value available yet."
          formatCurrency={formatCurrency}
        />

        <StackedAreaByGroupCard
          title="Target Spend Over Time by Group"
          description="Stacked monthly target value grouped by created date and wishlist group."
          chart={spendByGroupAreaChart}
          emptyMessage="No grouped wishlist spend history available yet."
          formatCurrency={formatCurrency}
          abbreviateCurrency={abbreviateCurrency}
        />
      </>
    );
  },
);
