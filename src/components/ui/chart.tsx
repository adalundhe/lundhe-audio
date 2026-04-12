"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "~/lib/utils";

export type ChartConfig = Record<
  string,
  {
    label?: React.ReactNode;
    color?: string;
  }
>;

type ChartContextValue = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextValue | null>(null);

const useChart = () => {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("Chart components must be used inside ChartContainer.");
  }

  return context;
};

const ChartStyle = ({
  id,
  config,
}: {
  id: string;
  config: ChartConfig;
}) => {
  const colorVars = Object.entries(config)
    .map(([key, value]) =>
      value.color ? `  --color-${key}: ${value.color};` : null,
    )
    .filter(Boolean)
    .join("\n");

  if (!colorVars) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
[data-chart="${id}"] {
${colorVars}
}
        `,
      }}
    />
  );
};

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const generatedId = React.useId().replace(/:/g, "");
  const chartId = id ?? `chart-${generatedId}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        ref={ref}
        data-chart={chartId}
        className={cn(
          "flex h-full w-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-polar-angle-axis-tick_text]:fill-muted-foreground [&_.recharts-polar-radius-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/60 [&_.recharts-polar-grid-concentric-polygon]:stroke-border/60 [&_.recharts-polar-grid-angle-line]:stroke-border/60 [&_.recharts-reference-line_line]:stroke-border [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <div className="h-full w-full">
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
            {children}
          </RechartsPrimitive.ResponsiveContainer>
        </div>
      </div>
    </ChartContext.Provider>
  );
});

ChartContainer.displayName = "ChartContainer";

const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipPayloadItem = {
  color?: string;
  dataKey?: string | number;
  name?: string;
  value?: number | string | null;
  payload?: Record<string, unknown>;
};

type ChartTooltipContentProps = {
  className?: string;
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: unknown;
  hideLabel?: boolean;
  formatter?: (
    value: number | string | null | undefined,
    name: string,
    item: TooltipPayloadItem,
  ) => React.ReactNode;
  labelFormatter?: (
    label: unknown,
    payload: TooltipPayloadItem[],
  ) => React.ReactNode;
  indicator?: "dot" | "line";
};

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      label,
      className,
      hideLabel = false,
      formatter,
      labelFormatter,
      indicator = "dot",
    },
    ref,
  ) => {
    const { config } = useChart();

    if (!active || !payload?.length) {
      return null;
    }

    const renderedLabel = labelFormatter
      ? labelFormatter(label, payload)
      : typeof label === "string" || typeof label === "number"
        ? String(label)
        : null;

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[12rem] gap-2 rounded-lg border bg-background/95 px-3 py-2 text-xs shadow-xl backdrop-blur",
          className,
        )}
      >
        {!hideLabel && renderedLabel ? (
          <div className="font-medium text-foreground">{renderedLabel}</div>
        ) : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = String(item.dataKey ?? item.name ?? index);
            const itemConfig = config[key];
            const displayName =
              typeof itemConfig?.label === "string"
                ? itemConfig.label
                : item.name ?? key;
            const color =
              item.color ??
              itemConfig?.color ??
              "hsl(var(--muted-foreground))";
            const displayValue = formatter
              ? formatter(item.value, String(displayName), item)
              : item.value;

            return (
              <div
                key={`${key}-${index}`}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <span
                    className={cn(
                      "shrink-0 rounded-full",
                      indicator === "dot" ? "h-2.5 w-2.5" : "h-0.5 w-3.5",
                    )}
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{displayName}</span>
                </div>
                <div className="text-right font-medium text-foreground">
                  {displayValue}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);

ChartTooltipContent.displayName = "ChartTooltipContent";

export { ChartContainer, ChartTooltip, ChartTooltipContent };
