"use client";

import * as React from "react";
import { Group } from "@visx/group";
import { scaleBand, scaleLinear } from "@visx/scale";
import { Arc } from "@visx/shape";
import { Text } from "@visx/text";

import { cn } from "~/lib/utils";
import {
  type ManufacturerRadialDatum,
} from "./manufacturer-radial-chart-helpers";

const chartColorTokens = [
  "hsl(var(--manufacturer-chart-1))",
  "hsl(var(--manufacturer-chart-2))",
  "hsl(var(--manufacturer-chart-3))",
  "hsl(var(--manufacturer-chart-4))",
  "hsl(var(--manufacturer-chart-5))",
  "hsl(var(--manufacturer-chart-6))",
  "hsl(var(--manufacturer-chart-7))",
  "hsl(var(--manufacturer-chart-8))",
];

interface ManufacturerRadialChartProps {
  data: ManufacturerRadialDatum[];
  valueLabel: string;
  quantityLabel: string;
  valueFormatter: (value: number) => string;
  centerLabel: string;
  emptyMessage: string;
  className?: string;
}

export const ManufacturerRadialChart = React.memo(function ManufacturerRadialChart({
  data,
  valueLabel,
  quantityLabel,
  valueFormatter,
  centerLabel,
  emptyMessage,
  className,
}: ManufacturerRadialChartProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const [activeLabel, setActiveLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === "undefined") {
      return;
    }

    const update = () => {
      setContainerWidth(node.clientWidth);
    };

    update();

    const observer = new ResizeObserver(update);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  const size = Math.max(Math.min(containerWidth || 0, 420), 260);
  const outerRadius = size / 2 - 18;
  const innerRadius = Math.max(54, outerRadius * 0.34);
  const maxValue = Math.max(...data.map((entry) => entry.value), 0);

  const angleScale = React.useMemo(
    () =>
      scaleBand<string>({
        domain: data.map((entry) => entry.label),
        range: [0, Math.PI * 2],
        padding: 0.12,
      }),
    [data],
  );

  const radiusScale = React.useMemo(
    () =>
      scaleLinear<number>({
        domain: [0, maxValue || 1],
        range: [innerRadius + 10, outerRadius],
      }),
    [innerRadius, maxValue, outerRadius],
  );

  const activeDatum =
    data.find((entry) => entry.label === activeLabel) ??
    data[0] ??
    null;
  const colorVars = React.useMemo(
    () =>
      ({
        "--manufacturer-chart-1": "188 94% 43%",
        "--manufacturer-chart-2": "38 92% 50%",
        "--manufacturer-chart-3": "160 84% 39%",
        "--manufacturer-chart-4": "271 91% 65%",
        "--manufacturer-chart-5": "330 81% 60%",
        "--manufacturer-chart-6": "173 80% 40%",
        "--manufacturer-chart-7": "24 95% 53%",
        "--manufacturer-chart-8": "84 81% 44%",
      }) as React.CSSProperties,
    [],
  );

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)} style={colorVars}>
      <div
        ref={containerRef}
        className="flex min-h-[20rem] w-full items-center justify-center"
        onPointerLeave={() => setActiveLabel(null)}
      >
        {data.length === 0 ? (
          <div className="py-10 text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="overflow-visible"
            role="img"
            aria-label={centerLabel}
          >
            <Group top={size / 2} left={size / 2}>
              {[0.25, 0.5, 0.75, 1].map((ratio) => {
                const radius = innerRadius + (outerRadius - innerRadius) * ratio;

                return (
                  <circle
                    key={ratio}
                    r={radius}
                    fill="none"
                    stroke="hsl(var(--border) / 0.45)"
                    strokeDasharray="2 4"
                  />
                );
              })}

              {data.map((entry, index) => {
                const startAngle = angleScale(entry.label) ?? 0;
                const endAngle = startAngle + angleScale.bandwidth();
                const fill = chartColorTokens[index % chartColorTokens.length]!;
                const isActive = activeDatum?.label === entry.label;

                return (
                  <Arc
                    key={entry.label}
                    data={entry}
                    innerRadius={innerRadius}
                    outerRadius={radiusScale(entry.value)}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    cornerRadius={4}
                    padAngle={0.012}
                    fill={fill}
                    fillOpacity={isActive ? 0.95 : 0.72}
                    stroke={fill}
                    strokeWidth={isActive ? 2 : 1}
                    className="transition-all duration-200 ease-out"
                    onPointerEnter={() => setActiveLabel(entry.label)}
                    onPointerDown={() => setActiveLabel(entry.label)}
                  />
                );
              })}

              <circle
                r={innerRadius - 8}
                fill="hsl(var(--background))"
                stroke="hsl(var(--border))"
              />

              <Text
                textAnchor="middle"
                verticalAnchor="end"
                y={-6}
                width={innerRadius * 1.5}
                className="fill-foreground text-sm font-medium"
              >
                {activeDatum ? activeDatum.label : centerLabel}
              </Text>
              <Text
                textAnchor="middle"
                verticalAnchor="start"
                y={2}
                width={innerRadius * 1.5}
                className="fill-muted-foreground text-[11px]"
              >
                {activeDatum
                  ? `${valueFormatter(activeDatum.value)} • ${activeDatum.uniqueItemCount} rows`
                  : `${data.length} manufacturers`}
              </Text>
            </Group>
          </svg>
        )}
      </div>

      {activeDatum ? (
        <div className="grid min-w-0 gap-1 rounded-md border px-3 py-3 text-xs">
          <div className="truncate font-medium">{activeDatum.label}</div>
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            <span>{valueLabel}</span>
            <span className="font-medium text-foreground">
              {valueFormatter(activeDatum.value)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            <span>{quantityLabel}</span>
            <span className="font-medium text-foreground">
              {activeDatum.totalQuantity.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between gap-4 text-muted-foreground">
            <span>Rows</span>
            <span className="font-medium text-foreground">
              {activeDatum.uniqueItemCount.toLocaleString()}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
});
