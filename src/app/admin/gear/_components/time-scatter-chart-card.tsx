"use client";

import * as React from "react";
import { format } from "date-fns";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";

import { ChartContainer, type ChartConfig, ChartTooltip } from "~/components/ui/chart";
import { ZoomableTimeChartFrame } from "./zoomable-time-chart-frame";

export type TimeScatterPoint = {
  name: string;
  quantity: number;
  itemValue: number;
  createdAtMs: number;
  createdAtTooltipLabel: string;
};

interface TimeScatterChartCardProps {
  title: string;
  description: string;
  data: TimeScatterPoint[];
  config: ChartConfig;
  valueLabel: string;
  quantityLabel: string;
  emptyMessage: string;
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const TimeScatterChartCard = React.memo(function TimeScatterChartCard({
  title,
  description,
  data,
  config,
  valueLabel,
  quantityLabel,
  emptyMessage,
  formatCurrency,
  abbreviateCurrency,
}: TimeScatterChartCardProps) {
  return (
    <div className="rounded-md border px-4 py-4 md:w-1/2">
      <div className="flex flex-col gap-1">
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      {data.length === 0 ? (
        <div className="py-10 text-sm text-muted-foreground">{emptyMessage}</div>
      ) : (
        <ZoomableTimeChartFrame values={data.map((point) => point.createdAtMs)}>
          {(domain) => (
            <ChartContainer config={config} className="h-[20rem] w-full">
              <ScatterChart
                data={data}
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
                    const point = payload?.[0]?.payload as TimeScatterPoint | undefined;

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
                          <span className="text-muted-foreground">{valueLabel}</span>
                          <span className="font-medium text-foreground">
                            {formatCurrency(point.itemValue ?? 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-muted-foreground">{quantityLabel}</span>
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
  );
});
