"use client";

import * as React from "react";

import { ManufacturerBubbleChart } from "./manufacturer-bubble-chart";
import { type ManufacturerRadialDatum } from "./manufacturer-radial-chart-helpers";

interface ManufacturerRadialChartCardProps {
  title: string;
  description: string;
  data: ManufacturerRadialDatum[];
  valueLabel: string;
  quantityLabel: string;
  centerLabel: string;
  emptyMessage: string;
  formatCurrency: (value: number) => string;
}

export const ManufacturerRadialChartCard = React.memo(
  function ManufacturerRadialChartCard({
    title,
    description,
    data,
    valueLabel,
    quantityLabel,
    centerLabel,
    emptyMessage,
    formatCurrency,
  }: ManufacturerRadialChartCardProps) {
    return (
      <div className="rounded-md border px-4 py-4">
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">{title}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <ManufacturerBubbleChart
          data={data}
          valueLabel={valueLabel}
          quantityLabel={quantityLabel}
          valueFormatter={formatCurrency}
          centerLabel={centerLabel}
          emptyMessage={emptyMessage}
          className="mt-4"
        />
      </div>
    );
  },
);
