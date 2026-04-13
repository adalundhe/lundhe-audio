"use client";

import * as React from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
} from "~/components/ui/chart";
import type { ModelHistoryPoint } from "./gear-manager-types";
import { type ChartFilterOption } from "./chart-filter-panel";
import { PriceHistoryFilters } from "./price-history-filters";
import { ZoomableTimeChartFrame } from "./zoomable-time-chart-frame";

type TitleQuery = {
  key: string;
  label: string;
};

type HistorySeries = {
  key: string;
  label: string;
  data: Array<ModelHistoryPoint & { occurredAtLabel?: string }>;
};

interface GearSelectedTitleHistorySectionProps {
  selectedTitleQueries: TitleQuery[];
  availableModelHistorySourceOptions: ChartFilterOption[];
  resolvedVisibleModelHistorySources: Array<"Listing" | "Price Guide">;
  setVisibleModelHistorySources: React.Dispatch<
    React.SetStateAction<Array<"Listing" | "Price Guide"> | null>
  >;
  availableModelHistoryTitleOptions: ChartFilterOption[];
  resolvedVisibleModelHistoryTitleKeys: string[];
  setVisibleModelHistoryTitleKeys: React.Dispatch<React.SetStateAction<string[] | null>>;
  availableModelHistorySeriesOptions: ChartFilterOption[];
  resolvedVisibleModelHistoryModelKeys: string[];
  setVisibleModelHistoryModelKeys: React.Dispatch<React.SetStateAction<string[] | null>>;
  availableModelHistoryManufacturerOptions: ChartFilterOption[];
  resolvedVisibleModelHistoryManufacturerKeys: string[];
  setVisibleModelHistoryManufacturerKeys: React.Dispatch<
    React.SetStateAction<string[] | null>
  >;
  availableModelHistoryYearOptions: ChartFilterOption[];
  resolvedVisibleModelHistoryYearKeys: string[];
  setVisibleModelHistoryYearKeys: React.Dispatch<React.SetStateAction<string[] | null>>;
  availableModelHistoryConditionOptions: ChartFilterOption[];
  resolvedVisibleModelHistoryConditionKeys: string[];
  setVisibleModelHistoryConditionKeys: React.Dispatch<
    React.SetStateAction<string[] | null>
  >;
  availableModelHistoryCategoryOptions: ChartFilterOption[];
  resolvedVisibleModelHistoryCategoryKeys: string[];
  setVisibleModelHistoryCategoryKeys: React.Dispatch<
    React.SetStateAction<string[] | null>
  >;
  modelHistoryError: string | null;
  selectedModelHistoryChartData: Array<ModelHistoryPoint & { occurredAtLabel?: string }>;
  isModelHistoryLoading: boolean;
  filteredSelectedModelHistoryCount: number;
  selectedModelHistoryChartConfig: ChartConfig;
  selectedModelHistorySeries: HistorySeries[];
  pendingModelHistoryKeys: string[];
  formatCurrency: (value: number) => string;
  abbreviateCurrency: (value: number) => string;
}

