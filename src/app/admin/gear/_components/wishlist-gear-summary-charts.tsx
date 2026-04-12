"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";
import { ZoomableTimeChartFrame } from "./zoomable-time-chart-frame";
import {
  type WishlistSpendByGroupAreaChart,
  type WishlistSpendPoint,
  type WishlistValuePoint,
} from "./wishlist-gear-summary-types";

interface WishlistGearSummaryChartsProps {
  valueDistributionChartData: WishlistValuePoint[];
  valueChartConfig: ChartConfig;
  spendOverTimeChartData: WishlistSpendPoint[];
  spendTimelineChartConfig: ChartConfig;
  spendByGroupAreaChart: WishlistSpendByGroupAreaChart;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const WishlistGearSummaryCharts = React.memo(
  function WishlistGearSummaryCharts({
    valueDistributionChartData,
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
          <div className="rounded-md border px-4 py-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Target Value Distribution</div>
              <div className="text-xs text-muted-foreground">
                Group-level target value based on target price multiplied by desired
                quantity.
              </div>
            </div>
            {valueDistributionChartData.length === 0 ? (
              <div className="py-10 text-sm text-muted-foreground">
                No grouped wishlist value available yet.
              </div>
            ) : (
              <ChartContainer config={valueChartConfig} className="mt-4 h-[20rem] w-full">
                <RadarChart
                  data={valueDistributionChartData}
                  margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  outerRadius="72%"
                >
                  <ChartTooltip
                    cursor={false}
                    content={
                      <ChartTooltipContent
                        formatter={(value) => formatCurrency(Number(value) || 0)}
                        labelFormatter={(_, payload) =>
                          payload[0]?.payload?.group
                            ? String(payload[0].payload.group)
                            : null
                        }
                      />
                    }
                  />
                  <PolarGrid />
                  <PolarAngleAxis dataKey="groupLabel" />
                  <PolarRadiusAxis tick={false} axisLine={false} />
                  <Radar
                    dataKey="targetValue"
                    stroke="var(--color-targetValue)"
                    fill="var(--color-targetValue)"
                    fillOpacity={0.26}
                    strokeWidth={2}
                  />
                </RadarChart>
              </ChartContainer>
            )}
          </div>

          <div className="rounded-md border px-4 py-4">
            <div className="flex flex-col gap-1">
              <div className="text-sm font-medium">Target Spend Over Time</div>
              <div className="text-xs text-muted-foreground">
                Each point shows a wishlist row&apos;s target value on its created
                date.
              </div>
            </div>
            {spendOverTimeChartData.length === 0 ? (
              <div className="py-10 text-sm text-muted-foreground">
                No dated wishlist history available yet.
              </div>
            ) : (
              <ZoomableTimeChartFrame
                values={spendOverTimeChartData.map((point) => point.createdAtMs)}
              >
                {(domain) => (
                  <ChartContainer config={spendTimelineChartConfig} className="h-[20rem] w-full">
                    <ScatterChart
                      data={spendOverTimeChartData}
                      margin={{ top: 12, right: 28, bottom: 12, left: 12 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        type="number"
                        dataKey="createdAtMs"
                        domain={domain ? [domain[0], domain[1]] : ["dataMin", "dataMax"]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        padding={{ left: 8, right: 24 }}
                        tickFormatter={(value) => format(new Date(Number(value)), "MMM yyyy")}
                      />
                      <YAxis
                        type="number"
                        dataKey="itemValue"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) => abbreviateCurrency(Number(value) || 0)}
                      />
                      <ZAxis dataKey="quantity" range={[64, 200]} />
                      <ChartTooltip
                        cursor={{
                          stroke: "hsl(var(--border))",
                          strokeDasharray: "4 4",
                        }}
                        content={({ active, payload }) => {
                          const point = payload?.[0]?.payload as WishlistSpendPoint | undefined;

                          if (!active || !point) {
                            return null;
                          }

                          return (
                            <div className="grid min-w-[14rem] gap-2 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
                              <div className="font-medium text-foreground">{point.name}</div>
                              <div className="text-muted-foreground">
                                {point.createdAtTooltipLabel}
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Target Value</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(point.itemValue ?? 0)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Desired Quantity</span>
                                <span className="font-medium text-foreground">
                                  {(point.quantity ?? 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Scatter
                        dataKey="itemValue"
                        fill="var(--color-itemValue)"
                        fillOpacity={0.85}
                        isAnimationActive={false}
                      />
                    </ScatterChart>
                  </ChartContainer>
                )}
              </ZoomableTimeChartFrame>
            )}
          </div>
        </div>

        <div className="rounded-md border px-4 py-4">
          <div className="flex flex-col gap-1">
            <div className="text-sm font-medium">Target Spend Over Time by Group</div>
            <div className="text-xs text-muted-foreground">
              Stacked monthly target value grouped by created date and wishlist
              group.
            </div>
          </div>
          {spendByGroupAreaChart.data.length === 0 ? (
            <div className="py-10 text-sm text-muted-foreground">
              No grouped wishlist spend history available yet.
            </div>
          ) : (
            <ZoomableTimeChartFrame
              values={spendByGroupAreaChart.data.map((row) => Number(row.monthMs))}
              minimumVisibleSpanMs={90 * 24 * 60 * 60 * 1000}
            >
              {(domain) => (
                <ChartContainer config={spendByGroupAreaChart.config} className="h-[22rem] w-full">
                  <AreaChart
                    data={spendByGroupAreaChart.data}
                    margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      type="number"
                      dataKey="monthMs"
                      domain={domain ? [domain[0], domain[1]] : ["dataMin", "dataMax"]}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      minTickGap={32}
                      tickFormatter={(value) => format(new Date(Number(value)), "MMM yyyy")}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => abbreviateCurrency(Number(value) || 0)}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={({ active, payload, label }) => {
                        const rows = (payload ?? [])
                          .map((item) => {
                            const key = String(item.dataKey ?? "");
                            const configEntry = spendByGroupAreaChart.config[key];
                            const value = Number(item.value) || 0;

                            return {
                              key,
                              label:
                                typeof configEntry?.label === "string"
                                  ? configEntry.label
                                  : key,
                              color: item.color ?? configEntry?.color,
                              value,
                            };
                          })
                          .filter((item) => item.value > 0)
                          .sort((left, right) => right.value - left.value);

                        if (!active || rows.length === 0) {
                          return null;
                        }

                        const total = rows.reduce((sum, row) => sum + row.value, 0);

                        return (
                          <div className="grid min-w-[15rem] gap-2 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
                            <div className="font-medium text-foreground">
                              {label ? format(new Date(Number(label)), "MMM yyyy") : ""}
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <span className="text-muted-foreground">Total</span>
                              <span className="font-medium text-foreground">
                                {formatCurrency(total)}
                              </span>
                            </div>
                            <div className="grid gap-1.5">
                              {rows.map((row) => (
                                <div
                                  key={row.key}
                                  className="flex items-center justify-between gap-4"
                                >
                                  <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                                    <span
                                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                                      style={{ backgroundColor: row.color }}
                                    />
                                    <span className="truncate">{row.label}</span>
                                  </div>
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(row.value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }}
                    />
                    {spendByGroupAreaChart.series.map((entry) => (
                      <Area
                        key={entry.key}
                        type="natural"
                        dataKey={entry.key}
                        stackId="wishlist-by-group"
                        stroke={entry.color}
                        fill={entry.color}
                        fillOpacity={0.55}
                        isAnimationActive={false}
                      />
                    ))}
                  </AreaChart>
                </ChartContainer>
              )}
            </ZoomableTimeChartFrame>
          )}
        </div>
      </>
    );
  },
);
