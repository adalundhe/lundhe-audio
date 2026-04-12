"use client";

import * as React from "react";

import { WishlistGearSummaryCharts } from "./wishlist-gear-summary-charts";
import { WishlistGearSummaryGroupBreakdown } from "./wishlist-gear-summary-group-breakdown";
import { WishlistGearSummaryStats } from "./wishlist-gear-summary-stats";
import {
  type WishlistSpendByGroupAreaChart,
  type WishlistSpendPoint,
  type WishlistSummary,
  type WishlistValuePoint,
} from "./wishlist-gear-summary-types";
import { type ChartConfig } from "~/components/ui/chart";

interface WishlistGearSummarySectionProps {
  summary: WishlistSummary;
  valueDistributionChartData: WishlistValuePoint[];
  valueChartConfig: ChartConfig;
  spendOverTimeChartData: WishlistSpendPoint[];
  spendTimelineChartConfig: ChartConfig;
  spendByGroupAreaChart: WishlistSpendByGroupAreaChart;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const WishlistGearSummarySection = React.memo(
  function WishlistGearSummarySection({
    summary,
    valueDistributionChartData,
    valueChartConfig,
    spendOverTimeChartData,
    spendTimelineChartConfig,
    spendByGroupAreaChart,
    formatCurrency,
    abbreviateCurrency,
  }: WishlistGearSummarySectionProps) {
    return (
      <div className="flex min-w-0 flex-col gap-4">
        <WishlistGearSummaryStats
          summary={summary}
          formatCurrency={formatCurrency}
        />
        <WishlistGearSummaryCharts
          valueDistributionChartData={valueDistributionChartData}
          valueChartConfig={valueChartConfig}
          spendOverTimeChartData={spendOverTimeChartData}
          spendTimelineChartConfig={spendTimelineChartConfig}
          spendByGroupAreaChart={spendByGroupAreaChart}
          formatCurrency={formatCurrency}
          abbreviateCurrency={abbreviateCurrency}
        />
        <WishlistGearSummaryGroupBreakdown
          groups={summary.groups}
          formatCurrency={formatCurrency}
        />
      </div>
    );
  },
);