export const GearSelectedTitleHistorySection = React.memo(
  function GearSelectedTitleHistorySection({
    selectedTitleQueries,
    availableModelHistorySourceOptions,
    resolvedVisibleModelHistorySources,
    setVisibleModelHistorySources,
    availableModelHistoryTitleOptions,
    resolvedVisibleModelHistoryTitleKeys,
    setVisibleModelHistoryTitleKeys,
    availableModelHistorySeriesOptions,
    resolvedVisibleModelHistoryModelKeys,
    setVisibleModelHistoryModelKeys,
    availableModelHistoryManufacturerOptions,
    resolvedVisibleModelHistoryManufacturerKeys,
    setVisibleModelHistoryManufacturerKeys,
    availableModelHistoryYearOptions,
    resolvedVisibleModelHistoryYearKeys,
    setVisibleModelHistoryYearKeys,
    availableModelHistoryConditionOptions,
    resolvedVisibleModelHistoryConditionKeys,
    setVisibleModelHistoryConditionKeys,
    availableModelHistoryCategoryOptions,
    resolvedVisibleModelHistoryCategoryKeys,
    setVisibleModelHistoryCategoryKeys,
    modelHistoryError,
    selectedModelHistoryChartData,
    isModelHistoryLoading,
    filteredSelectedModelHistoryCount,
    selectedModelHistoryChartConfig,
    selectedModelHistorySeries,
    pendingModelHistoryKeys,
    formatCurrency,
    abbreviateCurrency,
  }: GearSelectedTitleHistorySectionProps) {
    const historyContentStateKey =
      selectedTitleQueries.length === 0
        ? "idle"
        : selectedModelHistoryChartData.length === 0
          ? isModelHistoryLoading
            ? "loading"
            : "empty"
          : filteredSelectedModelHistoryCount === 0
            ? "filtered-empty"
            : "chart";

    return (
      <div className="rounded-md border px-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">Price History</div>
          <div className="text-xs text-muted-foreground">
            Uses Reverb&apos;s paginated `priceguide?query=` and `listings?query=`
            endpoints for the current automatic manufacturer + title query.
            Repeated queries reuse cached results, and visible points are grouped
            by model.
          </div>
        </div>
        {selectedTitleQueries.length > 0 ? (
          <div className="mt-3 flex flex-col gap-3 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300">
            <PriceHistoryFilters
              facets={[
                {
                  label: "Sources",
                  options: availableModelHistorySourceOptions,
                  selectedKeys: resolvedVisibleModelHistorySources,
                  onChange: (nextKeys) =>
                    setVisibleModelHistorySources(
                      nextKeys as Array<"Listing" | "Price Guide"> | null,
                    ),
                },
                {
                  label: "Titles",
                  options: availableModelHistoryTitleOptions,
                  selectedKeys: resolvedVisibleModelHistoryTitleKeys,
                  onChange: setVisibleModelHistoryTitleKeys,
                },
                {
                  label: "Models",
                  options: availableModelHistorySeriesOptions,
                  selectedKeys: resolvedVisibleModelHistoryModelKeys,
                  onChange: setVisibleModelHistoryModelKeys,
                },
                {
                  label: "Make",
                  options: availableModelHistoryManufacturerOptions,
                  selectedKeys: resolvedVisibleModelHistoryManufacturerKeys,
                  onChange: setVisibleModelHistoryManufacturerKeys,
                },
                {
                  label: "Year",
                  options: availableModelHistoryYearOptions,
                  selectedKeys: resolvedVisibleModelHistoryYearKeys,
                  onChange: setVisibleModelHistoryYearKeys,
                  grouping: "decade",
                },
                {
                  label: "Condition",
                  options: availableModelHistoryConditionOptions,
                  selectedKeys: resolvedVisibleModelHistoryConditionKeys,
                  onChange: setVisibleModelHistoryConditionKeys,
                },
                {
                  label: "Category",
                  options: availableModelHistoryCategoryOptions,
                  selectedKeys: resolvedVisibleModelHistoryCategoryKeys,
                  onChange: setVisibleModelHistoryCategoryKeys,
                },
              ]}
            />
            <div className="text-xs text-muted-foreground">
              Filter the chart by source, returned title, model, make, year,
              condition, and category.
            </div>
          </div>
        ) : null}
        {modelHistoryError ? (
          <div className="mt-3 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {modelHistoryError}
          </div>
        ) : null}
        <div
          key={historyContentStateKey}
          className="motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300"
        >
          {selectedTitleQueries.length === 0 ? (
            <div className="mt-4 py-10 text-sm text-muted-foreground">
              Enter a manufacturer and name to load price history automatically.
            </div>
          ) : selectedModelHistoryChartData.length === 0 && isModelHistoryLoading ? (
            <div className="mt-4 flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="!h-[16px] !w-[16px] animate-spin" />
              Loading price history for{" "}
              {selectedTitleQueries.map((entry) => entry.label).join(", ")}.
            </div>
          ) : selectedModelHistoryChartData.length === 0 ? (
            <div className="mt-4 py-10 text-sm text-muted-foreground">
              No dated price history with prices was returned for the current
              query.
            </div>
          ) : filteredSelectedModelHistoryCount === 0 ? (
            <div className="mt-4 py-10 text-sm text-muted-foreground">
              No price-history matches are visible for the current chart filters.
            </div>
          ) : (
            <>
              <ZoomableTimeChartFrame
                values={selectedModelHistoryChartData
                  .map((point) => point.occurredAtMs)
                  .filter((value): value is number => value !== null)}
              >
                {(domain) => (
                  <ChartContainer
                    config={selectedModelHistoryChartConfig}
                    className="h-[20rem] w-full"
                  >
                    <ScatterChart margin={{ top: 12, right: 12, bottom: 12, left: 12 }}>
                      <CartesianGrid vertical={false} />
                      <XAxis
                        type="number"
                        dataKey="occurredAtMs"
                        domain={domain ? [domain[0], domain[1]] : ["dataMin", "dataMax"]}
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          format(new Date(Number(value)), "MMM yyyy")
                        }
                      />
                      <YAxis
                        type="number"
                        dataKey="priceValue"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                        tickFormatter={(value) =>
                          abbreviateCurrency(Number(value) || 0)
                        }
                      />
                      <ChartTooltip
                        cursor={{
                          stroke: "hsl(var(--border))",
                          strokeDasharray: "4 4",
                        }}
                        content={({ active, payload }) => {
                          const point = payload?.[0]?.payload as
                            | (ModelHistoryPoint & { occurredAtLabel?: string })
                            | undefined;

                          if (!active || !point) {
                            return null;
                          }

                          return (
                            <div className="grid min-w-[16rem] gap-2 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur">
                              <div className="font-medium text-foreground">
                                {point.title}
                              </div>
                              <div className="text-muted-foreground">
                                {point.occurredAtLabel}
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Source</span>
                                <span className="font-medium text-foreground">
                                  {point.source}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                  Manufacturer
                                </span>
                                <span className="font-medium text-foreground">
                                  {point.manufacturer ?? "—"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Model</span>
                                <span className="font-medium text-foreground">
                                  {point.model}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Year</span>
                                <span className="font-medium text-foreground">
                                  {point.year}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">
                                  Condition
                                </span>
                                <span className="font-medium text-foreground">
                                  {point.condition}
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-muted-foreground">Price</span>
                                <span className="font-medium text-foreground">
                                  {formatCurrency(point.priceValue ?? 0)}
                                </span>
                              </div>
                            </div>
                          );
                        }}
                      />
                      {selectedModelHistorySeries.map((series) => (
                      <Scatter
                        key={series.key}
                        name={series.label}
                        data={series.data}
                        dataKey="priceValue"
                        fill={`var(--color-${series.key})`}
                        fillOpacity={0.8}
                        isAnimationActive={false}
                      />
                      ))}
                    </ScatterChart>
                  </ChartContainer>
                )}
              </ZoomableTimeChartFrame>
              {isModelHistoryLoading ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-top-2 motion-safe:duration-300">
                  <Loader2 className="!h-[14px] !w-[14px] animate-spin" />
                  Fetching additional history for{" "}
                  {pendingModelHistoryKeys
                    .map(
                      (key) =>
                        selectedTitleQueries.find((entry) => entry.key === key)?.label ??
                        key,
                    )
                    .join(", ")}
                  .
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  },
);
