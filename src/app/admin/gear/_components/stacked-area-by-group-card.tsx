"use client";

import * as React from "react";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { ChartContainer, type ChartConfig, ChartTooltip } from "~/components/ui/chart";
import { ZoomableTimeChartFrame } from "./zoomable-time-chart-frame";

export type StackedAreaByGroupChart = {
  data: Array<Record<string, string | number>>;
  config: ChartConfig;
  series: Array<{ key: string; color: string }>;
};

interface StackedAreaByGroupCardProps {
  title: string;
  description: string;
  chart: StackedAreaByGroupChart;
  emptyMessage: string;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const StackedAreaByGroupCard = React.memo(function StackedAreaByGroupCard({
  title,
  description,
  chart,
  emptyMessage,
  formatCurrency,
  abbreviateCurrency,
}: StackedAreaByGroupCardProps) {
  return (
    <div className="rounded-md border px-4 py-4">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {chart.data.length === 0 ? (
        <div className="py-10 text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <ZoomableTimeChartFrame
          values={chart.data.map((row) => Number(row.monthMs))}
          minimumVisibleSpanMs={90 * 24 * 60 * 60 * 1000}
        >
          {(domain) => (
            <ChartContainer config={chart.config} className="h-[22rem] w-full">
              <AreaChart
                data={chart.data}
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
                        const configEntry = chart.config[key];
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
                {chart.series.map((entry) => (
                  <Area
                    key={entry.key}
                    type="natural"
                    dataKey={entry.key}
                    stackId="group-series"
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
  );
});
