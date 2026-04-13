"use client";

import * as React from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

interface ValueDistributionRadarCardProps {
  title: string;
  description: string;
  data: Array<Record<string, string | number>>;
  dataKey: string;
  labelKey: string;
  titleKey: string;
  config: ChartConfig;
  emptyMessage: string;
  formatCurrency: (value: number) => string;
}

export const ValueDistributionRadarCard = React.memo(
  function ValueDistributionRadarCard({
    title,
    description,
    data,
    dataKey,
    labelKey,
    titleKey,
    config,
    emptyMessage,
    formatCurrency,
  }: ValueDistributionRadarCardProps) {
    return (
      <div className="rounded-md border px-4 py-4 md:w-1/2">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        {data.length === 0 ? (
          <div className="py-10 text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <ChartContainer
            config={config}
            className="md:mt-4 md:h-[24rem] w-full sm:h-[20rem] h-[20rem]"
          >
            <RadarChart
              data={data}
              outerRadius="100%"
            >
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value) => formatCurrency(Number(value) || 0)}
                    labelFormatter={(_, payload) =>
                      payload[0]?.payload?.[titleKey]
                        ? String(payload[0].payload[titleKey])
                        : null
                    }
                  />
                }
              />
              <PolarGrid />
              <PolarAngleAxis dataKey={labelKey} tick={false} axisLine={false} />
              <PolarRadiusAxis tick={false} axisLine={false} />
              <Radar
                dataKey={dataKey}
                stroke={`var(--color-${dataKey})`}
                fill={`var(--color-${dataKey})`}
                fillOpacity={0.26}
                strokeWidth={2}
              />
            </RadarChart>
          </ChartContainer>
        )}
      </div>
    );
  },
);
